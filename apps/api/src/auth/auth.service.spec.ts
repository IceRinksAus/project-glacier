import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    user: { findUnique: jest.fn() },
    authenticationSession: {
      create: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
    },
  };
  const jwtServiceMock = { signAsync: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a persisted eight-hour session before signing the JWT', async () => {
    const now = new Date('2031-01-01T00:00:00.000Z');
    jest.spyOn(Date, 'now').mockReturnValue(now.getTime());
    const passwordHash = await bcrypt.hash('valid-password', 4);
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'owner@example.com',
      name: 'Owner',
      passwordHash,
      isActive: true,
      organizations: [
        {
          organizationId: 'organization-1',
          role: 'OWNER',
          accessScope: 'ALL_EVENTS',
        },
      ],
      eventRoles: [],
    });
    jwtServiceMock.signAsync.mockResolvedValue('signed-token');

    await expect(
      service.login({
        email: ' OWNER@example.com ',
        password: 'valid-password',
      }),
    ).resolves.toMatchObject({ accessToken: 'signed-token' });

    expect(prismaMock.authenticationSession.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        organizationId: 'organization-1',
        expiresAt: new Date('2031-01-01T08:00:00.000Z'),
      }),
    });
    expect(jwtServiceMock.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: 'user-1',
        sid: expect.any(String),
        organizationId: 'organization-1',
      }),
    );
  });

  it('removes the session if token signing fails', async () => {
    const passwordHash = await bcrypt.hash('valid-password', 4);
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'owner@example.com',
      name: 'Owner',
      passwordHash,
      isActive: true,
      organizations: [
        {
          organizationId: 'organization-1',
          role: 'OWNER',
          accessScope: 'ALL_EVENTS',
        },
      ],
      eventRoles: [],
    });
    jwtServiceMock.signAsync.mockRejectedValue(
      new Error('signing unavailable'),
    );

    await expect(
      service.login({ email: 'owner@example.com', password: 'valid-password' }),
    ).rejects.toThrow('signing unavailable');
    expect(prismaMock.authenticationSession.delete).toHaveBeenCalledWith({
      where: { id: expect.any(String) },
    });
  });

  it('revokes the current session or every active session without deleting evidence', async () => {
    await expect(service.revokeSession('user-1', 'session-1')).resolves.toEqual(
      { revoked: true },
    );
    expect(prismaMock.authenticationSession.updateMany).toHaveBeenCalledWith({
      where: { id: 'session-1', userId: 'user-1', revokedAt: null },
      data: { revokedAt: expect.any(Date), revokeReason: 'USER_LOGOUT' },
    });

    await expect(service.revokeAllSessions('user-1')).resolves.toEqual({
      revoked: true,
    });
    expect(
      prismaMock.authenticationSession.updateMany,
    ).toHaveBeenLastCalledWith({
      where: {
        userId: 'user-1',
        revokedAt: null,
        expiresAt: { gt: expect.any(Date) },
      },
      data: { revokedAt: expect.any(Date), revokeReason: 'USER_REVOKE_ALL' },
    });
  });
});
