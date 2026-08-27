import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  FlexibleTicketEntitlementStatus,
  FlexibleTicketRequestReason,
  FlexibleTicketRequestStatus,
  FlexibleTicketRequestType,
  Prisma,
} from '@prisma/client';
import { createHash } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service';
import { FlexibleTicketRequestService } from './flexible-ticket-request.service';

describe('FlexibleTicketRequestService public workflow', () => {
  const token = 'a'.repeat(64);
  const tokenHash = createHash('sha256').update(token).digest('hex');
  let prisma: any;
  let service: FlexibleTicketRequestService;

  const entitlement = (overrides: Record<string, unknown> = {}) => ({
    id: 'entitlement-1',
    entitlementNumber: 'FTE-1',
    status: FlexibleTicketEntitlementStatus.ACTIVE,
    participantId: 'participant-1',
    ticketTypeNameSnapshot: 'Adult',
    ticketFaceValueSnapshot: new Prisma.Decimal(24),
    feeAmount: new Prisma.Decimal(5),
    currency: 'AUD',
    remainingUses: 1,
    cutoffMinutesBeforeSessionSnapshot: 60,
    allowsRefundRequestSnapshot: true,
    allowsSessionChangeSnapshot: true,
    feeRefundabilitySnapshot: 'NON_REFUNDABLE',
    participant: {
      firstName: 'Taylor',
      lastName: 'Adult',
      tickets: [
        {
          id: 'ticket-1',
          ticketNumber: 'TKT-1',
          status: 'ACTIVE',
          checkedInAt: null,
          adjustmentAllocation: null,
        },
      ],
    },
    ...overrides,
  });

  const booking = (overrides: Record<string, unknown> = {}) => ({
    id: 'booking-1',
    bookingNumber: 'PG-1',
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    eventId: 'event-1',
    sessionId: 'session-1',
    publicAccessTokenHash: tokenHash,
    session: {
      id: 'session-1',
      name: '10am',
      startDate: new Date(Date.now() + 3 * 60 * 60_000),
      endDate: new Date(Date.now() + 4 * 60 * 60_000),
    },
    event: {
      id: 'event-1',
      name: 'Test Event',
      timezone: 'Australia/Melbourne',
      organizationId: 'organization-1',
    },
    tickets: [
      {
        id: 'ticket-1',
        ticketNumber: 'TKT-1',
        status: 'ACTIVE',
        checkedInAt: null,
        participantId: 'participant-1',
        adjustmentAllocation: null,
      },
      {
        id: 'ticket-2',
        ticketNumber: 'TKT-2',
        status: 'ACTIVE',
        checkedInAt: null,
        participantId: 'participant-2',
        adjustmentAllocation: null,
      },
    ],
    flexibleTicketEntitlements: [entitlement()],
    flexibleTicketRequests: [],
    ...overrides,
  });

  beforeEach(() => {
    prisma = {
      booking: { findFirst: jest.fn() },
      session: { findFirst: jest.fn(), findMany: jest.fn() },
      flexibleTicketRequest: {
        create: jest.fn(),
        updateMany: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
      flexibleTicketRequestItem: { updateMany: jest.fn() },
      $transaction: jest.fn((callback) => callback(prisma)),
    };
    service = new FlexibleTicketRequestService(prisma as PrismaService);
  });

  it('uses a SHA-256 possession-token lookup and returns no context for an invalid token', async () => {
    prisma.booking.findFirst.mockResolvedValue(null);

    await expect(service.publicContext('booking-1', token)).rejects.toThrow(
      NotFoundException,
    );

    expect(prisma.booking.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'booking-1', publicAccessTokenHash: tokenHash },
      }),
    );
  });

  it('offers refund only for the covered Ticket and blocks a partial-coverage Session change', async () => {
    prisma.booking.findFirst.mockResolvedValue(booking());

    const result = await service.publicContext('booking-1', token);

    expect(result.entitlements).toEqual([
      expect.objectContaining({
        entitlementNumber: 'FTE-1',
        ticketNumber: 'TKT-1',
        canRequestRefund: true,
        canRequestSessionChange: true,
      }),
    ]);
    expect(result.canRequestSessionChange).toBe(false);
    expect(result.destinations).toEqual([]);
    expect(prisma.session.findMany).not.toHaveBeenCalled();
  });

  it('persists a refund request as case evidence without invoking a mutation engine', async () => {
    const source = booking();
    prisma.booking.findFirst.mockResolvedValue(source);
    prisma.flexibleTicketRequest.create.mockImplementation(({ data }) => ({
      ...data,
      requestNumber: 'FTR-1',
      status: FlexibleTicketRequestStatus.SUBMITTED,
      submittedAt: new Date(),
      reviewedAt: null,
      decidedAt: null,
      withdrawnAt: null,
      completedAt: null,
      failedAt: null,
      expiredAt: null,
      destinationSession: null,
      ticketAdjustment: null,
      bookingReschedule: null,
      items: data.items.create.map((item: any) => ({
        ...item,
        ticketValueSnapshot: new Prisma.Decimal(item.ticketValueSnapshot),
        flexibleFeeSnapshot: new Prisma.Decimal(item.flexibleFeeSnapshot),
      })),
    }));

    const result = await service.createPublicRequest('booking-1', {
      publicAccessToken: token,
      idempotencyKey: 'request_key_1234567890',
      type: FlexibleTicketRequestType.REFUND,
      entitlementIds: ['entitlement-1'],
      customerReason: FlexibleTicketRequestReason.CHANGE_OF_PLANS,
    });

    expect(result).toEqual(
      expect.objectContaining({
        requestNumber: 'FTR-1',
        status: FlexibleTicketRequestStatus.SUBMITTED,
        canWithdraw: true,
      }),
    );
    expect(prisma.flexibleTicketRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: 'organization-1',
          eventId: 'event-1',
          bookingId: 'booking-1',
          items: {
            create: [
              expect.objectContaining({
                entitlementId: 'entitlement-1',
                ticketId: 'ticket-1',
                activeRequestKey: 'entitlement-1:REFUND',
              }),
            ],
          },
        }),
      }),
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects duplicate entitlement selection and foreign entitlement identifiers', async () => {
    prisma.booking.findFirst.mockResolvedValue(booking());
    const base = {
      publicAccessToken: token,
      idempotencyKey: 'request_key_1234567890',
      type: FlexibleTicketRequestType.REFUND,
      customerReason: FlexibleTicketRequestReason.OTHER,
    };

    await expect(
      service.createPublicRequest('booking-1', {
        ...base,
        entitlementIds: ['entitlement-1', 'entitlement-1'],
      }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.createPublicRequest('booking-1', {
        ...base,
        entitlementIds: ['foreign-entitlement'],
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('re-evaluates the immutable cut-off and rejects a late request', async () => {
    prisma.booking.findFirst.mockResolvedValue(
      booking({
        session: {
          id: 'session-1',
          name: '10am',
          startDate: new Date(Date.now() + 30 * 60_000),
          endDate: new Date(Date.now() + 90 * 60_000),
        },
      }),
    );

    await expect(
      service.createPublicRequest('booking-1', {
        publicAccessToken: token,
        idempotencyKey: 'request_key_1234567890',
        type: FlexibleTicketRequestType.REFUND,
        entitlementIds: ['entitlement-1'],
        customerReason: FlexibleTicketRequestReason.ILLNESS_OR_INJURY,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('requires all active Tickets to be covered for a Session-change request', async () => {
    prisma.booking.findFirst.mockResolvedValue(booking());

    await expect(
      service.createPublicRequest('booking-1', {
        publicAccessToken: token,
        idempotencyKey: 'request_key_1234567890',
        type: FlexibleTicketRequestType.SESSION_CHANGE,
        entitlementIds: ['entitlement-1'],
        destinationSessionId: 'session-2',
        customerReason: FlexibleTicketRequestReason.CHANGE_OF_PLANS,
      }),
    ).rejects.toThrow(ConflictException);
    expect(prisma.session.findFirst).not.toHaveBeenCalled();
  });

  it('returns an exact idempotent request and rejects changed content', async () => {
    const prior = {
      id: 'request-1',
      requestNumber: 'FTR-1',
      idempotencyKey: 'request_key_1234567890',
      type: FlexibleTicketRequestType.REFUND,
      status: FlexibleTicketRequestStatus.SUBMITTED,
      destinationSessionId: null,
      customerReason: FlexibleTicketRequestReason.CHANGE_OF_PLANS,
      customerNote: null,
      submittedAt: new Date(),
      reviewedAt: null,
      decidedAt: null,
      withdrawnAt: null,
      completedAt: null,
      failedAt: null,
      expiredAt: null,
      destinationSession: null,
      ticketAdjustment: null,
      bookingReschedule: null,
      items: [
        {
          entitlementId: 'entitlement-1',
          participantNameSnapshot: 'Taylor Adult',
          ticketNumberSnapshot: 'TKT-1',
          ticketTypeNameSnapshot: 'Adult',
          ticketValueSnapshot: new Prisma.Decimal(24),
          flexibleFeeSnapshot: new Prisma.Decimal(5),
          currency: 'AUD',
          cutoffAtSnapshot: new Date(Date.now() + 60_000),
        },
      ],
    };
    prisma.booking.findFirst.mockResolvedValue(
      booking({ flexibleTicketRequests: [prior] }),
    );

    await expect(
      service.createPublicRequest('booking-1', {
        publicAccessToken: token,
        idempotencyKey: prior.idempotencyKey,
        type: FlexibleTicketRequestType.REFUND,
        entitlementIds: ['entitlement-1'],
        customerReason: FlexibleTicketRequestReason.CHANGE_OF_PLANS,
      }),
    ).resolves.toEqual(expect.objectContaining({ requestNumber: 'FTR-1' }));

    await expect(
      service.createPublicRequest('booking-1', {
        publicAccessToken: token,
        idempotencyKey: prior.idempotencyKey,
        type: FlexibleTicketRequestType.REFUND,
        entitlementIds: ['entitlement-1'],
        customerReason: FlexibleTicketRequestReason.OTHER,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('withdraws only a submitted request and releases its active request keys', async () => {
    const source: any = booking({
      flexibleTicketRequests: [
        {
          id: 'request-1',
          requestNumber: 'FTR-1',
          status: FlexibleTicketRequestStatus.SUBMITTED,
          items: [],
        },
      ],
    });
    prisma.booking.findFirst.mockResolvedValue(source);
    prisma.flexibleTicketRequest.updateMany.mockResolvedValue({ count: 1 });
    prisma.flexibleTicketRequest.findUniqueOrThrow.mockResolvedValue({
      ...source.flexibleTicketRequests[0],
      type: FlexibleTicketRequestType.REFUND,
      status: FlexibleTicketRequestStatus.WITHDRAWN,
      customerReason: FlexibleTicketRequestReason.OTHER,
      customerNote: null,
      submittedAt: new Date(),
      reviewedAt: null,
      decidedAt: null,
      withdrawnAt: new Date(),
      completedAt: null,
      failedAt: null,
      expiredAt: null,
      destinationSession: null,
      ticketAdjustment: null,
      bookingReschedule: null,
    });

    const result = await service.withdrawPublicRequest(
      'booking-1',
      'FTR-1',
      token,
    );

    expect(result.status).toBe(FlexibleTicketRequestStatus.WITHDRAWN);
    expect(prisma.flexibleTicketRequestItem.updateMany).toHaveBeenCalledWith({
      where: { requestId: 'request-1' },
      data: { activeRequestKey: null },
    });
  });
});
