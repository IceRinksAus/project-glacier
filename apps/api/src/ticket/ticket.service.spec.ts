import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { TicketScanResult } from './dto/ticket-scan-response.dto';
import { TicketCredentialService } from './ticket-credential.service';
import { TicketService } from './ticket.service';

jest.mock('qrcode', () => ({
  toBuffer: jest.fn().mockResolvedValue(Buffer.from('qr-code')),
}));

describe('TicketService', () => {
  let service: TicketService;

  const token = 'a'.repeat(64);
  const ticket = {
    id: 'ticket-1',
    ticketNumber: 'TKT-1',
    secureToken: token,
    credentialSelector: 'b'.repeat(32),
    credentialKeyId: 'local-v1',
    legacyCredentialHash: 'legacy-hash',
    status: 'ACTIVE',
    checkedInAt: new Date('2026-08-20T00:00:00.000Z'),
    participant: {
      firstName: 'Alex',
      lastName: 'Test',
    },
    booking: {
      event: {
        name: 'Winter Event',
      },
      session: {
        name: 'Public Skate',
        startDate: new Date('2026-08-21T00:00:00.000Z'),
        endDate: new Date('2026-08-21T01:00:00.000Z'),
      },
    },
  };
  const prismaMock = {
    booking: {
      findUnique: jest.fn(),
    },
    ticket: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      createMany: jest.fn(),
      updateMany: jest.fn(),
    },
    flexibleTicketEntitlement: {
      updateMany: jest.fn(),
    },
  };
  const credentialMock = {
    lookupWhere: jest.fn(() => ({
      legacyCredentialHash: 'legacy-hash',
    })),
    matches: jest.fn(() => true),
    present: jest.fn(() => `gt1_${'b'.repeat(32)}_${'A'.repeat(43)}`),
    issue: jest.fn((id: string) => ({
      id,
      credentialSelector: 'b'.repeat(32),
      credentialKeyId: 'local-v1',
      token: `gt1_${'b'.repeat(32)}_${'A'.repeat(43)}`,
    })),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: TicketCredentialService,
          useValue: credentialMock,
        },
      ],
    }).compile();

    service = module.get<TicketService>(TicketService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('issues new Tickets with stored verification metadata and no raw credential', async () => {
    prismaMock.booking.findUnique.mockResolvedValue({
      id: 'booking-1',
      participants: [{ id: 'participant-1' }],
      tickets: [],
    });
    prismaMock.ticket.createMany.mockResolvedValue({ count: 1 });
    prismaMock.ticket.findMany.mockResolvedValue([]);

    await service.issueTicketsForBooking('booking-1');

    expect(prismaMock.ticket.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          id: expect.any(String),
          bookingId: 'booking-1',
          participantId: 'participant-1',
          secureToken: null,
          credentialSelector: 'b'.repeat(32),
          credentialKeyId: 'local-v1',
          status: 'ACTIVE',
        }),
      ],
    });
  });

  it('activates pending Flexible Ticket entitlements against issued Tickets and Payment', async () => {
    prismaMock.ticket.findMany.mockResolvedValue([
      { id: 'ticket-1', participantId: 'participant-1' },
      { id: 'ticket-2', participantId: 'participant-2' },
    ]);
    prismaMock.flexibleTicketEntitlement.updateMany.mockResolvedValue({
      count: 1,
    });

    await service.activateFlexibleTicketsForBooking('booking-1', 'payment-1');

    expect(
      prismaMock.flexibleTicketEntitlement.updateMany,
    ).toHaveBeenCalledTimes(2);
    expect(
      prismaMock.flexibleTicketEntitlement.updateMany,
    ).toHaveBeenCalledWith({
      where: {
        bookingId: 'booking-1',
        participantId: 'participant-1',
        status: 'PENDING',
      },
      data: {
        status: 'ACTIVE',
        initialTicketId: 'ticket-1',
        activatedByPaymentId: 'payment-1',
        activatedAt: expect.any(Date),
      },
    });
  });

  it('rejects malformed public possession tokens before querying', async () => {
    credentialMock.lookupWhere.mockReturnValueOnce(null as never);
    await expect(service.getTicketByToken('not-a-token')).rejects.toThrow(
      NotFoundException,
    );
    expect(prismaMock.ticket.findUnique).not.toHaveBeenCalled();
  });

  it('minimises public Ticket presentation data', async () => {
    prismaMock.ticket.findUnique.mockResolvedValue(ticket);

    await service.getTicketByToken(token);

    expect(prismaMock.ticket.findUnique).toHaveBeenCalledWith({
      where: {
        legacyCredentialHash: 'legacy-hash',
      },
      select: expect.objectContaining({
        ticketNumber: true,
        status: true,
        checkedInAt: true,
        participant: expect.any(Object),
        booking: expect.any(Object),
      }),
    });
    const query = prismaMock.ticket.findUnique.mock.calls[0][0];
    expect(JSON.stringify(query)).not.toContain('customer');
  });

  it('resolves a current signed credential by selector and verifies its MAC', async () => {
    const currentToken = `gt1_${'b'.repeat(32)}_${'A'.repeat(43)}`;
    credentialMock.lookupWhere.mockReturnValueOnce({
      credentialSelector: 'b'.repeat(32),
    });
    prismaMock.ticket.findUnique.mockResolvedValue(ticket);

    await service.getTicketByToken(currentToken);

    expect(prismaMock.ticket.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { credentialSelector: 'b'.repeat(32) },
      }),
    );
    expect(credentialMock.matches).toHaveBeenCalledWith(ticket, currentToken);
  });

  it('generates a public QR only for a valid possession token', async () => {
    prismaMock.ticket.findUnique.mockResolvedValue(ticket);

    const result = await service.generatePublicQrCode(token);

    expect(prismaMock.ticket.findUnique).toHaveBeenCalledWith({
      where: { legacyCredentialHash: 'legacy-hash' },
      select: {
        id: true,
        credentialSelector: true,
        credentialKeyId: true,
        legacyCredentialHash: true,
      },
    });
    expect(result).toEqual(Buffer.from('qr-code'));
  });

  it('tenant-scopes Ticket detail through Booking and Event', async () => {
    prismaMock.ticket.findFirst.mockResolvedValue(ticket);

    await service.getTicketById('organization-1', 'ticket-1');

    expect(prismaMock.ticket.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'ticket-1',
          booking: {
            event: {
              organizationId: 'organization-1',
            },
          },
        },
      }),
    );
  });

  it('tenant-scopes Ticket validation', async () => {
    prismaMock.ticket.findFirst.mockResolvedValue(ticket);

    await service.validateTicket('organization-1', token);

    expect(prismaMock.ticket.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          legacyCredentialHash: 'legacy-hash',
          booking: {
            event: {
              organizationId: 'organization-1',
            },
          },
        },
      }),
    );
  });

  it('identifies a cancelled original as replaced without exposing its new token', async () => {
    prismaMock.ticket.findFirst.mockResolvedValue({
      ...ticket,
      status: 'CANCELLED',
      originalRescheduleMapping: {
        replacementTicketNumberSnapshot: 'TKT-REPLACEMENT',
      },
    });

    const result = await service.validateTicket('organization-1', token);

    expect(result).toEqual(
      expect.objectContaining({
        valid: false,
        reason: 'CANCELLED',
        replacementTicketNumber: 'TKT-REPLACEMENT',
        message: expect.stringContaining('replaced after a Session change'),
      }),
    );
    expect(JSON.stringify(result)).not.toContain('secureToken');
  });

  it('preserves atomic Ticket scan while tenant-scoping the mutation', async () => {
    prismaMock.ticket.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.ticket.findFirst.mockResolvedValue(ticket);

    const result = await service.checkInTicket('organization-1', token);

    expect(prismaMock.ticket.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'ticket-1',
        status: 'ACTIVE',
        booking: {
          event: {
            organizationId: 'organization-1',
          },
        },
      },
      data: {
        status: 'SCANNED',
        checkedInAt: expect.any(Date),
      },
    });
    expect(result.result).toBe(TicketScanResult.ENTRY_GRANTED);
  });

  it('does not expose another tenant Ticket through QR generation', async () => {
    prismaMock.ticket.findFirst.mockResolvedValue(null);

    await expect(
      service.generateQrCode('organization-1', 'ticket-2'),
    ).rejects.toThrow('Ticket not found');
    expect(prismaMock.ticket.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'ticket-2',
        booking: {
          event: {
            organizationId: 'organization-1',
          },
        },
      },
      select: {
        id: true,
        credentialSelector: true,
        credentialKeyId: true,
      },
    });
  });
});
