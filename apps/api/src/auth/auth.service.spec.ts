import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { MfaCryptoService } from './mfa-crypto.service';

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    user: { findUnique: jest.fn() },
    authenticationSession: {
      create: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
    },
    mfaFactor: {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
    },
    mfaChallenge: {
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    mfaAudit: { create: jest.fn() },
    mfaRecoveryCode: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const jwtServiceMock = { signAsync: jest.fn() };
  const mfaCryptoMock = {
    generateChallengeToken: jest.fn().mockReturnValue('c'.repeat(43)),
    hashChallengeToken: jest.fn().mockReturnValue('challenge-hash'),
    generateSecret: jest.fn().mockReturnValue('A'.repeat(32)),
    encryptSecret: jest.fn().mockReturnValue({
      encryptionKeyId: 'test-v1',
      encryptedSecret: 'encrypted',
      encryptionNonce: 'nonce',
      encryptionTag: 'tag',
    }),
    createOtpAuthUri: jest.fn().mockReturnValue('otpauth://test'),
    decryptSecret: jest.fn().mockReturnValue('A'.repeat(32)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prismaMock.$transaction.mockImplementation(
      (callback: (transaction: typeof prismaMock) => unknown) => callback(prismaMock),
    );
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
        {
          provide: MfaCryptoService,
          useValue: mfaCryptoMock,
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
          id: 'membership-1',
          organizationId: 'organization-1',
          role: 'STAFF',
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
          id: 'membership-1',
          organizationId: 'organization-1',
          role: 'STAFF',
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

  it('does not issue a privileged session before an active factor challenge', async () => {
    const passwordHash = await bcrypt.hash('valid-password', 4);
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1', email: 'owner@example.com', name: 'Owner', passwordHash,
      isActive: true,
      organizations: [{ id: 'membership-1', organizationId: 'organization-1', role: 'OWNER', accessScope: 'ALL_EVENTS' }],
      eventRoles: [],
    });
    prismaMock.mfaFactor.findFirst.mockResolvedValue({ id: 'factor-1', status: 'ACTIVE' });

    await expect(service.login({ email: 'owner@example.com', password: 'valid-password' }))
      .resolves.toMatchObject({ status: 'MFA_REQUIRED', challengeToken: 'c'.repeat(43) });
    expect(prismaMock.authenticationSession.create).not.toHaveBeenCalled();
    expect(jwtServiceMock.signAsync).not.toHaveBeenCalled();
  });

  it('starts controlled enrolment without issuing a privileged session', async () => {
    const passwordHash = await bcrypt.hash('valid-password', 4);
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1', email: 'owner@example.com', name: 'Owner', passwordHash,
      isActive: true,
      organizations: [{ id: 'membership-1', organizationId: 'organization-1', role: 'OWNER', accessScope: 'ALL_EVENTS' }],
      eventRoles: [],
    });
    prismaMock.mfaFactor.findFirst.mockResolvedValue(null);
    prismaMock.mfaFactor.create.mockResolvedValue({ id: 'factor-1' });

    await expect(service.login({ email: 'owner@example.com', password: 'valid-password' }))
      .resolves.toMatchObject({
        status: 'MFA_ENROLLMENT_REQUIRED',
        setup: { secret: 'A'.repeat(32) },
      });
    expect(prismaMock.authenticationSession.create).not.toHaveBeenCalled();
    expect(prismaMock.mfaAudit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'ENROLLMENT_STARTED' }),
    });
  });

  it('resumes a recent pending enrolment without replacing its factor', async () => {
    const now = new Date('2031-01-01T00:05:00.000Z');
    jest.spyOn(Date, 'now').mockReturnValue(now.getTime());
    const passwordHash = await bcrypt.hash('valid-password', 4);
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1', email: 'owner@example.com', name: 'Owner', passwordHash,
      isActive: true,
      organizations: [{
        id: 'membership-1', organizationId: 'organization-1', role: 'OWNER',
        accessScope: 'ALL_EVENTS', organization: { name: 'Example Rink' },
      }],
      eventRoles: [],
    });
    prismaMock.mfaFactor.findFirst.mockResolvedValue({
      id: 'factor-1', status: 'PENDING', createdAt: new Date('2031-01-01T00:00:00.000Z'),
    });

    await expect(service.login({ email: 'owner@example.com', password: 'valid-password' }))
      .resolves.toMatchObject({ status: 'MFA_ENROLLMENT_REQUIRED' });

    expect(mfaCryptoMock.decryptSecret).toHaveBeenCalled();
    expect(prismaMock.mfaFactor.create).not.toHaveBeenCalled();
    expect(prismaMock.mfaChallenge.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ factorId: 'factor-1' }),
    });
    expect(prismaMock.mfaAudit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'ENROLLMENT_RESUMED' }),
    });
  });

  it('explicitly restarts and revokes a pending enrolment', async () => {
    const now = new Date('2031-01-01T00:05:00.000Z');
    jest.spyOn(Date, 'now').mockReturnValue(now.getTime());
    const passwordHash = await bcrypt.hash('valid-password', 4);
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1', email: 'owner@example.com', name: 'Owner', passwordHash,
      isActive: true,
      organizations: [{
        id: 'membership-1', organizationId: 'organization-1', role: 'OWNER',
        accessScope: 'ALL_EVENTS', organization: { name: 'Example Rink' },
      }],
      eventRoles: [],
    });
    prismaMock.mfaFactor.findFirst.mockResolvedValue({
      id: 'factor-old', status: 'PENDING', createdAt: new Date('2031-01-01T00:00:00.000Z'),
    });
    prismaMock.mfaFactor.create.mockResolvedValue({ id: 'factor-new' });

    await service.login({
      email: 'owner@example.com', password: 'valid-password', restartMfaEnrollment: true,
    });

    expect(prismaMock.mfaFactor.updateMany).toHaveBeenCalledWith({
      where: { userOrganizationId: 'membership-1', status: 'PENDING' },
      data: expect.objectContaining({ revokeReason: 'ENROLLMENT_RESTARTED' }),
    });
    expect(prismaMock.mfaChallenge.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ factorId: 'factor-new' }),
    });
  });

  it('replaces an expired pending enrolment', async () => {
    const now = new Date('2031-01-01T00:11:00.000Z');
    jest.spyOn(Date, 'now').mockReturnValue(now.getTime());
    const passwordHash = await bcrypt.hash('valid-password', 4);
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1', email: 'owner@example.com', name: 'Owner', passwordHash,
      isActive: true,
      organizations: [{
        id: 'membership-1', organizationId: 'organization-1', role: 'OWNER',
        accessScope: 'ALL_EVENTS', organization: { name: 'Example Rink' },
      }],
      eventRoles: [],
    });
    prismaMock.mfaFactor.findFirst.mockResolvedValue({
      id: 'factor-old', status: 'PENDING', createdAt: new Date('2031-01-01T00:00:00.000Z'),
    });
    prismaMock.mfaFactor.create.mockResolvedValue({ id: 'factor-new' });

    await service.login({ email: 'owner@example.com', password: 'valid-password' });

    expect(prismaMock.mfaFactor.updateMany).toHaveBeenCalledWith({
      where: { userOrganizationId: 'membership-1', status: 'PENDING' },
      data: expect.objectContaining({ revokeReason: 'ENROLLMENT_EXPIRED' }),
    });
    expect(mfaCryptoMock.decryptSecret).not.toHaveBeenCalled();
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
