import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

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

  create(
    organizationId: string,
    data: {
      name: string;
      slug: string;
      description?: string;
      startDate: string;
      endDate: string;
    },
  ) {
    return this.prisma.event.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        organizationId,
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
}