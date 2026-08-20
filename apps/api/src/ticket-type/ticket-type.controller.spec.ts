import { Test, TestingModule } from '@nestjs/testing';

import { TicketTypeController } from './ticket-type.controller';
import { TicketTypeService } from './ticket-type.service';

describe('TicketTypeController', () => {
  let controller: TicketTypeController;

  const serviceMock = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [
          TicketTypeController,
        ],
        providers: [
          {
            provide: TicketTypeService,
            useValue: serviceMock,
          },
        ],
      }).compile();

    controller =
      module.get<TicketTypeController>(
        TicketTypeController,
      );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes trusted Organisation and optional Event filter to the service', () => {
    controller.findAll(
      { organizationId: 'organization-1' },
      { eventId: 'event-1' },
    );

    expect(serviceMock.findAll).toHaveBeenCalledWith(
      'organization-1',
      'event-1',
    );
  });
});
