import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;

  const transactionMock = {
    user: {
      create: jest.fn(),
    },
    userOrganization: {
      create: jest.fn(),
    },
  };
  const prismaMock = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(
      (callback: (transaction: typeof transactionMock) => unknown) =>
        callback(transactionMock),
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('lists only users in the authenticated organization', async () => {
    prismaMock.user.findMany.mockResolvedValue([]);

    await service.findAll('organization-1');

    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizations: {
            some: {
              organizationId: 'organization-1',
            },
          },
        },
      }),
    );
  });

  it('creates membership only in the authenticated organization', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.organization.findUnique.mockResolvedValue({
      id: 'organization-1',
    });
    transactionMock.user.create.mockResolvedValue({
      id: 'user-1',
      email: 'member@example.com',
      name: 'Member User',
      isActive: true,
      createdAt: new Date(),
    });
    transactionMock.userOrganization.create.mockResolvedValue({
      organizationId: 'organization-1',
      role: 'MEMBER',
    });

    await service.create('organization-1', {
      email: 'member@example.com',
      name: 'Member User',
      password: 'secure-password',
      role: 'MEMBER',
    });

    expect(prismaMock.organization.findUnique).toHaveBeenCalledWith({
      where: {
        id: 'organization-1',
      },
    });
    expect(transactionMock.userOrganization.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        organizationId: 'organization-1',
        role: 'MEMBER',
      },
    });
  });
});
