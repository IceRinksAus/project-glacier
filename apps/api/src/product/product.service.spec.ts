import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;

  const prismaMock = {
    product: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          ProductService,
          {
            provide: PrismaService,
            useValue: prismaMock,
          },
        ],
      }).compile();

    service =
      module.get<ProductService>(
        ProductService,
      );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('filters Product lists to the requested tenant Event', async () => {
    prismaMock.product.findMany.mockResolvedValue([]);

    await service.findAll('organization-1', 'event-1');

    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          eventId: 'event-1',
          event: {
            organizationId: 'organization-1',
          },
        },
      }),
    );
  });

  it('does not activate an online add-on without a Session assignment', async () => {
    prismaMock.product.findFirst.mockResolvedValue({
      id: 'product-1',
      productType: 'ADD_ON',
      availableOnline: true,
      variants: [],
      sessionProducts: [],
    });

    await expect(
      service.updateStatus('product-1', 'organization-1', 'ACTIVE'),
    ).rejects.toThrow(
      'An online add-on must be assigned to at least one Session before activation.',
    );
    expect(prismaMock.product.update).not.toHaveBeenCalled();
  });

  it('activates a configured tenant Product', async () => {
    prismaMock.product.findFirst.mockResolvedValue({
      id: 'product-1',
      productType: 'ADD_ON',
      availableOnline: true,
      variants: [
        {
          status: 'ACTIVE',
          availableOnline: true,
        },
      ],
      sessionProducts: [{ active: true }],
    });
    prismaMock.product.update.mockResolvedValue({
      id: 'product-1',
      status: 'ACTIVE',
    });

    await expect(
      service.updateStatus('product-1', 'organization-1', 'ACTIVE'),
    ).resolves.toEqual({
      id: 'product-1',
      status: 'ACTIVE',
    });
    expect(prismaMock.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'product-1' },
        data: { status: 'ACTIVE' },
      }),
    );
  });
});
