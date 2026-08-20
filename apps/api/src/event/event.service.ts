import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { UpdateEntryPolicyDto } from './dto/update-entry-policy.dto';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organizationId: string) {
    return this.prisma.event.findMany({
      where: {
        organizationId,
      },
    });
  }

  async findOne(id: string, organizationId: string) {
    const event = await this.prisma.event.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  create(organizationId: string, data: CreateEventDto) {
    return this.prisma.event.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        organizationId,
        entryOpensMinutesBeforeStart: data.entryOpensMinutesBeforeStart,
        entryClosesMinutesAfterEnd: data.entryClosesMinutesAfterEnd,
      },
    });
  }

  async updateStatus(id: string, organizationId: string, status: string) {
    const allowedStatuses = ['DRAFT', 'ACTIVE', 'INACTIVE'];

    if (!allowedStatuses.includes(status)) {
      throw new BadRequestException(
        `Event status must be one of: ${allowedStatuses.join(', ')}`,
      );
    }

    const event = await this.prisma.event.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return this.prisma.event.update({
      where: {
        id: event.id,
      },
      data: {
        status,
      },
    });
  }

  async remove(id: string, organizationId: string) {
    const event = await this.prisma.event.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        sessions: true,
        bookings: true,
        ticketTypes: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.sessions.length > 0) {
      throw new BadRequestException(
        'This event cannot be deleted because it has sessions',
      );
    }

    if (event.bookings.length > 0) {
      throw new BadRequestException(
        'This event cannot be deleted because it has bookings',
      );
    }

    if (event.ticketTypes.length > 0) {
      throw new BadRequestException(
        'This event cannot be deleted because it has ticket types',
      );
    }

    return this.prisma.event.delete({
      where: {
        id: event.id,
      },
    });
  }

  async updateEntryPolicy(
    id: string,
    organizationId: string,
    data: UpdateEntryPolicyDto,
  ) {
    const event = await this.prisma.event.findFirst({
      where: { id, organizationId },
      select: { id: true },
    });

    if (!event) throw new NotFoundException('Event not found');

    return this.prisma.event.update({
      where: { id: event.id },
      data: {
        entryOpensMinutesBeforeStart: data.entryOpensMinutesBeforeStart,
        entryClosesMinutesAfterEnd: data.entryClosesMinutesAfterEnd,
      },
      select: {
        id: true,
        entryOpensMinutesBeforeStart: true,
        entryClosesMinutesAfterEnd: true,
      },
    });
  }
}
