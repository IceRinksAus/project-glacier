import { Test, TestingModule } from '@nestjs/testing';

import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';

describe('CustomerController', () => {
  let controller: CustomerController;

  const serviceMock = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };
  const user = {
    organizationId: 'organization-1',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerController],
      providers: [
        {
          provide: CustomerService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<CustomerController>(CustomerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('uses trusted organization context for Customer lists', async () => {
    serviceMock.findAll.mockResolvedValue([]);

    await controller.findAll(user);

    expect(serviceMock.findAll).toHaveBeenCalledWith('organization-1');
  });

  it('uses trusted organization context for Customer detail', async () => {
    serviceMock.findOne.mockResolvedValue({ id: 'customer-1' });

    await controller.findOne('customer-1', user);

    expect(serviceMock.findOne).toHaveBeenCalledWith(
      'organization-1',
      'customer-1',
    );
  });
});
