import { Test, TestingModule } from '@nestjs/testing';

import { ProductController } from './product.controller';
import { ProductService } from './product.service';

describe('ProductController', () => {
  let controller: ProductController;

  const serviceMock = {};

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [
          ProductController,
        ],
        providers: [
          {
            provide: ProductService,
            useValue: serviceMock,
          },
        ],
      }).compile();

    controller =
      module.get<ProductController>(
        ProductController,
      );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
