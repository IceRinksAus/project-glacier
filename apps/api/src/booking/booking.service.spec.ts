import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { BookingService } from './booking.service';

describe('BookingService', () => {
  let service: BookingService;

  const customer = {
    id: 'customer-1',
    firstName: 'Jamie',
    lastName: 'Stoller',
    email: 'jamie@example.com',
    phone: null,
  };

  const event = {
    id: 'event-1',
    name: 'Winter Festival',
    status: 'ACTIVE',
  };

  const session = {
    id: 'session-1',
    name: 'Public Skate',
    eventId: 'event-1',
    status: 'ACTIVE',
    capacity: 200,
  };

  const adultTicketType = {
    id: 'ticket-adult',
    name: 'Adult',
    price: new Prisma.Decimal(24),
    active: true,
    eventId: 'event-1',
  };

  const childTicketType = {
    id: 'ticket-child',
    name: 'Child',
    price: new Prisma.Decimal(18),
    active: true,
    eventId: 'event-1',
  };

  const createdBooking = {
    id: 'booking-1',
    bookingNumber: 'PG-1234567890-1234',
    status: 'RESERVED',
    total: 24,
    flexibleBooking: false,
    customerId: 'customer-1',
    eventId: 'event-1',
    sessionId: 'session-1',
    reservedUntil: new Date('2026-08-14T04:15:00.000Z'),
    paymentStatus: 'UNPAID',
    customer,
    event,
    session,
    items: [],
    participants: [],
    products: [],
  };

  const createBookingDto = {
    customerId: 'customer-1',
    eventId: 'event-1',
    sessionId: 'session-1',
    flexibleBooking: false,
    participants: [
      {
        firstName: 'Jamie',
        lastName: 'Stoller',
        age: 35,
        ticketTypeId: 'ticket-adult',
      },
    ],
    products: [],
  };

  const prisma = {
    booking: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    customer: {
      findUnique: jest.fn(),
    },
    event: {
      findUnique: jest.fn(),
    },
    session: {
      findUnique: jest.fn(),
    },
    ticketType: {
      findMany: jest.fn(),
    },
    bookingItem: {
      aggregate: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
  };

  const ruleEvaluationService = {
    evaluate: jest.fn(),
  };

  const bookingValidationService = {
    validateBooking: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    prisma.booking.findMany.mockResolvedValue([]);

    prisma.booking.findUnique.mockResolvedValue(createdBooking);

    prisma.booking.findFirst.mockResolvedValue(createdBooking);

    prisma.customer.findUnique.mockResolvedValue(customer);

    prisma.event.findUnique.mockResolvedValue(event);

    prisma.session.findUnique.mockResolvedValue(session);

    prisma.ticketType.findMany.mockResolvedValue([adultTicketType]);

    prisma.bookingItem.aggregate.mockResolvedValue({
      _sum: {
        quantity: 0,
      },
    });

    prisma.product.findMany.mockResolvedValue([]);

    prisma.booking.create.mockResolvedValue(createdBooking);

    ruleEvaluationService.evaluate.mockResolvedValue({
      valid: true,
      matchedRuleIds: [],
      requiredProducts: [],
      errors: [],
      warnings: [],
    });

    bookingValidationService.validateBooking.mockResolvedValue(true);

    service = new BookingService(
      prisma as never,
      ruleEvaluationService as never,
      bookingValidationService as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should list bookings with related booking data', async () => {
    await service.findAll('organization-1');

    expect(prisma.booking.findMany).toHaveBeenCalledWith({
      where: {
        event: {
          organizationId: 'organization-1',
        },
      },
      include: {
        customer: true,
        event: true,
        session: true,
        items: {
          include: {
            ticketType: true,
          },
        },
        participants: {
          include: {
            ticketType: true,
          },
        },
        products: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  });

  it('should find a booking by id', async () => {
    const result = await service.findOne('organization-1', 'booking-1');

    expect(prisma.booking.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'booking-1',
        event: {
          organizationId: 'organization-1',
        },
      },
      include: {
        customer: true,
        event: true,
        session: true,
        items: {
          include: {
            ticketType: true,
          },
        },
        participants: {
          include: {
            ticketType: true,
          },
        },
        products: {
          include: {
            product: true,
          },
        },
      },
    });

    expect(result).toEqual(createdBooking);
  });

  it('should reject an unknown booking id', async () => {
    prisma.booking.findFirst.mockResolvedValue(null);

    await expect(
      service.findOne('organization-1', 'missing-booking'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should run booking validation before creating a booking', async () => {
    await service.create(createBookingDto);

    expect(bookingValidationService.validateBooking).toHaveBeenCalledWith(
      createBookingDto,
    );
  });

  it('should reject a booking with no participants', async () => {
    await expect(
      service.create({
        ...createBookingDto,
        participants: [],
      }),
    ).rejects.toThrow('A booking must contain at least one participant');

    expect(prisma.booking.create).not.toHaveBeenCalled();
  });

  it('should reject an unknown customer', async () => {
    prisma.customer.findUnique.mockResolvedValue(null);

    await expect(service.create(createBookingDto)).rejects.toThrow(
      'Customer not found',
    );

    expect(prisma.booking.create).not.toHaveBeenCalled();
  });

  it('should reject an unknown event', async () => {
    prisma.event.findUnique.mockResolvedValue(null);

    await expect(service.create(createBookingDto)).rejects.toThrow(
      'Event not found',
    );

    expect(prisma.booking.create).not.toHaveBeenCalled();
  });

  it('should reject an unknown session', async () => {
    prisma.session.findUnique.mockResolvedValue(null);

    await expect(service.create(createBookingDto)).rejects.toThrow(
      'Session not found',
    );

    expect(prisma.booking.create).not.toHaveBeenCalled();
  });

  it('should reject a session belonging to another event', async () => {
    prisma.session.findUnique.mockResolvedValue({
      ...session,
      eventId: 'event-2',
    });

    await expect(service.create(createBookingDto)).rejects.toThrow(
      'The selected session does not belong to the selected event',
    );

    expect(prisma.booking.create).not.toHaveBeenCalled();
  });

  it('should reject a session that is not active', async () => {
    prisma.session.findUnique.mockResolvedValue({
      ...session,
      status: 'DRAFT',
    });

    await expect(service.create(createBookingDto)).rejects.toThrow(
      'The selected session is not currently available for booking',
    );

    expect(prisma.booking.create).not.toHaveBeenCalled();
  });

  it('should evaluate event rules for every participant', async () => {
    const bookingWithTwoParticipants = {
      ...createBookingDto,
      participants: [
        {
          firstName: 'Jamie',
          lastName: 'Stoller',
          age: 35,
          ticketTypeId: 'ticket-adult',
        },
        {
          firstName: 'Sam',
          lastName: 'Stoller',
          age: 10,
          ticketTypeId: 'ticket-child',
        },
      ],
    };

    prisma.ticketType.findMany.mockResolvedValue([
      adultTicketType,
      childTicketType,
    ]);

    await service.create(bookingWithTwoParticipants);

    expect(ruleEvaluationService.evaluate).toHaveBeenCalledTimes(2);

    expect(ruleEvaluationService.evaluate).toHaveBeenNthCalledWith(
      1,
      'event-1',
      expect.objectContaining({
        participantAge: 35,
        participantFirstName: 'Jamie',
        ticketTypeId: 'ticket-adult',
        sessionId: 'session-1',
        eventId: 'event-1',
        participantCount: 2,
      }),
    );

    expect(ruleEvaluationService.evaluate).toHaveBeenNthCalledWith(
      2,
      'event-1',
      expect.objectContaining({
        participantAge: 10,
        participantFirstName: 'Sam',
        ticketTypeId: 'ticket-child',
        sessionId: 'session-1',
        eventId: 'event-1',
        participantCount: 2,
      }),
    );
  });

  it('should reject a booking when the rule engine returns errors', async () => {
    ruleEvaluationService.evaluate.mockResolvedValue({
      valid: false,
      matchedRuleIds: ['rule-child-accompaniment'],
      requiredProducts: [],
      errors: ['Children under 5 must be accompanied by an adult.'],
      warnings: [],
    });

    await expect(service.create(createBookingDto)).rejects.toThrow(
      BadRequestException,
    );

    expect(prisma.booking.create).not.toHaveBeenCalled();
  });

  it('should reject invalid or inactive ticket types', async () => {
    prisma.ticketType.findMany.mockResolvedValue([]);

    await expect(service.create(createBookingDto)).rejects.toThrow(
      'One or more ticket types are invalid, inactive, or belong to another event',
    );

    expect(prisma.booking.create).not.toHaveBeenCalled();
  });

  it('should reject a booking that exceeds remaining session capacity', async () => {
    prisma.session.findUnique.mockResolvedValue({
      ...session,
      capacity: 10,
    });

    prisma.bookingItem.aggregate.mockResolvedValue({
      _sum: {
        quantity: 10,
      },
    });

    await expect(service.create(createBookingDto)).rejects.toThrow(
      'Public Skate does not have enough capacity. Requested: 1. Remaining: 0.',
    );

    expect(prisma.booking.create).not.toHaveBeenCalled();
  });

  it('should calculate occupied capacity from reserved and confirmed booking items', async () => {
    await service.create(createBookingDto);

    expect(prisma.bookingItem.aggregate).toHaveBeenCalledWith({
      where: {
        booking: {
          sessionId: 'session-1',
          status: {
            in: ['RESERVED', 'CONFIRMED'],
          },
        },
      },
      _sum: {
        quantity: true,
      },
    });
  });

  it('should consolidate participants into ticket booking items', async () => {
    const bookingWithThreeParticipants = {
      ...createBookingDto,
      participants: [
        {
          firstName: 'Jamie',
          lastName: 'Stoller',
          age: 35,
          ticketTypeId: 'ticket-adult',
        },
        {
          firstName: 'Alex',
          lastName: 'Smith',
          age: 40,
          ticketTypeId: 'ticket-adult',
        },
        {
          firstName: 'Sam',
          lastName: 'Stoller',
          age: 10,
          ticketTypeId: 'ticket-child',
        },
      ],
    };

    prisma.ticketType.findMany.mockResolvedValue([
      adultTicketType,
      childTicketType,
    ]);

    await service.create(bookingWithThreeParticipants);

    expect(prisma.booking.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          items: {
            create: expect.arrayContaining([
              {
                ticketTypeId: 'ticket-adult',
                quantity: 2,
                unitPrice: new Prisma.Decimal(24),
                totalPrice: new Prisma.Decimal(48),
              },
              {
                ticketTypeId: 'ticket-child',
                quantity: 1,
                unitPrice: new Prisma.Decimal(18),
                totalPrice: new Prisma.Decimal(18),
              },
            ]),
          },
        }),
      }),
    );
  });

  it('should create a reserved unpaid booking with a reservation expiry', async () => {
    await service.create(createBookingDto);

    expect(prisma.booking.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          bookingNumber: expect.stringMatching(/^PG-\d+-\d{4}$/),
          status: 'RESERVED',
          reservedUntil: expect.any(Date),
          paymentStatus: 'UNPAID',
          total: new Prisma.Decimal(24),
          flexibleBooking: false,
          customerId: 'customer-1',
          eventId: 'event-1',
          sessionId: 'session-1',
          items: {
            create: [
              {
                ticketTypeId: 'ticket-adult',
                quantity: 1,
                unitPrice: new Prisma.Decimal(24),
                totalPrice: new Prisma.Decimal(24),
              },
            ],
          },
          participants: {
            create: [
              {
                firstName: 'Jamie',
                lastName: 'Stoller',
                age: 35,
                ticketTypeId: 'ticket-adult',
              },
            ],
          },
          products: {
            create: [],
          },
        }),
      }),
    );
  });

  it('should return the booking together with rule evaluation results', async () => {
    ruleEvaluationService.evaluate.mockResolvedValue({
      valid: true,
      matchedRuleIds: ['rule-1'],
      requiredProducts: [],
      errors: [],
      warnings: ['Helmet recommended.'],
    });

    const result = await service.create(createBookingDto);

    expect(result).toEqual({
      booking: createdBooking,
      ruleEvaluation: {
        valid: true,
        matchedRuleIds: ['rule-1'],
        requiredProducts: [],
        errors: [],
        warnings: ['Jamie: Helmet recommended.'],
      },
    });
  });
});
