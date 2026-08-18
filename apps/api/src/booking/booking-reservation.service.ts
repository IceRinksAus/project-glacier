import {
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  Cron,
  CronExpression,
} from '@nestjs/schedule';

import { PaymentService } from '../payment/payment.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookingReservationService {
  private readonly logger =
    new Logger(
      BookingReservationService.name,
    );

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async expireReservations() {
    const now = new Date();

    /*
     * Expire every overdue active reservation.
     *
     * Booking expiry remains authoritative even if payment
     * provider cleanup temporarily fails.
     */
    const expiryResult =
      await this.prisma.booking.updateMany({
        where: {
          status: 'RESERVED',
          reservedUntil: {
            lt: now,
          },
        },
        data: {
          status: 'EXPIRED',
          expiredAt: now,
        },
      });

    if (expiryResult.count > 0) {
      this.logger.log(
        `Expired ${expiryResult.count} booking reservation(s)`,
      );
    }

    /*
     * Find expired Bookings that still have unresolved
     * payments.
     *
     * Previously expired bookings are intentionally included,
     * allowing failed provider cancellations to be retried by
     * a later scheduler run.
     */
    const bookingsNeedingPaymentCleanup =
      await this.prisma.booking.findMany({
        where: {
          status: 'EXPIRED',
          payments: {
            some: {
              status: 'PENDING',
            },
          },
        },
        select: {
          id: true,
        },
      });

    for (
      const booking of
      bookingsNeedingPaymentCleanup
    ) {
      try {
        const result =
          await this.paymentService.cancelPendingPaymentForBooking(
            booking.id,
          );

        if (result.cancelled) {
          this.logger.log(
            `Cancelled pending payment for expired booking ${booking.id}`,
          );
        }
      } catch (error) {
        /*
         * One provider failure must not prevent other expired
         * bookings from being processed.
         *
         * The unresolved Payment remains PENDING so the next
         * scheduler run can retry cancellation.
         */
        const message =
          error instanceof Error
            ? error.message
            : 'Unknown payment cancellation error';

        this.logger.error(
          `Unable to cancel pending payment for expired booking ${booking.id}: ${message}`,
        );
      }
    }
  }
}