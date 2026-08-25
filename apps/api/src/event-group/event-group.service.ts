import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateEventGroupDto } from './dto/create-event-group.dto';
import { UpdateEventGroupDto } from './dto/update-event-group.dto';
import { UpdateEventGroupEventsDto } from './dto/update-event-group-events.dto';

@Injectable()
export class EventGroupService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organizationId: string) {
    return this.prisma.eventGroup.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        events: {
          select: {
            sortOrder: true,
            event: {
              select: {
                id: true,
                name: true,
                slug: true,
                status: true,
                startDate: true,
                endDate: true,
                timezone: true,
              },
            },
          },
          orderBy: [{ sortOrder: 'asc' }, { eventId: 'asc' }],
        },
      },
      orderBy: [{ status: 'asc' }, { name: 'asc' }, { id: 'asc' }],
      take: 100,
    });
  }

  async create(organizationId: string, data: CreateEventGroupDto) {
    const name = data.name.trim();
    await this.requireUniqueName(organizationId, name);
    return this.prisma.eventGroup.create({
      data: {
        organizationId,
        name,
        description: data.description?.trim() || null,
        type: data.type,
      },
    });
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdateEventGroupDto,
  ) {
    await this.requireGroup(organizationId, id);
    const name = data.name?.trim();
    if (name) await this.requireUniqueName(organizationId, name, id);
    return this.prisma.eventGroup.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(data.description !== undefined
          ? { description: data.description.trim() || null }
          : {}),
        ...(data.type ? { type: data.type } : {}),
        ...(data.status ? { status: data.status } : {}),
      },
    });
  }

  async replaceEvents(
    organizationId: string,
    id: string,
    data: UpdateEventGroupEventsDto,
  ) {
    await this.requireGroup(organizationId, id);
    const events = await this.prisma.event.findMany({
      where: { organizationId, id: { in: data.eventIds } },
      select: { id: true },
    });
    if (events.length !== data.eventIds.length) {
      throw new NotFoundException('One or more Events were not found.');
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.eventGroupEvent.deleteMany({
        where: { eventGroupId: id },
      });
      if (data.eventIds.length > 0) {
        await transaction.eventGroupEvent.createMany({
          data: data.eventIds.map((eventId, sortOrder) => ({
            eventGroupId: id,
            eventId,
            sortOrder,
          })),
        });
      }
    });
    return this.findOne(organizationId, id);
  }

  async findOne(organizationId: string, id: string) {
    const group = await this.prisma.eventGroup.findFirst({
      where: { id, organizationId },
      include: {
        events: {
          select: {
            sortOrder: true,
            event: {
              select: {
                id: true,
                name: true,
                slug: true,
                status: true,
                startDate: true,
                endDate: true,
                timezone: true,
              },
            },
          },
          orderBy: [{ sortOrder: 'asc' }, { eventId: 'asc' }],
        },
      },
    });
    if (!group) throw new NotFoundException('Event Group not found.');
    return group;
  }

  private async requireGroup(organizationId: string, id: string) {
    const group = await this.prisma.eventGroup.findFirst({
      where: { id, organizationId },
      select: { id: true },
    });
    if (!group) throw new NotFoundException('Event Group not found.');
    return group;
  }

  private async requireUniqueName(
    organizationId: string,
    name: string,
    excludeId?: string,
  ) {
    const duplicate = await this.prisma.eventGroup.findFirst({
      where: {
        organizationId,
        ...(excludeId ? { id: { not: excludeId } } : {}),
        name: { equals: name, mode: 'insensitive' },
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new ConflictException('An Event Group with this name exists.');
    }
  }
}
