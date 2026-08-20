import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

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

  async create(organizationId: string, data: CreateEventDto) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException('Event end must be after Event start.');
    }

    try {
      return await this.prisma.event.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          startDate,
          endDate,
          timezone: data.timezone,
          venueName: data.venueName,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2,
          suburb: data.suburb,
          postcode: data.postcode,
          country: data.country,
          jurisdiction: data.jurisdiction,
          activityType: data.activityType,
          organizationId,
          status: 'DRAFT',
          entryOpensMinutesBeforeStart: data.entryOpensMinutesBeforeStart,
          entryClosesMinutesAfterEnd: data.entryClosesMinutesAfterEnd,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'This Event URL is already in use. Choose a different slug.',
        );
      }

      throw error;
    }
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
