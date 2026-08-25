import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { ReportingService } from './reporting.service';

describe('ReportingService', () => {
  let service: ReportingService;
  const prisma = {
    event: { findFirst: jest.fn(), findMany: jest.fn() },
    session: { findMany: jest.fn() },
    booking: { findMany: jest.fn() },
    ticketType: { findMany: jest.fn() },
    product: { findMany: jest.fn() },
    rule: { findMany: jest.fn() },
    eventGroup: { findFirst: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportingService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(ReportingService);
    prisma.event.findFirst.mockResolvedValue({
      id: 'event-1',
      name: 'Winter Festival',
      status: 'ACTIVE',
      startDate: new Date('2027-08-31T14:00:00.000Z'),
      endDate: new Date('2027-09-05T13:59:59.999Z'),
      timezone: 'Australia/Melbourne',
    });
    prisma.session.findMany.mockResolvedValue([
      {
        id: 'session-1',
        name: 'Morning skate',
        status: 'ACTIVE',
        startDate: new Date('2027-09-01T00:30:00.000Z'),
        endDate: new Date('2027-09-01T01:30:00.000Z'),
        capacity: 10,
      },
    ]);
    prisma.booking.findMany.mockResolvedValue([]);
    prisma.event.findMany.mockResolvedValue([]);
    prisma.ticketType.findMany.mockResolvedValue([]);
    prisma.product.findMany.mockResolvedValue([]);
    prisma.rule.findMany.mockResolvedValue([]);
    prisma.eventGroup.findFirst.mockResolvedValue(null);
  });

  it('reports Ticket Type units and gross item sales without allocating refunds', async () => {
    prisma.ticketType.findMany.mockResolvedValue([
      { id: 'adult', name: 'Adult', active: true },
      { id: 'child', name: 'Child', active: true },
    ]);
    prisma.booking.findMany.mockResolvedValue([
      {
        items: [
          { ticketTypeId: 'adult', quantity: 2, totalPrice: 50 },
          { ticketTypeId: 'child', quantity: 1, totalPrice: 15 },
        ],
        tickets: [
          { status: 'SCANNED', checkedInAt: new Date(), participant: { ticketTypeId: 'adult' } },
          { status: 'ACTIVE', checkedInAt: null, participant: { ticketTypeId: 'adult' } },
          { status: 'ACTIVE', checkedInAt: null, participant: { ticketTypeId: 'child' } },
        ],
      },
    ]);

    const result = await service.getTicketTypeSales('org-1', 'event-1', {});

    expect(result.totals).toEqual({ unitsSold: 3, grossItemSales: 65, ticketsIssued: 3, admissions: 1 });
    expect(result.rows[0]).toEqual(expect.objectContaining({ id: 'adult', unitsSold: 2, grossItemSales: 50, unitSharePercent: 66.7 }));
    expect(result.refundAllocation).toBe('UNALLOCATED_AT_EVENT_OR_SESSION_LEVEL');
  });

  it('reports attributable Session collection, refunds and capacity truth', async () => {
    prisma.booking.findMany.mockResolvedValue([
      {
        sessionId: 'session-1', status: 'CONFIRMED', total: 80,
        items: [{ quantity: 2 }],
        tickets: [{ status: 'SCANNED', checkedInAt: new Date() }, { status: 'ACTIVE', checkedInAt: null }],
        payments: [{ status: 'SUCCEEDED', amount: 80, refunds: [{ status: 'SUCCEEDED', amount: 10 }] }],
      },
      {
        sessionId: 'session-1', status: 'RESERVED', total: 20,
        items: [{ quantity: 1 }], tickets: [], payments: [],
      },
    ]);

    const result = await service.getSessionSales('org-1', 'event-1', {});

    expect(result.rows[0]).toEqual(expect.objectContaining({
      confirmedBookings: 1, confirmedBookingValue: 80,
      grossCollected: 80, refunded: 10, netCollected: 70,
      ticketUnits: 2, ticketsIssued: 2, admissions: 1,
      reservedAttendance: 3, remainingCapacity: 7, utilisationPercent: 30,
    }));
  });

  it('reports Product sales, finite inventory and reusable Session capacity separately', async () => {
    prisma.product.findMany.mockResolvedValue([
      {
        id: 'kanga', name: 'Kanga', slug: 'kanga', status: 'ACTIVE',
        inventoryTracked: false, inventoryQuantity: null,
        capacityControlled: true, capacity: 30,
        productGroup: { id: 'group-1', name: 'Skating aids', sortOrder: 0 },
        variants: [],
        sessionProducts: [{ sessionId: 'session-1', capacityOverride: 20 }],
      },
      {
        id: 'hoodie', name: 'Hoodie', slug: 'hoodie', status: 'ACTIVE',
        inventoryTracked: false, inventoryQuantity: null,
        capacityControlled: false, capacity: null, productGroup: null,
        sessionProducts: [],
        variants: [{ id: 'small', name: 'Small', status: 'ACTIVE', inventoryTracked: true, inventoryQuantity: 50, sortOrder: 0 }],
      },
    ]);
    prisma.rule.findMany.mockResolvedValue([{ actions: { type: 'REQUIRE_PRODUCT', productSlug: 'kanga' } }]);
    prisma.booking.findMany
      .mockResolvedValueOnce([
        { id: 'booking-1', sessionId: 'session-1', products: [
          { productId: 'kanga', productVariantId: null, quantity: 2, unitPrice: 5 },
          { productId: 'hoodie', productVariantId: 'small', quantity: 1, unitPrice: 60 },
        ] },
      ])
      .mockResolvedValueOnce([
        { sessionId: 'session-1', products: [
          { productId: 'kanga', productVariantId: null, quantity: 3 },
          { productId: 'hoodie', productVariantId: 'small', quantity: 4 },
        ] },
      ]);

    const result = await service.getProductSales('org-1', 'event-1', {});

    expect(result.totals).toEqual({ confirmedBookings: 1, bookingsWithProducts: 1, attachRatePercent: 100, unitsSold: 3, grossItemSales: 70 });
    expect(result.rows[0]).toEqual(expect.objectContaining({ id: 'kanga', requiredByRule: true, unitsSold: 2, grossItemSales: 10 }));
    expect(result.rows[0].capacity.peakSession).toEqual(expect.objectContaining({ limit: 20, reserved: 3, remaining: 17, utilisationPercent: 15 }));
    expect(result.rows[1].variants[0]).toEqual(expect.objectContaining({ unitsSold: 1, inventoryCommitted: 4, inventoryRemaining: 46, sellThroughPercent: 8 }));
    expect(result.definitions.inventoryScope).toBe('EVENT_CURRENT_RESERVED_AND_CONFIRMED');
  });

  it('groups commercial, attendance and capacity results by Event-local Session date', async () => {
    prisma.booking.findMany.mockResolvedValue([
      {
        sessionId: 'session-1', status: 'CONFIRMED', total: 80,
        items: [{ quantity: 2 }],
        tickets: [{ status: 'SCANNED', checkedInAt: new Date() }, { status: 'ACTIVE', checkedInAt: null }],
        payments: [{ status: 'SUCCEEDED', amount: 80, refunds: [{ status: 'SUCCEEDED', amount: 10 }] }],
      },
      { sessionId: 'session-1', status: 'RESERVED', total: 20, items: [{ quantity: 1 }], tickets: [], payments: [] },
    ]);

    const result = await service.getDateSales('org-1', 'event-1', {});

    expect(result.rows).toEqual([expect.objectContaining({
      date: '2027-09-01', sessionCount: 1, confirmedBookings: 1, ticketUnits: 2,
      grossBookingValue: 80, grossCollected: 80, refunded: 10, netCollected: 70,
      ticketsIssued: 2, admissions: 1, capacity: 10, reservedAttendance: 3,
      remainingCapacity: 7, utilisationPercent: 30,
    })]);
  });

  it('aligns confirmed demand by Event-local days between Booking creation and Session date', async () => {
    prisma.booking.findMany.mockResolvedValue([
      { sessionId: 'session-1', createdAt: new Date('2027-08-23T14:30:00.000Z'), confirmedAt: new Date('2027-08-23T14:35:00.000Z'), total: 50, items: [{ quantity: 2 }] },
      { sessionId: 'session-1', createdAt: new Date('2027-08-31T15:00:00.000Z'), confirmedAt: new Date('2027-08-31T15:05:00.000Z'), total: 20, items: [{ quantity: 1 }] },
    ]);

    const result = await service.getSalesPace('org-1', 'event-1', {});

    expect(result.basis).toBe('BOOKING_CREATED_AT_FOR_CURRENTLY_CONFIRMED_BOOKINGS');
    expect(result.totals).toEqual({ confirmedBookings: 2, ticketUnits: 3, grossBookingValue: 70 });
    expect(result.rows.find(({ key }) => key === '8_TO_14')).toEqual(expect.objectContaining({ confirmedBookings: 1, ticketUnits: 2 }));
    expect(result.rows.find(({ key }) => key === 'SAME_DAY')).toEqual(expect.objectContaining({ confirmedBookings: 1, ticketUnits: 1, cumulativeTicketUnits: 3 }));
  });

  it('compares Event Group totals with absolute and normalised measures', async () => {
    prisma.eventGroup.findFirst.mockResolvedValue({
      id: 'group-1', name: 'Winter Tour', description: 'Two cities', type: 'TOUR', status: 'ACTIVE',
      events: [
        { sortOrder: 0, event: { id: 'event-1', name: 'Melbourne', slug: 'melbourne', status: 'ACTIVE', startDate: new Date('2027-09-01T00:00:00.000Z'), endDate: new Date('2027-09-02T00:00:00.000Z'), timezone: 'Australia/Melbourne' } },
        { sortOrder: 1, event: { id: 'event-2', name: 'Sydney', slug: 'sydney', status: 'ACTIVE', startDate: new Date('2027-09-08T00:00:00.000Z'), endDate: new Date('2027-09-08T12:00:00.000Z'), timezone: 'Australia/Sydney' } },
      ],
    });
    prisma.session.findMany.mockResolvedValue([
      { id: 'session-1', eventId: 'event-1', capacity: 100 },
      { id: 'session-2', eventId: 'event-2', capacity: 50 },
    ]);
    prisma.booking.findMany.mockResolvedValue([
      {
        eventId: 'event-1', status: 'CONFIRMED', total: 100,
        items: [{ quantity: 2 }], products: [{ quantity: 1, unitPrice: 20 }],
        tickets: [{ status: 'SCANNED', checkedInAt: new Date() }, { status: 'ACTIVE', checkedInAt: null }],
        payments: [{ status: 'SUCCEEDED', amount: 100, refunds: [{ status: 'SUCCEEDED', amount: 10 }] }],
      },
      {
        eventId: 'event-2', status: 'CONFIRMED', total: 60,
        items: [{ quantity: 1 }], products: [],
        tickets: [{ status: 'SCANNED', checkedInAt: new Date() }],
        payments: [{ status: 'SUCCEEDED', amount: 60, refunds: [] }],
      },
    ]);

    const result = await service.getEventGroupComparison('org-1', 'group-1');

    expect(result.totals).toEqual(expect.objectContaining({ events: 2, sessions: 2, confirmedBookings: 2, ticketUnits: 3, totalCapacity: 150, grossCollected: 160, refunded: 10, netCollected: 150, attendanceRatePercent: 66.7 }));
    expect(result.rows[0]).toEqual(expect.objectContaining({ revenuePerSession: 90, revenuePerCapacityPlace: 0.9, productAttachRatePercent: 100, contributionToGroupNetPercent: 60 }));
    expect(result.rows[1]).toEqual(expect.objectContaining({ revenuePerSession: 60, revenuePerCapacityPlace: 1.2, contributionToGroupNetPercent: 40 }));
    expect(result.timezoneSemantics).toBe('EACH_EVENT_RETAINS_ITS_OWN_TIMEZONE');
  });

  it('does not reveal an Event Group owned by another Organisation', async () => {
    await expect(service.getEventGroupComparison('org-1', 'foreign-group')).rejects.toThrow(NotFoundException);
  });

  it('returns a safe empty Organisation summary', async () => {
    const now = new Date('2027-09-01T00:00:00.000Z');
    const result = await service.getOrganizationSummary('org-1', now);

    expect(prisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: 'org-1' } }),
    );
    expect(prisma.session.findMany).not.toHaveBeenCalled();
    expect(prisma.booking.findMany).not.toHaveBeenCalled();
    expect(result.totals).toEqual({
      events: 0,
      currentEvents: 0,
      upcomingEvents: 0,
      sessionsToday: 0,
      confirmedBookings: 0,
      ticketsIssued: 0,
      admissions: 0,
      grossCollected: 0,
      refunded: 0,
      netCollected: 0,
      paymentExceptions: 0,
    });
  });

  it('summarises Event-local operations and commercial totals', async () => {
    const now = new Date('2027-08-31T23:00:00.000Z');
    prisma.event.findMany.mockResolvedValue([
      {
        id: 'event-1',
        name: 'Winter Festival',
        slug: 'winter-festival',
        status: 'ACTIVE',
        startDate: new Date('2027-08-31T14:00:00.000Z'),
        endDate: new Date('2027-09-05T13:59:59.999Z'),
        timezone: 'Australia/Melbourne',
      },
    ]);
    prisma.session.findMany.mockResolvedValue([
      {
        id: 'session-1',
        eventId: 'event-1',
        name: 'Morning skate',
        status: 'ACTIVE',
        startDate: new Date('2027-09-01T00:30:00.000Z'),
        endDate: new Date('2027-09-01T01:30:00.000Z'),
        capacity: 10,
      },
    ]);
    prisma.booking.findMany.mockResolvedValue([
      {
        eventId: 'event-1',
        sessionId: 'session-1',
        status: 'CONFIRMED',
        items: [{ quantity: 2 }],
        tickets: [
          { status: 'SCANNED', checkedInAt: now },
          { status: 'ACTIVE', checkedInAt: null },
        ],
        payments: [
          {
            status: 'SUCCEEDED',
            amount: 80,
            refunds: [{ status: 'SUCCEEDED', amount: 10 }],
          },
        ],
      },
      {
        eventId: 'event-1',
        sessionId: 'session-1',
        status: 'RESERVED',
        items: [{ quantity: 1 }],
        tickets: [],
        payments: [{ status: 'PENDING', amount: 20, refunds: [] }],
      },
    ]);

    const result = await service.getOrganizationSummary('org-1', now);

    expect(result.totals).toEqual(
      expect.objectContaining({
        currentEvents: 1,
        sessionsToday: 1,
        confirmedBookings: 1,
        ticketsIssued: 2,
        admissions: 1,
        grossCollected: 80,
        refunded: 10,
        netCollected: 70,
        paymentExceptions: 1,
      }),
    );
    expect(result.events[0]).toEqual(
      expect.objectContaining({
        lifecycle: 'CURRENT',
        sessions: expect.objectContaining({
          today: 1,
          reservedAttendance: 3,
          utilisationPercent: 30,
        }),
      }),
    );
  });

  it('returns safe zero metrics for an Event without Bookings', async () => {
    const result = await service.getEventReport('org-1', 'event-1', {});

    expect(result.commercial).toEqual({
      confirmedBookings: 0,
      grossCollected: 0,
      refunded: 0,
      netCollected: 0,
      averageBookingValue: 0,
    });
    expect(result.tickets).toEqual({
      issued: 0,
      admissions: 0,
      attendanceRate: 0,
    });
    expect(result.sessions[0]).toEqual(
      expect.objectContaining({
        reservedAttendance: 0,
        confirmedAttendance: 0,
        remainingCapacity: 10,
        utilisationPercent: 0,
      }),
    );
  });

  it('calculates mixed payment, refund, Ticket and capacity metrics', async () => {
    prisma.booking.findMany.mockResolvedValue([
      {
        id: 'booking-confirmed',
        bookingNumber: 'PG-1',
        sessionId: 'session-1',
        status: 'CONFIRMED',
        total: 80,
        items: [{ quantity: 2 }],
        tickets: [
          { id: 'ticket-1', status: 'SCANNED', checkedInAt: new Date() },
          { id: 'ticket-2', status: 'ACTIVE', checkedInAt: null },
        ],
        payments: [
          {
            id: 'payment-1',
            status: 'SUCCEEDED',
            amount: 80,
            refunds: [{ status: 'SUCCEEDED', amount: 10 }],
          },
        ],
        paymentReconciliationAttempts: [],
      },
      {
        id: 'booking-reserved',
        bookingNumber: 'PG-2',
        sessionId: 'session-1',
        status: 'RESERVED',
        total: 20,
        items: [{ quantity: 1 }],
        tickets: [],
        payments: [
          {
            id: 'payment-2',
            status: 'PENDING',
            amount: 20,
            refunds: [],
          },
        ],
        paymentReconciliationAttempts: [
          {
            succeeded: false,
            outcome: 'PROVIDER_UNAVAILABLE',
            attemptedAt: new Date('2027-08-01T00:00:00.000Z'),
          },
        ],
      },
      {
        id: 'booking-expired',
        bookingNumber: 'PG-3',
        sessionId: 'session-1',
        status: 'EXPIRED',
        total: 30,
        items: [{ quantity: 3 }],
        tickets: [],
        payments: [
          {
            id: 'payment-3',
            status: 'SUCCEEDED',
            amount: 30,
            refunds: [{ status: 'SUCCEEDED', amount: 30 }],
          },
        ],
        paymentReconciliationAttempts: [],
      },
    ]);

    const result = await service.getEventReport('org-1', 'event-1', {});

    expect(result.commercial).toEqual({
      confirmedBookings: 1,
      grossCollected: 110,
      refunded: 40,
      netCollected: 70,
      averageBookingValue: 80,
    });
    expect(result.tickets).toEqual({
      issued: 2,
      admissions: 1,
      attendanceRate: 50,
    });
    expect(result.sessions[0]).toEqual(
      expect.objectContaining({
        reservedAttendance: 3,
        confirmedAttendance: 2,
        remainingCapacity: 7,
        utilisationPercent: 30,
        admissions: 1,
      }),
    );
    expect(result.payments.exceptionCount).toBe(1);
    expect(result.payments.exceptions[0]).toEqual(
      expect.objectContaining({ bookingNumber: 'PG-2' }),
    );
  });

  it('uses Event-local midnight boundaries and still reads attached Payments', async () => {
    await service.getEventReport('org-1', 'event-1', {
      date: '2027-09-01',
    });

    expect(prisma.session.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          startDate: {
            gte: new Date('2027-08-31T14:00:00.000Z'),
            lt: new Date('2027-09-01T14:00:00.000Z'),
          },
        }),
      }),
    );
    expect(prisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          eventId: 'event-1',
          sessionId: { in: ['session-1'] },
        },
      }),
    );
  });

  it('surfaces a failed latest reconciliation without a pending Payment', async () => {
    prisma.booking.findMany.mockResolvedValue([
      {
        id: 'booking-reconciliation',
        bookingNumber: 'PG-RECON',
        sessionId: 'session-1',
        status: 'CONFIRMED',
        total: 20,
        items: [{ quantity: 1 }],
        tickets: [],
        payments: [{ status: 'SUCCEEDED', amount: 20, refunds: [] }],
        paymentReconciliationAttempts: [
          {
            succeeded: false,
            outcome: 'PROVIDER_UNAVAILABLE',
            attemptedAt: new Date('2027-08-01T00:00:00.000Z'),
          },
        ],
      },
    ]);

    const result = await service.getEventReport('org-1', 'event-1', {});

    expect(result.payments.exceptionCount).toBe(1);
    expect(result.payments.exceptions[0]).toEqual(
      expect.objectContaining({ bookingNumber: 'PG-RECON' }),
    );
  });

  it('rejects invalid dates before querying Sessions', async () => {
    await expect(
      service.getEventReport('org-1', 'event-1', { date: '2027-02-30' }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.session.findMany).not.toHaveBeenCalled();
  });

  it('hides Events outside the authenticated Organisation', async () => {
    prisma.event.findFirst.mockResolvedValue(null);

    await expect(
      service.getEventReport('org-1', 'event-other', {}),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.session.findMany).not.toHaveBeenCalled();
  });
});
