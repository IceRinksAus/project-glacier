import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;

  const prismaMock = {
    product: {
      findMany: jest.fn(),
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
});
