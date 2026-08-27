import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  FlexibleTicketDecisionReason,
  FlexibleTicketEntitlementStatus,
  FlexibleTicketFeeRefundability,
  FlexibleTicketRequestReason,
  FlexibleTicketRequestStatus,
  FlexibleTicketRequestType,
  Prisma,
} from '@prisma/client';

import type { AuthenticatedAccessContext } from '../access-control/access-control.service';
import { FlexibleTicketRequestService } from './flexible-ticket-request.service';

describe('FlexibleTicketRequestService operator workflow', () => {
  const access: AuthenticatedAccessContext = {
    userId: 'owner-1',
    organizationId: 'organization-1',
    role: 'OWNER',
    accessScope: 'ALL_EVENTS',
  };
  let prisma: any;
  let accessControl: any;
  let adjustments: any;
  let reschedules: any;
  let service: FlexibleTicketRequestService;

  const request = (overrides: Record<string, unknown> = {}): any => ({
    id: 'request-1',
    requestNumber: 'FTR-1',
    type: FlexibleTicketRequestType.REFUND,
    status: FlexibleTicketRequestStatus.SUBMITTED,
    organizationId: 'organization-1',
    eventId: 'event-1',
    bookingId: 'booking-1',
    destinationSessionId: null,
    customerReason: FlexibleTicketRequestReason.CHANGE_OF_PLANS,
    customerNote: null,
    reviewedByUserId: null,
    reviewedByUser: null,
    reviewedAt: null,
    decisionReason: null,
    decisionNote: null,
    decidedAt: null,
    submittedAt: new Date(),
    withdrawnAt: null,
    completedAt: null,
    failedAt: null,
    expiredAt: null,
    destinationSession: null,
    ticketAdjustment: null,
    bookingReschedule: null,
    useAllocations: [],
    booking: {
      id: 'booking-1',
      bookingNumber: 'PG-1',
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      sessionId: 'session-1',
      session: {
        id: 'session-1',
        name: '10am',
        startDate: new Date(Date.now() + 3 * 60 * 60_000),
        endDate: new Date(Date.now() + 4 * 60 * 60_000),
      },
      tickets: [
        {
          id: 'ticket-1',
          participantId: 'participant-1',
          checkedInAt: null,
          adjustmentAllocation: null,
        },
      ],
    },
    items: [
      {
        id: 'item-1',
        requestId: 'request-1',
        entitlementId: 'entitlement-1',
        participantId: 'participant-1',
        ticketId: 'ticket-1',
        participantNameSnapshot: 'Taylor Adult',
        ticketNumberSnapshot: 'TKT-1',
        ticketTypeNameSnapshot: 'Adult',
        ticketValueSnapshot: new Prisma.Decimal(24),
        flexibleFeeSnapshot: new Prisma.Decimal(5),
        currency: 'AUD',
        remainingUsesSnapshot: 1,
        cutoffAtSnapshot: new Date(Date.now() + 2 * 60 * 60_000),
        participant: {
          id: 'participant-1',
          firstName: 'Taylor',
          lastName: 'Adult',
        },
        ticket: {
          id: 'ticket-1',
          ticketNumber: 'TKT-1',
          status: 'ACTIVE',
          checkedInAt: null,
          participantId: 'participant-1',
          adjustmentAllocation: null,
        },
        entitlement: {
          id: 'entitlement-1',
          entitlementNumber: 'FTE-1',
          status: FlexibleTicketEntitlementStatus.ACTIVE,
          remainingUses: 1,
          cutoffMinutesBeforeSessionSnapshot: 60,
          allowsRefundRequestSnapshot: true,
          allowsSessionChangeSnapshot: true,
          feeRefundabilitySnapshot:
            FlexibleTicketFeeRefundability.NON_REFUNDABLE,
        },
      },
    ],
    ...overrides,
  });

  beforeEach(() => {
    prisma = {
      booking: { findFirst: jest.fn() },
      flexibleTicketRequest: {
        findFirst: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
      },
      flexibleTicketRequestItem: { updateMany: jest.fn() },
      flexibleTicketEntitlement: {
        findUniqueOrThrow: jest.fn(),
        updateMany: jest.fn(),
      },
      flexibleTicketUseAllocation: { createMany: jest.fn() },
      $transaction: jest.fn((callback) => callback(prisma)),
    };
    accessControl = {
      eventWhere: jest.fn(() => ({ organizationId: 'organization-1' })),
    };
    adjustments = { preview: jest.fn(), execute: jest.fn() };
    reschedules = { preview: jest.fn(), execute: jest.fn() };
    service = new FlexibleTicketRequestService(
      prisma,
      accessControl,
      adjustments,
      reschedules,
    );
  });

  it('enforces management authority inside the service boundary', async () => {
    await expect(
      service.operatorContext({ ...access, role: 'STAFF' }, 'booking-1'),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.booking.findFirst).not.toHaveBeenCalled();
  });

  it('uses tenant and Event-assignment scope for operator lookup', async () => {
    prisma.booking.findFirst.mockResolvedValue(null);

    await expect(service.operatorContext(access, 'booking-1')).rejects.toThrow(
      NotFoundException,
    );

    expect(accessControl.eventWhere).toHaveBeenCalledWith(access);
    expect(prisma.booking.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          event: { organizationId: 'organization-1' },
        }),
      }),
    );
  });

  it('marks a submitted request under review without consuming an entitlement', async () => {
    const source = request();
    prisma.flexibleTicketRequest.findFirst.mockResolvedValue(source);
    prisma.flexibleTicketRequest.updateMany.mockResolvedValue({ count: 1 });
    prisma.flexibleTicketRequest.findUniqueOrThrow.mockResolvedValue({
      ...source,
      status: FlexibleTicketRequestStatus.UNDER_REVIEW,
      reviewedByUserId: access.userId,
      reviewedByUser: { id: access.userId, name: 'Owner' },
      reviewedAt: new Date(),
    });

    const result = await service.markUnderReview(access, 'booking-1', 'FTR-1');

    expect(result.status).toBe(FlexibleTicketRequestStatus.UNDER_REVIEW);
    expect(prisma.flexibleTicketEntitlement.updateMany).not.toHaveBeenCalled();
    expect(
      prisma.flexibleTicketUseAllocation.createMany,
    ).not.toHaveBeenCalled();
  });

  it('previews an eligible refund through the existing Ticket-adjustment authority', async () => {
    prisma.flexibleTicketRequest.findFirst.mockResolvedValue(request());
    adjustments.preview.mockResolvedValue({
      previewHash: 'a'.repeat(64),
      refundAmount: 24,
      ticketCount: 1,
    });

    const result = await service.previewDecision(access, 'booking-1', 'FTR-1', {
      decision: 'APPROVE',
      reason: FlexibleTicketDecisionReason.APPROVED_UNDER_ENTITLEMENT,
      note: 'Approved under the purchased entitlement.',
    });

    expect(result.previewHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.consumesUses).toBe(1);
    expect(adjustments.preview).toHaveBeenCalledWith(
      access,
      'booking-1',
      expect.objectContaining({
        action: 'CANCEL_AND_REFUND',
        reason: 'FLEXIBLE_TICKET',
        ticketIds: ['ticket-1'],
      }),
    );
  });

  it('fails closed when the Flexible Ticket fee requires a separate refund allocation', async () => {
    const source = request();
    source.items[0].entitlement.feeRefundabilitySnapshot =
      FlexibleTicketFeeRefundability.REFUNDABLE_WITH_TICKET;
    prisma.flexibleTicketRequest.findFirst.mockResolvedValue(source);

    await expect(
      service.previewDecision(access, 'booking-1', 'FTR-1', {
        decision: 'APPROVE',
        reason: FlexibleTicketDecisionReason.APPROVED_UNDER_ENTITLEMENT,
        note: 'Approved under the purchased entitlement.',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(adjustments.preview).not.toHaveBeenCalled();
  });

  it('declines with immutable decision evidence and consumes no use', async () => {
    const source = request();
    prisma.flexibleTicketRequest.findFirst.mockResolvedValue(source);
    prisma.flexibleTicketRequest.updateMany.mockResolvedValue({ count: 1 });
    prisma.flexibleTicketRequest.findUniqueOrThrow.mockResolvedValue({
      ...source,
      status: FlexibleTicketRequestStatus.DECLINED,
      decisionReason: FlexibleTicketDecisionReason.OUTSIDE_ENTITLEMENT,
      decisionNote: 'The request is outside the purchased terms.',
      reviewedByUser: { id: access.userId, name: 'Owner' },
      reviewedAt: new Date(),
      decidedAt: new Date(),
    });
    const preview = await service.previewDecision(
      access,
      'booking-1',
      'FTR-1',
      {
        decision: 'DECLINE',
        reason: FlexibleTicketDecisionReason.OUTSIDE_ENTITLEMENT,
        note: 'The request is outside the purchased terms.',
      },
    );

    const result = await service.executeDecision(access, 'booking-1', 'FTR-1', {
      decision: 'DECLINE',
      reason: FlexibleTicketDecisionReason.OUTSIDE_ENTITLEMENT,
      note: 'The request is outside the purchased terms.',
      previewHash: preview.previewHash,
    });

    expect(result.status).toBe(FlexibleTicketRequestStatus.DECLINED);
    expect(prisma.flexibleTicketRequestItem.updateMany).toHaveBeenCalledWith({
      where: { requestId: 'request-1' },
      data: { activeRequestKey: null },
    });
    expect(prisma.flexibleTicketEntitlement.updateMany).not.toHaveBeenCalled();
  });

  it('links a completed refund and consumes exactly one entitlement use', async () => {
    const source = request({
      status: FlexibleTicketRequestStatus.UNDER_REVIEW,
    });
    prisma.flexibleTicketRequest.findFirst.mockResolvedValue(source);
    prisma.flexibleTicketRequest.updateMany.mockResolvedValue({ count: 1 });
    adjustments.preview.mockResolvedValue({
      previewHash: 'b'.repeat(64),
      refundAmount: 24,
    });
    adjustments.execute.mockResolvedValue({
      id: 'adjustment-1',
      status: 'COMPLETED',
    });
    const approved = {
      ...source,
      status: FlexibleTicketRequestStatus.APPROVED,
      reviewedByUserId: access.userId,
      reviewedByUser: { id: access.userId, name: 'Owner' },
      reviewedAt: new Date(),
      decisionReason: FlexibleTicketDecisionReason.APPROVED_UNDER_ENTITLEMENT,
      decisionNote: 'Approved under the purchased entitlement.',
      decidedAt: new Date(),
    };
    prisma.flexibleTicketRequest.findUniqueOrThrow.mockResolvedValue(approved);
    prisma.flexibleTicketEntitlement.findUniqueOrThrow.mockResolvedValue({
      id: 'entitlement-1',
      status: FlexibleTicketEntitlementStatus.ACTIVE,
      remainingUses: 1,
    });
    prisma.flexibleTicketEntitlement.updateMany.mockResolvedValue({ count: 1 });
    prisma.flexibleTicketRequest.update.mockResolvedValue({
      ...approved,
      status: FlexibleTicketRequestStatus.COMPLETED,
      completedAt: new Date(),
      ticketAdjustment: {
        id: 'adjustment-1',
        adjustmentNumber: 'TA-1',
        status: 'COMPLETED',
        requestedAmount: new Prisma.Decimal(24),
        refundedAmount: new Prisma.Decimal(24),
      },
      useAllocations: [
        {
          entitlementId: 'entitlement-1',
          remainingUsesBefore: 1,
          remainingUsesAfter: 0,
        },
      ],
    });
    const decision = {
      decision: 'APPROVE' as const,
      reason: FlexibleTicketDecisionReason.APPROVED_UNDER_ENTITLEMENT,
      note: 'Approved under the purchased entitlement.',
    };
    const preview = await service.previewDecision(
      access,
      'booking-1',
      'FTR-1',
      decision,
    );

    const result = await service.executeDecision(access, 'booking-1', 'FTR-1', {
      ...decision,
      previewHash: preview.previewHash,
    });

    expect(result.status).toBe(FlexibleTicketRequestStatus.COMPLETED);
    expect(adjustments.execute).toHaveBeenCalledWith(
      access,
      'booking-1',
      expect.objectContaining({
        idempotencyKey: 'flex_request_request-1',
        previewHash: 'b'.repeat(64),
      }),
    );
    expect(prisma.flexibleTicketEntitlement.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'entitlement-1',
        status: FlexibleTicketEntitlementStatus.ACTIVE,
        remainingUses: 1,
      },
      data: { remainingUses: { decrement: 1 } },
    });
    expect(prisma.flexibleTicketUseAllocation.createMany).toHaveBeenCalledWith({
      data: [
        {
          requestId: 'request-1',
          entitlementId: 'entitlement-1',
          remainingUsesBefore: 1,
          remainingUsesAfter: 0,
        },
      ],
    });
  });

  it('uses the whole-Booking reschedule authority for an all-covered Session request', async () => {
    const source = request({
      type: FlexibleTicketRequestType.SESSION_CHANGE,
      destinationSessionId: 'session-2',
      destinationSession: {
        id: 'session-2',
        name: '11am',
        startDate: new Date(Date.now() + 5 * 60 * 60_000),
        endDate: new Date(Date.now() + 6 * 60 * 60_000),
      },
    });
    prisma.flexibleTicketRequest.findFirst.mockResolvedValue(source);
    reschedules.preview.mockResolvedValue({
      previewHash: 'c'.repeat(64),
      ticketCount: 1,
    });

    await service.previewDecision(access, 'booking-1', 'FTR-1', {
      decision: 'APPROVE',
      reason: FlexibleTicketDecisionReason.APPROVED_UNDER_ENTITLEMENT,
      note: 'Approved under the purchased entitlement.',
    });

    expect(reschedules.preview).toHaveBeenCalledWith(
      access,
      'booking-1',
      expect.objectContaining({
        destinationSessionId: 'session-2',
        reason: 'FLEXIBLE_TICKET',
      }),
    );
  });

  it('rejects a changed terminal-decision retry', async () => {
    prisma.flexibleTicketRequest.findFirst.mockResolvedValue(
      request({
        status: FlexibleTicketRequestStatus.DECLINED,
        decisionReason: FlexibleTicketDecisionReason.CUTOFF_PASSED,
        decisionNote: 'The deadline passed before approval.',
      }),
    );

    await expect(
      service.executeDecision(access, 'booking-1', 'FTR-1', {
        decision: 'DECLINE',
        reason: FlexibleTicketDecisionReason.OTHER,
        note: 'Different decision evidence.',
        previewHash: 'd'.repeat(64),
      }),
    ).rejects.toThrow(ConflictException);
  });
});
