import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { TicketService } from './ticket.service';

describe('TicketService', () => {
  let service: TicketService;

  const prismaMock = {};

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          TicketService,
          {
            provide: PrismaService,
            useValue: prismaMock,
          },
        ],
      }).compile();

    service =
      module.get<TicketService>(
        TicketService,
      );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
