import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../prisma/prisma.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const prismaMock = {
    userOrganization: {
      findUnique: jest.fn(),
    },
  };

  const strategy = new JwtStrategy(
    {
      getOrThrow: jest.fn().mockReturnValue('test-jwt-secret'),
    } as unknown as ConfigService,
    prismaMock as unknown as PrismaService,
  );

  const payload = {
    sub: 'user-1',
    email: 'operator@example.com',
    role: 'OWNER',
    organizationId: 'organization-1',
  };

  beforeEach(() => jest.clearAllMocks());

  it('uses the current membership role and scope rather than stale JWT values', async () => {
    prismaMock.userOrganization.findUnique.mockResolvedValue({
      role: 'STAFF',
      accessScope: 'ASSIGNED_EVENTS',
      user: { isActive: true },
      organization: { status: 'ACTIVE' },
    });

    await expect(strategy.validate(payload)).resolves.toEqual({
      userId: 'user-1',
      email: 'operator@example.com',
      role: 'STAFF',
      accessScope: 'ASSIGNED_EVENTS',
      organizationId: 'organization-1',
    });
  });

  it('rejects removed memberships', async () => {
    prismaMock.userOrganization.findUnique.mockResolvedValue(null);

    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects inactive users and organizations', async () => {
    prismaMock.userOrganization.findUnique.mockResolvedValue({
      role: 'MANAGER',
      accessScope: 'ALL_EVENTS',
      user: { isActive: false },
      organization: { status: 'ACTIVE' },
    });

    await expect(strategy.validate(payload)).rejects.toThrow(
      'Authentication access is no longer active',
    );

    prismaMock.userOrganization.findUnique.mockResolvedValue({
      role: 'MANAGER',
      accessScope: 'ALL_EVENTS',
      user: { isActive: true },
      organization: { status: 'ARCHIVED' },
    });

    await expect(strategy.validate(payload)).rejects.toThrow(
      'Authentication access is no longer active',
    );
  });

  it('rejects tokens without an organization context', async () => {
    await expect(
      strategy.validate({ ...payload, organizationId: null }),
    ).rejects.toThrow('Authentication context is invalid');
    expect(prismaMock.userOrganization.findUnique).not.toHaveBeenCalled();
  });
});
