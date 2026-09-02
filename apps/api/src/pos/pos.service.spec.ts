import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type { AuthenticatedAccessContext } from '../access-control/access-control.service';

import { PosService } from './pos.service';

describe('PosService', () => {
  const access: AuthenticatedAccessContext = {
    userId: 'user-1',
    organizationId: 'organization-1',
    role: 'STAFF',
    accessScope: 'ASSIGNED_EVENTS',
  };
  const prisma = {
    event: { findFirst: jest.fn() },
    session: { findMany: jest.fn() },
    ticketType: { findMany: jest.fn() },
    sessionProduct: { findMany: jest.fn() },
    customer: { create: jest.fn() },
    booking: {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
    payment: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const accessControl = {
    eventWhere: jest.fn(),
    assertEventAccess: jest.fn(),
  };
  const bookingService = {
    create: jest.fn(),
  };
  const ticketService = {
    issueTicketsForBooking: jest.fn(),
    presentCredential: jest.fn(() => 'current-ticket-token'),
  };
  const ruleEvaluationService = {
    evaluate: jest.fn(),
  };
  const service = new PosService(
    prisma as never,
    accessControl as never,
    bookingService as never,
    ticketService as never,
    ruleEvaluationService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    accessControl.eventWhere.mockReturnValue({
      id: 'event-1',
      organizationId: 'organization-1',
    });
    prisma.event.findFirst.mockResolvedValue({
      id: 'event-1',
      name: 'Winter Festival',
      timezone: 'Australia/Melbourne',
    });
    prisma.session.findMany.mockResolvedValue([
      {
        id: 'session-1',
        name: '10:00 session',
        startDate: new Date(),
        endDate: new Date(),
        capacity: 150,
        salesStart: null,
        salesEnd: null,
      },
    ]);
    prisma.ticketType.findMany.mockResolvedValue([]);
    prisma.sessionProduct.findMany.mockResolvedValue([]);
    ruleEvaluationService.evaluate.mockResolvedValue({
      matchedRuleIds: [],
      requiredProducts: [],
      errors: [],
      warnings: [],
    });
    prisma.payment.findUnique.mockResolvedValue(null);
    prisma.booking.updateMany.mockResolvedValue({ count: 1 });
    prisma.payment.create.mockResolvedValue({ id: 'payment-1' });
    prisma.$transaction.mockImplementation(async (operation) =>
      operation(prisma),
    );
  });

  it('uses Event-scoped access and POS availability for catalogue reads', async () => {
    await service.findCatalogue(access, 'event-1', 'session-1');

    expect(accessControl.eventWhere).toHaveBeenCalledWith(access, {
      id: 'event-1',
      status: 'ACTIVE',
    });
    expect(prisma.sessionProduct.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          sessionId: 'session-1',
          product: expect.objectContaining({
            availablePos: true,
          }),
        }),
      }),
    );
  });

  it('hides an inaccessible Event behind the established not-found response', async () => {
    prisma.event.findFirst.mockResolvedValue(null);

    await expect(service.findCatalogue(access, 'event-2')).rejects.toThrow(
      new NotFoundException('Event not found'),
    );
  });

  it('creates a presentation-safe walk-up customer without inventing email', async () => {
    prisma.customer.create.mockResolvedValue({ id: 'customer-1' });

    await service.createCustomer(access, 'event-1', {
      firstName: ' Jamie ',
    });

    expect(accessControl.assertEventAccess).toHaveBeenCalledWith(
      'event-1',
      access,
    );
    expect(prisma.customer.create).toHaveBeenCalledWith({
      data: {
        firstName: 'Jamie',
        lastName: '',
        email: null,
        phone: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });
  });

  it('creates the reservation through the shared Booking engine as WALK_UP', async () => {
    const data = {
      customerId: 'customer-1',
      sessionId: 'session-1',
      participants: [
        {
          firstName: 'Jamie',
          age: 35,
          ticketTypeId: 'ticket-type-1',
        },
      ],
    };

    await service.createReservation(access, 'event-1', data);

    expect(accessControl.assertEventAccess).toHaveBeenCalledWith(
      'event-1',
      access,
    );
    expect(bookingService.create).toHaveBeenCalledWith(
      {
        ...data,
        eventId: 'event-1',
      },
      'WALK_UP',
    );
  });

  it('records an attributable cash payment and issues Tickets once', async () => {
    prisma.booking.findFirst
      .mockResolvedValueOnce({
        id: 'booking-1',
        status: 'RESERVED',
        paymentStatus: 'UNPAID',
        total: new Prisma.Decimal(24),
        reservedUntil: new Date(Date.now() + 60_000),
      })
      .mockResolvedValueOnce({
        id: 'booking-1',
        bookingNumber: 'PG-1',
        source: 'WALK_UP',
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        total: new Prisma.Decimal(24),
        confirmedAt: new Date(),
        session: { id: 'session-1' },
        payments: [],
        tickets: [],
      });

    await service.completePayment(access, 'event-1', 'booking-1', {
      method: 'CASH',
      amount: 24,
      idempotencyKey: 'pos-payment-1',
    });

    expect(prisma.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        bookingId: 'booking-1',
        provider: 'CASH',
        method: 'CASH',
        amount: new Prisma.Decimal(24),
        status: 'SUCCEEDED',
        receivedByUserId: 'user-1',
      }),
    });
    expect(ticketService.issueTicketsForBooking).toHaveBeenCalledWith(
      'booking-1',
    );
  });

  it('rejects staff confirmation when the amount does not match', async () => {
    prisma.booking.findFirst.mockResolvedValue({
      id: 'booking-1',
      status: 'RESERVED',
      paymentStatus: 'UNPAID',
      total: new Prisma.Decimal(24),
      reservedUntil: new Date(Date.now() + 60_000),
    });

    await expect(
      service.completePayment(access, 'event-1', 'booking-1', {
        method: 'CASH',
        amount: 20,
        idempotencyKey: 'pos-payment-1',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects reuse of an idempotency key for different payment details', async () => {
    prisma.payment.findUnique.mockResolvedValue({
      bookingId: 'booking-1',
      method: 'CASH',
      amount: new Prisma.Decimal(24),
      standaloneReference: null,
    });

    await expect(
      service.completePayment(access, 'event-1', 'booking-1', {
        method: 'STANDALONE_EFTPOS',
        amount: 24,
        idempotencyKey: 'pos-payment-1',
      }),
    ).rejects.toThrow(ConflictException);
  });
});
