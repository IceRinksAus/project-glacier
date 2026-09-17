import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  AccessControlService,
  AuthenticatedAccessContext,
} from '../access-control/access-control.service';
import { PrismaService } from '../prisma/prisma.service';
import { SearchCustomersQueryDto } from './dto/search-customers-query.dto';

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

  async search(
    access: AuthenticatedAccessContext,
    query: SearchCustomersQueryDto,
  ) {
    const eventWhere = this.accessControl.eventWhere(access);
    const bookingWhere: Prisma.BookingWhereInput = {
      event: eventWhere,
      ...(query.eventId ? { eventId: query.eventId } : {}),
    };
    const terms = query.search
      ? query.search.split(/\s+/).filter(Boolean).slice(0, 5)
      : [];
    const where: Prisma.CustomerWhereInput = {
      bookings: { some: bookingWhere },
      ...(terms.length
        ? {
            AND: terms.map((term) => ({
              OR: [
                { firstName: { contains: term, mode: 'insensitive' } },
                { lastName: { contains: term, mode: 'insensitive' } },
                { email: { contains: term, mode: 'insensitive' } },
                { phone: { contains: term, mode: 'insensitive' } },
              ],
            })),
          }
        : {}),
    };
    const skip = (query.page - 1) * query.pageSize;
    const [totalItems, customers] = await this.prisma.$transaction([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: query.pageSize,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          createdAt: true,
          _count: { select: { bookings: { where: bookingWhere } } },
          bookings: {
            where: bookingWhere,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: 1,
            select: {
              id: true,
              bookingNumber: true,
              createdAt: true,
              event: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ]);
    return {
      items: customers.map(({ _count, bookings, ...customer }) => ({
        ...customer,
        bookingCount: _count.bookings,
        latestBooking: bookings[0] ?? null,
      })),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / query.pageSize)),
      },
    };
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
