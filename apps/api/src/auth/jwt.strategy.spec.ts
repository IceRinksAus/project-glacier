import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../prisma/prisma.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const prismaMock = {
    authenticationSession: {
      findUnique: jest.fn(),
    },
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
    sid: 'session-1',
    email: 'operator@example.com',
    role: 'OWNER',
    organizationId: 'organization-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.authenticationSession.findUnique.mockResolvedValue({
      userId: 'user-1',
      organizationId: 'organization-1',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    });
  });

  it('uses the current membership role and scope rather than stale JWT values', async () => {
    prismaMock.userOrganization.findUnique.mockResolvedValue({
      role: 'STAFF',
      accessScope: 'ASSIGNED_EVENTS',
      user: { isActive: true },
      organization: { status: 'ACTIVE' },
    });

    await expect(strategy.validate(payload)).resolves.toEqual({
      userId: 'user-1',
      sessionId: 'session-1',
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

  it('rejects missing, revoked, expired or mismatched sessions', async () => {
    prismaMock.userOrganization.findUnique.mockResolvedValue({
      role: 'OWNER',
      accessScope: 'ALL_EVENTS',
      user: { isActive: true },
      organization: { status: 'ACTIVE' },
    });

    for (const session of [
      null,
      {
        userId: 'user-1',
        organizationId: 'organization-1',
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: new Date(),
      },
      {
        userId: 'user-1',
        organizationId: 'organization-1',
        expiresAt: new Date(Date.now() - 1),
        revokedAt: null,
      },
      {
        userId: 'different-user',
        organizationId: 'organization-1',
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: null,
      },
    ]) {
      prismaMock.authenticationSession.findUnique.mockResolvedValueOnce(
        session,
      );
      await expect(strategy.validate(payload)).rejects.toThrow(
        'Authentication access is no longer active',
      );
    }
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
