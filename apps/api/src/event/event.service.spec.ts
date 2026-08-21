import {
  AustralianJurisdiction,
  EventActivityType,
  Prisma,
} from '@prisma/client';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
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
    eventBranding: {
      upsert: jest.fn(),
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

  const readyEvent = {
    id: 'event-1',
    name: 'Winter Ice Event',
    slug: 'winter-ice-event',
    description: null,
    startDate: new Date('2027-09-01T00:00:00.000Z'),
    endDate: new Date('2027-09-05T00:00:00.000Z'),
    timezone: 'Australia/Melbourne',
    status: 'DRAFT',
    venueName: 'Preview Ice Arena',
    addressLine1: '1 Example Street',
    addressLine2: null,
    suburb: 'Melbourne',
    postcode: '3000',
    country: 'AU',
    jurisdiction: AustralianJurisdiction.VIC,
    activityType: EventActivityType.ICE_SKATING,
    organizationId: 'organization-1',
    entryOpensMinutesBeforeStart: 30,
    entryClosesMinutesAfterEnd: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    sessions: [
      {
        id: 'session-1',
        status: 'ACTIVE',
        startDate: new Date('2027-09-01T01:00:00.000Z'),
        endDate: new Date('2027-09-01T02:00:00.000Z'),
      },
    ],
    ticketTypes: [{ id: 'ticket-type-1', active: true }],
    waiver: null,
  };

  it('creates a tenant-owned DRAFT Event with complete setup fields', async () => {
    prismaMock.event.create.mockResolvedValue({ id: 'event-1' });

    await service.create('organization-1', createData);

    expect(prismaMock.event.create).toHaveBeenCalledWith(
      expect.objectContaining({
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
        include: { branding: true },
      }),
    );
  });

  it('creates optional branding atomically with its Event', async () => {
    prismaMock.event.create.mockResolvedValue({ id: 'event-1' });
    const branding = {
      primaryColor: '#112233',
      secondaryColor: '#223344',
      accentColor: '#334455',
      backgroundColor: '#FFFFFF',
      surfaceColor: '#F8FAFC',
      textColor: '#0F172A',
      headingFont: 'OSWALD',
      bodyFont: 'INTER',
      heroHeadline: 'Skate into winter',
    };

    await service.create('organization-1', { ...createData, branding });

    expect(prismaMock.event.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ branding: { create: branding } }),
        include: { branding: true },
      }),
    );
  });

  it('tenant-scopes and upserts Event branding', async () => {
    prismaMock.event.findFirst.mockResolvedValue({ id: 'event-1' });
    prismaMock.eventBranding.upsert.mockResolvedValue({ id: 'branding-1' });
    const branding = {
      primaryColor: '#112233',
      secondaryColor: '#223344',
      accentColor: '#334455',
      backgroundColor: '#FFFFFF',
      surfaceColor: '#F8FAFC',
      textColor: '#0F172A',
      headingFont: 'OSWALD',
      bodyFont: 'INTER',
    };

    await service.updateBranding('event-1', 'organization-1', branding);

    expect(prismaMock.event.findFirst).toHaveBeenCalledWith({
      where: { id: 'event-1', organizationId: 'organization-1' },
      select: { id: true },
    });
    expect(prismaMock.eventBranding.upsert).toHaveBeenCalledWith({
      where: { eventId: 'event-1' },
      create: { eventId: 'event-1', ...branding },
      update: branding,
    });
  });

  it('does not reveal another tenant Event during branding update', async () => {
    prismaMock.event.findFirst.mockResolvedValue(null);

    await expect(
      service.updateBranding('event-1', 'organization-2', {
        primaryColor: '#112233',
        secondaryColor: '#223344',
        accentColor: '#334455',
        backgroundColor: '#FFFFFF',
        surfaceColor: '#F8FAFC',
        textColor: '#0F172A',
        headingFont: 'OSWALD',
        bodyFont: 'INTER',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prismaMock.eventBranding.upsert).not.toHaveBeenCalled();
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

  it('reports authoritative readiness with No Waiver as not required', async () => {
    prismaMock.event.findFirst.mockResolvedValue(readyEvent);

    await expect(
      service.getReadiness('event-1', 'organization-1'),
    ).resolves.toEqual(
      expect.objectContaining({
        eventId: 'event-1',
        readyToActivate: true,
        percentage: 100,
        items: expect.arrayContaining([
          expect.objectContaining({ id: 'WAIVER', status: 'NOT_REQUIRED' }),
        ]),
      }),
    );
  });

  it('reports missing foundations and an unpublished Waiver', async () => {
    prismaMock.event.findFirst.mockResolvedValue({
      ...readyEvent,
      sessions: [],
      ticketTypes: [],
      waiver: { id: 'waiver-1', versions: [] },
    });

    const readiness = await service.getReadiness('event-1', 'organization-1');

    expect(readiness.readyToActivate).toBe(false);
    expect(readiness.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'SESSIONS', status: 'INCOMPLETE' }),
        expect.objectContaining({
          id: 'TICKET_TYPES',
          status: 'INCOMPLETE',
        }),
        expect.objectContaining({ id: 'WAIVER', status: 'INCOMPLETE' }),
      ]),
    );
  });

  it('blocks activation when current readiness is incomplete', async () => {
    prismaMock.event.findFirst.mockResolvedValue({
      ...readyEvent,
      sessions: [],
    });

    await expect(
      service.updateStatus('event-1', 'organization-1', 'ACTIVE'),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ missingItems: ['SESSIONS'] }),
    });
    expect(prismaMock.event.update).not.toHaveBeenCalled();
  });

  it('activates a currently ready tenant-owned Event', async () => {
    prismaMock.event.findFirst.mockResolvedValue(readyEvent);
    prismaMock.event.update.mockResolvedValue({
      ...readyEvent,
      status: 'ACTIVE',
    });

    await service.updateStatus('event-1', 'organization-1', 'ACTIVE');

    expect(prismaMock.event.update).toHaveBeenCalledWith({
      where: { id: 'event-1' },
      data: { status: 'ACTIVE' },
    });
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
