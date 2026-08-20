import {
  AustralianJurisdiction,
  EventActivityType,
  Prisma,
} from '@prisma/client';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { EventService } from './event.service';

describe('EventService', () => {
  let service: EventService;

  const prismaMock = {
    event: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

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

  const createData = {
    name: 'Winter Ice Event',
    slug: 'winter-ice-event',
    description: 'A fictional Event',
    startDate: '2027-09-01T00:00:00.000Z',
    endDate: '2027-09-05T00:00:00.000Z',
    timezone: 'Australia/Melbourne',
    venueName: 'Preview Ice Arena',
    addressLine1: '1 Example Street',
    suburb: 'Melbourne',
    postcode: '3000',
    country: 'AU',
    jurisdiction: AustralianJurisdiction.VIC,
    activityType: EventActivityType.ICE_SKATING,
    entryOpensMinutesBeforeStart: 30,
    entryClosesMinutesAfterEnd: 0,
  };

  it('creates a tenant-owned DRAFT Event with complete setup fields', async () => {
    prismaMock.event.create.mockResolvedValue({ id: 'event-1' });

    await service.create('organization-1', createData);

    expect(prismaMock.event.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: 'organization-1',
        status: 'DRAFT',
        timezone: 'Australia/Melbourne',
        venueName: 'Preview Ice Arena',
        jurisdiction: AustralianJurisdiction.VIC,
        activityType: EventActivityType.ICE_SKATING,
        entryOpensMinutesBeforeStart: 30,
        entryClosesMinutesAfterEnd: 0,
      }),
    });
  });

  it('rejects an Event whose end is not after its start', async () => {
    await expect(
      service.create('organization-1', {
        ...createData,
        endDate: createData.startDate,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prismaMock.event.create).not.toHaveBeenCalled();
  });

  it('converts a unique slug collision into a stable conflict', async () => {
    prismaMock.event.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(
      service.create('organization-1', createData),
    ).rejects.toBeInstanceOf(ConflictException);
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
