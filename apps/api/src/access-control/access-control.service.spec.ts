import { NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import {
  AccessControlService,
  AuthenticatedAccessContext,
} from './access-control.service';
import { TicketCredentialService } from '../ticket/ticket-credential.service';

describe('AccessControlService', () => {
  const prismaMock = {
    event: {
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    eventGroup: {
      findFirst: jest.fn(),
    },
    ticket: {
      findFirst: jest.fn(),
    },
  };
  const ticketCredentials = {
    lookupWhere: jest.fn(() => ({ legacyCredentialHash: 'legacy-hash' })),
    matches: jest.fn(() => true),
  };

  const service = new AccessControlService(
    prismaMock as unknown as PrismaService,
    ticketCredentials as unknown as TicketCredentialService,
  );

  const assignedStaff: AuthenticatedAccessContext = {
    userId: 'user-1',
    organizationId: 'organization-1',
    role: 'STAFF',
    accessScope: 'ASSIGNED_EVENTS',
  };

  beforeEach(() => jest.clearAllMocks());

  it('requires an Event assignment for restricted users', () => {
    expect(service.eventWhere(assignedStaff, { id: 'event-1' })).toEqual({
      AND: [
        { organizationId: 'organization-1' },
        {
          userAccess: {
            some: {
              userId: 'user-1',
            },
          },
        },
        { id: 'event-1' },
      ],
    });
  });

  it.each([
    { role: 'OWNER' as const, accessScope: 'ALL_EVENTS' as const },
    { role: 'MANAGER' as const, accessScope: 'ALL_EVENTS' as const },
  ])('allows $role to use organization-wide Event scope', (roleScope) => {
    expect(
      service.eventWhere({ ...assignedStaff, ...roleScope }, { id: 'event-1' }),
    ).toEqual({
      AND: [{ organizationId: 'organization-1' }, {}, { id: 'event-1' }],
    });
  });

  it('resolves an assigned same-organization Event', async () => {
    prismaMock.event.findFirst.mockResolvedValue({ id: 'event-1' });

    await expect(
      service.assertEventAccess('event-1', assignedStaff),
    ).resolves.toBeUndefined();
  });

  it('uses a privacy-safe not-found response for inaccessible Events', async () => {
    prismaMock.event.findFirst.mockResolvedValue(null);

    await expect(
      service.assertEventAccess('foreign-event', assignedStaff),
    ).rejects.toThrow(NotFoundException);
  });

  it('allows an Event Group only when every member Event is accessible', async () => {
    prismaMock.eventGroup.findFirst.mockResolvedValue({
      events: [{ eventId: 'event-1' }, { eventId: 'event-2' }],
    });
    prismaMock.event.count.mockResolvedValue(2);

    await expect(
      service.assertEventGroupAccess('group-1', assignedStaff),
    ).resolves.toBeUndefined();
  });

  it('does not reveal an Event Group containing an inaccessible Event', async () => {
    prismaMock.eventGroup.findFirst.mockResolvedValue({
      events: [{ eventId: 'event-1' }, { eventId: 'event-2' }],
    });
    prismaMock.event.count.mockResolvedValue(1);

    await expect(
      service.assertEventGroupAccess('group-1', assignedStaff),
    ).rejects.toThrow('Event Group not found');
  });

  it('requires the Ticket to belong to an assigned Event', async () => {
    prismaMock.ticket.findFirst.mockResolvedValue({
      id: 'ticket-1',
      credentialSelector: 'a'.repeat(32),
      credentialKeyId: 'local-v1',
      legacyCredentialHash: 'legacy-hash',
    });

    await service.assertTicketAccessByToken('secure-token', assignedStaff);

    expect(prismaMock.ticket.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          legacyCredentialHash: 'legacy-hash',
          booking: { event: expect.any(Object) },
        }),
      }),
    );
  });

  it('does not reveal a Ticket from an inaccessible Event', async () => {
    prismaMock.event.findFirst.mockResolvedValue(null);

    await expect(
      service.assertTicketAccessById('ticket-1', assignedStaff),
    ).rejects.toThrow('Ticket not found');
  });
});
