import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { CustomerService } from './customer.service';

describe('CustomerService', () => {
  let service: CustomerService;

  const prismaMock = {
    customer: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
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

    await service.findAll('organization-1');

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

    await service.findOne('organization-1', 'customer-2');

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
});
