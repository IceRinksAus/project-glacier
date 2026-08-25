import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

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
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
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
      service.addUser('organization-1', 'organization-2', {
        userId: 'user-1',
        role: 'STAFF',
      }),
    ).rejects.toThrow(NotFoundException);
    expect(prismaMock.userOrganization.create).not.toHaveBeenCalled();
  });

  it('rejects membership mutation for an unknown user', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      service.addUser('organization-1', 'organization-1', {
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

    await service.addUser('organization-1', 'organization-1', {
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
  });
});
