import { Test, TestingModule } from '@nestjs/testing';

import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';

describe('BookingController', () => {
  let controller: BookingController;

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
      controllers: [BookingController],
      providers: [
        {
          provide: BookingService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<BookingController>(BookingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('uses trusted organization context for Booking lists', async () => {
    serviceMock.findAll.mockResolvedValue([]);

    await controller.findAll(user);

    expect(serviceMock.findAll).toHaveBeenCalledWith('organization-1');
  });

  it('uses trusted organization context for Booking detail', async () => {
    serviceMock.findOne.mockResolvedValue({ id: 'booking-1' });

    await controller.findOne('booking-1', user);

    expect(serviceMock.findOne).toHaveBeenCalledWith(
      'organization-1',
      'booking-1',
    );
  });
});
