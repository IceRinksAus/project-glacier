import { Prisma } from '@prisma/client';

import { BookingService } from './booking.service';
import { SearchBookingsQueryDto } from './dto/search-bookings-query.dto';

describe('BookingService search', () => {
  const ownerAccess = {
    userId: 'user-1',
    organizationId: 'organization-1',
    role: 'OWNER' as const,
    accessScope: 'ALL_EVENTS' as const,
  };
  const prisma = {
    $transaction: jest.fn(),
    booking: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };

  let service: BookingService;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new BookingService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
      {
        eventWhere: ({ organizationId }: typeof ownerAccess) => ({
          organizationId,
        }),
      } as never,
    );
  });

  it('searches name, email or Booking number inside the trusted tenant and filters by Session', async () => {
    prisma.$transaction.mockResolvedValue([
      1,
      [
        {
          id: 'booking-1',
          bookingNumber: 'PG-1234',
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          total: new Prisma.Decimal(74),
          createdAt: new Date(),
          customer: {
            firstName: 'Jamie',
            lastName: 'Stoller',
            email: 'jamie@example.com',
          },
          event: {
            id: 'event-1',
            name: 'Winter Festival',
          },
          session: {
            id: 'session-1',
            name: '10:00 session',
            startDate: new Date(),
          },
        },
      ],
    ]);

    const query = Object.assign(new SearchBookingsQueryDto(), {
      search: 'Jamie PG-1234',
      eventId: 'event-1',
      sessionId: 'session-1',
      bookingStatus: 'CONFIRMED' as const,
      paymentStatus: 'PAID' as const,
      sortBy: 'sessionStart' as const,
      sortDirection: 'asc' as const,
      page: 2,
      pageSize: 10,
    });

    const result = await service.search(ownerAccess, query);

    expect(prisma.booking.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        event: {
          organizationId: 'organization-1',
        },
        eventId: 'event-1',
        sessionId: 'session-1',
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        AND: expect.arrayContaining([
          expect.objectContaining({
            OR: expect.any(Array),
          }),
        ]),
      }),
    });

    expect(prisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
        orderBy: [
          {
            session: {
              startDate: 'asc',
            },
          },
          {
            id: 'asc',
          },
        ],
      }),
    );

    expect(result.items[0].total).toBe(74);
    expect(result.pagination).toEqual({
      page: 2,
      pageSize: 10,
      totalItems: 1,
      totalPages: 1,
    });
  });

  it('uses deterministic customer-name sorting and bounded defaults', async () => {
    prisma.$transaction.mockResolvedValue([0, []]);

    const query = new SearchBookingsQueryDto();
    query.sortBy = 'customerName';

    await service.search(ownerAccess, query);

    expect(prisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 25,
        orderBy: [
          {
            customer: {
              lastName: 'desc',
            },
          },
          {
            customer: {
              firstName: 'desc',
            },
          },
          {
            id: 'desc',
          },
        ],
      }),
    );
  });
});
