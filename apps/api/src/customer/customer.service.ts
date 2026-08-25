import { Injectable } from '@nestjs/common';
import {
  AccessControlService,
  AuthenticatedAccessContext,
} from '../access-control/access-control.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControl: AccessControlService,
  ) {}

  findAll(access: AuthenticatedAccessContext) {
    const eventWhere = this.accessControl.eventWhere(access);
    return this.prisma.customer.findMany({
      where: {
        bookings: {
          some: {
            event: eventWhere,
          },
        },
      },
      include: {
        bookings: {
          where: {
            event: eventWhere,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findOne(access: AuthenticatedAccessContext, id: string) {
    const eventWhere = this.accessControl.eventWhere(access);
    return this.prisma.customer.findFirst({
      where: {
        id,
        bookings: {
          some: {
            event: eventWhere,
          },
        },
      },
      include: {
        bookings: {
          where: {
            event: eventWhere,
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
