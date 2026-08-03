import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookingReservationService {
  private readonly logger = new Logger(BookingReservationService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async expireReservations() {
    const now = new Date();

    const result = await this.prisma.booking.updateMany({
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

    if (result.count > 0) {
      this.logger.log(
        `Expired ${result.count} booking reservation(s)`,
      );
    }
  }
}