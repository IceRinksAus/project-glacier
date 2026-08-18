import { Test, TestingModule } from '@nestjs/testing';

import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';

describe('CustomerController', () => {
  let controller: CustomerController;

  const serviceMock = {};

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [
          CustomerController,
        ],
        providers: [
          {
            provide: CustomerService,
            useValue: serviceMock,
          },
        ],
      }).compile();

    controller =
      module.get<CustomerController>(
        CustomerController,
      );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
