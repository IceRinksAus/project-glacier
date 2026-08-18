import { Test, TestingModule } from '@nestjs/testing';

import { TicketTypeController } from './ticket-type.controller';
import { TicketTypeService } from './ticket-type.service';

describe('TicketTypeController', () => {
  let controller: TicketTypeController;

  const serviceMock = {};

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
});
