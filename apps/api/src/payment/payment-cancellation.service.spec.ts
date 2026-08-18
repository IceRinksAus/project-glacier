import { Prisma } from '@prisma/client';

import { PaymentService } from './payment.service';

describe('PaymentService cancellation', () => {
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
  };

  const paymentProvider = {
    createPayment: jest.fn(),
    cancelPayment: jest.fn(),
    refundPayment: jest.fn(),
  };

  const ticketService = {
    issueTicketsForBooking: jest.fn(),
  };

  const pendingPayment = {
    id: 'payment-1',
    bookingId: 'booking-1',
    provider: 'STRIPE',
    providerReference:
      'pi_pending_1',
    idempotencyKey:
      'booking_booking-1_payment',
    amount: new Prisma.Decimal(24),
    currency: 'AUD',
    status: 'PENDING',
    failureCode: null,
    failureMessage: null,
    succeededAt: null,
    failedAt: null,
    cancelledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new PaymentService(
      prisma as never,
      paymentProvider,
      ticketService as never,
    );
  });

  it('should do nothing when the booking has no pending payment', async () => {
    prisma.payment.findFirst.mockResolvedValue(
      null,
    );

    const result =
      await service.cancelPendingPaymentForBooking(
        'booking-1',
      );

    expect(result).toEqual({
      cancelled: false,
      reason:
        'NO_PENDING_PAYMENT',
    });

    expect(
      paymentProvider.cancelPayment,
    ).not.toHaveBeenCalled();

    expect(
      prisma.payment.updateMany,
    ).not.toHaveBeenCalled();
  });

  it('should not contact the provider without a provider reference', async () => {
    prisma.payment.findFirst.mockResolvedValue({
      ...pendingPayment,
      providerReference: null,
    });

    const result =
      await service.cancelPendingPaymentForBooking(
        'booking-1',
      );

    expect(result).toEqual({
      cancelled: false,
      reason:
        'MISSING_PROVIDER_REFERENCE',
    });

    expect(
      paymentProvider.cancelPayment,
    ).not.toHaveBeenCalled();
  });

  it('should cancel the pending provider payment using a stable idempotency key', async () => {
    prisma.payment.findFirst.mockResolvedValue(
      pendingPayment,
    );

    paymentProvider.cancelPayment.mockResolvedValue({
      provider: 'STRIPE',
      paymentReference:
        'pi_pending_1',
      status: 'CANCELLED',
    });

    prisma.payment.updateMany.mockResolvedValue({
      count: 1,
    });

    const result =
      await service.cancelPendingPaymentForBooking(
        'booking-1',
      );

    expect(
      paymentProvider.cancelPayment,
    ).toHaveBeenCalledWith({
      paymentReference:
        'pi_pending_1',
      idempotencyKey:
        'cancel_payment-1',
    });

    expect(
      prisma.payment.updateMany,
    ).toHaveBeenCalledWith({
      where: {
        id: 'payment-1',
        status: 'PENDING',
      },
      data: {
        status: 'CANCELLED',
        cancelledAt:
          expect.any(Date),
      },
    });

    expect(result).toEqual({
      cancelled: true,
      paymentId: 'payment-1',
      paymentReference:
        'pi_pending_1',
    });
  });

  it('should leave the Glacier payment pending when provider cancellation does not complete', async () => {
    prisma.payment.findFirst.mockResolvedValue(
      pendingPayment,
    );

    paymentProvider.cancelPayment.mockResolvedValue({
      provider: 'STRIPE',
      paymentReference:
        'pi_pending_1',
      status: 'PENDING',
    });

    const result =
      await service.cancelPendingPaymentForBooking(
        'booking-1',
      );

    expect(result).toEqual({
      cancelled: false,
      reason:
        'PROVIDER_NOT_CANCELLED',
    });

    expect(
      prisma.payment.updateMany,
    ).not.toHaveBeenCalled();
  });

  it('should propagate provider cancellation errors so cleanup can retry later', async () => {
    prisma.payment.findFirst.mockResolvedValue(
      pendingPayment,
    );

    paymentProvider.cancelPayment.mockRejectedValue(
      new Error(
        'Stripe temporarily unavailable',
      ),
    );

    await expect(
      service.cancelPendingPaymentForBooking(
        'booking-1',
      ),
    ).rejects.toThrow(
      'Stripe temporarily unavailable',
    );

    expect(
      prisma.payment.updateMany,
    ).not.toHaveBeenCalled();
  });
});