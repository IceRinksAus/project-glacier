import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as QRCode from 'qrcode';

import { PrismaService } from '../prisma/prisma.service';
import { MfaRotationConfirmDto, MfaSecurityActionDto } from './dto/mfa-management.dto';
import { MfaCryptoService } from './mfa-crypto.service';

@Injectable()
export class MfaManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: MfaCryptoService,
  ) {}

  async status(userId: string, organizationId: string) {
    const membership = await this.prisma.userOrganization.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
      select: {
        role: true,
        mfaFactors: {
          where: { status: 'ACTIVE' },
          select: {
            activatedAt: true,
            recoveryCodes: { where: { usedAt: null }, select: { id: true } },
          },
          take: 1,
        },
      },
    });
    if (!membership) throw new NotFoundException('Security settings not found');
    const factor = membership.mfaFactors[0];
    return {
      required: ['OWNER', 'MANAGER'].includes(membership.role),
      enrolled: Boolean(factor),
      activatedAt: factor?.activatedAt ?? null,
      remainingRecoveryCodes: factor?.recoveryCodes.length ?? 0,
    };
  }

  async regenerateCodes(
    userId: string,
    organizationId: string,
    input: MfaSecurityActionDto,
  ) {
    const verified = await this.verifySecurityAction(userId, organizationId, input);
    const codes = this.crypto.generateRecoveryCodes();
    await this.prisma.$transaction(async (tx) => {
      await tx.mfaRecoveryCode.updateMany({
        where: { factorId: verified.factorId, usedAt: null },
        data: { usedAt: new Date() },
      });
      await tx.mfaRecoveryCode.createMany({
        data: codes.map((code) => ({
          factorId: verified.factorId,
          codeHash: this.crypto.hashRecoveryCode(code),
        })),
      });
      await tx.mfaAudit.create({
        data: {
          organizationId,
          actorUserId: userId,
          targetUserId: userId,
          action: 'RECOVERY_CODES_REGENERATED',
        },
      });
    });
    return { recoveryCodes: codes };
  }

  async startRotation(
    userId: string,
    organizationId: string,
    input: MfaSecurityActionDto,
  ) {
    const verified = await this.verifySecurityAction(userId, organizationId, input);
    const secret = this.crypto.generateSecret();
    const encrypted = this.crypto.encryptSecret(secret);
    const challengeToken = this.crypto.generateChallengeToken();
    const expiresAt = new Date(Date.now() + 5 * 60_000);
    const membership = await this.prisma.userOrganization.findUniqueOrThrow({
      where: { userId_organizationId: { userId, organizationId } },
      select: { id: true, user: { select: { email: true } } },
    });
    await this.prisma.$transaction(async (tx) => {
      await tx.mfaChallenge.updateMany({
        where: { userOrganizationId: membership.id, purpose: 'ROTATION', consumedAt: null },
        data: { consumedAt: new Date() },
      });
      await tx.mfaFactor.updateMany({
        where: { userOrganizationId: membership.id, status: 'PENDING' },
        data: { status: 'REVOKED', revokedAt: new Date(), revokeReason: 'ROTATION_RESTARTED' },
      });
      const factor = await tx.mfaFactor.create({
        data: {
          userOrganizationId: membership.id,
          generation: verified.generation + 1,
          ...encrypted,
        },
      });
      await tx.mfaChallenge.create({
        data: {
          tokenHash: this.crypto.hashChallengeToken(challengeToken),
          purpose: 'ROTATION',
          userOrganizationId: membership.id,
          factorId: factor.id,
          expiresAt,
        },
      });
    });
    const otpAuthUri = this.crypto.createOtpAuthUri(secret, membership.user.email);
    return {
      challengeToken,
      expiresAt,
      setup: {
        secret,
        otpAuthUri,
        qrCodeDataUrl: await QRCode.toDataURL(otpAuthUri, { margin: 1, width: 240 }),
      },
    };
  }

  async confirmRotation(input: MfaRotationConfirmDto) {
    const now = new Date();
    const challenge = await this.prisma.mfaChallenge.findUnique({
      where: { tokenHash: this.crypto.hashChallengeToken(input.challengeToken) },
      include: { factor: true, userOrganization: true },
    });
    if (
      !challenge?.factor || challenge.purpose !== 'ROTATION' ||
      challenge.consumedAt || challenge.expiresAt <= now || challenge.attempts >= 5
    ) throw new UnauthorizedException('MFA rotation is invalid or expired');
    const factor = challenge.factor;
    const secret = this.crypto.decryptSecret(factor);
    const counter = this.crypto.verifyTotp(secret, input.code, now.getTime());
    if (counter === null) {
      await this.prisma.mfaChallenge.updateMany({
        where: { id: challenge.id, consumedAt: null, attempts: { lt: 5 } },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('MFA rotation is invalid or expired');
    }
    const codes = this.crypto.generateRecoveryCodes();
    await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.mfaChallenge.updateMany({
        where: { id: challenge.id, consumedAt: null, expiresAt: { gt: now }, attempts: { lt: 5 } },
        data: { consumedAt: now },
      });
      if (consumed.count !== 1) throw new UnauthorizedException('MFA rotation is invalid or expired');
      await tx.mfaFactor.updateMany({
        where: { userOrganizationId: challenge.userOrganizationId, status: 'ACTIVE' },
        data: { status: 'REVOKED', revokedAt: now, revokeReason: 'USER_ROTATED' },
      });
      const activated = await tx.mfaFactor.updateMany({
        where: { id: factor.id, status: 'PENDING' },
        data: { status: 'ACTIVE', activatedAt: now, lastUsedCounter: counter },
      });
      if (activated.count !== 1) throw new UnauthorizedException('MFA rotation is invalid or expired');
      await tx.mfaRecoveryCode.createMany({
        data: codes.map((code) => ({ factorId: factor.id, codeHash: this.crypto.hashRecoveryCode(code) })),
      });
      await tx.authenticationSession.updateMany({
        where: {
          userId: challenge.userOrganization.userId,
          organizationId: challenge.userOrganization.organizationId,
          revokedAt: null,
        },
        data: { revokedAt: now, revokeReason: 'MFA_FACTOR_ROTATED' },
      });
      await tx.mfaAudit.create({
        data: {
          organizationId: challenge.userOrganization.organizationId,
          actorUserId: challenge.userOrganization.userId,
          targetUserId: challenge.userOrganization.userId,
          action: 'FACTOR_ROTATED',
        },
      });
    });
    return { rotated: true, signInRequired: true, recoveryCodes: codes };
  }

  async resetManager(
    actorUserId: string,
    organizationId: string,
    targetUserId: string,
    reason: string,
  ) {
    const target = await this.prisma.userOrganization.findUnique({
      where: { userId_organizationId: { userId: targetUserId, organizationId } },
      select: { id: true, role: true },
    });
    if (!target || target.role !== 'MANAGER') {
      throw new NotFoundException('Team member MFA reset is not available');
    }
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      const factorIds = (await tx.mfaFactor.findMany({
        where: { userOrganizationId: target.id, status: { in: ['ACTIVE', 'PENDING'] } },
        select: { id: true },
      })).map(({ id }) => id);
      await tx.mfaRecoveryCode.updateMany({
        where: { factorId: { in: factorIds }, usedAt: null },
        data: { usedAt: now },
      });
      await tx.mfaFactor.updateMany({
        where: { id: { in: factorIds } },
        data: { status: 'REVOKED', revokedAt: now, revokeReason: 'OWNER_RESET' },
      });
      await tx.mfaChallenge.updateMany({
        where: { userOrganizationId: target.id, consumedAt: null },
        data: { consumedAt: now },
      });
      await tx.authenticationSession.updateMany({
        where: { userId: targetUserId, organizationId, revokedAt: null },
        data: { revokedAt: now, revokeReason: 'MFA_RESET_BY_OWNER' },
      });
      await tx.mfaAudit.create({
        data: {
          organizationId,
          actorUserId,
          targetUserId,
          action: 'MANAGER_FACTOR_RESET',
          metadata: { reason: reason.trim() },
        },
      });
    });
    return { reset: true };
  }

  private async verifySecurityAction(
    userId: string,
    organizationId: string,
    input: MfaSecurityActionDto,
  ) {
    const membership = await this.prisma.userOrganization.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
      include: { user: true, mfaFactors: { where: { status: 'ACTIVE' }, take: 1 } },
    });
    const factor = membership?.mfaFactors[0];
    if (!membership?.user.passwordHash || !factor ||
      !(await bcrypt.compare(input.password, membership.user.passwordHash))) {
      throw new UnauthorizedException('Security confirmation failed');
    }
    const secret = this.crypto.decryptSecret(factor);
    const counter = /^\d{6}$/.test(input.code)
      ? this.crypto.verifyTotp(secret, input.code, Date.now(), factor.lastUsedCounter)
      : null;
    if (counter !== null) {
      const updated = await this.prisma.mfaFactor.updateMany({
        where: { id: factor.id, OR: [{ lastUsedCounter: null }, { lastUsedCounter: { lt: counter } }] },
        data: { lastUsedCounter: counter },
      });
      if (updated.count === 1) return { factorId: factor.id, generation: factor.generation };
    } else {
      const used = await this.prisma.mfaRecoveryCode.updateMany({
        where: { factorId: factor.id, codeHash: this.crypto.hashRecoveryCode(input.code), usedAt: null },
        data: { usedAt: new Date() },
      });
      if (used.count === 1) return { factorId: factor.id, generation: factor.generation };
    }
    throw new UnauthorizedException('Security confirmation failed');
  }
}
