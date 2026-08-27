import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FlexibleTicketEntitlementStatus,
  FlexibleTicketRequestStatus,
  FlexibleTicketRequestType,
  Prisma,
} from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service';
import { CreatePublicFlexibleTicketRequestDto } from './dto/public-flexible-ticket-request.dto';

const publicBookingInclude = {
  session: {
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
    },
  },
  event: {
    select: {
      id: true,
      name: true,
      timezone: true,
      organizationId: true,
    },
  },
  tickets: {
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      ticketNumber: true,
      status: true,
      checkedInAt: true,
      participantId: true,
      adjustmentAllocation: { select: { id: true } },
    },
    orderBy: { issuedAt: 'desc' as const },
  },
  flexibleTicketEntitlements: {
    include: {
      participant: {
        include: {
          tickets: {
            where: { status: 'ACTIVE' },
            select: {
              id: true,
              ticketNumber: true,
              status: true,
              checkedInAt: true,
              adjustmentAllocation: { select: { id: true } },
            },
            orderBy: { issuedAt: 'desc' as const },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
  flexibleTicketRequests: {
    include: {
      items: true,
      destinationSession: {
        select: { id: true, name: true, startDate: true },
      },
      ticketAdjustment: {
        select: { adjustmentNumber: true, status: true },
      },
      bookingReschedule: {
        select: { rescheduleNumber: true, status: true },
      },
    },
    orderBy: { createdAt: 'desc' as const },
  },
} satisfies Prisma.BookingInclude;

type PublicBooking = Prisma.BookingGetPayload<{
  include: typeof publicBookingInclude;
}>;

const activeRequestStatuses = new Set<FlexibleTicketRequestStatus>([
  FlexibleTicketRequestStatus.SUBMITTED,
  FlexibleTicketRequestStatus.UNDER_REVIEW,
  FlexibleTicketRequestStatus.APPROVED,
]);

@Injectable()
export class FlexibleTicketRequestService {
  constructor(private readonly prisma: PrismaService) {}

  async publicContext(bookingId: string, publicAccessToken: string) {
    const booking = await this.findPublicBooking(bookingId, publicAccessToken);
    return this.serializePublicContext(booking);
  }

  async createPublicRequest(
    bookingId: string,
    input: CreatePublicFlexibleTicketRequestDto,
  ) {
    const booking = await this.findPublicBooking(
      bookingId,
      input.publicAccessToken,
    );
    const entitlementIds = [...new Set(input.entitlementIds)];
    if (entitlementIds.length !== input.entitlementIds.length) {
      throw new BadRequestException(
        'A Flexible Ticket entitlement may be selected only once.',
      );
    }

    const existing = booking.flexibleTicketRequests.find(
      ({ idempotencyKey }) => idempotencyKey === input.idempotencyKey,
    );
    if (existing) {
      this.assertIdempotentMatch(existing, input, entitlementIds);
      return this.serializeRequest(existing);
    }

    const now = new Date();
    const selected = booking.flexibleTicketEntitlements.filter(({ id }) =>
      entitlementIds.includes(id),
    );
    if (selected.length !== entitlementIds.length) {
      throw new NotFoundException('Flexible Ticket entitlement not found.');
    }

    const eligibility = this.evaluateEligibility(booking, now);
    const selectedEligibility = selected.map((entitlement) => {
      const result = eligibility.entitlements.find(
        ({ id }) => id === entitlement.id,
      );
      if (!result) {
        throw new NotFoundException('Flexible Ticket entitlement not found.');
      }
      return { entitlement, result };
    });

    if (input.type === FlexibleTicketRequestType.REFUND) {
      if (input.destinationSessionId) {
        throw new BadRequestException(
          'Refund requests cannot select a destination Session.',
        );
      }
      if (selectedEligibility.some(({ result }) => !result.canRequestRefund)) {
        throw new ConflictException(
          'One or more selected Tickets are not eligible for a refund request.',
        );
      }
    } else {
      if (!input.destinationSessionId) {
        throw new BadRequestException(
          'A destination Session is required for a Session-change request.',
        );
      }
      if (!eligibility.canRequestSessionChange) {
        throw new ConflictException(
          'Every active Ticket in the Booking must have eligible Flexible Ticket coverage for a Session change.',
        );
      }
      const requiredIds = eligibility.entitlements
        .filter(({ isCurrentActiveTicket }) => isCurrentActiveTicket)
        .map(({ id }) => id)
        .sort();
      if (entitlementIds.slice().sort().join(':') !== requiredIds.join(':')) {
        throw new BadRequestException(
          'A Session-change request must include every active covered Ticket.',
        );
      }
      const destination = await this.prisma.session.findFirst({
        where: {
          id: input.destinationSessionId,
          eventId: booking.eventId,
          status: 'ACTIVE',
          startDate: { gt: now },
          NOT: { id: booking.sessionId ?? undefined },
        },
        select: { id: true },
      });
      if (!destination) {
        throw new NotFoundException('Destination Session not found.');
      }
    }

    try {
      const created = await this.prisma.flexibleTicketRequest.create({
        data: {
          requestNumber: `FTR-${Date.now()}-${randomBytes(3)
            .toString('hex')
            .toUpperCase()}`,
          idempotencyKey: input.idempotencyKey,
          type: input.type,
          organizationId: booking.event.organizationId,
          eventId: booking.eventId,
          bookingId: booking.id,
          destinationSessionId: input.destinationSessionId,
          customerReason: input.customerReason,
          customerNote: input.customerNote?.trim() || null,
          items: {
            create: selectedEligibility.map(({ entitlement, result }) => ({
              entitlementId: entitlement.id,
              participantId: entitlement.participantId,
              ticketId: result.ticketId!,
              activeRequestKey: `${entitlement.id}:${input.type}`,
              participantNameSnapshot: this.participantName(
                entitlement.participant,
              ),
              ticketNumberSnapshot: result.ticketNumber!,
              ticketTypeNameSnapshot: entitlement.ticketTypeNameSnapshot,
              ticketValueSnapshot: entitlement.ticketFaceValueSnapshot,
              flexibleFeeSnapshot: entitlement.feeAmount,
              currency: entitlement.currency,
              remainingUsesSnapshot: entitlement.remainingUses,
              cutoffAtSnapshot: result.cutoffAt,
            })),
          },
        },
        include: {
          items: true,
          destinationSession: {
            select: { id: true, name: true, startDate: true },
          },
          ticketAdjustment: {
            select: { adjustmentNumber: true, status: true },
          },
          bookingReschedule: {
            select: { rescheduleNumber: true, status: true },
          },
        },
      });
      return this.serializeRequest(created);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'An active Flexible Ticket request already covers one or more selected Tickets.',
        );
      }
      throw error;
    }
  }

  async withdrawPublicRequest(
    bookingId: string,
    requestNumber: string,
    publicAccessToken: string,
  ) {
    const booking = await this.findPublicBooking(bookingId, publicAccessToken);
    const request = booking.flexibleTicketRequests.find(
      (candidate) => candidate.requestNumber === requestNumber,
    );
    if (!request) {
      throw new NotFoundException('Flexible Ticket request not found.');
    }
    if (request.status !== FlexibleTicketRequestStatus.SUBMITTED) {
      throw new ConflictException('Only a submitted request can be withdrawn.');
    }

    const withdrawn = await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.flexibleTicketRequest.updateMany({
        where: {
          id: request.id,
          status: FlexibleTicketRequestStatus.SUBMITTED,
        },
        data: {
          status: FlexibleTicketRequestStatus.WITHDRAWN,
          withdrawnAt: new Date(),
        },
      });
      if (updated.count !== 1) {
        throw new ConflictException(
          'This request is already being reviewed and cannot be withdrawn.',
        );
      }
      await transaction.flexibleTicketRequestItem.updateMany({
        where: { requestId: request.id },
        data: { activeRequestKey: null },
      });
      return transaction.flexibleTicketRequest.findUniqueOrThrow({
        where: { id: request.id },
        include: {
          items: true,
          destinationSession: {
            select: { id: true, name: true, startDate: true },
          },
          ticketAdjustment: {
            select: { adjustmentNumber: true, status: true },
          },
          bookingReschedule: {
            select: { rescheduleNumber: true, status: true },
          },
        },
      });
    });
    return this.serializeRequest(withdrawn);
  }

  private async findPublicBooking(
    bookingId: string,
    publicAccessToken: string,
  ) {
    const publicAccessTokenHash = createHash('sha256')
      .update(publicAccessToken)
      .digest('hex');
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, publicAccessTokenHash },
      include: publicBookingInclude,
    });
    if (!booking) {
      throw new NotFoundException('Booking not found or access token invalid.');
    }
    return booking;
  }

  private evaluateEligibility(booking: PublicBooking, now: Date) {
    const confirmed =
      booking.status === 'CONFIRMED' && booking.paymentStatus === 'PAID';
    const sessionStart = booking.session?.startDate ?? null;
    const entitlements = booking.flexibleTicketEntitlements.map(
      (entitlement) => {
        const ticket = entitlement.participant.tickets[0] ?? null;
        const cutoffAt = sessionStart
          ? new Date(
              sessionStart.getTime() -
                entitlement.cutoffMinutesBeforeSessionSnapshot * 60_000,
            )
          : new Date(0);
        const baseEligible =
          confirmed &&
          entitlement.status === FlexibleTicketEntitlementStatus.ACTIVE &&
          entitlement.remainingUses > 0 &&
          Boolean(ticket) &&
          ticket?.status === 'ACTIVE' &&
          !ticket.checkedInAt &&
          !ticket.adjustmentAllocation &&
          now < cutoffAt;
        return {
          id: entitlement.id,
          entitlementNumber: entitlement.entitlementNumber,
          participantId: entitlement.participantId,
          participantName: this.participantName(entitlement.participant),
          ticketId: ticket?.id ?? null,
          ticketNumber: ticket?.ticketNumber ?? null,
          status: entitlement.status,
          remainingUses: entitlement.remainingUses,
          cutoffAt,
          feeAmount: entitlement.feeAmount.toNumber(),
          currency: entitlement.currency,
          feeRefundability: entitlement.feeRefundabilitySnapshot,
          canRequestRefund:
            baseEligible && entitlement.allowsRefundRequestSnapshot,
          canRequestSessionChange:
            baseEligible && entitlement.allowsSessionChangeSnapshot,
          isCurrentActiveTicket: Boolean(ticket),
        };
      },
    );
    const activeTickets = booking.tickets.filter(
      ({ status }) => status === 'ACTIVE',
    );
    const entitlementByParticipant = new Map(
      entitlements.map((entitlement) => [
        entitlement.participantId,
        entitlement,
      ]),
    );
    const canRequestSessionChange =
      confirmed &&
      Boolean(booking.session) &&
      activeTickets.length > 0 &&
      activeTickets.every((ticket) => {
        const entitlement = entitlementByParticipant.get(ticket.participantId);
        return Boolean(
          entitlement?.canRequestSessionChange &&
          !ticket.checkedInAt &&
          !ticket.adjustmentAllocation,
        );
      });
    return { confirmed, entitlements, canRequestSessionChange };
  }

  private async serializePublicContext(booking: PublicBooking) {
    const eligibility = this.evaluateEligibility(booking, new Date());
    const destinations = eligibility.canRequestSessionChange
      ? await this.prisma.session.findMany({
          where: {
            eventId: booking.eventId,
            status: 'ACTIVE',
            startDate: { gt: new Date() },
            NOT: { id: booking.sessionId ?? undefined },
          },
          select: { id: true, name: true, startDate: true, endDate: true },
          orderBy: { startDate: 'asc' },
        })
      : [];
    return {
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        event: booking.event,
        session: booking.session,
      },
      entitlements: eligibility.entitlements,
      canRequestSessionChange: eligibility.canRequestSessionChange,
      destinations,
      requests: booking.flexibleTicketRequests.map((request) =>
        this.serializeRequest(request),
      ),
    };
  }

  private serializeRequest(
    request: PublicBooking['flexibleTicketRequests'][number],
  ) {
    return {
      requestNumber: request.requestNumber,
      type: request.type,
      status: request.status,
      customerReason: request.customerReason,
      customerNote: request.customerNote,
      submittedAt: request.submittedAt,
      reviewedAt: request.reviewedAt,
      decidedAt: request.decidedAt,
      withdrawnAt: request.withdrawnAt,
      completedAt: request.completedAt,
      failedAt: request.failedAt,
      expiredAt: request.expiredAt,
      destinationSession: request.destinationSession,
      items: request.items.map((item) => ({
        participantName: item.participantNameSnapshot,
        ticketNumber: item.ticketNumberSnapshot,
        ticketTypeName: item.ticketTypeNameSnapshot,
        ticketValue: item.ticketValueSnapshot.toNumber(),
        flexibleFee: item.flexibleFeeSnapshot.toNumber(),
        currency: item.currency,
        cutoffAt: item.cutoffAtSnapshot,
      })),
      adjustment: request.ticketAdjustment,
      reschedule: request.bookingReschedule,
      canWithdraw:
        request.status === FlexibleTicketRequestStatus.SUBMITTED &&
        activeRequestStatuses.has(request.status),
    };
  }

  private assertIdempotentMatch(
    existing: PublicBooking['flexibleTicketRequests'][number],
    input: CreatePublicFlexibleTicketRequestDto,
    entitlementIds: string[],
  ) {
    const existingIds = existing.items.map(
      ({ entitlementId }) => entitlementId,
    );
    const matches =
      existing.type === input.type &&
      (existing.destinationSessionId ?? undefined) ===
        input.destinationSessionId &&
      existing.customerReason === input.customerReason &&
      (existing.customerNote ?? undefined) ===
        (input.customerNote?.trim() || undefined) &&
      existingIds.slice().sort().join(':') ===
        entitlementIds.slice().sort().join(':');
    if (!matches) {
      throw new ConflictException(
        'This idempotency key was already used for a different Flexible Ticket request.',
      );
    }
  }

  private participantName(participant: {
    firstName: string;
    lastName: string | null;
  }) {
    return [participant.firstName, participant.lastName]
      .filter(Boolean)
      .join(' ');
  }
}
