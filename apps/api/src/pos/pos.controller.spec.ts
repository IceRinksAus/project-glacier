import { Test, TestingModule } from '@nestjs/testing';

import { ROLES_KEY } from '../auth/decorators/roles.decorator';

import { PosController } from './pos.controller';
import { PosService } from './pos.service';

describe('PosController', () => {
  const service = {
    findCatalogue: jest.fn(),
    createCustomer: jest.fn(),
    evaluateRules: jest.fn(),
    createReservation: jest.fn(),
    completePayment: jest.fn(),
  };
  const user = {
    userId: 'user-1',
    organizationId: 'organization-1',
    role: 'STAFF' as const,
    accessScope: 'ASSIGNED_EVENTS' as const,
  };
  let controller: PosController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PosController],
      providers: [{ provide: PosService, useValue: service }],
    }).compile();
    controller = module.get(PosController);
  });

  it('allows OWNER, MANAGER and STAFF while excluding SCANNER', () => {
    expect(Reflect.getMetadata(ROLES_KEY, PosController)).toEqual([
      'OWNER',
      'MANAGER',
      'STAFF',
    ]);
  });

  it('passes current access context through every POS operation', async () => {
    const customer = { firstName: 'Jamie', lastName: 'Stoller' };
    const reservation = {
      customerId: 'customer-1',
      sessionId: 'session-1',
      participants: [],
    };

    await controller.findCatalogue(user, 'event-1', {
      sessionId: 'session-1',
    });
    await controller.createCustomer(user, 'event-1', customer);
    await controller.evaluateRules(user, 'event-1', {
      sessionId: 'session-1',
      participants: reservation.participants,
    });
    await controller.createReservation(user, 'event-1', reservation);
    await controller.completePayment(user, 'event-1', 'booking-1', {
      method: 'CASH',
      amount: 24,
      idempotencyKey: 'pos-payment-1',
    });

    expect(service.findCatalogue).toHaveBeenCalledWith(
      user,
      'event-1',
      'session-1',
    );
    expect(service.createCustomer).toHaveBeenCalledWith(
      user,
      'event-1',
      customer,
    );
    expect(service.evaluateRules).toHaveBeenCalledWith(user, 'event-1', {
      sessionId: 'session-1',
      participants: reservation.participants,
    });
    expect(service.createReservation).toHaveBeenCalledWith(
      user,
      'event-1',
      reservation,
    );
    expect(service.completePayment).toHaveBeenCalledWith(
      user,
      'event-1',
      'booking-1',
      {
        method: 'CASH',
        amount: 24,
        idempotencyKey: 'pos-payment-1',
      },
    );
  });
});
