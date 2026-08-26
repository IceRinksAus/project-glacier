import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BookingRescheduleReason, Prisma } from '@prisma/client';

import { BookingRescheduleService } from './booking-reschedule.service';

describe('BookingRescheduleService', () => {
  const access = {
    userId: 'manager-1',
    organizationId: 'org-1',
    role: 'MANAGER' as const,
    accessScope: 'ASSIGNED_EVENTS' as const,
  };
  const originalSession = {
    id: 'session-1',
    name: '10:00am',
    startDate: new Date('2027-09-01T00:00:00Z'),
    endDate: new Date('2027-09-01T01:00:00Z'),
    capacity: 150,
    status: 'ACTIVE',
    eventId: 'event-1',
    salesStart: null,
    salesEnd: null,
    operationalScheduleId: null,
    scheduleEntryId: null,
    scheduleExceptionType: 'NONE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const destinationSession = {
    ...originalSession,
    id: 'session-2',
    name: '11:00am',
    startDate: new Date('2027-09-01T01:00:00Z'),
    endDate: new Date('2027-09-01T02:00:00Z'),
  };
  const participants = [
    {
      id: 'participant-1',
      firstName: 'Alex',
      lastName: 'Skater',
      age: 30,
      ticketTypeId: 'adult',
      ticketType: { id: 'adult', name: 'Adult', active: true },
    },
    {
      id: 'participant-2',
      firstName: 'Sam',
      lastName: 'Skater',
      age: 4,
      ticketTypeId: 'young-child',
      ticketType: {
        id: 'young-child',
        name: 'Young Child',
        active: true,
      },
    },
  ];
  const booking = {
    id: 'booking-1',
    bookingNumber: 'PG-1',
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    eventId: 'event-1',
    sessionId: 'session-1',
    session: originalSession,
    total: new Prisma.Decimal(34),
    flexibleBooking: false,
    items: [
      { ticketTypeId: 'adult', quantity: 1 },
      { ticketTypeId: 'young-child', quantity: 1 },
    ],
    participants,
    tickets: participants.map((participant, index) => ({
      id: `ticket-${index + 1}`,
      ticketNumber: `T-${index + 1}`,
      status: 'ACTIVE',
      checkedInAt: null,
      issuedAt: new Date(),
      participant,
      adjustmentAllocation: null,
      originalRescheduleMapping: null,
    })),
    products: [
      {
        id: 'booking-product-1',
        productId: 'kanga-1',
        quantity: 1,
        unitPrice: new Prisma.Decimal(10),
        product: {
          id: 'kanga-1',
          name: 'Kanga',
          slug: 'kanga',
          status: 'ACTIVE',
          capacityControlled: true,
          capacity: 20,
          inventoryTracked: false,
        },
        productVariant: null,
      },
    ],
    ticketAdjustments: [],
    reschedules: [],
  };
  const prisma = {
    booking: { findFirst: jest.fn(), findMany: jest.fn() },
    session: { findFirst: jest.fn(), findMany: jest.fn() },
    sessionProduct: { findMany: jest.fn() },
    bookingProduct: { aggregate: jest.fn() },
  };
  const accessControl = {
    eventWhere: jest.fn(() => ({
      AND: [{ organizationId: 'org-1' }, { id: 'event-1' }],
    })),
  };
  const ruleEvaluation = { evaluate: jest.fn() };
  let service: BookingRescheduleService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.booking.findFirst.mockResolvedValue(booking);
    prisma.session.findFirst.mockResolvedValue(destinationSession);
    prisma.session.findMany.mockResolvedValue([destinationSession]);
    prisma.booking.findMany.mockResolvedValue([
      {
        status: 'CONFIRMED',
        items: [{ quantity: 12 }],
        tickets: Array.from({ length: 10 }, () => ({ status: 'ACTIVE' })),
      },
    ]);
    prisma.sessionProduct.findMany.mockResolvedValue([
      {
        id: 'session-product-1',
        sessionId: 'session-1',
        productId: 'kanga-1',
        active: true,
        capacityOverride: 20,
      },
      {
        id: 'session-product-2',
        sessionId: 'session-2',
        productId: 'kanga-1',
        active: true,
        capacityOverride: 20,
      },
    ]);
    prisma.bookingProduct.aggregate.mockResolvedValue({
      _sum: { quantity: 5 },
    });
    ruleEvaluation.evaluate.mockResolvedValue({
      valid: true,
      errors: [],
      warnings: [],
      matchedRuleIds: [],
      requiredProducts: [],
    });
    service = new BookingRescheduleService(
      prisma as never,
      accessControl as never,
      ruleEvaluation as never,
    );
  });

  it('returns eligible destinations with admission and Product capacity', async () => {
    const result = await service.context(access, 'booking-1');

    expect(result.eligible).toBe(true);
    expect(result.destinations).toEqual([
      expect.objectContaining({
        id: 'session-2',
        available: true,
        remainingAdmissionBeforeMove: 140,
        remainingAdmissionAfterMove: 138,
      }),
    ]);
    expect(result.destinations[0].productEffects).toEqual([
      expect.objectContaining({
        name: 'Kanga',
        capacityTransferred: 1,
        remainingCapacity: 15,
        finiteInventoryUnchanged: false,
      }),
    ]);
  });

  it('previews the exact whole-Booking move without changing price or inventory', async () => {
    const result = await service.preview(access, 'booking-1', {
      destinationSessionId: 'session-2',
      reason: BookingRescheduleReason.CUSTOMER_REQUEST,
      note: 'Customer requested the later Session.',
    });

    expect(result.previewHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.ticketCount).toBe(2);
    expect(result.admissionPlacesTransferred).toBe(2);
    expect(result.totalUnchanged).toBe(34);
    expect(result.priceDifference).toBe(0);
    expect(result.finiteInventoryUnchanged).toBe(true);
    expect(ruleEvaluation.evaluate).toHaveBeenCalledTimes(2);
  });

  it('does not disclose a foreign or unassigned Booking', async () => {
    prisma.booking.findFirst.mockResolvedValue(null);

    await expect(service.context(access, 'booking-foreign')).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.booking.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          event: expect.any(Object),
        }),
      }),
    );
  });

  it.each([
    ['scanned', { tickets: [{ ...booking.tickets[0], status: 'SCANNED' }] }],
    ['adjusted', { ticketAdjustments: [{ id: 'adjustment-1' }] }],
    [
      'late',
      {
        session: {
          ...originalSession,
          startDate: new Date('2020-01-01T00:00:00Z'),
        },
      },
    ],
  ])('rejects an ineligible %s Booking', async (_label, change) => {
    prisma.booking.findFirst.mockResolvedValue({ ...booking, ...change });

    await expect(
      service.preview(access, 'booking-1', {
        destinationSessionId: 'session-2',
        reason: BookingRescheduleReason.ORGANISER_CORRECTION,
        note: 'Correcting the Session selection.',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a different-Event destination without disclosure', async () => {
    prisma.session.findFirst.mockResolvedValue(null);

    await expect(
      service.preview(access, 'booking-1', {
        destinationSessionId: 'foreign-session',
        reason: BookingRescheduleReason.CUSTOMER_REQUEST,
        note: 'Customer requested a different Session.',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects a destination without enough admission capacity', async () => {
    prisma.booking.findMany.mockResolvedValue([
      {
        status: 'CONFIRMED',
        items: [{ quantity: 149 }],
        tickets: Array.from({ length: 149 }, () => ({ status: 'ACTIVE' })),
      },
    ]);

    await expect(
      service.preview(access, 'booking-1', {
        destinationSessionId: 'session-2',
        reason: BookingRescheduleReason.CUSTOMER_REQUEST,
        note: 'Customer requested a different Session.',
      }),
    ).rejects.toThrow(/admission capacity/);
  });

  it('counts active Tickets after partial cancellation and reserves unissued quantities conservatively', async () => {
    prisma.booking.findMany.mockResolvedValue([
      {
        status: 'CONFIRMED',
        items: [{ quantity: 5 }],
        tickets: [
          { status: 'ACTIVE' },
          { status: 'ACTIVE' },
          { status: 'CANCELLED' },
        ],
      },
      {
        status: 'RESERVED',
        items: [{ quantity: 4 }],
        tickets: [],
      },
    ]);

    const result = await service.context(access, 'booking-1');

    expect(result.destinations[0].remainingAdmissionBeforeMove).toBe(144);
    expect(result.destinations[0].remainingAdmissionAfterMove).toBe(142);
    expect(prisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ sessionId: 'session-2' }),
      }),
    );
  });

  it('rejects a destination without reusable Product capacity', async () => {
    prisma.bookingProduct.aggregate.mockResolvedValue({
      _sum: { quantity: 20 },
    });

    await expect(
      service.preview(access, 'booking-1', {
        destinationSessionId: 'session-2',
        reason: BookingRescheduleReason.CUSTOMER_REQUEST,
        note: 'Customer requested a different Session.',
      }),
    ).rejects.toThrow(/Kanga does not have enough capacity/);
  });

  it('excludes unavailable Sessions from the destination list', async () => {
    prisma.booking.findMany.mockResolvedValue([
      {
        status: 'CONFIRMED',
        items: [{ quantity: 150 }],
        tickets: Array.from({ length: 150 }, () => ({ status: 'ACTIVE' })),
      },
    ]);

    const result = await service.context(access, 'booking-1');

    expect(result.destinations).toEqual([]);
  });

  it('rejects a destination that no longer satisfies required Products', async () => {
    ruleEvaluation.evaluate.mockResolvedValue({
      valid: true,
      errors: [],
      warnings: [],
      matchedRuleIds: ['rule-1'],
      requiredProducts: [
        { productSlug: 'safety-pack', quantity: 1, ruleId: 'rule-1' },
      ],
    });

    await expect(
      service.preview(access, 'booking-1', {
        destinationSessionId: 'session-2',
        reason: BookingRescheduleReason.CUSTOMER_REQUEST,
        note: 'Customer requested a different Session.',
      }),
    ).rejects.toThrow(/required Product Rules/);
  });
});
