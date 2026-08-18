import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { ProductVariantService } from './product-variant.service';

describe('ProductVariantService', () => {
  let service: ProductVariantService;

  const prismaMock = {};

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          ProductVariantService,
          {
            provide: PrismaService,
            useValue: prismaMock,
          },
        ],
      }).compile();

    service =
      module.get<ProductVariantService>(
        ProductVariantService,
      );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
