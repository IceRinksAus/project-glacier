import { Prisma } from '@prisma/client';

import { PaymentService } from './payment.service';

describe('PaymentService late-success refund', () => {
  let service: PaymentService;

  const prisma = {
    booking: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    payment: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    paymentRefund: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const paymentProvider = {
    createPayment: jest.fn(),
    retrievePayment: jest.fn(),
    cancelPayment: jest.fn(),
    refundPayment: jest.fn(),
  };

  const ticketService = {
    issueTicketsForBooking: jest.fn(),
  };

  const payment = {
    id: 'payment-1',
    bookingId: 'booking-1',
    provider: 'STRIPE',
    providerReference:
      'pi_late_success',
    idempotencyKey:
      'booking_booking-1_payment',
    amount:
      new Prisma.Decimal(24),
    currency: 'AUD',
    status: 'PENDING',
    failureCode: null,
    failureMessage: null,
    succeededAt: null,
    failedAt: null,
    cancelledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    booking: {
      id: 'booking-1',
      status: 'EXPIRED',
      paymentStatus: 'UNPAID',
      reservedUntil:
        new Date(
          Date.now() - 60_000,
        ),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    prisma.payment.findFirst.mockResolvedValue(
      payment,
    );

    prisma.booking.updateMany.mockResolvedValue({
      count: 0,
    });

    prisma.booking.findUnique.mockResolvedValue({
      status: 'EXPIRED',
      paymentStatus: 'UNPAID',
    });

    prisma.paymentRefund.findUnique.mockResolvedValue(
      null,
    );

    prisma.paymentRefund.create.mockResolvedValue({
      id: 'refund-1',
      paymentId: 'payment-1',
      provider: 'STRIPE',
      providerReference:
        're_test_1',
      idempotencyKey:
        'refund_payment-1_expired_booking',
      amount:
        new Prisma.Decimal(24),
      currency: 'AUD',
      status: 'SUCCEEDED',
      reason:
        'Reservation expired before payment confirmation',
      failureCode: null,
      failureMessage: null,
      succeededAt:
        new Date(),
      failedAt: null,
      cancelledAt: null,
      createdAt:
        new Date(),
      updatedAt:
        new Date(),
    });

    paymentProvider.refundPayment.mockResolvedValue({
      provider: 'STRIPE',
      refundReference:
        're_test_1',
      paymentReference:
        'pi_late_success',
      status: 'SUCCEEDED',
    });

    service = new PaymentService(
      prisma as never,
      paymentProvider,
      ticketService as never,
    );
  });

  it('should automatically refund a successful payment when the booking has expired', async () => {
    const result =
      await service.completePaymentFromProviderEvent(
        {
          provider: 'STRIPE',
          paymentReference:
            'pi_late_success',
          status: 'SUCCEEDED',
        },
      );

    expect(
      paymentProvider.refundPayment,
    ).toHaveBeenCalledWith({
      paymentReference:
        'pi_late_success',
      amount: 24,
      currency: 'AUD',
      idempotencyKey:
        'refund_payment-1_expired_booking',
      reason:
        'Reservation expired before payment confirmation',
    });

    expect(
      prisma.paymentRefund.create,
    ).toHaveBeenCalledWith({
      data: {
        paymentId:
          'payment-1',
        provider: 'STRIPE',
        providerReference:
          're_test_1',
        idempotencyKey:
          'refund_payment-1_expired_booking',
        amount:
          new Prisma.Decimal(24),
        currency: 'AUD',
        status: 'SUCCEEDED',
        reason:
          'Reservation expired before payment confirmation',
        succeededAt:
          expect.any(Date),
        failedAt: null,
        cancelledAt: null,
      },
    });

    expect(
      ticketService.issueTicketsForBooking,
    ).not.toHaveBeenCalled();

    expect(result).toEqual({
      status: 'SUCCEEDED',
      bookingFulfilled: false,
      refunded: true,
      refundStatus:
        'SUCCEEDED',
      refundReference:
        're_test_1',
    });
  });

  it('should keep the provider payment recorded as SUCCEEDED', async () => {
    await service.completePaymentFromProviderEvent(
      {
        provider: 'STRIPE',
        paymentReference:
          'pi_late_success',
        status: 'SUCCEEDED',
      },
    );

    expect(
      prisma.payment.update,
    ).toHaveBeenCalledWith({
      where: {
        id: 'payment-1',
      },
      data: {
        status: 'SUCCEEDED',
        failureCode: null,
        failureMessage: null,
        succeededAt:
          expect.any(Date),
      },
    });
  });

  it('should use a stable refund idempotency key', async () => {
    await service.completePaymentFromProviderEvent(
      {
        provider: 'STRIPE',
        paymentReference:
          'pi_late_success',
        status: 'SUCCEEDED',
      },
    );

    expect(
      paymentProvider.refundPayment,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey:
          'refund_payment-1_expired_booking',
      }),
    );
  });

  it('should not create another Stripe refund when the refund already exists', async () => {
    prisma.payment.findFirst.mockResolvedValue({
      ...payment,
      status: 'SUCCEEDED',
    });

    prisma.paymentRefund.findUnique.mockResolvedValue({
      id: 'refund-1',
      providerReference:
        're_existing',
      status: 'SUCCEEDED',
    });

    const result =
      await service.completePaymentFromProviderEvent(
        {
          provider: 'STRIPE',
          paymentReference:
            'pi_late_success',
          status: 'SUCCEEDED',
        },
      );

    expect(
      paymentProvider.refundPayment,
    ).not.toHaveBeenCalled();

    expect(
      prisma.paymentRefund.create,
    ).not.toHaveBeenCalled();

    expect(result).toEqual({
      status: 'SUCCEEDED',
      bookingFulfilled: false,
      refunded: true,
      refundStatus:
        'SUCCEEDED',
      refundReference:
        're_existing',
    });
  });

  it('should persist a pending refund without issuing tickets', async () => {
    paymentProvider.refundPayment.mockResolvedValue({
      provider: 'STRIPE',
      refundReference:
        're_pending',
      paymentReference:
        'pi_late_success',
      status: 'PENDING',
    });

    prisma.paymentRefund.create.mockResolvedValue({
      id: 'refund-1',
      providerReference:
        're_pending',
      status: 'PENDING',
    });

    const result =
      await service.completePaymentFromProviderEvent(
        {
          provider: 'STRIPE',
          paymentReference:
            'pi_late_success',
          status: 'SUCCEEDED',
        },
      );

    expect(
      ticketService.issueTicketsForBooking,
    ).not.toHaveBeenCalled();

    expect(result).toEqual({
      status: 'SUCCEEDED',
      bookingFulfilled: false,
      refunded: true,
      refundStatus:
        'PENDING',
      refundReference:
        're_pending',
    });
  });

  it('should propagate Stripe refund API errors so the webhook can be retried', async () => {
    paymentProvider.refundPayment.mockRejectedValue(
      new Error(
        'Stripe refund API unavailable',
      ),
    );

    await expect(
      service.completePaymentFromProviderEvent(
        {
          provider: 'STRIPE',
          paymentReference:
            'pi_late_success',
          status: 'SUCCEEDED',
        },
      ),
    ).rejects.toThrow(
      'Stripe refund API unavailable',
    );

    expect(
      prisma.paymentRefund.create,
    ).not.toHaveBeenCalled();

    expect(
      ticketService.issueTicketsForBooking,
    ).not.toHaveBeenCalled();
  });
});
