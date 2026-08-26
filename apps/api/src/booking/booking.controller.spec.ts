import { Test, TestingModule } from '@nestjs/testing';

import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';

describe('BookingController', () => {
  let controller: BookingController;

  const serviceMock = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findPaymentInvestigation: jest.fn(),
    reconcilePayment: jest.fn(),
    search: jest.fn(),
  };
  const user = {
    userId: 'user-1',
    organizationId: 'organization-1',
    role: 'OWNER' as const,
    accessScope: 'ALL_EVENTS' as const,
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

    await controller.findPaymentInvestigation('booking-1', user);

    expect(serviceMock.findPaymentInvestigation).toHaveBeenCalledWith(
      user,
      'booking-1',
    );
  });

  it('uses trusted user and organization context for payment reconciliation', async () => {
    serviceMock.reconcilePayment.mockResolvedValue({});

    await controller.reconcilePayment('booking-1', user);

    expect(serviceMock.reconcilePayment).toHaveBeenCalledWith(
      'organization-1',
      'user-1',
      'booking-1',
    );
  });

  it('allows scoped Managers to investigate while retaining OWNER-only reconciliation', () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, controller.findPaymentInvestigation),
    ).toEqual(['OWNER', 'MANAGER']);

    expect(Reflect.getMetadata(ROLES_KEY, controller.reconcilePayment)).toEqual(
      ['OWNER'],
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('uses trusted organization context for Booking lists', async () => {
    serviceMock.findAll.mockResolvedValue([]);

    await controller.findAll(user);

    expect(serviceMock.findAll).toHaveBeenCalledWith(user);
  });

  it('uses trusted organization context for bounded Booking search', async () => {
    const query = {
      search: 'Jamie',
      page: 1,
      pageSize: 25,
    } as never;

    serviceMock.search.mockResolvedValue({
      items: [],
    });

    await controller.search(user, query);

    expect(serviceMock.search).toHaveBeenCalledWith(user, query);
  });

  it('uses trusted organization context for Booking detail', async () => {
    serviceMock.findOne.mockResolvedValue({ id: 'booking-1' });

    await controller.findOne('booking-1', user);

    expect(serviceMock.findOne).toHaveBeenCalledWith(user, 'booking-1');
  });
});
