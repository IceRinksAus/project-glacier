import { TicketScanMode } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';

import { StaffScannerController } from './staff-scanner.controller';
import { StaffScannerService } from './staff-scanner.service';

describe('StaffScannerController', () => {
  const service = {
    findActiveEvents: jest.fn(),
    getEventContext: jest.fn(),
    lookup: jest.fn(),
    admit: jest.fn(),
  };
  const user = { userId: 'user-1', organizationId: 'organization-1' };
  const input = { token: 'a'.repeat(64), mode: TicketScanMode.TICKET_LOOKUP };
  let controller: StaffScannerController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StaffScannerController],
      providers: [{ provide: StaffScannerService, useValue: service }],
    }).compile();
    controller = module.get(StaffScannerController);
  });

  it('uses trusted organization context for Event selection and lookup', async () => {
    await controller.findEvents(user);
    await controller.getContext('event-1', user);
    await controller.lookup('event-1', input, user);
    expect(service.findActiveEvents).toHaveBeenCalledWith('organization-1');
    expect(service.getEventContext).toHaveBeenCalledWith(
      'organization-1',
      'event-1',
    );
    expect(service.lookup).toHaveBeenCalledWith(
      'organization-1',
      'event-1',
      input,
    );
  });

  it('supplies actor identity and mode for attributable admission', async () => {
    await controller.admit('event-1', input, user);
    expect(service.admit).toHaveBeenCalledWith(
      'organization-1',
      'user-1',
      'event-1',
      input,
    );
  });
});
