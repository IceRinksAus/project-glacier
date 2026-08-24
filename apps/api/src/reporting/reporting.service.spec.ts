import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { ReportingService } from './reporting.service';

describe('ReportingService', () => {
  let service: ReportingService;
  const prisma = {
    event: { findFirst: jest.fn() },
    session: { findMany: jest.fn() },
    booking: { findMany: jest.fn() },
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
