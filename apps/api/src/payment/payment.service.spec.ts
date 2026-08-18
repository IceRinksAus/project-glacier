import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PaymentService } from './payment.service';

describe('PaymentService', () => {
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
    cancelPayment: jest.fn(),
    refundPayment: jest.fn(),
  };

  const ticketService = {
    issueTicketsForBooking: jest.fn(),
  };

  const booking = {
    id: 'booking-1',
    bookingNumber:
      'PG-1234567890-1234',
    status: 'RESERVED',
    total:
      new Prisma.Decimal(24),
    reservedUntil: new Date(
      Date.now() +
        15 * 60 * 1000,
    ),
    paymentStatus: 'UNPAID',
    paymentReference: null,
    paidAt: null,
    confirmedAt: null,
    customer: {
      id: 'customer-1',
      email:
        'jamie@example.com',
    },
  };

  const paymentRecord = {
    id: 'payment-1',
    bookingId: 'booking-1',
    provider: 'MOCK',
    providerReference:
      'mock-payment-1',
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
      status: 'RESERVED',
      paymentStatus:
        'UNPAID',
      reservedUntil: new Date(
        Date.now() +
          15 * 60 * 1000,
      ),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    prisma.booking.findUnique.mockResolvedValue(
      booking,
    );

    prisma.payment.findFirst.mockResolvedValue(
      null,
    );

    prisma.booking.updateMany.mockResolvedValue({
      count: 1,
    });

    prisma.payment.create.mockResolvedValue({
      id: 'payment-1',
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
      succeededAt: new Date(),
      failedAt: null,
      cancelledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    service = new PaymentService(
      prisma as never,
      paymentProvider,
      ticketService as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should reject an unknown booking', async () => {
    prisma.booking.findUnique.mockResolvedValue(
      null,
    );

    await expect(
      service.createPayment(
        'booking-1',
      ),
    ).rejects.toThrow(
      new NotFoundException(
        'Booking not found',
      ),
    );

    expect(
      paymentProvider.createPayment,
    ).not.toHaveBeenCalled();
  });

  it('should reject a booking that is not RESERVED', async () => {
    prisma.booking.findUnique.mockResolvedValue({
      ...booking,
      status: 'EXPIRED',
    });

    await expect(
      service.createPayment(
        'booking-1',
      ),
    ).rejects.toThrow(
      new BadRequestException(
        'Only reserved bookings can be paid',
      ),
    );

    expect(
      paymentProvider.createPayment,
    ).not.toHaveBeenCalled();
  });

  it('should reject an expired reservation', async () => {
    prisma.booking.findUnique.mockResolvedValue({
      ...booking,
      reservedUntil:
        new Date(
          Date.now() -
            60_000,
        ),
    });

    await expect(
      service.createPayment(
        'booking-1',
      ),
    ).rejects.toThrow(
      new BadRequestException(
        'This booking reservation has expired',
      ),
    );

    expect(
      paymentProvider.createPayment,
    ).not.toHaveBeenCalled();
  });

  it('should not call the provider for an already-paid booking', async () => {
    prisma.booking.findUnique.mockResolvedValue({
      ...booking,
      status:
        'CONFIRMED',
      paymentStatus:
        'PAID',
      paymentReference:
        'mock-payment-1',
      paidAt: new Date(),
      confirmedAt:
        new Date(),
    });

    await expect(
      service.createPayment(
        'booking-1',
      ),
    ).rejects.toThrow(
      new BadRequestException(
        'This booking has already been paid',
      ),
    );

    expect(
      paymentProvider.createPayment,
    ).not.toHaveBeenCalled();

    expect(
      prisma.payment.create,
    ).not.toHaveBeenCalled();
  });

  it('should send the authoritative booking amount and idempotency key to the payment provider', async () => {
    paymentProvider.createPayment.mockResolvedValue({
      provider: 'MOCK',
      paymentReference:
        'mock-payment-1',
      status: 'PENDING',
    });

    await service.createPayment(
      'booking-1',
    );

    expect(
      paymentProvider.createPayment,
    ).toHaveBeenCalledWith({
      bookingId:
        'booking-1',
      amount: 24,
      currency: 'AUD',
      customerEmail:
        'jamie@example.com',
      idempotencyKey:
        'booking_booking-1_payment',
    });
  });

  it('should create a Payment record when payment is initiated', async () => {
    paymentProvider.createPayment.mockResolvedValue({
      provider: 'MOCK',
      paymentReference:
        'mock-payment-1',
      status: 'PENDING',
    });

    await service.createPayment(
      'booking-1',
    );

    expect(
      prisma.payment.create,
    ).toHaveBeenCalledWith({
      data:
        expect.objectContaining({
          bookingId:
            'booking-1',
          provider: 'MOCK',
          providerReference:
            'mock-payment-1',
          idempotencyKey:
            'booking_booking-1_payment',
          amount:
            new Prisma.Decimal(
              24,
            ),
          currency: 'AUD',
          status: 'PENDING',
          succeededAt:
            null,
          failedAt: null,
          cancelledAt:
            null,
        }),
    });
  });

  it('should leave the booking unpaid when initiation returns PENDING', async () => {
    paymentProvider.createPayment.mockResolvedValue({
      provider: 'MOCK',
      paymentReference:
        'mock-payment-1',
      status: 'PENDING',
    });

    await service.createPayment(
      'booking-1',
    );

    expect(
      prisma.booking.updateMany,
    ).not.toHaveBeenCalled();

    expect(
      ticketService.issueTicketsForBooking,
    ).not.toHaveBeenCalled();
  });

  it('should leave the booking unpaid when initiation returns FAILED', async () => {
    paymentProvider.createPayment.mockResolvedValue({
      provider: 'MOCK',
      paymentReference:
        'mock-payment-1',
      status: 'FAILED',
    });

    await service.createPayment(
      'booking-1',
    );

    expect(
      prisma.booking.updateMany,
    ).not.toHaveBeenCalled();

    expect(
      ticketService.issueTicketsForBooking,
    ).not.toHaveBeenCalled();

    expect(
      prisma.payment.create,
    ).toHaveBeenCalledWith({
      data:
        expect.objectContaining({
          status: 'FAILED',
          failedAt:
            expect.any(
              Date,
            ),
        }),
    });
  });

  it('should block another payment while the latest attempt is PENDING', async () => {
    prisma.payment.findFirst.mockResolvedValue({
      ...paymentRecord,
      status: 'PENDING',
    });

    await expect(
      service.createPayment(
        'booking-1',
      ),
    ).rejects.toThrow(
      new BadRequestException(
        'A payment is already in progress for this booking',
      ),
    );

    expect(
      paymentProvider.createPayment,
    ).not.toHaveBeenCalled();
  });

  it('should block another payment when the latest attempt SUCCEEDED', async () => {
    prisma.payment.findFirst.mockResolvedValue({
      ...paymentRecord,
      status:
        'SUCCEEDED',
    });

    await expect(
      service.createPayment(
        'booking-1',
      ),
    ).rejects.toThrow(
      new BadRequestException(
        'This booking has already been paid',
      ),
    );

    expect(
      paymentProvider.createPayment,
    ).not.toHaveBeenCalled();
  });

  it('should allow a retry after a FAILED payment with a new idempotency key', async () => {
    prisma.payment.findFirst.mockResolvedValue({
      ...paymentRecord,
      status: 'FAILED',
    });

    paymentProvider.createPayment.mockResolvedValue({
      provider: 'MOCK',
      paymentReference:
        'mock-retry-1',
      status: 'PENDING',
    });

    await service.createPayment(
      'booking-1',
    );

    expect(
      paymentProvider.createPayment,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        bookingId:
          'booking-1',
        idempotencyKey:
          expect.stringMatching(
            /^booking_booking-1_payment_/,
          ),
      }),
    );

    expect(
      prisma.payment.create,
    ).toHaveBeenCalledWith({
      data:
        expect.objectContaining({
          status:
            'PENDING',
          idempotencyKey:
            expect.stringMatching(
              /^booking_booking-1_payment_/,
            ),
        }),
    });
  });

  it('should route immediate provider success through the authoritative completion path', async () => {
    prisma.payment.findFirst
      .mockResolvedValueOnce(
        null,
      )
      .mockResolvedValueOnce({
        ...paymentRecord,
        status:
          'SUCCEEDED',
      });

    paymentProvider.createPayment.mockResolvedValue({
      provider: 'MOCK',
      paymentReference:
        'mock-payment-1',
      status:
        'SUCCEEDED',
    });

    prisma.booking.updateMany.mockResolvedValue({
      count: 1,
    });

    await service.createPayment(
      'booking-1',
    );

    expect(
      prisma.booking.updateMany,
    ).toHaveBeenCalledWith({
      where: {
        id: 'booking-1',
        status:
          'RESERVED',
        reservedUntil: {
          gt: expect.any(
            Date,
          ),
        },
      },
      data:
        expect.objectContaining({
          paymentReference:
            'mock-payment-1',
          paymentStatus:
            'PAID',
          status:
            'CONFIRMED',
          paidAt:
            expect.any(
              Date,
            ),
          confirmedAt:
            expect.any(
              Date,
            ),
        }),
    });

    expect(
      ticketService.issueTicketsForBooking,
    ).toHaveBeenCalledWith(
      'booking-1',
    );
  });

  describe(
    'completePaymentFromProviderEvent',
    () => {
      it('should reject an unknown provider payment', async () => {
        prisma.payment.findFirst.mockResolvedValue(
          null,
        );

        await expect(
          service.completePaymentFromProviderEvent(
            {
              provider:
                'STRIPE',
              paymentReference:
                'pi_missing',
              status:
                'SUCCEEDED',
            },
          ),
        ).rejects.toThrow(
          new NotFoundException(
            'Payment not found',
          ),
        );
      });

      it('should mark a payment FAILED without confirming the booking', async () => {
        prisma.payment.findFirst.mockResolvedValue({
          ...paymentRecord,
          status:
            'PENDING',
        });

        const result =
          await service.completePaymentFromProviderEvent(
            {
              provider:
                'STRIPE',
              paymentReference:
                'pi_failed',
              status:
                'FAILED',
              failureCode:
                'card_declined',
              failureMessage:
                'Your card was declined.',
            },
          );

        expect(
          prisma.payment.update,
        ).toHaveBeenCalledWith({
          where: {
            id:
              'payment-1',
          },
          data: {
            status:
              'FAILED',
            failureCode:
              'card_declined',
            failureMessage:
              'Your card was declined.',
            failedAt:
              expect.any(
                Date,
              ),
          },
        });

        expect(
          prisma.booking
            .updateMany,
        ).not.toHaveBeenCalled();

        expect(
          ticketService.issueTicketsForBooking,
        ).not.toHaveBeenCalled();

        expect(
          result,
        ).toEqual({
          status:
            'FAILED',
        });
      });

      it('should mark a payment CANCELLED without confirming the booking', async () => {
        prisma.payment.findFirst.mockResolvedValue({
          ...paymentRecord,
          status:
            'PENDING',
        });

        const result =
          await service.completePaymentFromProviderEvent(
            {
              provider:
                'STRIPE',
              paymentReference:
                'pi_cancelled',
              status:
                'CANCELLED',
            },
          );

        expect(
          prisma.payment.update,
        ).toHaveBeenCalledWith({
          where: {
            id:
              'payment-1',
          },
          data: {
            status:
              'CANCELLED',
            cancelledAt:
              expect.any(
                Date,
              ),
          },
        });

        expect(
          prisma.booking
            .updateMany,
        ).not.toHaveBeenCalled();

        expect(
          ticketService.issueTicketsForBooking,
        ).not.toHaveBeenCalled();

        expect(
          result,
        ).toEqual({
          status:
            'CANCELLED',
        });
      });

      it('should allow a provider event to leave a payment PENDING without fulfilling the booking', async () => {
        prisma.payment.findFirst.mockResolvedValue({
          ...paymentRecord,
          status:
            'FAILED',
        });

        const result =
          await service.completePaymentFromProviderEvent(
            {
              provider:
                'STRIPE',
              paymentReference:
                'pi_pending',
              status:
                'PENDING',
            },
          );

        expect(
          prisma.payment.update,
        ).toHaveBeenCalledWith({
          where: {
            id:
              'payment-1',
          },
          data: {
            status:
              'PENDING',
          },
        });

        expect(
          prisma.booking
            .updateMany,
        ).not.toHaveBeenCalled();

        expect(
          ticketService.issueTicketsForBooking,
        ).not.toHaveBeenCalled();

        expect(
          result,
        ).toEqual({
          status:
            'PENDING',
        });
      });

      it('should complete a successful provider payment and issue tickets', async () => {
        prisma.payment.findFirst.mockResolvedValue({
          ...paymentRecord,
          provider:
            'STRIPE',
          providerReference:
            'pi_success',
          status:
            'PENDING',
        });

        prisma.booking.updateMany.mockResolvedValue({
          count: 1,
        });

        const result =
          await service.completePaymentFromProviderEvent(
            {
              provider:
                'STRIPE',
              paymentReference:
                'pi_success',
              status:
                'SUCCEEDED',
            },
          );

        expect(
          prisma.payment.update,
        ).toHaveBeenCalledWith({
          where: {
            id:
              'payment-1',
          },
          data: {
            status:
              'SUCCEEDED',
            failureCode:
              null,
            failureMessage:
              null,
            succeededAt:
              expect.any(
                Date,
              ),
          },
        });

        expect(
          prisma.booking
            .updateMany,
        ).toHaveBeenCalledWith({
          where: {
            id:
              'booking-1',
            status:
              'RESERVED',
            reservedUntil: {
              gt:
                expect.any(
                  Date,
                ),
            },
          },
          data:
            expect.objectContaining({
              paymentReference:
                'pi_success',
              paymentStatus:
                'PAID',
              status:
                'CONFIRMED',
              paidAt:
                expect.any(
                  Date,
                ),
              confirmedAt:
                expect.any(
                  Date,
                ),
            }),
        });

        expect(
          ticketService.issueTicketsForBooking,
        ).toHaveBeenCalledWith(
          'booking-1',
        );

        expect(
          result,
        ).toEqual({
          status:
            'SUCCEEDED',
          bookingFulfilled:
            true,
          refunded: false,
        });
      });

      it('should treat duplicate successful provider events as idempotent', async () => {
        prisma.payment.findFirst.mockResolvedValue({
          ...paymentRecord,
          status:
            'SUCCEEDED',
          succeededAt:
            new Date(),
          booking: {
            ...paymentRecord.booking,
            status:
              'CONFIRMED',
            paymentStatus:
              'PAID',
          },
        });

        const result =
          await service.completePaymentFromProviderEvent(
            {
              provider:
                'STRIPE',
              paymentReference:
                'pi_success',
              status:
                'SUCCEEDED',
            },
          );

        expect(
          prisma.payment.update,
        ).not.toHaveBeenCalled();

        expect(
          prisma.booking
            .updateMany,
        ).not.toHaveBeenCalled();

        expect(
          ticketService.issueTicketsForBooking,
        ).not.toHaveBeenCalled();

        expect(
          result,
        ).toEqual({
          status:
            'SUCCEEDED',
        });
      });

      it('should automatically refund if the reservation expires before provider success can confirm it', async () => {
        prisma.payment.findFirst.mockResolvedValue({
          ...paymentRecord,
          provider:
            'STRIPE',
          providerReference:
            'pi_late_success',
          status:
            'PENDING',
        });

        prisma.booking.updateMany.mockResolvedValue({
          count: 0,
        });

        prisma.booking.findUnique.mockResolvedValue({
          status:
            'EXPIRED',
          paymentStatus:
            'UNPAID',
        });

        prisma.paymentRefund.findUnique.mockResolvedValue(
          null,
        );

        paymentProvider.refundPayment.mockResolvedValue({
          provider:
            'STRIPE',
          refundReference:
            're_late_success',
          paymentReference:
            'pi_late_success',
          status:
            'SUCCEEDED',
        });

        prisma.paymentRefund.create.mockResolvedValue({
          id:
            'refund-1',
          providerReference:
            're_late_success',
          status:
            'SUCCEEDED',
        });

        const result =
          await service.completePaymentFromProviderEvent(
            {
              provider:
                'STRIPE',
              paymentReference:
                'pi_late_success',
              status:
                'SUCCEEDED',
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
          ticketService.issueTicketsForBooking,
        ).not.toHaveBeenCalled();

        expect(
          result,
        ).toEqual({
          status:
            'SUCCEEDED',
          bookingFulfilled:
            false,
          refunded: true,
          refundStatus:
            'SUCCEEDED',
          refundReference:
            're_late_success',
        });
      });

      it('should tolerate a concurrent successful confirmation performed by another provider-event delivery', async () => {
        prisma.payment.findFirst.mockResolvedValue({
          ...paymentRecord,
          provider:
            'STRIPE',
          providerReference:
            'pi_concurrent',
          status:
            'PENDING',
        });

        prisma.booking.updateMany.mockResolvedValue({
          count: 0,
        });

        prisma.booking.findUnique.mockResolvedValue({
          status:
            'CONFIRMED',
          paymentStatus:
            'PAID',
        });

        const result =
          await service.completePaymentFromProviderEvent(
            {
              provider:
                'STRIPE',
              paymentReference:
                'pi_concurrent',
              status:
                'SUCCEEDED',
            },
          );

        expect(
          result,
        ).toEqual({
          status:
            'SUCCEEDED',
        });

        expect(
          paymentProvider.refundPayment,
        ).not.toHaveBeenCalled();

        expect(
          ticketService.issueTicketsForBooking,
        ).not.toHaveBeenCalled();
      });
    },
  );
});