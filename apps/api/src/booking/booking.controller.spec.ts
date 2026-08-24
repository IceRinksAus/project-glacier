import { Test, TestingModule } from '@nestjs/testing';

import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';

describe('BookingController', () => {
  let controller: BookingController;

  const serviceMock = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findPaymentInvestigation:
      jest.fn(),
    reconcilePayment: jest.fn(),
  };
  const user = {
    userId: 'user-1',
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

  it('uses trusted organization context for payment investigation', async () => {
    serviceMock.findPaymentInvestigation.mockResolvedValue({
      id: 'booking-1',
    });

    await controller.findPaymentInvestigation(
      'booking-1',
      user,
    );

    expect(
      serviceMock.findPaymentInvestigation,
    ).toHaveBeenCalledWith(
      'organization-1',
      'booking-1',
    );
  });

  it('uses trusted user and organization context for payment reconciliation', async () => {
    serviceMock.reconcilePayment.mockResolvedValue({});

    await controller.reconcilePayment(
      'booking-1',
      user,
    );

    expect(
      serviceMock.reconcilePayment,
    ).toHaveBeenCalledWith(
      'organization-1',
      'user-1',
      'booking-1',
    );
  });

  it('restricts payment operations to OWNER', () => {
    expect(
      Reflect.getMetadata(
        ROLES_KEY,
        controller.findPaymentInvestigation,
      ),
    ).toEqual(['OWNER']);

    expect(
      Reflect.getMetadata(
        ROLES_KEY,
        controller.reconcilePayment,
      ),
    ).toEqual(['OWNER']);
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
