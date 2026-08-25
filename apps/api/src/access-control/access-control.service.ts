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

  async assertEventGroupAccess(
    eventGroupId: string,
    access: AuthenticatedAccessContext,
  ): Promise<void> {
    const group = await this.prisma.eventGroup.findFirst({
      where: {
        id: eventGroupId,
        organizationId: access.organizationId,
      },
      select: {
        events: {
          select: {
            eventId: true,
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Event Group not found');
    }

    const eventIds = group.events.map(({ eventId }) => eventId);

    if (eventIds.length === 0) {
      return;
    }

    const accessibleCount = await this.prisma.event.count({
      where: this.eventWhere(access, {
        id: { in: eventIds },
      }),
    });

    if (accessibleCount !== eventIds.length) {
      throw new NotFoundException('Event Group not found');
    }
  }
}
