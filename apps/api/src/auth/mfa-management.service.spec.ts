import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { MfaCryptoService } from './mfa-crypto.service';
import { MfaManagementService } from './mfa-management.service';

describe('MfaManagementService', () => {
  const prisma = {
    userOrganization: { findUnique: jest.fn(), findUniqueOrThrow: jest.fn() },
    mfaFactor: { findMany: jest.fn(), updateMany: jest.fn() },
    mfaRecoveryCode: { updateMany: jest.fn(), createMany: jest.fn() },
    mfaChallenge: { updateMany: jest.fn(), findUnique: jest.fn() },
    authenticationSession: { updateMany: jest.fn() },
    mfaAudit: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  const crypto = {};
  let service: MfaManagementService;

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(
      (callback: (transaction: typeof prisma) => unknown) => callback(prisma),
    );
    const module = await Test.createTestingModule({
      providers: [
        MfaManagementService,
        { provide: PrismaService, useValue: prisma },
        { provide: MfaCryptoService, useValue: crypto },
      ],
    }).compile();
    service = module.get(MfaManagementService);
  });

  it('returns only non-sensitive membership-scoped status', async () => {
    prisma.userOrganization.findUnique.mockResolvedValue({
      role: 'OWNER',
      mfaFactors: [{ activatedAt: new Date('2031-01-01'), recoveryCodes: [{ id: 'one' }] }],
    });
    await expect(service.status('owner-1', 'organization-1')).resolves.toEqual({
      required: true,
      enrolled: true,
      activatedAt: new Date('2031-01-01'),
      remainingRecoveryCodes: 1,
    });
  });

  it.each(['OWNER', 'STAFF', 'SCANNER'])('does not permit OWNER reset authority over a %s target', async (role) => {
    prisma.userOrganization.findUnique.mockResolvedValue({ id: 'membership-1', role });
    await expect(
      service.resetManager('owner-1', 'organization-1', 'target-1', 'Lost device'),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('atomically revokes only the same-Organisation Manager authority and records the actor', async () => {
    prisma.userOrganization.findUnique.mockResolvedValue({ id: 'membership-1', role: 'MANAGER' });
    prisma.mfaFactor.findMany.mockResolvedValue([{ id: 'factor-1' }]);

    await expect(
      service.resetManager('owner-1', 'organization-1', 'manager-1', 'Lost device'),
    ).resolves.toEqual({ reset: true });

    expect(prisma.authenticationSession.updateMany).toHaveBeenCalledWith({
      where: { userId: 'manager-1', organizationId: 'organization-1', revokedAt: null },
      data: expect.objectContaining({ revokeReason: 'MFA_RESET_BY_OWNER' }),
    });
    expect(prisma.mfaAudit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: 'organization-1',
        actorUserId: 'owner-1',
        targetUserId: 'manager-1',
        action: 'MANAGER_FACTOR_RESET',
        metadata: { reason: 'Lost device' },
      }),
    });
  });
});
