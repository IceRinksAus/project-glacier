import { randomUUID } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

const AUTHENTICATION_SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const email = loginDto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        organizations: true,
        eventRoles: true,
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('This user account is inactive');
    }

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const primaryOrganization = user.organizations[0] ?? null;

    if (!primaryOrganization) {
      throw new UnauthorizedException('Authentication access is not available');
    }

    const sessionId = randomUUID();
    await this.prisma.authenticationSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        organizationId: primaryOrganization.organizationId,
        expiresAt: new Date(Date.now() + AUTHENTICATION_SESSION_DURATION_MS),
      },
    });

    const payload = {
      sub: user.id,
      sid: sessionId,
      email: user.email,
      role: primaryOrganization?.role ?? null,
      accessScope: primaryOrganization?.accessScope ?? null,
      organizationId: primaryOrganization.organizationId,
    };
    let accessToken: string;
    try {
      accessToken = await this.jwtService.signAsync(payload);
    } catch (error) {
      await this.prisma.authenticationSession.delete({
        where: { id: sessionId },
      });
      throw error;
    }

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
        organizationId: primaryOrganization?.organizationId ?? null,
        role: primaryOrganization?.role ?? null,
        accessScope: primaryOrganization?.accessScope ?? null,
      },
    };
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
}
