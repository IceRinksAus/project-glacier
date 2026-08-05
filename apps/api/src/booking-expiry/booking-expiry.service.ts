import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookingExpiryService {
  private readonly logger = new Logger(BookingExpiryService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async expireReservations() {
    const result = await this.prisma.booking.updateMany({
      where: {
        status: 'RESERVED',
        reservedUntil: {
          lt: new Date(),
        },
      },
   data: {
  status: 'EXPIRED',
  expiredAt: new Date(),
},
    });

    if (result.count > 0) {
      this.logger.log(
        `Expired ${result.count} reservation(s).`,
      );
    }
  }
}