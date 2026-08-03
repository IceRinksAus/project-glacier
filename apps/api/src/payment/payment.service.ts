import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TicketService } from '../ticket/ticket.service';
import type {
  CreatePaymentResult,
  PaymentProvider,
} from './payment-provider.interface';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,

    @Inject('PAYMENT_PROVIDER')
    private readonly paymentProvider: PaymentProvider,

    private readonly ticketService: TicketService,
  ) {}

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

    if (booking.status !== 'RESERVED') {
      throw new BadRequestException(
        'Only reserved bookings can be paid',
      );
    }

    if (
      booking.reservedUntil &&
      booking.reservedUntil.getTime() < Date.now()
    ) {
      throw new BadRequestException(
        'This booking reservation has expired',
      );
    }

    const payment = await this.paymentProvider.createPayment({
      bookingId: booking.id,
      amount: Number(booking.total),
      currency: 'AUD',
      customerEmail: booking.customer.email,
    });

    await this.prisma.booking.update({
      where: {
        id: booking.id,
      },
      data: {
        paymentReference: payment.paymentReference,
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
        paidAt: new Date(),
        confirmedAt: new Date(),
      },
    });

    await this.ticketService.issueTicketsForBooking(booking.id);

    return payment;
  }
}