import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  PaymentMethod,
  Prisma,
  TicketAdjustmentAction,
  TicketAdjustmentReason,
} from '@prisma/client';

import { TicketAdjustmentService } from './ticket-adjustment.service';

describe('TicketAdjustmentService', () => {
  const access = {
    userId: 'manager-1',
    organizationId: 'org-1',
    role: 'MANAGER' as const,
    accessScope: 'ASSIGNED_EVENTS' as const,
  };
  const input = {
    action: TicketAdjustmentAction.CANCEL_AND_REFUND,
    reason: TicketAdjustmentReason.MEDICAL_COMPASSIONATE,
    note: 'Participant is unable to attend.',
    ticketIds: ['ticket-1'],
  };
  const booking = {
    id: 'booking-1',
    bookingNumber: 'PG-1',
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    eventId: 'event-1',
    sessionId: 'session-1',
    items: [{ ticketTypeId: 'adult', unitPrice: new Prisma.Decimal(24) }],
    products: [
      {
        id: 'booking-product-1',
        quantity: 1,
        product: { name: 'Kanga' },
        productVariant: null,
      },
    ],
    tickets: [
      {
        id: 'ticket-1',
        ticketNumber: 'T-1',
        status: 'ACTIVE',
        checkedInAt: null,
        adjustmentAllocation: null,
        participant: {
          id: 'participant-1',
          firstName: 'Alex',
          lastName: 'Skater',
          ticketTypeId: 'adult',
          ticketType: { name: 'Adult' },
        },
      },
    ],
    payments: [
      {
        id: 'payment-1',
        method: PaymentMethod.ONLINE_CARD,
        amount: new Prisma.Decimal(50),
        currency: 'AUD',
        providerReference: 'pi_1',
        refunds: [{ amount: new Prisma.Decimal(10) }],
      },
    ],
  };
  const transaction = {
    ticket: { updateMany: jest.fn() },
    ticketAdjustment: { update: jest.fn() },
    paymentRefund: { findUniqueOrThrow: jest.fn() },
  };
  const prisma = {
    booking: { findFirst: jest.fn() },
    ticketAdjustment: { findUnique: jest.fn(), update: jest.fn() },
    paymentRefund: { create: jest.fn() },
    payment: { findUnique: jest.fn() },
    $transaction: jest.fn((operation) => operation(transaction)),
  };
  const accessControl = {
    eventWhere: jest.fn(() => ({ organizationId: 'org-1' })),
  };
  const paymentService = { requestRefund: jest.fn() };
  let service: TicketAdjustmentService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.ticketAdjustment.findUnique.mockResolvedValue(null);
    service = new TicketAdjustmentService(
      prisma as never,
      accessControl as never,
      paymentService as never,
    );
  });

  it('previews exact Ticket value, capacity release and unchanged Products', async () => {
    prisma.booking.findFirst.mockResolvedValue(booking);

    const result = await service.preview(access, 'booking-1', input);

    expect(result.refundAmount).toBe(24);
    expect(result.capacityPlacesReleased).toBe(1);
    expect(result.payment).toEqual({
      id: 'payment-1',
      method: 'ONLINE_CARD',
      remaining: 40,
    });
    expect(result.productsUnchanged).toEqual([
      { bookingProductId: 'booking-product-1', name: 'Kanga', quantity: 1 },
    ]);
    expect(result.previewHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('previews cancel-only without selecting a Payment or refund amount', async () => {
    prisma.booking.findFirst.mockResolvedValue({ ...booking, payments: [] });

    const result = await service.preview(access, 'booking-1', {
      ...input,
      action: TicketAdjustmentAction.CANCEL_ONLY,
    });

    expect(result.refundAmount).toBe(0);
    expect(result.payment).toBeNull();
  });

  it('rejects a scanned Ticket', async () => {
    prisma.booking.findFirst.mockResolvedValue({
      ...booking,
      tickets: [{ ...booking.tickets[0], checkedInAt: new Date() }],
    });

    await expect(service.preview(access, 'booking-1', input)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('does not disclose a foreign or unassigned Booking', async () => {
    prisma.booking.findFirst.mockResolvedValue(null);

    await expect(service.preview(access, 'booking-1', input)).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.booking.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          event: { organizationId: 'org-1' },
        }),
      }),
    );
  });

  it('resumes an interrupted cancel-only adjustment exactly once', async () => {
    const pending = {
      id: 'adjustment-1',
      idempotencyKey: 'adjustment-key-1',
      organizationId: 'org-1',
      bookingId: 'booking-1',
      action: TicketAdjustmentAction.CANCEL_ONLY,
      reason: TicketAdjustmentReason.ORGANISER_CORRECTION,
      note: 'Ticket issued in error.',
      status: 'PENDING',
      capacityReleasedAt: null,
      externalReference: null,
      requestedAmount: new Prisma.Decimal(0),
      currency: 'AUD',
      allocations: [{ ticketId: 'ticket-1' }],
      paymentRefund: null,
      payment: null,
    };
    prisma.ticketAdjustment.findUnique.mockResolvedValue(pending);
    transaction.ticket.updateMany.mockResolvedValue({ count: 1 });
    transaction.ticketAdjustment.update.mockResolvedValue({
      ...pending,
      status: 'COMPLETED',
    });

    const result = await service.execute(access, 'booking-1', {
      action: TicketAdjustmentAction.CANCEL_ONLY,
      reason: TicketAdjustmentReason.ORGANISER_CORRECTION,
      note: 'Ticket issued in error.',
      ticketIds: ['ticket-1'],
      previewHash: 'a'.repeat(64),
      idempotencyKey: 'adjustment-key-1',
    });

    expect(result.status).toBe('COMPLETED');
    expect(transaction.ticket.updateMany).toHaveBeenCalledTimes(1);
    expect(paymentService.requestRefund).not.toHaveBeenCalled();
  });
});
