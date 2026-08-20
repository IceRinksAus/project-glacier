import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organizationId: string) {
    return this.prisma.customer.findMany({
      where: {
        bookings: {
          some: {
            event: {
              organizationId,
            },
          },
        },
      },
      include: {
        bookings: {
          where: {
            event: {
              organizationId,
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findOne(organizationId: string, id: string) {
    return this.prisma.customer.findFirst({
      where: {
        id,
        bookings: {
          some: {
            event: {
              organizationId,
            },
          },
        },
      },
      include: {
        bookings: {
          where: {
            event: {
              organizationId,
            },
          },
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
