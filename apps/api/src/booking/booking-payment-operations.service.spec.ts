import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { BookingService } from './booking.service';

describe('BookingService payment operations', () => {
  const prisma = {
    booking: {
      findFirst: jest.fn(),
    },
    paymentReconciliationAttempt: {
      create: jest.fn(),
    },
  };

  const paymentService = {
    reconcilePendingPaymentForBooking:
      jest.fn(),
  };

  let service: BookingService;

  const investigation = {
    id: 'booking-1',
    bookingNumber:
      'PG-1234567890-1234',
    status: 'EXPIRED',
    paymentStatus: 'UNPAID',
    total: new Prisma.Decimal(74),
    reservedUntil: new Date(),
    confirmedAt: null,
    paidAt: null,
    expiredAt: new Date(),
    createdAt: new Date(),
    customer: {
      firstName: 'Jamie',
      lastName: 'Stoller',
      email: 'jamie@example.com',
    },
    event: {
      id: 'event-1',
      name: 'Winter Festival',
    },
    session: {
      id: 'session-1',
      name: '10:00 session',
      startDate: new Date(),
      endDate: new Date(),
    },
    tickets: [],
    payments: [
      {
        id: 'payment-1',
        provider: 'STRIPE',
        providerReference:
          'pi_sensitive_12345678',
        amount:
          new Prisma.Decimal(74),
        currency: 'AUD',
        status: 'PENDING',
        failureCode: null,
        failureMessage: null,
        succeededAt: null,
        failedAt: null,
        cancelledAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        refunds: [],
      },
    ],
    paymentReconciliationAttempts: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new BookingService(
      prisma as never,
      {} as never,
      {} as never,
      paymentService as never,
    );
  });

  it('returns a tenant-scoped investigation without exposing the full provider reference', async () => {
    prisma.booking.findFirst.mockResolvedValue(
      investigation,
    );

    const result =
      await service.findPaymentInvestigation(
        'organization-1',
        'booking-1',
      );

    expect(
      prisma.booking.findFirst,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'booking-1',
          event: {
            organizationId:
              'organization-1',
          },
        },
      }),
    );

    expect(result.total).toBe(74);
    expect(
      result.requiresReconciliation,
    ).toBe(true);
    expect(result.payments[0]).toEqual(
      expect.objectContaining({
        amount: 74,
        providerReferenceSummary:
          '••••12345678',
      }),
    );
    expect(result.payments[0]).not.toHaveProperty(
      'providerReference',
    );
  });

  it('uses the same not-found response outside the tenant boundary', async () => {
    prisma.booking.findFirst.mockResolvedValue(
      null,
    );

    await expect(
      service.findPaymentInvestigation(
        'other-organization',
        'booking-1',
      ),
    ).rejects.toThrow(
      new NotFoundException(
        'Booking not found',
      ),
    );
  });

  it('reconciles through PaymentService and records the acting owner', async () => {
    prisma.booking.findFirst
      .mockResolvedValueOnce({
        id: 'booking-1',
        eventId: 'event-1',
        payments: [
          {
            id: 'payment-1',
          },
        ],
      })
      .mockResolvedValueOnce({
        ...investigation,
        payments: [
          {
            ...investigation.payments[0],
            status: 'SUCCEEDED',
            succeededAt: new Date(),
          },
        ],
      });

    paymentService.reconcilePendingPaymentForBooking.mockResolvedValue({
      reconciled: true,
      paymentId: 'payment-1',
      providerStatus:
        'SUCCEEDED',
      reconciliation: {
        status: 'SUCCEEDED',
      },
    });

    prisma.paymentReconciliationAttempt.create.mockResolvedValue({});

    const result =
      await service.reconcilePayment(
        'organization-1',
        'owner-1',
        'booking-1',
      );

    expect(
      paymentService.reconcilePendingPaymentForBooking,
    ).toHaveBeenCalledWith(
      'booking-1',
    );

    expect(
      prisma.paymentReconciliationAttempt.create,
    ).toHaveBeenCalledWith({
      data: {
        organizationId:
          'organization-1',
        eventId: 'event-1',
        bookingId: 'booking-1',
        paymentId: 'payment-1',
        userId: 'owner-1',
        trigger: 'MANUAL',
        outcome:
          'RECONCILED_SUCCEEDED',
        providerStatus:
          'SUCCEEDED',
        succeeded: true,
      },
    });

    expect(
      result.investigation.requiresReconciliation,
    ).toBe(false);
  });

  it('records a bounded failed attempt and preserves the provider error', async () => {
    prisma.booking.findFirst.mockResolvedValue({
      id: 'booking-1',
      eventId: 'event-1',
      payments: [
        {
          id: 'payment-1',
        },
      ],
    });

    paymentService.reconcilePendingPaymentForBooking.mockRejectedValue(
      new Error(
        'Stripe temporarily unavailable',
      ),
    );

    prisma.paymentReconciliationAttempt.create.mockResolvedValue({});

    await expect(
      service.reconcilePayment(
        'organization-1',
        'owner-1',
        'booking-1',
      ),
    ).rejects.toThrow(
      'Stripe temporarily unavailable',
    );

    expect(
      prisma.paymentReconciliationAttempt.create,
    ).toHaveBeenCalledWith({
      data: expect.objectContaining({
        outcome: 'ERROR',
        succeeded: false,
        errorMessage:
          'Stripe temporarily unavailable',
      }),
    });
  });
});
