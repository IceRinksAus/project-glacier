import { randomUUID } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as QRCode from 'qrcode';

import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { MfaChallengeDto } from './dto/mfa-challenge.dto';
import { MfaCryptoService } from './mfa-crypto.service';

const SESSION_MS = 8 * 60 * 60 * 1000;
const CHALLENGE_MS = 5 * 60 * 1000;
const PENDING_ENROLLMENT_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const PRIVILEGED_ROLES = new Set(['OWNER', 'MANAGER']);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mfaCrypto: MfaCryptoService,
  ) {}

  async login(input: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.trim().toLowerCase() },
      include: {
        organizations: { include: { organization: true } },
        eventRoles: true,
      },
    });
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('This user account is inactive');
    }
    if (!(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const membership = user.organizations[0];
    if (!membership) {
      throw new UnauthorizedException('Authentication access is not available');
    }
    if (!PRIVILEGED_ROLES.has(membership.role)) {
      return this.issuePasswordSession(user, membership);
    }

    const factor = await this.prisma.mfaFactor.findFirst({
      where: {
        userOrganizationId: membership.id,
        status: { in: ['ACTIVE', 'PENDING'] },
      },
      orderBy: { createdAt: 'desc' },
    });
    const challengeToken = this.mfaCrypto.generateChallengeToken();
    const commonChallenge = {
      tokenHash: this.mfaCrypto.hashChallengeToken(challengeToken),
      userOrganizationId: membership.id,
      expiresAt: new Date(Date.now() + CHALLENGE_MS),
    };

    if (factor?.status === 'ACTIVE') {
      await this.prisma.$transaction(async (tx) => {
        await this.consumeOutstandingChallenges(tx, membership.id);
        await this.cleanupChallenges(tx, membership.id, new Date());
        await tx.mfaChallenge.create({
          data: { ...commonChallenge, purpose: 'LOGIN', factorId: factor.id },
        });
      });
      return {
        status: 'MFA_REQUIRED',
        challengeToken,
        expiresAt: commonChallenge.expiresAt,
      };
    }

    const canReusePending = Boolean(
      factor?.status === 'PENDING' &&
      !input.restartMfaEnrollment &&
      factor.createdAt.getTime() > Date.now() - PENDING_ENROLLMENT_MS,
    );
    const secret = canReusePending
      ? this.mfaCrypto.decryptSecret(factor!)
      : this.mfaCrypto.generateSecret();
    const encrypted = this.mfaCrypto.encryptSecret(secret);
    let factorId = canReusePending ? factor!.id : '';
    await this.prisma.$transaction(async (tx) => {
      await this.consumeOutstandingChallenges(tx, membership.id);
      await this.cleanupChallenges(tx, membership.id, new Date());
      if (!canReusePending) {
        await tx.mfaFactor.updateMany({
          where: { userOrganizationId: membership.id, status: 'PENDING' },
          data: {
            status: 'REVOKED',
            revokedAt: new Date(),
            revokeReason: input.restartMfaEnrollment
              ? 'ENROLLMENT_RESTARTED'
              : 'ENROLLMENT_EXPIRED',
          },
        });
        const createdFactor = await tx.mfaFactor.create({
          data: { userOrganizationId: membership.id, ...encrypted },
        });
        factorId = createdFactor.id;
      }
      await tx.mfaChallenge.create({
        data: { ...commonChallenge, purpose: 'ENROLLMENT', factorId },
      });
      await tx.mfaAudit.create({
        data: {
          organizationId: membership.organizationId,
          actorUserId: user.id,
          targetUserId: user.id,
          action: canReusePending ? 'ENROLLMENT_RESUMED' : 'ENROLLMENT_STARTED',
        },
      });
    });
    const otpAuthUri = this.mfaCrypto.createOtpAuthUri(
      secret,
      user.email,
      membership.organization?.name,
    );
    return {
      status: 'MFA_ENROLLMENT_REQUIRED',
      challengeToken,
      expiresAt: commonChallenge.expiresAt,
      setup: {
        secret,
        otpAuthUri,
        qrCodeDataUrl: await QRCode.toDataURL(otpAuthUri, { margin: 1, width: 240 }),
      },
    };
  }

  async completeMfaChallenge(input: MfaChallengeDto) {
    const now = new Date();
    const challenge = await this.prisma.mfaChallenge.findUnique({
      where: { tokenHash: this.mfaCrypto.hashChallengeToken(input.challengeToken) },
      include: {
        factor: true,
        userOrganization: { include: { user: true, organization: true } },
      },
    });
    if (
      !challenge?.factor ||
      challenge.consumedAt ||
      challenge.expiresAt <= now ||
      challenge.attempts >= MAX_ATTEMPTS ||
      !challenge.userOrganization.user.isActive ||
      challenge.userOrganization.organization.status !== 'ACTIVE' ||
      !PRIVILEGED_ROLES.has(challenge.userOrganization.role)
    ) {
      throw this.invalidChallenge();
    }

    const factor = challenge.factor;
    const secret = this.mfaCrypto.decryptSecret(factor);
    const counter = /^\d{6}$/.test(input.code)
      ? this.mfaCrypto.verifyTotp(secret, input.code, now.getTime(), factor.lastUsedCounter)
      : null;
    const recovery = counter === null
      ? await this.prisma.mfaRecoveryCode.findUnique({
          where: { codeHash: this.mfaCrypto.hashRecoveryCode(input.code) },
        })
      : null;
    const usesRecovery = Boolean(
      recovery && recovery.factorId === factor.id && !recovery.usedAt,
    );
    if (counter === null && !usesRecovery) {
      await this.prisma.mfaChallenge.updateMany({
        where: { id: challenge.id, consumedAt: null, attempts: { lt: MAX_ATTEMPTS } },
        data: { attempts: { increment: 1 } },
      });
      throw this.invalidChallenge();
    }

    const generatedCodes = challenge.purpose === 'ENROLLMENT'
      ? this.mfaCrypto.generateRecoveryCodes()
      : [];
    const sessionId = randomUUID();
    await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.mfaChallenge.updateMany({
        where: {
          id: challenge.id,
          consumedAt: null,
          expiresAt: { gt: now },
          attempts: { lt: MAX_ATTEMPTS },
        },
        data: { consumedAt: now },
      });
      if (consumed.count !== 1) throw this.invalidChallenge();

      if (counter !== null) {
        const verified = await tx.mfaFactor.updateMany({
          where: {
            id: factor.id,
            status: challenge.purpose === 'ENROLLMENT' ? 'PENDING' : 'ACTIVE',
            OR: [{ lastUsedCounter: null }, { lastUsedCounter: { lt: counter } }],
          },
          data: {
            lastUsedCounter: counter,
            ...(challenge.purpose === 'ENROLLMENT'
              ? { status: 'ACTIVE', activatedAt: now }
              : {}),
          },
        });
        if (verified.count !== 1) throw this.invalidChallenge();
      } else if (recovery) {
        const used = await tx.mfaRecoveryCode.updateMany({
          where: { id: recovery.id, factorId: factor.id, usedAt: null },
          data: { usedAt: now },
        });
        if (used.count !== 1) throw this.invalidChallenge();
      }

      if (generatedCodes.length) {
        await tx.mfaRecoveryCode.createMany({
          data: generatedCodes.map((code) => ({
            factorId: factor.id,
            codeHash: this.mfaCrypto.hashRecoveryCode(code),
          })),
        });
      }
      await tx.authenticationSession.create({
        data: {
          id: sessionId,
          userId: challenge.userOrganization.userId,
          organizationId: challenge.userOrganization.organizationId,
          expiresAt: new Date(now.getTime() + SESSION_MS),
          mfaVerifiedAt: now,
          mfaMethod: usesRecovery ? 'RECOVERY_CODE' : 'TOTP',
          mfaFactorGeneration: factor.generation,
        },
      });
      await tx.mfaAudit.create({
        data: {
          organizationId: challenge.userOrganization.organizationId,
          actorUserId: challenge.userOrganization.userId,
          targetUserId: challenge.userOrganization.userId,
          action: challenge.purpose === 'ENROLLMENT'
            ? 'ENROLLMENT_COMPLETED'
            : usesRecovery
              ? 'RECOVERY_CODE_USED'
              : 'CHALLENGE_COMPLETED',
          metadata: { method: usesRecovery ? 'RECOVERY_CODE' : 'TOTP' },
        },
      });
    });

    try {
      return {
        ...(await this.signSession(
          challenge.userOrganization.user,
          challenge.userOrganization,
          sessionId,
        )),
        recoveryCodes: generatedCodes,
      };
    } catch (error) {
      await this.prisma.authenticationSession.delete({ where: { id: sessionId } });
      throw error;
    }
  }

  async revokeSession(userId: string, sessionId: string) {
    await this.prisma.authenticationSession.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date(), revokeReason: 'USER_LOGOUT' },
    });
    return { revoked: true };
  }

  async revokeAllSessions(userId: string) {
    await this.prisma.authenticationSession.updateMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      data: { revokedAt: new Date(), revokeReason: 'USER_REVOKE_ALL' },
    });
    return { revoked: true };
  }

  private async issuePasswordSession(user: any, membership: any) {
    const sessionId = randomUUID();
    await this.prisma.authenticationSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        organizationId: membership.organizationId,
        expiresAt: new Date(Date.now() + SESSION_MS),
      },
    });
    try {
      return await this.signSession(user, membership, sessionId);
    } catch (error) {
      await this.prisma.authenticationSession.delete({ where: { id: sessionId } });
      throw error;
    }
  }

  private async signSession(user: any, membership: any, sessionId: string) {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      sid: sessionId,
      email: user.email,
      role: membership.role,
      accessScope: membership.accessScope,
      organizationId: membership.organizationId,
    });
    return {
      status: 'AUTHENTICATED',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
        organizationId: membership.organizationId,
        role: membership.role,
        accessScope: membership.accessScope,
      },
    };
  }

  private consumeOutstandingChallenges(tx: any, membershipId: string) {
    return tx.mfaChallenge.updateMany({
      where: { userOrganizationId: membershipId, consumedAt: null },
      data: { consumedAt: new Date() },
    });
  }

  private cleanupChallenges(tx: any, membershipId: string, now: Date) {
    return tx.mfaChallenge.deleteMany({
      where: {
        userOrganizationId: membershipId,
        OR: [{ expiresAt: { lte: now } }, { consumedAt: { not: null } }],
      },
    });
  }

  private invalidChallenge() {
    return new UnauthorizedException('MFA challenge is invalid or expired');
  }
}
