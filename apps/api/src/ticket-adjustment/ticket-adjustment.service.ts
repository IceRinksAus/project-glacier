import { createHash } from 'crypto';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentMethod, Prisma, TicketAdjustmentAction } from '@prisma/client';

import {
  AccessControlService,
  AuthenticatedAccessContext,
} from '../access-control/access-control.service';
import { PrismaService } from '../prisma/prisma.service';

import { PreviewTicketAdjustmentDto } from './dto/preview-ticket-adjustment.dto';

@Injectable()
export class TicketAdjustmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControl: AccessControlService,
  ) {}

  async preview(
    access: AuthenticatedAccessContext,
    bookingId: string,
    input: PreviewTicketAdjustmentDto,
  ) {
    const ticketIds = [...new Set(input.ticketIds)].sort();
    if (ticketIds.length !== input.ticketIds.length) {
      throw new BadRequestException('Each Ticket may be selected only once');
    }

    const booking = await this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        event: this.accessControl.eventWhere(access),
      },
      select: {
        id: true,
        bookingNumber: true,
        status: true,
        paymentStatus: true,
        eventId: true,
        sessionId: true,
        items: {
          select: { ticketTypeId: true, unitPrice: true },
        },
        products: {
          select: {
            id: true,
            quantity: true,
            product: { select: { name: true } },
            productVariant: { select: { name: true } },
          },
        },
        tickets: {
          where: { id: { in: ticketIds } },
          select: {
            id: true,
            ticketNumber: true,
            status: true,
            checkedInAt: true,
            participant: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                ticketTypeId: true,
                ticketType: { select: { name: true } },
              },
            },
            adjustmentAllocation: { select: { id: true } },
          },
        },
        payments: {
          where: { status: 'SUCCEEDED' },
          select: {
            id: true,
            method: true,
            amount: true,
            currency: true,
            providerReference: true,
            refunds: {
              where: { status: { in: ['PENDING', 'SUCCEEDED'] } },
              select: { amount: true },
            },
          },
        },
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== 'CONFIRMED' || booking.paymentStatus !== 'PAID') {
      throw new BadRequestException(
        'Only confirmed and paid Bookings can be adjusted',
      );
    }
    if (booking.tickets.length !== ticketIds.length) {
      throw new NotFoundException('Ticket not found');
    }

    const itemPrices = new Map(
      booking.items.map((item) => [item.ticketTypeId, item.unitPrice]),
    );
    const allocations = booking.tickets.map((ticket) => {
      if (
        ticket.status !== 'ACTIVE' ||
        ticket.checkedInAt ||
        ticket.adjustmentAllocation
      ) {
        throw new BadRequestException(
          `Ticket ${ticket.ticketNumber} is not eligible for adjustment`,
        );
      }
      const unitValue = itemPrices.get(ticket.participant.ticketTypeId);
      if (!unitValue) {
        throw new BadRequestException(
          `Ticket ${ticket.ticketNumber} has no authoritative price snapshot`,
        );
      }
      return {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        participantId: ticket.participant.id,
        participantName: [
          ticket.participant.firstName,
          ticket.participant.lastName,
        ]
          .filter(Boolean)
          .join(' '),
        ticketTypeId: ticket.participant.ticketTypeId,
        ticketTypeName: ticket.participant.ticketType.name,
        unitValue: unitValue.toNumber(),
      };
    });
    const refundAmount = allocations.reduce(
      (total, allocation) => total + allocation.unitValue,
      0,
    );

    const payment =
      input.action === TicketAdjustmentAction.CANCEL_AND_REFUND
        ? this.resolvePayment(booking.payments, refundAmount)
        : null;
    const normalizedNote = input.note.trim();
    const previewHash = createHash('sha256')
      .update(
        JSON.stringify({
          bookingId,
          ticketIds,
          action: input.action,
          reason: input.reason,
          note: normalizedNote,
          refundAmount,
          paymentId: payment?.id ?? null,
        }),
      )
      .digest('hex');

    return {
      previewHash,
      bookingId,
      bookingNumber: booking.bookingNumber,
      eventId: booking.eventId,
      sessionId: booking.sessionId,
      action: input.action,
      reason: input.reason,
      note: normalizedNote,
      ticketCount: allocations.length,
      allocations,
      refundAmount:
        input.action === TicketAdjustmentAction.CANCEL_AND_REFUND
          ? refundAmount
          : 0,
      currency: payment?.currency ?? 'AUD',
      payment: payment
        ? {
            id: payment.id,
            method: payment.method,
            remaining: payment.remaining,
          }
        : null,
      capacityPlacesReleased: allocations.length,
      productsUnchanged: booking.products.map((product) => ({
        bookingProductId: product.id,
        name: product.productVariant
          ? `${product.product.name} — ${product.productVariant.name}`
          : product.product.name,
        quantity: product.quantity,
      })),
    };
  }

  private resolvePayment(
    payments: Array<{
      id: string;
      method: PaymentMethod;
      amount: Prisma.Decimal;
      currency: string;
      providerReference: string | null;
      refunds: Array<{ amount: Prisma.Decimal }>;
    }>,
    refundAmount: number,
  ) {
    const candidates = payments
      .map((payment) => ({
        ...payment,
        remaining:
          payment.amount.toNumber() -
          payment.refunds.reduce(
            (total, refund) => total + refund.amount.toNumber(),
            0,
          ),
      }))
      .filter(
        (payment) =>
          payment.remaining >= refundAmount &&
          (payment.method !== PaymentMethod.ONLINE_CARD ||
            Boolean(payment.providerReference)),
      );
    if (candidates.length !== 1) {
      throw new BadRequestException(
        'The selected refund requires one eligible Payment with sufficient remaining balance',
      );
    }
    return candidates[0];
  }
}
