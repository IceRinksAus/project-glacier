import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  OrganizationAccessScope,
  OrganizationRole,
} from '../auth/roles/organization-role';
import { PrismaService } from '../prisma/prisma.service';

export interface AuthenticatedAccessContext {
  userId: string;
  organizationId: string;
  role: OrganizationRole;
  accessScope: OrganizationAccessScope;
}

@Injectable()
export class AccessControlService {
  constructor(private readonly prisma: PrismaService) {}

  eventWhere(
    access: AuthenticatedAccessContext,
    additionalWhere: Prisma.EventWhereInput = {},
  ): Prisma.EventWhereInput {
    const eventAssignment =
      access.role === 'OWNER' || access.accessScope === 'ALL_EVENTS'
        ? {}
        : {
            userAccess: {
              some: {
                userId: access.userId,
              },
            },
          };

    return {
      AND: [
        { organizationId: access.organizationId },
        eventAssignment,
        additionalWhere,
      ],
    };
  }

  async assertEventAccess(
    eventId: string,
    access: AuthenticatedAccessContext,
  ): Promise<void> {
    const event = await this.prisma.event.findFirst({
      where: this.eventWhere(access, { id: eventId }),
      select: {
        id: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }
  }
}
