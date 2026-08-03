import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.customer.findMany({
      include: {
        bookings: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.customer.findUnique({
      where: {
        id,
      },
      include: {
        bookings: {
          include: {
            event: true,
            items: {
              include: {
                ticketType: true,
              },
            },
          },
        },
      },
    });
  }

  create(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  }) {
    return this.prisma.customer.create({
      data,
    });
  }
}