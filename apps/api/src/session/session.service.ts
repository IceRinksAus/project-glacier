import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    organizationId: string,
    createSessionDto: CreateSessionDto,
  ) {
    const {
      name,
      startDate,
      endDate,
      capacity,
      status,
      salesStart,
      salesEnd,
      eventId,
    } = createSessionDto;

    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        organizationId,
      },
    });

    if (!event) {
      throw new NotFoundException(
        'Event was not found in your organization.',
      );
    }

    const sessionStart = new Date(startDate);
    const sessionEnd = new Date(endDate);

    if (sessionEnd <= sessionStart) {
      throw new BadRequestException(
        'Session end date must be later than the start date.',
      );
    }

    if (
      sessionStart < event.startDate ||
      sessionEnd > event.endDate
    ) {
      throw new BadRequestException(
        'The session must occur within the event start and end dates.',
      );
    }

    const parsedSalesStart = salesStart
      ? new Date(salesStart)
      : null;

    const parsedSalesEnd = salesEnd
      ? new Date(salesEnd)
      : null;

    if (
      parsedSalesStart &&
      parsedSalesEnd &&
      parsedSalesEnd <= parsedSalesStart
    ) {
      throw new BadRequestException(
        'Sales end date must be later than the sales start date.',
      );
    }

    return this.prisma.session.create({
      data: {
        name: name.trim(),
        startDate: sessionStart,
        endDate: sessionEnd,
        capacity,
        status: status ?? 'DRAFT',
        salesStart: parsedSalesStart,
        salesEnd: parsedSalesEnd,
        eventId: event.id,
      },
      include: {
        event: true,
      },
    });
  }

findAll(
  organizationId: string,
  eventId?: string,
) {
  return this.prisma.session.findMany({
    where: {
      ...(eventId
        ? {
            eventId,
          }
        : {}),
      event: {
        organizationId,
      },
    },
      include: {
        event: true,
        _count: {
          select: {
            bookings: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });
  }

  async findOne(
    id: string,
    organizationId: string,
  ) {
    const session = await this.prisma.session.findFirst({
      where: {
        id,
        event: {
          organizationId,
        },
      },
      include: {
        event: true,
        bookings: {
          include: {
            customer: true,
            items: {
              include: {
                ticketType: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found.');
    }

    return session;
  }

  async update(
    id: string,
    organizationId: string,
    updateSessionDto: UpdateSessionDto,
  ) {
    const existingSession =
      await this.prisma.session.findFirst({
        where: {
          id,
          event: {
            organizationId,
          },
        },
        include: {
          event: true,
        },
      });

    if (!existingSession) {
      throw new NotFoundException('Session not found.');
    }

    const startDate = updateSessionDto.startDate
      ? new Date(updateSessionDto.startDate)
      : existingSession.startDate;

    const endDate = updateSessionDto.endDate
      ? new Date(updateSessionDto.endDate)
      : existingSession.endDate;

    if (endDate <= startDate) {
      throw new BadRequestException(
        'Session end date must be later than the start date.',
      );
    }

    if (
      startDate < existingSession.event.startDate ||
      endDate > existingSession.event.endDate
    ) {
      throw new BadRequestException(
        'The session must occur within the event start and end dates.',
      );
    }

    const salesStart =
      updateSessionDto.salesStart !== undefined
        ? new Date(updateSessionDto.salesStart)
        : existingSession.salesStart;

    const salesEnd =
      updateSessionDto.salesEnd !== undefined
        ? new Date(updateSessionDto.salesEnd)
        : existingSession.salesEnd;

    if (
      salesStart &&
      salesEnd &&
      salesEnd <= salesStart
    ) {
      throw new BadRequestException(
        'Sales end date must be later than the sales start date.',
      );
    }

    return this.prisma.session.update({
      where: {
        id: existingSession.id,
      },
      data: {
        name:
          updateSessionDto.name?.trim() ??
          existingSession.name,
        startDate,
        endDate,
        capacity:
          updateSessionDto.capacity ??
          existingSession.capacity,
        status:
          updateSessionDto.status ??
          existingSession.status,
        salesStart,
        salesEnd,
      },
      include: {
        event: true,
      },
    });
  }

  async remove(
    id: string,
    organizationId: string,
  ) {
    const session = await this.prisma.session.findFirst({
      where: {
        id,
        event: {
          organizationId,
        },
      },
      include: {
        bookings: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found.');
    }

    if (session.bookings.length > 0) {
      throw new BadRequestException(
        'This session cannot be deleted because it has bookings.',
      );
    }

    return this.prisma.session.delete({
      where: {
        id: session.id,
      },
    });
  }
}