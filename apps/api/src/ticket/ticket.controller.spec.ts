import { Test, TestingModule } from '@nestjs/testing';

import { TicketController } from './ticket.controller';
import { TicketService } from './ticket.service';

describe('TicketController', () => {
  let controller: TicketController;

  const serviceMock = {
    getTicketByToken: jest.fn(),
    validateTicket: jest.fn(),
    checkInTicket: jest.fn(),
    generateQrCode: jest.fn(),
    getTicketById: jest.fn(),
  };
  const user = {
    organizationId: 'organization-1',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketController],
      providers: [
        {
          provide: TicketService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<TicketController>(TicketController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('keeps public Ticket presentation token-based', async () => {
    serviceMock.getTicketByToken.mockResolvedValue({ ticketNumber: 'TKT-1' });

    await controller.getTicketByToken('a'.repeat(64));

    expect(serviceMock.getTicketByToken).toHaveBeenCalledWith('a'.repeat(64));
  });

  it('uses trusted organization context for Ticket validation', async () => {
    serviceMock.validateTicket.mockResolvedValue({ valid: true });

    await controller.validateTicket('a'.repeat(64), user);

    expect(serviceMock.validateTicket).toHaveBeenCalledWith(
      'organization-1',
      'a'.repeat(64),
    );
  });

  it('uses trusted organization context for Ticket scan', async () => {
    serviceMock.checkInTicket.mockResolvedValue({ result: 'ENTRY_GRANTED' });

    await controller.checkInTicket('a'.repeat(64), user);

    expect(serviceMock.checkInTicket).toHaveBeenCalledWith(
      'organization-1',
      'a'.repeat(64),
    );
  });
});
