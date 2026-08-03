import {
  TicketScanResponseDto,
  TicketScanResult,
} from './dto/ticket-scan-response.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as QRCode from 'qrcode';

import { PrismaService } from '../prisma/prisma.service';
import {
  TicketValidationReason,
  TicketValidationResponseDto,
} from './dto/ticket-validation-response.dto';

@Injectable()
export class TicketService {
  constructor(private readonly prisma: PrismaService) {}

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
      data: participantsWithoutTickets.map((participant) => ({
        bookingId: booking.id,
        participantId: participant.id,
        ticketNumber: `TKT-${Date.now()}-${randomBytes(3)
          .toString('hex')
          .toUpperCase()}`,
        secureToken: randomBytes(32).toString('hex'),
        status: 'ACTIVE',
      })),
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

  async getTicketById(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: {
        id,
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
    const ticket = await this.prisma.ticket.findUnique({
      where: {
        secureToken: token,
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

  async validateTicket(
    token: string,
  ): Promise<TicketValidationResponseDto> {
    const ticket = await this.prisma.ticket.findUnique({
      where: {
        secureToken: token,
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
      message = 'Ticket has been cancelled.';
    }

    return {
      valid: ticket.status === 'ACTIVE',
      reason,
      message,
      ticketNumber: ticket.ticketNumber,
      status: ticket.status,
      checkedInAt: ticket.checkedInAt,
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

async checkInTicket(token: string): Promise<TicketScanResponseDto> {
  const checkedInAt = new Date();

  const updateResult = await this.prisma.ticket.updateMany({
    where: {
      secureToken: token,
      status: 'ACTIVE',
    },
    data: {
      status: 'SCANNED',
      checkedInAt,
    },
  });

  if (updateResult.count === 1) {
    const ticket = await this.prisma.ticket.findUnique({
      where: {
        secureToken: token,
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

  const ticket = await this.prisma.ticket.findUnique({
    where: {
      secureToken: token,
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

  async generateQrCode(ticketId: string): Promise<Buffer> {
    const ticket = await this.prisma.ticket.findUnique({
      where: {
        id: ticketId,
      },
      select: {
        id: true,
        secureToken: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return QRCode.toBuffer(ticket.secureToken, {
      type: 'png',
      errorCorrectionLevel: 'H',
      width: 512,
      margin: 2,
    });
  }
}