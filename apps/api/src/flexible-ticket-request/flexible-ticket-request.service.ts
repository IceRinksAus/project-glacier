import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FlexibleTicketEntitlementStatus,
  FlexibleTicketFeeRefundability,
  FlexibleTicketDecisionReason,
  FlexibleTicketRequestStatus,
  FlexibleTicketRequestType,
  BookingRescheduleReason,
  Prisma,
  TicketAdjustmentAction,
  TicketAdjustmentReason,
} from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';

import {
  AccessControlService,
  AuthenticatedAccessContext,
} from '../access-control/access-control.service';
import { BookingRescheduleService } from '../booking-reschedule/booking-reschedule.service';
import { PrismaService } from '../prisma/prisma.service';
import { TicketAdjustmentService } from '../ticket-adjustment/ticket-adjustment.service';
import {
  ExecuteFlexibleTicketDecisionDto,
  PreviewFlexibleTicketDecisionDto,
} from './dto/operator-flexible-ticket-request.dto';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControl: AccessControlService,
    private readonly ticketAdjustments: TicketAdjustmentService,
    private readonly bookingReschedules: BookingRescheduleService,
  ) {}

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

  async operatorContext(access: AuthenticatedAccessContext, bookingId: string) {
    this.assertManagementAccess(access);
    const booking = await this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        event: this.accessControl.eventWhere(access),
      },
      select: {
        id: true,
        bookingNumber: true,
        eventId: true,
        flexibleTicketRequests: {
          include: this.operatorRequestInclude,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return {
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      requests: booking.flexibleTicketRequests.map((request) =>
        this.serializeOperatorRequest(request),
      ),
    };
  }

  async markUnderReview(
    access: AuthenticatedAccessContext,
    bookingId: string,
    requestNumber: string,
  ) {
    const request = await this.loadOperatorRequest(
      access,
      bookingId,
      requestNumber,
    );
    if (request.status === FlexibleTicketRequestStatus.UNDER_REVIEW) {
      return this.serializeOperatorRequest(request);
    }
    if (request.status !== FlexibleTicketRequestStatus.SUBMITTED) {
      throw new ConflictException(
        'Only a submitted Flexible Ticket request can enter review.',
      );
    }
    const now = new Date();
    const updated = await this.prisma.flexibleTicketRequest.updateMany({
      where: {
        id: request.id,
        status: FlexibleTicketRequestStatus.SUBMITTED,
      },
      data: {
        status: FlexibleTicketRequestStatus.UNDER_REVIEW,
        reviewedByUserId: access.userId,
        reviewedAt: now,
      },
    });
    if (updated.count !== 1) {
      throw new ConflictException('This request changed before review began.');
    }
    return this.serializeOperatorRequest(
      await this.prisma.flexibleTicketRequest.findUniqueOrThrow({
        where: { id: request.id },
        include: this.operatorRequestInclude,
      }),
    );
  }

  async previewDecision(
    access: AuthenticatedAccessContext,
    bookingId: string,
    requestNumber: string,
    input: PreviewFlexibleTicketDecisionDto,
  ) {
    const request = await this.loadOperatorRequest(
      access,
      bookingId,
      requestNumber,
    );
    if (
      request.status !== FlexibleTicketRequestStatus.SUBMITTED &&
      request.status !== FlexibleTicketRequestStatus.UNDER_REVIEW &&
      request.status !== FlexibleTicketRequestStatus.APPROVED
    ) {
      throw new ConflictException(
        'This Flexible Ticket request already has a terminal decision.',
      );
    }
    const note = input.note.trim();
    if (input.decision === 'DECLINE') {
      const previewHash = this.decisionHash({
        requestId: request.id,
        access,
        decision: input.decision,
        reason: input.reason,
        note,
        mutationPreviewHash: null,
      });
      return {
        previewHash,
        decision: input.decision,
        reason: input.reason,
        note,
        request: this.serializeOperatorRequest(request),
        mutation: null,
        consumesUses: 0,
      };
    }

    this.assertApprovalReason(input.reason);
    this.assertCurrentRequestEligibility(request);
    const mutationNote = `Flexible Ticket ${request.requestNumber}: ${note}`;
    if (request.type === FlexibleTicketRequestType.REFUND) {
      const refundableFee = request.items.reduce(
        (total, item) =>
          total +
          (item.entitlement.feeRefundabilitySnapshot ===
          FlexibleTicketFeeRefundability.REFUNDABLE_WITH_TICKET
            ? item.flexibleFeeSnapshot.toNumber()
            : 0),
        0,
      );
      if (refundableFee > 0) {
        throw new BadRequestException(
          'This request includes a refundable Flexible Ticket fee. A separate fee-refund allocation is required before approval.',
        );
      }
      const mutation = await this.ticketAdjustments.preview(access, bookingId, {
        action: TicketAdjustmentAction.CANCEL_AND_REFUND,
        reason: TicketAdjustmentReason.FLEXIBLE_TICKET,
        note: mutationNote,
        ticketIds: request.items.map(({ ticketId }) => ticketId),
      });
      return this.decisionPreviewResponse(
        request,
        access,
        input,
        note,
        mutation,
      );
    }

    const mutation = await this.bookingReschedules.preview(access, bookingId, {
      destinationSessionId: request.destinationSessionId!,
      reason: BookingRescheduleReason.FLEXIBLE_TICKET,
      note: mutationNote,
    });
    return this.decisionPreviewResponse(request, access, input, note, mutation);
  }

  async executeDecision(
    access: AuthenticatedAccessContext,
    bookingId: string,
    requestNumber: string,
    input: ExecuteFlexibleTicketDecisionDto,
  ) {
    const prior = await this.loadOperatorRequest(
      access,
      bookingId,
      requestNumber,
    );
    if (
      (prior.status === FlexibleTicketRequestStatus.COMPLETED &&
        input.decision === 'APPROVE') ||
      (prior.status === FlexibleTicketRequestStatus.DECLINED &&
        input.decision === 'DECLINE')
    ) {
      if (
        prior.decisionReason !== input.reason ||
        prior.decisionNote !== input.note.trim()
      ) {
        throw new ConflictException(
          'This Flexible Ticket request already has a different terminal decision.',
        );
      }
      return this.serializeOperatorRequest(prior);
    }
    const preview = await this.previewDecision(
      access,
      bookingId,
      requestNumber,
      input,
    );
    if (preview.previewHash !== input.previewHash) {
      throw new BadRequestException(
        'The Flexible Ticket decision changed after review. Review it again.',
      );
    }
    const request = await this.loadOperatorRequest(
      access,
      bookingId,
      requestNumber,
    );
    if (input.decision === 'DECLINE') {
      return this.completeDecline(access, request, input);
    }

    const now = new Date();
    if (request.status !== FlexibleTicketRequestStatus.APPROVED) {
      const approved = await this.prisma.flexibleTicketRequest.updateMany({
        where: {
          id: request.id,
          status: {
            in: [
              FlexibleTicketRequestStatus.SUBMITTED,
              FlexibleTicketRequestStatus.UNDER_REVIEW,
            ],
          },
        },
        data: {
          status: FlexibleTicketRequestStatus.APPROVED,
          reviewedByUserId: access.userId,
          reviewedAt: request.reviewedAt ?? now,
          decisionReason: input.reason,
          decisionNote: input.note.trim(),
          decidedAt: now,
        },
      });
      if (approved.count !== 1) {
        throw new ConflictException(
          'This Flexible Ticket request changed before approval.',
        );
      }
    }

    try {
      const mutationNote = `Flexible Ticket ${request.requestNumber}: ${input.note.trim()}`;
      const mutation =
        request.type === FlexibleTicketRequestType.REFUND
          ? await this.ticketAdjustments.execute(access, bookingId, {
              action: TicketAdjustmentAction.CANCEL_AND_REFUND,
              reason: TicketAdjustmentReason.FLEXIBLE_TICKET,
              note: mutationNote,
              ticketIds: request.items.map(({ ticketId }) => ticketId),
              previewHash: preview.mutation!.previewHash,
              idempotencyKey: `flex_request_${request.id}`,
              manualRefundConfirmed: input.manualRefundConfirmed,
              standaloneReference: input.standaloneReference,
            })
          : await this.bookingReschedules.execute(access, bookingId, {
              destinationSessionId: request.destinationSessionId!,
              reason: BookingRescheduleReason.FLEXIBLE_TICKET,
              note: mutationNote,
              previewHash: preview.mutation!.previewHash,
              idempotencyKey: `flex_request_${request.id}`,
            });

      if (mutation.status === 'COMPLETED') {
        return this.finalizeCompletedRequest(request, mutation.id);
      }
      if (mutation.status === 'FAILED') {
        return this.failApprovedRequest(
          request,
          'MUTATION_FAILED',
          'The controlled action did not complete.',
        );
      }
      return this.serializeOperatorRequest(
        await this.prisma.flexibleTicketRequest.findUniqueOrThrow({
          where: { id: request.id },
          include: this.operatorRequestInclude,
        }),
      );
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      await this.prisma.flexibleTicketRequest.update({
        where: { id: request.id },
        data: {
          failureCode: 'EXECUTION_ERROR',
          failureMessage:
            error instanceof Error ? error.message.slice(0, 500) : 'Unknown',
        },
      });
      throw error;
    }
  }

  private readonly operatorRequestInclude = {
    items: {
      include: {
        entitlement: true,
        participant: {
          select: { id: true, firstName: true, lastName: true },
        },
        ticket: {
          select: {
            id: true,
            ticketNumber: true,
            status: true,
            checkedInAt: true,
            participantId: true,
            adjustmentAllocation: { select: { id: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' as const },
    },
    booking: {
      select: {
        id: true,
        bookingNumber: true,
        status: true,
        paymentStatus: true,
        sessionId: true,
        session: {
          select: { id: true, name: true, startDate: true, endDate: true },
        },
        tickets: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            participantId: true,
            checkedInAt: true,
            adjustmentAllocation: { select: { id: true } },
          },
        },
      },
    },
    destinationSession: {
      select: { id: true, name: true, startDate: true, endDate: true },
    },
    reviewedByUser: { select: { id: true, name: true } },
    ticketAdjustment: {
      select: {
        id: true,
        adjustmentNumber: true,
        status: true,
        requestedAmount: true,
        refundedAmount: true,
      },
    },
    bookingReschedule: {
      select: {
        id: true,
        rescheduleNumber: true,
        status: true,
      },
    },
    useAllocations: true,
  } satisfies Prisma.FlexibleTicketRequestInclude;

  private async loadOperatorRequest(
    access: AuthenticatedAccessContext,
    bookingId: string,
    requestNumber: string,
  ) {
    this.assertManagementAccess(access);
    const request = await this.prisma.flexibleTicketRequest.findFirst({
      where: {
        requestNumber,
        bookingId,
        booking: { event: this.accessControl.eventWhere(access) },
      },
      include: this.operatorRequestInclude,
    });
    if (!request) {
      throw new NotFoundException('Flexible Ticket request not found.');
    }
    return request;
  }

  private assertManagementAccess(access: AuthenticatedAccessContext) {
    if (access.role !== 'OWNER' && access.role !== 'MANAGER') {
      throw new NotFoundException('Flexible Ticket request not found.');
    }
  }

  private assertApprovalReason(reason: FlexibleTicketDecisionReason) {
    if (reason !== FlexibleTicketDecisionReason.APPROVED_UNDER_ENTITLEMENT) {
      throw new BadRequestException(
        'Approval must use the approved-under-entitlement decision reason.',
      );
    }
  }

  private assertCurrentRequestEligibility(
    request: Awaited<
      ReturnType<FlexibleTicketRequestService['loadOperatorRequest']>
    >,
  ) {
    const now = new Date();
    if (
      request.booking.status !== 'CONFIRMED' ||
      request.booking.paymentStatus !== 'PAID' ||
      !request.booking.session
    ) {
      throw new BadRequestException(
        'The Booking is no longer eligible for Flexible Ticket use.',
      );
    }
    for (const item of request.items) {
      const entitlement = item.entitlement;
      const cutoffAt = new Date(
        request.booking.session.startDate.getTime() -
          entitlement.cutoffMinutesBeforeSessionSnapshot * 60_000,
      );
      if (
        entitlement.status !== FlexibleTicketEntitlementStatus.ACTIVE ||
        entitlement.remainingUses < 1 ||
        item.ticket.status !== 'ACTIVE' ||
        item.ticket.checkedInAt ||
        item.ticket.adjustmentAllocation ||
        now >= cutoffAt
      ) {
        throw new BadRequestException(
          `Ticket ${item.ticketNumberSnapshot} is no longer eligible for Flexible Ticket use.`,
        );
      }
      if (
        request.type === FlexibleTicketRequestType.REFUND &&
        !entitlement.allowsRefundRequestSnapshot
      ) {
        throw new BadRequestException(
          'The purchased entitlement does not permit a refund request.',
        );
      }
      if (
        request.type === FlexibleTicketRequestType.SESSION_CHANGE &&
        !entitlement.allowsSessionChangeSnapshot
      ) {
        throw new BadRequestException(
          'The purchased entitlement does not permit a Session change.',
        );
      }
    }
    if (request.type === FlexibleTicketRequestType.SESSION_CHANGE) {
      const selectedParticipants = new Set(
        request.items.map(({ participantId }) => participantId),
      );
      if (
        request.booking.tickets.length === 0 ||
        request.booking.tickets.some(
          (ticket) =>
            !selectedParticipants.has(ticket.participantId) ||
            Boolean(ticket.checkedInAt) ||
            Boolean(ticket.adjustmentAllocation),
        )
      ) {
        throw new BadRequestException(
          'Every active Ticket must remain covered and eligible for this whole-Booking Session change.',
        );
      }
    }
  }

  private decisionPreviewResponse(
    request: Awaited<
      ReturnType<FlexibleTicketRequestService['loadOperatorRequest']>
    >,
    access: AuthenticatedAccessContext,
    input: PreviewFlexibleTicketDecisionDto,
    note: string,
    mutation: { previewHash: string },
  ) {
    return {
      previewHash: this.decisionHash({
        requestId: request.id,
        access,
        decision: input.decision,
        reason: input.reason,
        note,
        mutationPreviewHash: mutation.previewHash,
      }),
      decision: input.decision,
      reason: input.reason,
      note,
      request: this.serializeOperatorRequest(request),
      mutation,
      consumesUses: request.items.length,
    };
  }

  private decisionHash(input: {
    requestId: string;
    access: AuthenticatedAccessContext;
    decision: string;
    reason: FlexibleTicketDecisionReason;
    note: string;
    mutationPreviewHash: string | null;
  }) {
    return createHash('sha256')
      .update(
        JSON.stringify({
          requestId: input.requestId,
          organizationId: input.access.organizationId,
          userId: input.access.userId,
          decision: input.decision,
          reason: input.reason,
          note: input.note,
          mutationPreviewHash: input.mutationPreviewHash,
        }),
      )
      .digest('hex');
  }

  private async completeDecline(
    access: AuthenticatedAccessContext,
    request: Awaited<
      ReturnType<FlexibleTicketRequestService['loadOperatorRequest']>
    >,
    input: ExecuteFlexibleTicketDecisionDto,
  ) {
    if (
      input.reason === FlexibleTicketDecisionReason.APPROVED_UNDER_ENTITLEMENT
    ) {
      throw new BadRequestException(
        'A declined request requires a decline reason.',
      );
    }
    const now = new Date();
    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.flexibleTicketRequest.updateMany({
        where: {
          id: request.id,
          status: {
            in: [
              FlexibleTicketRequestStatus.SUBMITTED,
              FlexibleTicketRequestStatus.UNDER_REVIEW,
            ],
          },
        },
        data: {
          status: FlexibleTicketRequestStatus.DECLINED,
          reviewedByUserId: access.userId,
          reviewedAt: request.reviewedAt ?? now,
          decisionReason: input.reason,
          decisionNote: input.note.trim(),
          decidedAt: now,
        },
      });
      if (updated.count !== 1) {
        throw new ConflictException(
          'This Flexible Ticket request changed before decline.',
        );
      }
      await transaction.flexibleTicketRequestItem.updateMany({
        where: { requestId: request.id },
        data: { activeRequestKey: null },
      });
      return this.serializeOperatorRequest(
        await transaction.flexibleTicketRequest.findUniqueOrThrow({
          where: { id: request.id },
          include: this.operatorRequestInclude,
        }),
      );
    });
  }

  private async finalizeCompletedRequest(
    request: Awaited<
      ReturnType<FlexibleTicketRequestService['loadOperatorRequest']>
    >,
    mutationId: string,
  ) {
    return this.prisma.$transaction(
      async (transaction) => {
        const existing =
          await transaction.flexibleTicketRequest.findUniqueOrThrow({
            where: { id: request.id },
            include: this.operatorRequestInclude,
          });
        if (existing.status === FlexibleTicketRequestStatus.COMPLETED) {
          return this.serializeOperatorRequest(existing);
        }
        if (existing.status !== FlexibleTicketRequestStatus.APPROVED) {
          throw new ConflictException(
            'The Flexible Ticket request is no longer approved.',
          );
        }
        const useAllocations: Array<{
          entitlementId: string;
          remainingUsesBefore: number;
          remainingUsesAfter: number;
        }> = [];
        for (const item of existing.items) {
          const entitlement =
            await transaction.flexibleTicketEntitlement.findUniqueOrThrow({
              where: { id: item.entitlementId },
            });
          const updated =
            await transaction.flexibleTicketEntitlement.updateMany({
              where: {
                id: entitlement.id,
                status: FlexibleTicketEntitlementStatus.ACTIVE,
                remainingUses: entitlement.remainingUses,
              },
              data: { remainingUses: { decrement: 1 } },
            });
          if (entitlement.remainingUses < 1 || updated.count !== 1) {
            throw new ConflictException(
              'A Flexible Ticket entitlement use changed before completion.',
            );
          }
          useAllocations.push({
            entitlementId: entitlement.id,
            remainingUsesBefore: entitlement.remainingUses,
            remainingUsesAfter: entitlement.remainingUses - 1,
          });
        }
        await transaction.flexibleTicketUseAllocation.createMany({
          data: useAllocations.map((allocation) => ({
            requestId: request.id,
            ...allocation,
          })),
        });
        await transaction.flexibleTicketRequestItem.updateMany({
          where: { requestId: request.id },
          data: { activeRequestKey: null },
        });
        const completed = await transaction.flexibleTicketRequest.update({
          where: { id: request.id },
          data: {
            status: FlexibleTicketRequestStatus.COMPLETED,
            completedAt: new Date(),
            ...(request.type === FlexibleTicketRequestType.REFUND
              ? { ticketAdjustmentId: mutationId }
              : { bookingRescheduleId: mutationId }),
          },
          include: this.operatorRequestInclude,
        });
        return this.serializeOperatorRequest(completed);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private async failApprovedRequest(
    request: Awaited<
      ReturnType<FlexibleTicketRequestService['loadOperatorRequest']>
    >,
    failureCode: string,
    failureMessage: string,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.flexibleTicketRequestItem.updateMany({
        where: { requestId: request.id },
        data: { activeRequestKey: null },
      });
      return this.serializeOperatorRequest(
        await transaction.flexibleTicketRequest.update({
          where: { id: request.id },
          data: {
            status: FlexibleTicketRequestStatus.FAILED,
            failedAt: new Date(),
            failureCode,
            failureMessage,
          },
          include: this.operatorRequestInclude,
        }),
      );
    });
  }

  private serializeOperatorRequest(
    request: Awaited<
      ReturnType<FlexibleTicketRequestService['loadOperatorRequest']>
    >,
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
      completedAt: request.completedAt,
      failedAt: request.failedAt,
      expiredAt: request.expiredAt,
      reviewedByUser: request.reviewedByUser,
      decisionReason: request.decisionReason,
      decisionNote: request.decisionNote,
      destinationSession: request.destinationSession,
      items: request.items.map((item) => ({
        entitlementNumber: item.entitlement.entitlementNumber,
        participantName: item.participantNameSnapshot,
        ticketId: item.ticketId,
        ticketNumber: item.ticketNumberSnapshot,
        ticketTypeName: item.ticketTypeNameSnapshot,
        ticketValue: item.ticketValueSnapshot.toNumber(),
        flexibleFee: item.flexibleFeeSnapshot.toNumber(),
        currency: item.currency,
        remainingUsesSnapshot: item.remainingUsesSnapshot,
        remainingUses: item.entitlement.remainingUses,
        cutoffAt: item.cutoffAtSnapshot,
        feeRefundability: item.entitlement.feeRefundabilitySnapshot,
      })),
      adjustment: request.ticketAdjustment
        ? {
            ...request.ticketAdjustment,
            requestedAmount:
              request.ticketAdjustment.requestedAmount.toNumber(),
            refundedAmount: request.ticketAdjustment.refundedAmount.toNumber(),
          }
        : null,
      reschedule: request.bookingReschedule,
      useAllocations: request.useAllocations,
    };
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
          ticketValue: entitlement.ticketFaceValueSnapshot.toNumber(),
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
        event: {
          id: booking.event.id,
          name: booking.event.name,
          timezone: booking.event.timezone,
        },
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
