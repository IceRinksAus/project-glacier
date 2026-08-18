import { Test, TestingModule } from '@nestjs/testing';

import { TicketController } from './ticket.controller';
import { TicketService } from './ticket.service';

describe('TicketController', () => {
  let controller: TicketController;

  const serviceMock = {};

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [
          TicketController,
        ],
        providers: [
          {
            provide: TicketService,
            useValue: serviceMock,
          },
        ],
      }).compile();

    controller =
      module.get<TicketController>(
        TicketController,
      );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
