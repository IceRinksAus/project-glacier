import { TicketScanMode } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { ScannerClock } from './scanner-clock';
import { StaffScannerService } from './staff-scanner.service';
import { ScannerTicketResult } from './staff-scanner.types';

describe('StaffScannerService', () => {
  const token = 'a'.repeat(64);
  const now = new Date('2027-09-01T00:00:00.000Z');
  const event = {
    id: 'event-1',
    name: 'Ice Event',
    startDate: new Date('2027-09-01T00:30:00.000Z'),
    endDate: new Date('2027-09-01T01:30:00.000Z'),
    timezone: 'Australia/Melbourne',
    venueName: 'Ice Arena',
    entryOpensMinutesBeforeStart: 30,
    entryClosesMinutesAfterEnd: 0,
  };
  const ticket = {
    id: 'ticket-1',
    ticketNumber: 'TKT-1',
    issuedAt: new Date('2027-08-20T00:00:00.000Z'),
    status: 'ACTIVE',
    checkedInAt: null,
    participant: {
      firstName: 'Alex',
      lastName: 'Test',
      ticketType: { name: 'Adult' },
    },
    booking: {
      eventId: 'event-1',
      event,
      session: {
        name: '10am Session',
        startDate: new Date('2027-09-01T00:30:00.000Z'),
        endDate: new Date('2027-09-01T01:30:00.000Z'),
      },
    },
  };
  const transactionMock = {
    ticket: { findFirst: jest.fn(), updateMany: jest.fn() },
    ticketScanAttempt: { create: jest.fn() },
  };
  const prismaMock = {
    event: { findMany: jest.fn(), findFirst: jest.fn() },
    ticket: { findFirst: jest.fn() },
    $transaction: jest.fn((callback) => callback(transactionMock)),
  };
  const clockMock = { now: jest.fn(() => now) };
  let service: StaffScannerService;

  beforeEach(async () => {
    jest.clearAllMocks();
    prismaMock.event.findFirst.mockResolvedValue(event);
    prismaMock.ticket.findFirst.mockResolvedValue(ticket);
    transactionMock.ticket.findFirst.mockResolvedValue(ticket);
    transactionMock.ticket.updateMany.mockResolvedValue({ count: 1 });
    transactionMock.ticketScanAttempt.create.mockResolvedValue({
      id: 'attempt-1',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaffScannerService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ScannerClock, useValue: clockMock },
      ],
    }).compile();
    service = module.get(StaffScannerService);
  });

  const input = { token, mode: TicketScanMode.GATE_ENTRY };

  it('lists only active Events in the authenticated organization', async () => {
    prismaMock.event.findMany.mockResolvedValue([event]);
    await service.findActiveEvents('organization-1');
    expect(prismaMock.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: 'organization-1', status: 'ACTIVE' },
      }),
    );
  });

  it('performs read-only lookup without admission or audit writes', async () => {
    const result = await service.lookup('organization-1', 'event-1', input);
    expect(result).toMatchObject({
      result: ScannerTicketResult.READY_TO_ADMIT,
      participantName: 'Alex Test',
      ticketType: 'Adult',
      entryOpensAt: now,
    });
    expect(transactionMock.ticket.updateMany).not.toHaveBeenCalled();
    expect(transactionMock.ticketScanAttempt.create).not.toHaveBeenCalled();
  });

  it('reports too early using the injected server clock', async () => {
    clockMock.now.mockReturnValueOnce(new Date('2027-08-31T23:59:59.999Z'));
    const result = await service.lookup('organization-1', 'event-1', input);
    expect(result.result).toBe(ScannerTicketResult.NOT_YET_VALID);
  });

  it('does not disclose details for a Ticket belonging to another selected Event', async () => {
    prismaMock.ticket.findFirst.mockResolvedValue({
      ...ticket,
      booking: { ...ticket.booking, eventId: 'event-2' },
    });
    const result = await service.lookup('organization-1', 'event-1', input);
    expect(result).toEqual({ result: ScannerTicketResult.INVALID_FOR_EVENT });
  });

  it('atomically admits an eligible Ticket and records attributable evidence', async () => {
    const result = await service.admit(
      'organization-1',
      'user-1',
      'event-1',
      input,
    );
    expect(transactionMock.ticket.updateMany).toHaveBeenCalledWith({
      where: { id: 'ticket-1', status: 'ACTIVE' },
      data: { status: 'SCANNED', checkedInAt: now },
    });
    expect(transactionMock.ticketScanAttempt.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: 'organization-1',
        eventId: 'event-1',
        ticketId: 'ticket-1',
        userId: 'user-1',
        mode: TicketScanMode.GATE_ENTRY,
        result: 'ENTRY_GRANTED',
      }),
    });
    expect(result.result).toBe(ScannerTicketResult.ENTRY_GRANTED);
  });

  it('returns already scanned when another device wins the atomic update', async () => {
    transactionMock.ticket.updateMany.mockResolvedValueOnce({ count: 0 });
    transactionMock.ticket.findFirst
      .mockResolvedValueOnce(ticket)
      .mockResolvedValueOnce({
        ...ticket,
        status: 'SCANNED',
        checkedInAt: now,
      });

    const result = await service.admit(
      'organization-1',
      'user-1',
      'event-1',
      input,
    );

    expect(result.result).toBe(ScannerTicketResult.ALREADY_SCANNED);
    expect(transactionMock.ticketScanAttempt.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ result: 'ALREADY_SCANNED' }),
    });
  });

  it('fails closed and audits an admission outside the entry window', async () => {
    clockMock.now.mockReturnValueOnce(new Date('2027-09-01T01:30:00.001Z'));
    const result = await service.admit('organization-1', 'user-1', 'event-1', {
      ...input,
      mode: TicketScanMode.TICKET_LOOKUP,
    });
    expect(result.result).toBe(ScannerTicketResult.ENTRY_WINDOW_CLOSED);
    expect(transactionMock.ticket.updateMany).not.toHaveBeenCalled();
    expect(transactionMock.ticketScanAttempt.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        mode: TicketScanMode.TICKET_LOOKUP,
        result: 'ENTRY_WINDOW_CLOSED',
      }),
    });
  });
});
