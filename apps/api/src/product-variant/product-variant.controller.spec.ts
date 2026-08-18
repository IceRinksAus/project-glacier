import { Test, TestingModule } from '@nestjs/testing';

import { ProductVariantController } from './product-variant.controller';
import { ProductVariantService } from './product-variant.service';

describe('ProductVariantController', () => {
  let controller: ProductVariantController;

  const serviceMock = {};

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [
          ProductVariantController,
        ],
        providers: [
          {
            provide: ProductVariantService,
            useValue: serviceMock,
          },
        ],
      }).compile();

    controller =
      module.get<ProductVariantController>(
        ProductVariantController,
      );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
