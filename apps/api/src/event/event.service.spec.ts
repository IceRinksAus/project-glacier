import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { EventService } from './event.service';

describe('EventService', () => {
  let service: EventService;

  const prismaMock = {};

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          EventService,
          {
            provide: PrismaService,
            useValue: prismaMock,
          },
        ],
      }).compile();

    service =
      module.get<EventService>(
        EventService,
      );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
