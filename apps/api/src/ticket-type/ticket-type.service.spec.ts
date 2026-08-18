import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { TicketTypeService } from './ticket-type.service';

describe('TicketTypeService', () => {
  let service: TicketTypeService;

  const prismaMock = {};

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          TicketTypeService,
          {
            provide: PrismaService,
            useValue: prismaMock,
          },
        ],
      }).compile();

    service =
      module.get<TicketTypeService>(
        TicketTypeService,
      );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
