import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto';
import { UpdateTicketTypePresentationDto } from './dto/update-ticket-type-presentation.dto';
import { UpdateTicketTypeAgePolicyDto } from './dto/update-ticket-type-age-policy.dto';

@Injectable()
export class TicketTypeService {
  constructor(private prisma: PrismaService) {}

  findAll(organizationId: string, eventId?: string) {
    return this.prisma.ticketType.findMany({
      where: {
        ...(eventId ? { eventId } : {}),
        event: {
          organizationId,
        },
      },
      include: {
        event: true,
        imageAsset: {
          select: {
            id: true,
            displayName: true,
            width: true,
            height: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async create(organizationId: string, data: CreateTicketTypeDto) {
    this.assertValidAgePolicy(data.minimumAge, data.maximumAge);
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
        capacity: data.capacity ?? 0,
        saleStart: data.saleStart ? new Date(data.saleStart) : undefined,
        saleEnd: data.saleEnd ? new Date(data.saleEnd) : undefined,
      },
    });
  }

  async updateAgePolicy(
    organizationId: string,
    id: string,
    data: UpdateTicketTypeAgePolicyDto,
  ) {
    this.assertValidAgePolicy(data.minimumAge, data.maximumAge);
    const ticketType = await this.prisma.ticketType.findFirst({
      where: { id, event: { organizationId } },
      select: { id: true },
    });
    if (!ticketType) throw new NotFoundException('Ticket Type not found');
    return this.prisma.ticketType.update({
      where: { id },
      data: {
        minimumAge: data.minimumAge ?? null,
        maximumAge: data.maximumAge ?? null,
      },
    });
  }

  private assertValidAgePolicy(
    minimumAge?: number | null,
    maximumAge?: number | null,
  ) {
    if (minimumAge != null && maximumAge != null && minimumAge > maximumAge) {
      throw new BadRequestException(
        'Minimum age must not be greater than maximum age',
      );
    }
  }

  async updatePresentation(
    organizationId: string,
    id: string,
    data: UpdateTicketTypePresentationDto,
  ) {
    const ticketType = await this.prisma.ticketType.findFirst({
      where: { id, event: { organizationId } },
      select: { id: true },
    });
    if (!ticketType) throw new NotFoundException('Ticket Type not found');
    return this.prisma.ticketType.update({
      where: { id },
      data: {
        tileLabel: data.tileLabel?.trim() || null,
        tileColor: data.tileColor.toUpperCase(),
      },
    });
  }
}
