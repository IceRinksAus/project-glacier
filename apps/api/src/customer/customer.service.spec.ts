import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { CustomerService } from './customer.service';
import { AccessControlService } from '../access-control/access-control.service';

describe('CustomerService', () => {
  let service: CustomerService;

  const ownerAccess = {
    userId: 'user-1',
    organizationId: 'organization-1',
    role: 'OWNER' as const,
    accessScope: 'ALL_EVENTS' as const,
  };

  const prismaMock = {
    customer: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((operations: Array<Promise<unknown>>) =>
      Promise.all(operations),
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        {
          provide: AccessControlService,
          useValue: {
            eventWhere: ({ organizationId }: typeof ownerAccess) => ({
              organizationId,
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<CustomerService>(CustomerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('lists only customers with Bookings in the authenticated organization', async () => {
    prismaMock.customer.findMany.mockResolvedValue([]);

    await service.findAll(ownerAccess);

    expect(prismaMock.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          bookings: {
            some: {
              event: {
                organizationId: 'organization-1',
              },
            },
          },
        },
        include: {
          bookings: {
            where: {
              event: {
                organizationId: 'organization-1',
              },
            },
          },
        },
      }),
    );
  });

  it('tenant-scopes Customer detail and nested Bookings', async () => {
    prismaMock.customer.findFirst.mockResolvedValue(null);

    await service.findOne(ownerAccess, 'customer-2');

    expect(prismaMock.customer.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'customer-2',
          bookings: {
            some: {
              event: {
                organizationId: 'organization-1',
              },
            },
          },
        },
        include: expect.objectContaining({
          bookings: expect.objectContaining({
            where: {
              event: {
                organizationId: 'organization-1',
              },
            },
          }),
        }),
      }),
    );
  });

  it('searches and paginates only Customers with authorised Event Bookings', async () => {
    prismaMock.customer.count.mockResolvedValue(1);
    prismaMock.customer.findMany.mockResolvedValue([
      {
        id: 'customer-1',
        firstName: 'Taylor',
        lastName: 'Example',
        email: 'taylor@example.test',
        phone: null,
        createdAt: new Date('2026-09-01T00:00:00Z'),
        _count: { bookings: 2 },
        bookings: [
          {
            id: 'booking-1',
            bookingNumber: 'GLA-TEST-1',
            createdAt: new Date('2026-09-02T00:00:00Z'),
            event: { id: 'event-1', name: 'Fictional Festival' },
          },
        ],
      },
    ]);

    const result = await service.search(ownerAccess, {
      search: 'Taylor Example',
      eventId: 'event-1',
      page: 1,
      pageSize: 25,
    });

    expect(prismaMock.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          bookings: {
            some: {
              event: { organizationId: 'organization-1' },
              eventId: 'event-1',
            },
          },
        }),
        take: 25,
        skip: 0,
      }),
    );
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        id: 'customer-1',
        bookingCount: 2,
        latestBooking: expect.objectContaining({ id: 'booking-1' }),
      }),
    );
  });
});
