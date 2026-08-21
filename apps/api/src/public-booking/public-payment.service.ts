import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';

import { PaymentService } from '../payment/payment.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublicPaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
  ) {}

  async createPayment(bookingId: string, publicAccessToken: string) {
    const publicAccessTokenHash = createHash('sha256')
      .update(publicAccessToken)
      .digest('hex');

    const booking = await this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        publicAccessTokenHash,
      },
      select: {
        id: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found or access token invalid.');
    }

    return this.paymentService.createPayment(booking.id);
  }
}
