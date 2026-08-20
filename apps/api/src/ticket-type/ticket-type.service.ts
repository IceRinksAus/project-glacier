import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto';

@Injectable()
export class TicketTypeService {
  constructor(private prisma: PrismaService) {}

  findAll(organizationId: string) {
    return this.prisma.ticketType.findMany({
      where: {
        event: {
          organizationId,
        },
      },
      include: {
        event: true,
      },
    });
  }

  async create(organizationId: string, data: CreateTicketTypeDto) {
    const event = await this.prisma.event.findFirst({
      where: {
        id: data.eventId,
        organizationId,
      },
      select: {
        id: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return this.prisma.ticketType.create({
      data: {
        ...data,
        saleStart: data.saleStart ? new Date(data.saleStart) : undefined,
        saleEnd: data.saleEnd ? new Date(data.saleEnd) : undefined,
      },
    });
  }
}
