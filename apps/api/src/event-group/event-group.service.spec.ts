import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { EventGroupService } from './event-group.service';

describe('EventGroupService', () => {
  let service: EventGroupService;
  const transaction = {
    eventGroupEvent: { deleteMany: jest.fn(), createMany: jest.fn() },
  };
  const prisma = {
    eventGroup: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    event: { findMany: jest.fn() },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventGroupService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(EventGroupService);
    prisma.eventGroup.findFirst.mockResolvedValue(null);
    prisma.eventGroup.findMany.mockResolvedValue([]);
    prisma.$transaction.mockImplementation(
      (callback: (value: typeof transaction) => unknown) =>
        callback(transaction),
    );
    transaction.eventGroupEvent.deleteMany.mockResolvedValue({ count: 0 });
    transaction.eventGroupEvent.createMany.mockResolvedValue({ count: 0 });
  });

  it('lists only Groups in the authenticated Organisation with bounded fields', async () => {
    await service.findAll('org-1');

    expect(prisma.eventGroup.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: 'org-1' },
        take: 100,
      }),
    );
  });

  it('creates a trimmed Organisation-owned Group', async () => {
    prisma.eventGroup.create.mockResolvedValue({ id: 'group-1' });

    await service.create('org-1', {
      name: '  Winter Festival Season  ',
      description: '  Three cities  ',
      type: 'SEASON',
    });

    expect(prisma.eventGroup.create).toHaveBeenCalledWith({
      data: {
        organizationId: 'org-1',
        name: 'Winter Festival Season',
        description: 'Three cities',
        type: 'SEASON',
      },
    });
  });

  it('rejects a case-insensitive duplicate Group name', async () => {
    prisma.eventGroup.findFirst.mockResolvedValue({ id: 'existing' });

    await expect(
      service.create('org-1', { name: 'season', type: 'SEASON' }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects Group access outside the authenticated Organisation', async () => {
    await expect(service.findOne('org-1', 'foreign-group')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('replaces ordered membership transactionally using only tenant Events', async () => {
    prisma.eventGroup.findFirst
      .mockResolvedValueOnce({ id: 'group-1' })
      .mockResolvedValueOnce({ id: 'group-1', events: [] });
    prisma.event.findMany.mockResolvedValue([
      { id: 'event-1' },
      { id: 'event-2' },
    ]);

    await service.replaceEvents('org-1', 'group-1', {
      eventIds: ['event-2', 'event-1'],
    });

    expect(prisma.event.findMany).toHaveBeenCalledWith({
      where: {
        organizationId: 'org-1',
        id: { in: ['event-2', 'event-1'] },
      },
      select: { id: true },
    });
    expect(transaction.eventGroupEvent.createMany).toHaveBeenCalledWith({
      data: [
        { eventGroupId: 'group-1', eventId: 'event-2', sortOrder: 0 },
        { eventGroupId: 'group-1', eventId: 'event-1', sortOrder: 1 },
      ],
    });
  });

  it('rejects membership when any Event is foreign or unknown before mutation', async () => {
    prisma.eventGroup.findFirst.mockResolvedValue({ id: 'group-1' });
    prisma.event.findMany.mockResolvedValue([{ id: 'event-1' }]);

    await expect(
      service.replaceEvents('org-1', 'group-1', {
        eventIds: ['event-1', 'foreign-event'],
      }),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
