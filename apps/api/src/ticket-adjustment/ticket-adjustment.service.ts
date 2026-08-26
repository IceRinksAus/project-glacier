import { createHash, randomBytes } from 'crypto';

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
import { PaymentService } from '../payment/payment.service';

import { ExecuteTicketAdjustmentDto } from './dto/execute-ticket-adjustment.dto';
import { PreviewTicketAdjustmentDto } from './dto/preview-ticket-adjustment.dto';

@Injectable()
export class TicketAdjustmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControl: AccessControlService,
    private readonly paymentService: PaymentService,
  ) {}

  async context(access: AuthenticatedAccessContext, bookingId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, event: this.accessControl.eventWhere(access) },
      select: {
        id: true,
        bookingNumber: true,
        status: true,
        paymentStatus: true,
        items: { select: { ticketTypeId: true, unitPrice: true } },
        products: {
          select: {
            id: true,
            quantity: true,
            product: { select: { name: true } },
            productVariant: { select: { name: true } },
          },
        },
        tickets: {
          select: {
            id: true,
            ticketNumber: true,
            status: true,
            issuedAt: true,
            checkedInAt: true,
            cancelledAt: true,
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
          orderBy: { issuedAt: 'asc' },
        },
        ticketAdjustments: {
          include: {
            requestedByUser: { select: { id: true, name: true } },
            allocations: true,
            payment: { select: { method: true } },
            paymentRefund: {
              select: { amount: true, currency: true, status: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    const prices = new Map(
      booking.items.map(({ ticketTypeId, unitPrice }) => [
        ticketTypeId,
        unitPrice.toNumber(),
      ]),
    );
    return {
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      tickets: booking.tickets.map((ticket) => ({
        ...ticket,
        participantName: [
          ticket.participant.firstName,
          ticket.participant.lastName,
        ]
          .filter(Boolean)
          .join(' '),
        ticketTypeName: ticket.participant.ticketType.name,
        unitValue: prices.get(ticket.participant.ticketTypeId) ?? null,
        eligible:
          booking.status === 'CONFIRMED' &&
          booking.paymentStatus === 'PAID' &&
          ticket.status === 'ACTIVE' &&
          !ticket.checkedInAt &&
          !ticket.adjustmentAllocation,
      })),
      productsUnchanged: booking.products.map((product) => ({
        id: product.id,
        name: product.productVariant
          ? `${product.product.name} — ${product.productVariant.name}`
          : product.product.name,
        quantity: product.quantity,
      })),
      adjustments: booking.ticketAdjustments.map((adjustment) => ({
        ...adjustment,
        requestedAmount: adjustment.requestedAmount.toNumber(),
        refundedAmount: adjustment.refundedAmount.toNumber(),
        paymentRefund: adjustment.paymentRefund
          ? {
              ...adjustment.paymentRefund,
              amount: adjustment.paymentRefund.amount.toNumber(),
            }
          : null,
      })),
    };
  }

  async execute(
    access: AuthenticatedAccessContext,
    bookingId: string,
    input: ExecuteTicketAdjustmentDto,
  ) {
    const existing = await this.prisma.ticketAdjustment.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { allocations: true, paymentRefund: true, payment: true },
    });
    if (existing) {
      this.assertExactRetry(existing, access, bookingId, input);
      return this.resumeExisting(existing, input);
    }

    const preview = await this.preview(access, bookingId, input);
    if (preview.previewHash !== input.previewHash) {
      throw new BadRequestException(
        'The Ticket adjustment changed after review. Review it again.',
      );
    }
    const paymentMethod = preview.payment?.method;
    if (
      paymentMethod &&
      paymentMethod !== PaymentMethod.ONLINE_CARD &&
      !input.manualRefundConfirmed
    ) {
      throw new BadRequestException(
        'Confirm that the manual refund was completed before recording it',
      );
    }
    if (
      paymentMethod === PaymentMethod.STANDALONE_EFTPOS &&
      !input.standaloneReference?.trim()
    ) {
      throw new BadRequestException(
        'Standalone EFTPOS refunds require the terminal reference',
      );
    }

    const adjustment = await this.prisma.$transaction(async (transaction) =>
      transaction.ticketAdjustment.create({
        data: {
          adjustmentNumber: `TA-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`,
          idempotencyKey: input.idempotencyKey,
          action: input.action,
          reason: input.reason,
          note: preview.note,
          requestedAmount: preview.refundAmount,
          currency: preview.currency,
          organizationId: access.organizationId,
          eventId: preview.eventId,
          bookingId,
          paymentId: preview.payment?.id,
          externalReference: input.standaloneReference?.trim() || null,
          requestedByUserId: access.userId,
          allocations: {
            create: preview.allocations.map((allocation) => ({
              ticketId: allocation.ticketId,
              participantId: allocation.participantId,
              ticketTypeId: allocation.ticketTypeId,
              participantNameSnapshot: allocation.participantName,
              ticketNumberSnapshot: allocation.ticketNumber,
              ticketTypeNameSnapshot: allocation.ticketTypeName,
              unitValue: allocation.unitValue,
            })),
          },
        },
        include: { allocations: true },
      }),
    );

    if (input.action === TicketAdjustmentAction.CANCEL_ONLY) {
      return this.completeAdjustment(adjustment.id, preview.allocations, null);
    }

    if (!preview.payment) {
      throw new BadRequestException('Refund Payment was not resolved');
    }
    if (preview.payment.method === PaymentMethod.ONLINE_CARD) {
      return this.completeOnlineRefund(
        adjustment,
        preview,
        input.idempotencyKey,
      );
    }
    return this.completeManualRefund(
      adjustment.id,
      preview,
      input.standaloneReference,
    );
  }

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

  private assertExactRetry(
    existing: {
      bookingId: string;
      organizationId: string;
      action: string;
      reason: string;
      note: string;
      externalReference: string | null;
      allocations: Array<{ ticketId: string }>;
    },
    access: AuthenticatedAccessContext,
    bookingId: string,
    input: ExecuteTicketAdjustmentDto,
  ) {
    const existingTicketIds = existing.allocations
      .map(({ ticketId }) => ticketId)
      .sort();
    const inputTicketIds = [...new Set(input.ticketIds)].sort();
    if (
      existing.organizationId !== access.organizationId ||
      existing.bookingId !== bookingId ||
      existing.action !== input.action ||
      existing.reason !== input.reason ||
      existing.note !== input.note.trim() ||
      existing.externalReference !==
        (input.standaloneReference?.trim() || null) ||
      JSON.stringify(existingTicketIds) !== JSON.stringify(inputTicketIds)
    ) {
      throw new BadRequestException(
        'This idempotency key was already used for a different adjustment',
      );
    }
  }

  private async resumeExisting(
    existing: NonNullable<
      Awaited<ReturnType<PrismaService['ticketAdjustment']['findUnique']>>
    > & {
      allocations: Array<{ ticketId: string }>;
      paymentRefund: { id: string; status: string } | null;
      payment: {
        id: string;
        method: PaymentMethod;
        providerReference: string | null;
      } | null;
    },
    input: ExecuteTicketAdjustmentDto,
  ) {
    if (existing.status !== 'PENDING' || existing.capacityReleasedAt) {
      return existing;
    }
    if (existing.action === TicketAdjustmentAction.CANCEL_ONLY) {
      return this.completeAdjustment(existing.id, existing.allocations, null);
    }
    if (existing.paymentRefund) {
      if (
        existing.paymentRefund.status === 'SUCCEEDED' ||
        existing.paymentRefund.status === 'PENDING'
      ) {
        return this.completeAdjustment(
          existing.id,
          existing.allocations,
          existing.paymentRefund.id,
          existing.paymentRefund.status === 'PENDING',
        );
      }
      return existing;
    }
    if (!existing.payment) {
      throw new BadRequestException('Refund Payment was not resolved');
    }
    if (existing.payment.method !== PaymentMethod.ONLINE_CARD) {
      if (!input.manualRefundConfirmed) {
        throw new BadRequestException(
          'Confirm that the manual refund was completed before recording it',
        );
      }
      const refund = await this.prisma.paymentRefund.create({
        data: {
          paymentId: existing.payment.id,
          provider: existing.payment.method,
          providerReference:
            existing.payment.method === PaymentMethod.STANDALONE_EFTPOS
              ? `MANUAL_${existing.externalReference}`
              : null,
          idempotencyKey: `ticket_adjustment_${existing.id}`,
          amount: existing.requestedAmount,
          currency: existing.currency,
          status: 'SUCCEEDED',
          reason: existing.note,
          succeededAt: new Date(),
        },
      });
      return this.completeAdjustment(
        existing.id,
        existing.allocations,
        refund.id,
      );
    }
    if (!existing.payment.providerReference) {
      throw new BadRequestException('Online Payment cannot be refunded');
    }
    const result = await this.paymentService.requestRefund({
      paymentReference: existing.payment.providerReference,
      amount: existing.requestedAmount.toNumber(),
      currency: existing.currency,
      idempotencyKey: `ticket_adjustment_${existing.idempotencyKey}`,
      reason: existing.note,
    });
    const now = new Date();
    const refund = await this.prisma.paymentRefund.create({
      data: {
        paymentId: existing.payment.id,
        provider: result.provider,
        providerReference: result.refundReference,
        idempotencyKey: `ticket_adjustment_${existing.id}`,
        amount: existing.requestedAmount,
        currency: existing.currency,
        status: result.status,
        reason: existing.note,
        succeededAt: result.status === 'SUCCEEDED' ? now : null,
        failedAt: result.status === 'FAILED' ? now : null,
        cancelledAt: result.status === 'CANCELLED' ? now : null,
      },
    });
    if (result.status === 'SUCCEEDED' || result.status === 'PENDING') {
      return this.completeAdjustment(
        existing.id,
        existing.allocations,
        refund.id,
        result.status === 'PENDING',
      );
    }
    return this.prisma.ticketAdjustment.update({
      where: { id: existing.id },
      data: {
        status: 'FAILED',
        failedAt: now,
        paymentRefundId: refund.id,
        failureCode: `PROVIDER_${result.status}`,
      },
      include: { allocations: true, paymentRefund: true },
    });
  }

  private async completeAdjustment(
    adjustmentId: string,
    allocations: Array<{ ticketId: string }>,
    paymentRefundId: string | null,
    refundPending = false,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const now = new Date();
      const updated = await transaction.ticket.updateMany({
        where: {
          id: { in: allocations.map(({ ticketId }) => ticketId) },
          status: 'ACTIVE',
          checkedInAt: null,
        },
        data: { status: 'CANCELLED', cancelledAt: now },
      });
      if (updated.count !== allocations.length) {
        throw new BadRequestException(
          'One or more Tickets are no longer eligible for adjustment',
        );
      }
      return transaction.ticketAdjustment.update({
        where: { id: adjustmentId },
        data: {
          status: refundPending ? 'PENDING' : 'COMPLETED',
          completedAt: refundPending ? null : now,
          capacityReleasedAt: now,
          paymentRefundId,
          ...(paymentRefundId && !refundPending
            ? {
                refundedAmount: {
                  set: await this.refundAmount(transaction, paymentRefundId),
                },
              }
            : {}),
        },
        include: { allocations: true, paymentRefund: true },
      });
    });
  }

  private async refundAmount(
    transaction: Prisma.TransactionClient,
    paymentRefundId: string,
  ) {
    const refund = await transaction.paymentRefund.findUniqueOrThrow({
      where: { id: paymentRefundId },
      select: { amount: true },
    });
    return refund.amount;
  }

  private async completeManualRefund(
    adjustmentId: string,
    preview: Awaited<ReturnType<TicketAdjustmentService['preview']>>,
    standaloneReference?: string,
  ) {
    const refund = await this.prisma.paymentRefund.create({
      data: {
        paymentId: preview.payment!.id,
        provider: preview.payment!.method,
        providerReference:
          preview.payment!.method === PaymentMethod.STANDALONE_EFTPOS
            ? `MANUAL_${standaloneReference!.trim()}`
            : null,
        idempotencyKey: `ticket_adjustment_${adjustmentId}`,
        amount: preview.refundAmount,
        currency: preview.currency,
        status: 'SUCCEEDED',
        reason: preview.note,
        succeededAt: new Date(),
      },
    });
    await this.prisma.ticketAdjustment.update({
      where: { id: adjustmentId },
      data: { externalReference: standaloneReference?.trim() || null },
    });
    return this.completeAdjustment(
      adjustmentId,
      preview.allocations,
      refund.id,
    );
  }

  private async completeOnlineRefund(
    adjustment: { id: string },
    preview: Awaited<ReturnType<TicketAdjustmentService['preview']>>,
    idempotencyKey: string,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: preview.payment!.id },
      select: { providerReference: true },
    });
    if (!payment?.providerReference) {
      throw new BadRequestException('Online Payment cannot be refunded');
    }
    try {
      const result = await this.paymentService.requestRefund({
        paymentReference: payment.providerReference,
        amount: preview.refundAmount,
        currency: preview.currency,
        idempotencyKey: `ticket_adjustment_${idempotencyKey}`,
        reason: preview.note,
      });
      const now = new Date();
      const refund = await this.prisma.paymentRefund.create({
        data: {
          paymentId: preview.payment!.id,
          provider: result.provider,
          providerReference: result.refundReference,
          idempotencyKey: `ticket_adjustment_${adjustment.id}`,
          amount: preview.refundAmount,
          currency: preview.currency,
          status: result.status,
          reason: preview.note,
          succeededAt: result.status === 'SUCCEEDED' ? now : null,
          failedAt: result.status === 'FAILED' ? now : null,
          cancelledAt: result.status === 'CANCELLED' ? now : null,
        },
      });
      if (result.status === 'SUCCEEDED' || result.status === 'PENDING') {
        return this.completeAdjustment(
          adjustment.id,
          preview.allocations,
          refund.id,
          result.status === 'PENDING',
        );
      }
      return this.prisma.ticketAdjustment.update({
        where: { id: adjustment.id },
        data: {
          status: 'FAILED',
          failedAt: now,
          paymentRefundId: refund.id,
          failureCode: `PROVIDER_${result.status}`,
        },
        include: { allocations: true, paymentRefund: true },
      });
    } catch (error) {
      await this.prisma.ticketAdjustment.update({
        where: { id: adjustment.id },
        data: {
          status: 'FAILED',
          failedAt: new Date(),
          failureCode: 'PROVIDER_ERROR',
          failureMessage:
            error instanceof Error ? error.message.slice(0, 500) : 'Unknown',
        },
      });
      throw error;
    }
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
