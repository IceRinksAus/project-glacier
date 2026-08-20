import { Test, TestingModule } from '@nestjs/testing';

import { ProductController } from './product.controller';
import { ProductService } from './product.service';

describe('ProductController', () => {
  let controller: ProductController;

  const serviceMock = {
    findAll: jest.fn(),
    updateStatus: jest.fn(),
  };

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

  it('passes trusted Organisation and optional Event filter to the service', () => {
    controller.findAll(
      {
        userId: 'user-1',
        email: 'owner@example.com',
        role: 'OWNER',
        organizationId: 'organization-1',
      },
      { eventId: 'event-1' },
    );

    expect(serviceMock.findAll).toHaveBeenCalledWith(
      'organization-1',
      'event-1',
    );
  });

  it('passes Product status changes through trusted Organisation scope', () => {
    controller.updateStatus(
      'product-1',
      {
        userId: 'user-1',
        email: 'owner@example.com',
        role: 'OWNER',
        organizationId: 'organization-1',
      },
      { status: 'ACTIVE' },
    );

    expect(serviceMock.updateStatus).toHaveBeenCalledWith(
      'product-1',
      'organization-1',
      'ACTIVE',
    );
  });
});
