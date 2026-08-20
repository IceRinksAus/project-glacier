import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { EventService } from './event.service';

describe('EventService', () => {
  let service: EventService;

  const prismaMock = {
    event: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('tenant-scopes and updates the Event entry policy', async () => {
    prismaMock.event.findFirst.mockResolvedValue({ id: 'event-1' });
    prismaMock.event.update.mockResolvedValue({ id: 'event-1' });

    await service.updateEntryPolicy('event-1', 'organization-1', {
      entryOpensMinutesBeforeStart: 45,
      entryClosesMinutesAfterEnd: 15,
    });

    expect(prismaMock.event.findFirst).toHaveBeenCalledWith({
      where: { id: 'event-1', organizationId: 'organization-1' },
      select: { id: true },
    });
    expect(prismaMock.event.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'event-1' },
        data: {
          entryOpensMinutesBeforeStart: 45,
          entryClosesMinutesAfterEnd: 15,
        },
      }),
    );
  });
});
