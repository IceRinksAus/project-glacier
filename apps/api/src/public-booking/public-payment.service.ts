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

  async getBookingStatus(bookingId: string, publicAccessToken: string) {
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
        bookingNumber: true,
        status: true,
        paymentStatus: true,
        total: true,
        reservedUntil: true,
        confirmedAt: true,
        paidAt: true,
        event: {
          select: {
            name: true,
            slug: true,
            waiver: {
              select: {
                publicSlug: true,
              },
            },
          },
        },
        tickets: {
          select: {
            ticketNumber: true,
            secureToken: true,
            status: true,
            participant: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            issuedAt: 'asc',
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found or access token invalid.');
    }

    const confirmed =
      booking.status === 'CONFIRMED' && booking.paymentStatus === 'PAID';

    return {
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      total: Number(booking.total),
      reservedUntil: booking.reservedUntil,
      confirmedAt: booking.confirmedAt,
      paidAt: booking.paidAt,
      event: {
        name: booking.event.name,
        slug: booking.event.slug,
        waiverPublicSlug: booking.event.waiver?.publicSlug ?? null,
      },
      tickets: confirmed ? booking.tickets : [],
    };
  }
}
