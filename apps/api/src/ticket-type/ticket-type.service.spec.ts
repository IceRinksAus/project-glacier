import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { TicketTypeService } from './ticket-type.service';

describe('TicketTypeService', () => {
  let service: TicketTypeService;

  const prismaMock = {
    event: {
      findFirst: jest.fn(),
    },
    ticketType: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketTypeService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<TicketTypeService>(TicketTypeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('tenant-scopes Ticket Type lists through the Event', async () => {
    prismaMock.ticketType.findMany.mockResolvedValue([]);

    await service.findAll('organization-1');

    expect(prismaMock.ticketType.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          event: {
            organizationId: 'organization-1',
          },
        },
      }),
    );
  });

  it('filters a Ticket Type list to the requested tenant Event', async () => {
    prismaMock.ticketType.findMany.mockResolvedValue([]);

    await service.findAll('organization-1', 'event-1');

    expect(prismaMock.ticketType.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          eventId: 'event-1',
          event: {
            organizationId: 'organization-1',
          },
        },
      }),
    );
  });

  it('does not create a Ticket Type for another tenant Event', async () => {
    prismaMock.event.findFirst.mockResolvedValue(null);

    await expect(
      service.create('organization-1', {
        name: 'Adult',
        price: 25,
        capacity: 100,
        eventId: 'event-2',
      }),
    ).rejects.toThrow('Event not found');
    expect(prismaMock.ticketType.create).not.toHaveBeenCalled();
  });

  it('creates a Ticket Type after tenant ownership is proven', async () => {
    prismaMock.event.findFirst.mockResolvedValue({ id: 'event-1' });
    prismaMock.ticketType.create.mockResolvedValue({ id: 'ticket-type-1' });

    await service.create('organization-1', {
      name: 'Adult',
      price: 25,
      capacity: 100,
      eventId: 'event-1',
      saleStart: '2027-01-01T00:00:00.000Z',
    });

    expect(prismaMock.ticketType.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        eventId: 'event-1',
        saleStart: new Date('2027-01-01T00:00:00.000Z'),
      }),
    });
  });
});
