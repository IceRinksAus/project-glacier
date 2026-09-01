import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { PrismaService } from '../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  sid: string;
  email: string;
  role: string | null;
  organizationId: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const jwtSecret = configService.getOrThrow<string>('JWT_SECRET');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub || !payload.sid || !payload.organizationId) {
      throw new UnauthorizedException('Authentication context is invalid');
    }

    const [session, membership] = await Promise.all([
      this.prisma.authenticationSession.findUnique({
        where: { id: payload.sid },
        select: {
          userId: true,
          organizationId: true,
          expiresAt: true,
          revokedAt: true,
        },
      }),
      this.prisma.userOrganization.findUnique({
        where: {
          userId_organizationId: {
            userId: payload.sub,
            organizationId: payload.organizationId,
          },
        },
        select: {
          role: true,
          accessScope: true,
          user: {
            select: {
              isActive: true,
            },
          },
          organization: {
            select: {
              status: true,
            },
          },
        },
      }),
    ]);

    if (
      !session ||
      session.userId !== payload.sub ||
      session.organizationId !== payload.organizationId ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      !membership ||
      !membership.user.isActive ||
      membership.organization.status !== 'ACTIVE'
    ) {
      throw new UnauthorizedException(
        'Authentication access is no longer active',
      );
    }

    return {
      userId: payload.sub,
      sessionId: payload.sid,
      email: payload.email,
      role: membership.role,
      accessScope: membership.accessScope,
      organizationId: payload.organizationId,
    };
  }
}
