import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import {
  AccessControlService,
  AuthenticatedAccessContext,
} from '../access-control/access-control.service';
import { PrismaService } from '../prisma/prisma.service';
import { TicketCredentialRotationService } from './ticket-credential-rotation.service';
import { TicketCredentialService } from './ticket-credential.service';

describe('TicketCredentialRotationService', () => {
  const manager: AuthenticatedAccessContext = {
    userId: 'manager-1',
    organizationId: 'organization-1',
    role: 'MANAGER',
    accessScope: 'ASSIGNED_EVENTS',
  };
  const transaction = {
    ticket: { updateMany: jest.fn() },
    ticketCredentialRotationAudit: { create: jest.fn() },
  };
  const prisma = {
    ticket: { findFirst: jest.fn() },
    $transaction: jest.fn((callback) => callback(transaction)),
  };
  const accessControl = {
    eventWhere: jest.fn(() => ({ AND: ['trusted-event-scope'] })),
  };
  const credentials = {
    issue: jest.fn(() => ({
      id: 'ticket-1',
      credentialSelector: 'c'.repeat(32),
      credentialKeyId: 'current-v2',
      token: `gt1_${'c'.repeat(32)}_${'A'.repeat(43)}`,
    })),
  };
  const service = new TicketCredentialRotationService(
    prisma as unknown as PrismaService,
    accessControl as unknown as AccessControlService,
    credentials as unknown as TicketCredentialService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    transaction.ticket.updateMany.mockResolvedValue({ count: 1 });
    transaction.ticketCredentialRotationAudit.create.mockResolvedValue({});
    prisma.ticket.findFirst.mockResolvedValue({
      id: 'ticket-1',
      credentialSelector: 'b'.repeat(32),
      credentialKeyId: 'previous-v1',
      legacyCredentialHash: 'legacy-hash',
      booking: { eventId: 'event-1' },
    });
  });

  it('rotates selector and key atomically and records non-secret audit evidence', async () => {
    const result = await service.rotate('ticket-1', manager);

    expect(prisma.ticket.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'ticket-1',
        booking: { event: { AND: ['trusted-event-scope'] } },
      },
      select: expect.any(Object),
    });
    expect(transaction.ticket.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'ticket-1',
        credentialSelector: 'b'.repeat(32),
        credentialKeyId: 'previous-v1',
        legacyCredentialHash: 'legacy-hash',
      },
      data: {
        credentialSelector: 'c'.repeat(32),
        credentialKeyId: 'current-v2',
        legacyCredentialHash: null,
      },
    });
    expect(
      transaction.ticketCredentialRotationAudit.create,
    ).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: 'organization-1',
        eventId: 'event-1',
        ticketId: 'ticket-1',
        actorUserId: 'manager-1',
        previousKeyId: 'previous-v1',
        newKeyId: 'current-v2',
        legacyCredentialRevoked: true,
      }),
    });
    expect(
      JSON.stringify(
        transaction.ticketCredentialRotationAudit.create.mock.calls,
      ),
    ).not.toContain('legacy-hash');
    expect(result.credential).toBe(`gt1_${'c'.repeat(32)}_${'A'.repeat(43)}`);
  });

  it('does not reveal a foreign or unassigned Ticket', async () => {
    prisma.ticket.findFirst.mockResolvedValue(null);

    await expect(service.rotate('foreign-ticket', manager)).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it.each(['STAFF', 'SCANNER'] as const)(
    'rejects the %s role at the service boundary',
    async (role) => {
      await expect(
        service.rotate('ticket-1', { ...manager, role }),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.ticket.findFirst).not.toHaveBeenCalled();
    },
  );

  it('fails safely when another request rotates the Ticket first', async () => {
    transaction.ticket.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.rotate('ticket-1', manager)).rejects.toThrow(
      ConflictException,
    );
    expect(
      transaction.ticketCredentialRotationAudit.create,
    ).not.toHaveBeenCalled();
  });
});
