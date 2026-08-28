import { Injectable, ServiceUnavailableException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  liveness() {
    return {
      status: 'ok' as const,
    };
  }

  async readiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'ready' as const,
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'not_ready',
      });
    }
  }
}
