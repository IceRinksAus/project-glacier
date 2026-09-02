import {
  TicketScanResponseDto,
  TicketScanResult,
} from './dto/ticket-scan-response.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes, randomUUID } from 'crypto';
import * as QRCode from 'qrcode';

import { PrismaService } from '../prisma/prisma.service';
import {
  StoredTicketCredential,
  TicketCredentialService,
} from './ticket-credential.service';
import {
  TicketValidationReason,
  TicketValidationResponseDto,
} from './dto/ticket-validation-response.dto';

@Injectable()
export class TicketService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly credentials: TicketCredentialService,
  ) {}

  async issueTicketsForBooking(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: {
        id: bookingId,
      },
      include: {
        participants: true,
        tickets: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const existingParticipantIds = new Set(
      booking.tickets.map((ticket) => ticket.participantId),
    );

    const participantsWithoutTickets = booking.participants.filter(
      (participant) => !existingParticipantIds.has(participant.id),
    );

    if (participantsWithoutTickets.length === 0) {
      return booking.tickets;
    }

    await this.prisma.ticket.createMany({
      data: participantsWithoutTickets.map((participant) => {
        const id = randomUUID();
        const credential = this.credentials.issue(id);
        return {
          id,
          bookingId: booking.id,
          participantId: participant.id,
          ticketNumber: `TKT-${Date.now()}-${randomBytes(3)
            .toString('hex')
            .toUpperCase()}`,
          secureToken: null,
          credentialSelector: credential.credentialSelector,
          credentialKeyId: credential.credentialKeyId,
          status: 'ACTIVE' as const,
        };
      }),
    });

    return this.prisma.ticket.findMany({
      where: {
        bookingId: booking.id,
      },
      include: {
        participant: true,
      },
    });
  }

  async activateFlexibleTicketsForBooking(
    bookingId: string,
    paymentId: string,
  ) {
    const tickets = await this.prisma.ticket.findMany({
      where: { bookingId },
      select: {
        id: true,
        participantId: true,
      },
    });
    const activatedAt = new Date();

    await Promise.all(
      tickets.map((ticket) =>
        this.prisma.flexibleTicketEntitlement.updateMany({
          where: {
            bookingId,
            participantId: ticket.participantId,
            status: 'PENDING',
          },
          data: {
            status: 'ACTIVE',
            initialTicketId: ticket.id,
            activatedByPaymentId: paymentId,
            activatedAt,
          },
        }),
      ),
    );
  }

  async getTicketById(organizationId: string, id: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        id,
        booking: {
          event: {
            organizationId,
          },
        },
      },
      include: {
        participant: true,
        booking: {
          include: {
            customer: true,
            event: true,
            session: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  async getTicketByToken(token: string) {
    const where = this.credentialWhereOrThrow(token);

    const ticket = await this.prisma.ticket.findUnique({
      where,
      select: {
        id: true,
        credentialSelector: true,
        credentialKeyId: true,
        legacyCredentialHash: true,
        ticketNumber: true,
        status: true,
        checkedInAt: true,
        originalRescheduleMapping: {
          select: { replacementTicketNumberSnapshot: true },
        },
        participant: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        booking: {
          select: {
            event: {
              select: {
                name: true,
              },
            },
            session: {
              select: {
                name: true,
                startDate: true,
                endDate: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    this.assertCredentialMatch(ticket, token);
    const {
      id: _id,
      credentialSelector: _selector,
      credentialKeyId: _keyId,
      legacyCredentialHash: _legacyHash,
      ...presentation
    } = ticket;
    return presentation;
  }

  async validateTicket(
    organizationId: string,
    token: string,
  ): Promise<TicketValidationResponseDto> {
    const where = this.credentialWhereOrThrow(token);

    const ticket = await this.prisma.ticket.findFirst({
      where: {
        ...where,
        booking: {
          event: {
            organizationId,
          },
        },
      },
      include: {
        participant: true,
        originalRescheduleMapping: {
          select: { replacementTicketNumberSnapshot: true },
        },
        booking: {
          include: {
            event: true,
            session: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    this.assertCredentialMatch(ticket, token);

    const alreadyScanned = ticket.status === 'SCANNED';
    const cancelled = ticket.status === 'CANCELLED';

    let reason = TicketValidationReason.VALID;
    let message = 'Ticket is valid and ready for entry.';

    if (alreadyScanned) {
      reason = TicketValidationReason.ALREADY_SCANNED;
      message = ticket.checkedInAt
        ? `Ticket was already scanned at ${ticket.checkedInAt.toISOString()}.`
        : 'Ticket has already been scanned.';
    } else if (cancelled) {
      reason = TicketValidationReason.CANCELLED;
      message = ticket.originalRescheduleMapping
        ? 'Ticket was replaced after a Session change. Use the replacement Ticket.'
        : 'Ticket has been cancelled.';
    }

    return {
      valid: ticket.status === 'ACTIVE',
      reason,
      message,
      ticketNumber: ticket.ticketNumber,
      status: ticket.status,
      checkedInAt: ticket.checkedInAt,
      replacementTicketNumber:
        ticket.originalRescheduleMapping?.replacementTicketNumberSnapshot ??
        null,
      participant: {
        firstName: ticket.participant.firstName,
        lastName: ticket.participant.lastName,
      },
      event: {
        name: ticket.booking.event.name,
      },
      session: ticket.booking.session
        ? {
            name: ticket.booking.session.name,
            start: ticket.booking.session.startDate,
          }
        : {
            name: 'No session assigned',
            start: new Date(0),
          },
    };
  }

  async checkInTicket(
    organizationId: string,
    token: string,
  ): Promise<TicketScanResponseDto> {
    const where = this.credentialWhereOrThrow(token);
    const checkedInAt = new Date();

    const resolved = await this.prisma.ticket.findFirst({
      where: {
        ...where,
        booking: { event: { organizationId } },
      },
      select: {
        id: true,
        credentialSelector: true,
        credentialKeyId: true,
        legacyCredentialHash: true,
      },
    });
    if (!resolved) throw new NotFoundException('Ticket not found');
    this.assertCredentialMatch(resolved, token);

    const updateResult = await this.prisma.ticket.updateMany({
      where: {
        id: resolved.id,
        status: 'ACTIVE',
        booking: {
          event: {
            organizationId,
          },
        },
      },
      data: {
        status: 'SCANNED',
        checkedInAt,
      },
    });

    if (updateResult.count === 1) {
      const ticket = await this.prisma.ticket.findFirst({
        where: {
          id: resolved.id,
          booking: {
            event: {
              organizationId,
            },
          },
        },
        include: {
          participant: true,
          booking: {
            include: {
              event: true,
              session: true,
            },
          },
        },
      });

      if (!ticket) {
        throw new NotFoundException('Ticket not found');
      }

      const participantName = [
        ticket.participant.firstName,
        ticket.participant.lastName,
      ]
        .filter(Boolean)
        .join(' ');

      return {
        result: TicketScanResult.ENTRY_GRANTED,
        message: 'Entry granted. Welcome!',
        ticketNumber: ticket.ticketNumber,
        participantName,
        eventName: ticket.booking.event.name,
        sessionName: ticket.booking.session?.name ?? null,
        checkedInAt: ticket.checkedInAt,
      };
    }

    const ticket = await this.prisma.ticket.findFirst({
      where: {
        id: resolved.id,
        booking: {
          event: {
            organizationId,
          },
        },
      },
      include: {
        participant: true,
        booking: {
          include: {
            event: true,
            session: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.status === 'SCANNED') {
      return {
        result: TicketScanResult.ALREADY_SCANNED,
        message: ticket.checkedInAt
          ? `Ticket was already scanned at ${ticket.checkedInAt.toISOString()}.`
          : 'Ticket has already been scanned.',
        ticketNumber: ticket.ticketNumber,
        participantName: [
          ticket.participant.firstName,
          ticket.participant.lastName,
        ]
          .filter(Boolean)
          .join(' '),
        eventName: ticket.booking.event.name,
        sessionName: ticket.booking.session?.name ?? null,
        checkedInAt: ticket.checkedInAt,
      };
    }

    if (ticket.status === 'CANCELLED') {
      return {
        result: TicketScanResult.CANCELLED,
        message: 'Ticket has been cancelled.',
        ticketNumber: ticket.ticketNumber,
        participantName: [
          ticket.participant.firstName,
          ticket.participant.lastName,
        ]
          .filter(Boolean)
          .join(' '),
        eventName: ticket.booking.event.name,
        sessionName: ticket.booking.session?.name ?? null,
        checkedInAt: ticket.checkedInAt,
      };
    }

    return {
      result: TicketScanResult.INVALID,
      message: `Ticket cannot be scanned because its status is ${ticket.status}.`,
      ticketNumber: ticket.ticketNumber,
      participantName: [
        ticket.participant.firstName,
        ticket.participant.lastName,
      ]
        .filter(Boolean)
        .join(' '),
      eventName: ticket.booking.event.name,
      sessionName: ticket.booking.session?.name ?? null,
      checkedInAt: ticket.checkedInAt,
    };
  }

  async generateQrCode(
    organizationId: string,
    ticketId: string,
  ): Promise<Buffer> {
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        id: ticketId,
        booking: {
          event: {
            organizationId,
          },
        },
      },
      select: {
        id: true,
        credentialSelector: true,
        credentialKeyId: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return QRCode.toBuffer(this.credentials.present(ticket), {
      type: 'png',
      errorCorrectionLevel: 'H',
      width: 512,
      margin: 2,
    });
  }

  async generatePublicQrCode(token: string): Promise<Buffer> {
    const where = this.credentialWhereOrThrow(token);

    const ticket = await this.prisma.ticket.findUnique({
      where,
      select: {
        id: true,
        credentialSelector: true,
        credentialKeyId: true,
        legacyCredentialHash: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    this.assertCredentialMatch(ticket, token);

    return QRCode.toBuffer(this.credentials.present(ticket), {
      type: 'png',
      errorCorrectionLevel: 'H',
      width: 512,
      margin: 2,
    });
  }

  presentCredential(ticket: StoredTicketCredential): string {
    return this.credentials.present(ticket);
  }

  private credentialWhereOrThrow(token: string) {
    const where = this.credentials.lookupWhere(token);
    if (!where) throw new NotFoundException('Ticket not found');
    return where;
  }

  private assertCredentialMatch(ticket: StoredTicketCredential, token: string) {
    if (!this.credentials.matches(ticket, token)) {
      throw new NotFoundException('Ticket not found');
    }
  }
}
