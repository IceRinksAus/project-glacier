import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TicketTypeService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.ticketType.findMany({
      include: {
        event: true,
      },
    });
  }

  create(data: {
    name: string;
    description?: string;
    price: number;
    capacity: number;
    active?: boolean;
    saleStart?: Date;
    saleEnd?: Date;
    eventId: string;
  }) {
    return this.prisma.ticketType.create({
      data,
    });
  }
}   