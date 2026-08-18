import { Test, TestingModule } from '@nestjs/testing';

import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';

describe('CategoryController', () => {
  let controller: CategoryController;

  const serviceMock = {};

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [
          CategoryController,
        ],
        providers: [
          {
            provide: CategoryService,
            useValue: serviceMock,
          },
        ],
      }).compile();

    controller =
      module.get<CategoryController>(
        CategoryController,
      );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
