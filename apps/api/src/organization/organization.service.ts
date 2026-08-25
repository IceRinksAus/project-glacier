import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { defaultAccessScopeForRole } from '../auth/roles/organization-role';
import { AddOrganizationUserDto } from './dto/add-organization-user.dto';
import { UpdateTeamAccessDto } from './dto/update-team-access.dto';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) {}

  findCurrent(organizationId: string) {
    return this.prisma.organization.findUnique({
      where: {
        id: organizationId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        legalName: true,
        tradingName: true,
        abn: true,
        addressLine1: true,
        addressLine2: true,
        suburb: true,
        state: true,
        postcode: true,
        country: true,
        contactEmail: true,
        contactPhone: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  listTeam(organizationId: string) {
    return this.prisma.userOrganization.findMany({
      where: { organizationId },
      orderBy: [{ role: 'asc' }, { user: { name: 'asc' } }],
      select: {
        id: true,
        role: true,
        accessScope: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            eventAccess: {
              where: { event: { organizationId } },
              orderBy: { event: { startDate: 'asc' } },
              select: {
                event: {
                  select: {
                    id: true,
                    name: true,
                    startDate: true,
                    endDate: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async updateTeamAccess(
    organizationId: string,
    actorUserId: string,
    targetUserId: string,
    data: UpdateTeamAccessDto,
  ) {
    const membership = await this.prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: { userId: targetUserId, organizationId },
      },
      include: {
        user: {
          select: {
            id: true,
            eventAccess: {
              where: { event: { organizationId } },
              select: { eventId: true },
            },
          },
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Team member not found');
    }

    const role = data.role ?? membership.role;
    const accessScope =
      role === 'OWNER'
        ? 'ALL_EVENTS'
        : role === 'SCANNER'
          ? 'ASSIGNED_EVENTS'
          : (data.accessScope ?? membership.accessScope);
    const eventIds =
      accessScope === 'ALL_EVENTS'
        ? []
        : (data.eventIds ??
          membership.user.eventAccess.map(({ eventId }) => eventId));

    if (accessScope === 'ASSIGNED_EVENTS' && data.eventIds) {
      const matchingEvents = await this.prisma.event.count({
        where: { id: { in: eventIds }, organizationId },
      });
      if (matchingEvents !== eventIds.length) {
        throw new NotFoundException('One or more events were not found');
      }
    }

    const before = {
      role: membership.role,
      accessScope: membership.accessScope,
      eventIds: membership.user.eventAccess
        .map(({ eventId }) => eventId)
        .sort(),
    } satisfies Prisma.InputJsonObject;
    const after = {
      role,
      accessScope,
      eventIds: accessScope === 'ASSIGNED_EVENTS' ? [...eventIds].sort() : [],
    } satisfies Prisma.InputJsonObject;

    return this.prisma.$transaction(
      async (transaction) => {
        if (membership.role === 'OWNER' && role !== 'OWNER') {
          const ownerCount = await transaction.userOrganization.count({
            where: { organizationId, role: 'OWNER' },
          });
          if (ownerCount <= 1) {
            throw new ConflictException(
              'The organization must always retain at least one owner.',
            );
          }
        }

        await transaction.userOrganization.update({
          where: { id: membership.id },
          data: { role, accessScope },
        });
        await transaction.userEventAccess.deleteMany({
          where: { userId: targetUserId, event: { organizationId } },
        });
        if (after.eventIds.length > 0) {
          await transaction.userEventAccess.createMany({
            data: after.eventIds.map((eventId) => ({
              eventId,
              userId: targetUserId,
            })),
          });
        }
        await transaction.organizationAccessAudit.create({
          data: {
            organizationId,
            actorUserId,
            targetUserId,
            action: 'TEAM_ACCESS_UPDATED',
            before,
            after,
          },
        });

        return transaction.userOrganization.findUniqueOrThrow({
          where: { id: membership.id },
          select: {
            id: true,
            role: true,
            accessScope: true,
            user: {
              select: { id: true, name: true, email: true, isActive: true },
            },
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  async addUser(
    authenticatedOrganizationId: string,
    requestedOrganizationId: string,
    actorUserId: string,
    data: AddOrganizationUserDto,
  ) {
    if (requestedOrganizationId !== authenticatedOrganizationId) {
      throw new NotFoundException('Organization not found');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: data.userId,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const accessScope = defaultAccessScopeForRole(data.role);
    return this.prisma.$transaction(async (transaction) => {
      const membership = await transaction.userOrganization.create({
        data: {
          organizationId: authenticatedOrganizationId,
          userId: data.userId,
          role: data.role,
          accessScope,
        },
      });
      await transaction.organizationAccessAudit.create({
        data: {
          organizationId: authenticatedOrganizationId,
          actorUserId,
          targetUserId: data.userId,
          action: 'TEAM_MEMBER_ADDED',
          after: { role: data.role, accessScope, eventIds: [] },
        },
      });
      return membership;
    });
  }
}
