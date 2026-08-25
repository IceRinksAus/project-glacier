import { NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import {
  AccessControlService,
  AuthenticatedAccessContext,
} from './access-control.service';

describe('AccessControlService', () => {
  const prismaMock = {
    event: {
      findFirst: jest.fn(),
    },
  };

  const service = new AccessControlService(
    prismaMock as unknown as PrismaService,
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
});
