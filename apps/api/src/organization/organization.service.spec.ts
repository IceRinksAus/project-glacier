import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { OrganizationService } from './organization.service';

describe('OrganizationService', () => {
  let service: OrganizationService;

  const prismaMock = {
    organization: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    userOrganization: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    userEventAccess: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    event: {
      count: jest.fn(),
    },
    organizationAccessAudit: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prismaMock.$transaction.mockImplementation(
      (callback: (transaction: typeof prismaMock) => unknown) =>
        callback(prismaMock),
    );
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<OrganizationService>(OrganizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('retrieves only the authenticated organization', async () => {
    prismaMock.organization.findUnique.mockResolvedValue({
      id: 'organization-1',
      name: 'Ice Rinks Australia',
    });

    await service.findCurrent('organization-1');

    expect(prismaMock.organization.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'organization-1',
        },
      }),
    );
  });

  it('rejects membership mutation for a different organization', async () => {
    await expect(
      service.addUser('organization-1', 'organization-2', 'owner-1', {
        userId: 'user-1',
        role: 'STAFF',
      }),
    ).rejects.toThrow(NotFoundException);
    expect(prismaMock.userOrganization.create).not.toHaveBeenCalled();
  });

  it('rejects membership mutation for an unknown user', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      service.addUser('organization-1', 'organization-1', 'owner-1', {
        userId: 'missing-user',
        role: 'STAFF',
      }),
    ).rejects.toThrow('User not found');
  });

  it('adds a validated user to the authenticated organization', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1' });
    prismaMock.userOrganization.create.mockResolvedValue({
      organizationId: 'organization-1',
      userId: 'user-1',
      role: 'STAFF',
    });

    await service.addUser('organization-1', 'organization-1', 'owner-1', {
      userId: 'user-1',
      role: 'STAFF',
    });

    expect(prismaMock.userOrganization.create).toHaveBeenCalledWith({
      data: {
        organizationId: 'organization-1',
        userId: 'user-1',
        role: 'STAFF',
        accessScope: 'ALL_EVENTS',
      },
    });
    expect(prismaMock.organizationAccessAudit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: 'owner-1',
        targetUserId: 'user-1',
        action: 'TEAM_MEMBER_ADDED',
      }),
    });
  });

  it('rejects an event assignment from another organization', async () => {
    prismaMock.userOrganization.findUnique.mockResolvedValue({
      id: 'membership-1',
      role: 'STAFF',
      accessScope: 'ALL_EVENTS',
      user: { id: 'user-1', eventAccess: [] },
    });
    prismaMock.event.count.mockResolvedValue(0);

    await expect(
      service.updateTeamAccess('organization-1', 'owner-1', 'user-1', {
        accessScope: 'ASSIGNED_EVENTS',
        eventIds: ['foreign-event'],
      }),
    ).rejects.toThrow(NotFoundException);
    expect(prismaMock.userOrganization.update).not.toHaveBeenCalled();
  });

  it('prevents the final owner from being demoted', async () => {
    prismaMock.userOrganization.findUnique.mockResolvedValue({
      id: 'membership-owner',
      role: 'OWNER',
      accessScope: 'ALL_EVENTS',
      user: { id: 'owner-1', eventAccess: [] },
    });
    prismaMock.userOrganization.count.mockResolvedValue(1);

    await expect(
      service.updateTeamAccess('organization-1', 'owner-1', 'owner-1', {
        role: 'MANAGER',
      }),
    ).rejects.toThrow(ConflictException);
    expect(prismaMock.userOrganization.update).not.toHaveBeenCalled();
  });

  it('replaces assignments and records immutable audit evidence', async () => {
    prismaMock.userOrganization.findUnique.mockResolvedValue({
      id: 'membership-1',
      role: 'STAFF',
      accessScope: 'ALL_EVENTS',
      user: { id: 'user-1', eventAccess: [] },
    });
    prismaMock.event.count.mockResolvedValue(1);
    prismaMock.userOrganization.findUniqueOrThrow.mockResolvedValue({
      id: 'membership-1',
      role: 'MANAGER',
      accessScope: 'ASSIGNED_EVENTS',
    });

    await service.updateTeamAccess('organization-1', 'owner-1', 'user-1', {
      role: 'MANAGER',
      accessScope: 'ASSIGNED_EVENTS',
      eventIds: ['event-1'],
    });

    expect(prismaMock.userEventAccess.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', event: { organizationId: 'organization-1' } },
    });
    expect(prismaMock.userEventAccess.createMany).toHaveBeenCalledWith({
      data: [{ eventId: 'event-1', userId: 'user-1' }],
    });
    expect(prismaMock.organizationAccessAudit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: 'owner-1',
        targetUserId: 'user-1',
        action: 'TEAM_ACCESS_UPDATED',
        before: expect.objectContaining({ role: 'STAFF' }),
        after: expect.objectContaining({
          role: 'MANAGER',
          eventIds: ['event-1'],
        }),
      }),
    });
  });
});
