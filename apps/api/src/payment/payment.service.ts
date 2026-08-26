import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service';
import { TicketService } from '../ticket/ticket.service';

import type {
  CompleteProviderPaymentEvent,
  CreatePaymentResult,
  PaymentProvider,
  RefundPaymentRequest,
} from './payment-provider.interface';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,

    @Inject('PAYMENT_PROVIDER')
    private readonly paymentProvider: PaymentProvider,

    private readonly ticketService: TicketService,
  ) {}

  requestRefund(request: RefundPaymentRequest) {
    return this.paymentProvider.refundPayment(request);
  }

  async createPayment(bookingId: string): Promise<CreatePaymentResult> {
    const booking = await this.prisma.booking.findUnique({
      where: {
        id: bookingId,
      },
      include: {
        customer: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.paymentStatus === 'PAID' || booking.status === 'CONFIRMED') {
      throw new BadRequestException('This booking has already been paid');
    }

    if (booking.status !== 'RESERVED') {
      throw new BadRequestException('Only reserved bookings can be paid');
    }

    if (booking.reservedUntil && booking.reservedUntil.getTime() < Date.now()) {
      throw new BadRequestException('This booking reservation has expired');
    }

    const latestPayment = await this.prisma.payment.findFirst({
      where: {
        bookingId: booking.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (latestPayment?.status === 'PENDING') {
      throw new BadRequestException(
        'A payment is already in progress for this booking',
      );
    }

    if (latestPayment?.status === 'SUCCEEDED') {
      throw new BadRequestException('This booking has already been paid');
    }

    const baseIdempotencyKey = `booking_${booking.id}_payment`;

    const idempotencyKey = latestPayment
      ? `${baseIdempotencyKey}_${randomUUID()}`
      : baseIdempotencyKey;

    const amount = new Prisma.Decimal(booking.total);

    const providerResult = await this.paymentProvider.createPayment({
      bookingId: booking.id,
      amount: amount.toNumber(),
      currency: 'AUD',
      customerEmail: booking.customer.email ?? undefined,
      idempotencyKey,
    });

    const now = new Date();

    await this.prisma.payment.create({
      data: {
        bookingId: booking.id,
        provider: providerResult.provider,
        method: 'ONLINE_CARD',
        providerReference: providerResult.paymentReference,
        idempotencyKey,
        amount,
        currency: 'AUD',
        status: providerResult.status,
        succeededAt: providerResult.status === 'SUCCEEDED' ? now : null,
        failedAt: providerResult.status === 'FAILED' ? now : null,
        cancelledAt: providerResult.status === 'CANCELLED' ? now : null,
      },
    });

    if (providerResult.status === 'SUCCEEDED') {
      await this.completePaymentFromProviderEvent({
        provider: providerResult.provider,
        paymentReference: providerResult.paymentReference,
        status: 'SUCCEEDED',
      });
    }

    return providerResult;
  }

  async resolvePendingPaymentForExpiredBooking(bookingId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        bookingId,
        status: 'PENDING',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!payment) {
      return {
        cancelled: false,
        reason: 'NO_PENDING_PAYMENT',
      } as const;
    }

    if (!payment.providerReference) {
      return {
        cancelled: false,
        reason: 'MISSING_PROVIDER_REFERENCE',
      } as const;
    }

    /*
     * Re-read provider truth before cancellation. A webhook may
     * have been missed while the provider successfully collected
     * payment. Feeding that state through the existing completion
     * path preserves Glacier's idempotent late-success refund rule.
     */
    const providerPayment = await this.paymentProvider.retrievePayment({
      paymentReference: payment.providerReference,
    });

    if (providerPayment.status !== 'PENDING') {
      const reconciliation = await this.completePaymentFromProviderEvent({
        provider: providerPayment.provider,
        paymentReference: providerPayment.paymentReference,
        status: providerPayment.status,
        failureCode: providerPayment.failureCode,
        failureMessage: providerPayment.failureMessage,
      });

      return {
        cancelled: false,
        reconciled: true,
        providerStatus: providerPayment.status,
        reconciliation,
      } as const;
    }

    const cancellationResult = await this.paymentProvider.cancelPayment({
      paymentReference: payment.providerReference,
      idempotencyKey: `cancel_${payment.id}`,
    });

    if (cancellationResult.status !== 'CANCELLED') {
      return {
        cancelled: false,
        reason: 'PROVIDER_NOT_CANCELLED',
      } as const;
    }

    const now = new Date();

    await this.prisma.payment.updateMany({
      where: {
        id: payment.id,
        status: 'PENDING',
      },
      data: {
        status: 'CANCELLED',
        cancelledAt: now,
      },
    });

    return {
      cancelled: true,
      paymentId: payment.id,
      paymentReference: payment.providerReference,
    } as const;
  }

  async reconcilePendingPaymentForBooking(bookingId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        bookingId,
        status: 'PENDING',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!payment) {
      return {
        reconciled: false,
        reason: 'NO_PENDING_PAYMENT',
        paymentId: null,
      } as const;
    }

    if (!payment.providerReference) {
      return {
        reconciled: false,
        reason: 'MISSING_PROVIDER_REFERENCE',
        paymentId: payment.id,
      } as const;
    }

    const providerPayment = await this.paymentProvider.retrievePayment({
      paymentReference: payment.providerReference,
    });

    if (providerPayment.status === 'PENDING') {
      return {
        reconciled: false,
        reason: 'PROVIDER_PENDING',
        paymentId: payment.id,
        providerStatus: providerPayment.status,
      } as const;
    }

    const reconciliation = await this.completePaymentFromProviderEvent({
      provider: providerPayment.provider,
      paymentReference: providerPayment.paymentReference,
      status: providerPayment.status,
      failureCode: providerPayment.failureCode,
      failureMessage: providerPayment.failureMessage,
    });

    return {
      reconciled: true,
      paymentId: payment.id,
      providerStatus: providerPayment.status,
      reconciliation,
    } as const;
  }

  private async refundLateSuccessfulPayment(payment: {
    id: string;
    provider: string;
    providerReference: string | null;
    amount: Prisma.Decimal;
    currency: string;
  }) {
    if (!payment.providerReference) {
      throw new BadRequestException(
        'Successful payment is missing provider reference',
      );
    }

    const idempotencyKey = `refund_${payment.id}_expired_booking`;

    /*
     * First check Glacier's refund history.
     *
     * Duplicate webhook deliveries must not create additional
     * refunds.
     */
    const existingRefund = await this.prisma.paymentRefund.findUnique({
      where: {
        idempotencyKey,
      },
    });

    if (existingRefund) {
      return {
        refunded: true,
        refundId: existingRefund.id,
        refundReference: existingRefund.providerReference,
        status: existingRefund.status,
      } as const;
    }

    const refundResult = await this.paymentProvider.refundPayment({
      paymentReference: payment.providerReference,
      amount: payment.amount.toNumber(),
      currency: payment.currency,
      idempotencyKey,
      reason: 'Reservation expired before payment confirmation',
    });

    const now = new Date();

    const refund = await this.prisma.paymentRefund.create({
      data: {
        paymentId: payment.id,
        provider: refundResult.provider,
        providerReference: refundResult.refundReference,
        idempotencyKey,
        amount: payment.amount,
        currency: payment.currency,
        status: refundResult.status,
        reason: 'Reservation expired before payment confirmation',
        succeededAt: refundResult.status === 'SUCCEEDED' ? now : null,
        failedAt: refundResult.status === 'FAILED' ? now : null,
        cancelledAt: refundResult.status === 'CANCELLED' ? now : null,
      },
    });

    return {
      refunded: true,
      refundId: refund.id,
      refundReference: refund.providerReference,
      status: refund.status,
    } as const;
  }

  async completePaymentFromProviderEvent(event: CompleteProviderPaymentEvent) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        provider: event.provider,
        providerReference: event.paymentReference,
      },
      include: {
        booking: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (!payment.bookingId || !payment.booking) {
      throw new BadRequestException(
        'Provider payment is not linked to an admission Booking',
      );
    }

    const now = new Date();

    if (event.status === 'FAILED') {
      if (payment.status !== 'FAILED') {
        await this.prisma.payment.update({
          where: {
            id: payment.id,
          },
          data: {
            status: 'FAILED',
            failureCode: event.failureCode ?? null,
            failureMessage: event.failureMessage ?? null,
            failedAt: now,
          },
        });
      }

      return {
        status: 'FAILED' as const,
      };
    }

    if (event.status === 'CANCELLED') {
      if (payment.status !== 'CANCELLED') {
        await this.prisma.payment.update({
          where: {
            id: payment.id,
          },
          data: {
            status: 'CANCELLED',
            cancelledAt: now,
          },
        });
      }

      return {
        status: 'CANCELLED' as const,
      };
    }

    if (event.status === 'PENDING') {
      if (payment.status !== 'PENDING') {
        await this.prisma.payment.update({
          where: {
            id: payment.id,
          },
          data: {
            status: 'PENDING',
          },
        });
      }

      return {
        status: 'PENDING' as const,
      };
    }

    /*
     * Stripe/provider really did collect the payment, so keep
     * the Payment record as SUCCEEDED even when the Booking can
     * no longer be fulfilled.
     */
    if (payment.status !== 'SUCCEEDED') {
      await this.prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: 'SUCCEEDED',
          failureCode: null,
          failureMessage: null,
          succeededAt: now,
        },
      });
    }

    if (
      payment.booking.status === 'CONFIRMED' &&
      payment.booking.paymentStatus === 'PAID'
    ) {
      await this.ticketService.issueTicketsForBooking(payment.bookingId);
      await this.ticketService.activateFlexibleTicketsForBooking(
        payment.bookingId,
        payment.id,
      );
      return {
        status: 'SUCCEEDED' as const,
      };
    }

    const confirmationResult = await this.prisma.booking.updateMany({
      where: {
        id: payment.bookingId,
        status: 'RESERVED',
        reservedUntil: {
          gt: now,
        },
      },
      data: {
        paymentReference: event.paymentReference,
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
        paidAt: now,
        confirmedAt: now,
      },
    });

    if (confirmationResult.count !== 1) {
      const currentBooking = await this.prisma.booking.findUnique({
        where: {
          id: payment.bookingId,
        },
        select: {
          status: true,
          paymentStatus: true,
        },
      });

      if (
        currentBooking?.status === 'CONFIRMED' &&
        currentBooking.paymentStatus === 'PAID'
      ) {
        return {
          status: 'SUCCEEDED' as const,
        };
      }

      /*
       * The provider succeeded but Glacier can no longer fulfil
       * the reservation.
       *
       * Compensate automatically rather than leaving a charged
       * customer with no Booking.
       */
      const refund = await this.refundLateSuccessfulPayment(payment);

      return {
        status: 'SUCCEEDED' as const,
        bookingFulfilled: false,
        refunded: true,
        refundStatus: refund.status,
        refundReference: refund.refundReference,
      };
    }

    await this.ticketService.issueTicketsForBooking(payment.bookingId);
    await this.ticketService.activateFlexibleTicketsForBooking(
      payment.bookingId,
      payment.id,
    );

    return {
      status: 'SUCCEEDED' as const,
      bookingFulfilled: true,
      refunded: false,
    };
  }
}
