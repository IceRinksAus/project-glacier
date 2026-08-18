import { NotFoundException } from '@nestjs/common';

import { BookingService } from '../booking/booking.service';
import { PublicBookingService } from './public-booking.service';

describe('PublicBookingService', () => {
  let service: PublicBookingService;

  const activeEvent = {
    id: 'event-1',
    name: 'Australian Ice Festival 2027',
    slug: 'australian-ice-festival-2027',
    description: 'A winter ice skating festival.',
    startDate: new Date(
      '2027-06-25T00:00:00.000Z',
    ),
    endDate: new Date(
      '2027-07-18T23:59:59.999Z',
    ),
    timezone: 'Australia/Melbourne',
    status: 'ACTIVE',
  };

  const activeSessions = [
    {
      id: 'session-1',
      name: 'Morning Public Skate',
      startDate: new Date(
        '2027-07-05T00:00:00.000Z',
      ),
      endDate: new Date(
        '2027-07-05T01:00:00.000Z',
      ),
      capacity: 200,
      status: 'ACTIVE',
      salesStart: null,
      salesEnd: null,
      eventId: 'event-1',
    },
    {
      id: 'session-2',
      name: 'Afternoon Public Skate',
      startDate: new Date(
        '2027-07-05T03:00:00.000Z',
      ),
      endDate: new Date(
        '2027-07-05T04:00:00.000Z',
      ),
      capacity: 200,
      status: 'ACTIVE',
      salesStart: null,
      salesEnd: null,
      eventId: 'event-1',
    },
  ];

  const activeTicketTypes = [
    {
      id: 'ticket-type-1',
      name: 'Adult',
      description: 'Adult admission',
      price: 24,
      capacity: 200,
      active: true,
      saleStart: null,
      saleEnd: null,
      eventId: 'event-1',
    },
    {
      id: 'ticket-type-2',
      name: 'Child',
      description: 'Child admission',
      price: 18,
      capacity: 200,
      active: true,
      saleStart: null,
      saleEnd: null,
      eventId: 'event-1',
    },
  ];

  const sessionProducts = [
    {
      id: 'session-product-1',
      sessionId: 'session-1',
      productId: 'product-kanga',
      sortOrder: 0,
      product: {
        id: 'product-kanga',
        name: 'Kanga Skating Aid',
        slug: 'kanga-skating-aid',
        description: 'Skating aid hire',
        price: 10,
        imageUrl: null,
        minQuantity: 0,
        maxQuantity: 1,
        salesStart: null,
        salesEnd: null,
        eventId: 'event-1',
      },
    },
  ];

  const createdCustomer = {
    id: 'customer-1',
    firstName: 'Jamie',
    lastName: 'Stoller',
    email: 'jamie@example.com',
    phone: '0400000000',
  };

  const internalBookingResult = {
    booking: {
      id: 'booking-1',
      bookingNumber: 'PG-1234567890-1234',
      status: 'RESERVED',
      paymentStatus: 'UNPAID',
      total: 24,
      flexibleBooking: false,
      customerId: 'customer-1',
      eventId: 'event-1',
      sessionId: 'session-1',
      reservedUntil: new Date(
        '2027-07-05T00:15:00.000Z',
      ),
      confirmedAt: null,
      paidAt: null,
      expiredAt: null,
      paymentReference: null,
      createdAt: new Date(
        '2027-07-05T00:00:00.000Z',
      ),
      updatedAt: new Date(
        '2027-07-05T00:00:00.000Z',
      ),
      customer: {
        id: 'customer-1',
        firstName: 'Jamie',
        lastName: 'Stoller',
        email: 'jamie@example.com',
        phone: '0400000000',
        createdAt: new Date(
          '2027-06-01T00:00:00.000Z',
        ),
        updatedAt: new Date(
          '2027-06-01T00:00:00.000Z',
        ),
      },
      event: {
        id: 'event-1',
        name: 'Australian Ice Festival 2027',
        slug: 'australian-ice-festival-2027',
        description:
          'A winter ice skating festival.',
        startDate: new Date(
          '2027-06-25T00:00:00.000Z',
        ),
        endDate: new Date(
          '2027-07-18T23:59:59.999Z',
        ),
        timezone: 'Australia/Melbourne',
        status: 'ACTIVE',
        organizationId: 'org-1',
        createdAt: new Date(
          '2027-01-01T00:00:00.000Z',
        ),
        updatedAt: new Date(
          '2027-01-01T00:00:00.000Z',
        ),
      },
      session: {
        id: 'session-1',
        name: 'Morning Public Skate',
        startDate: new Date(
          '2027-07-05T00:00:00.000Z',
        ),
        endDate: new Date(
          '2027-07-05T01:00:00.000Z',
        ),
        capacity: 200,
        status: 'ACTIVE',
        salesStart: null,
        salesEnd: null,
        eventId: 'event-1',
        operationalScheduleId:
          'schedule-1',
        scheduleEntryId: 'entry-1',
        scheduleExceptionType: 'NONE',
        createdAt: new Date(
          '2027-01-01T00:00:00.000Z',
        ),
        updatedAt: new Date(
          '2027-01-01T00:00:00.000Z',
        ),
      },
      items: [
        {
          id: 'booking-item-1',
          bookingId: 'booking-1',
          ticketTypeId:
            'ticket-type-1',
          quantity: 1,
          unitPrice: 24,
          totalPrice: 24,
          createdAt: new Date(
            '2027-07-05T00:00:00.000Z',
          ),
          ticketType: {
            id: 'ticket-type-1',
            name: 'Adult',
            description:
              'Adult admission',
            price: 24,
            capacity: 200,
            active: true,
            saleStart: null,
            saleEnd: null,
            eventId: 'event-1',
            createdAt: new Date(
              '2027-01-01T00:00:00.000Z',
            ),
            updatedAt: new Date(
              '2027-01-01T00:00:00.000Z',
            ),
          },
        },
      ],
      participants: [
        {
          id: 'participant-1',
          firstName: 'Jamie',
          lastName: 'Stoller',
          age: 35,
          bookingId: 'booking-1',
          ticketTypeId:
            'ticket-type-1',
          createdAt: new Date(
            '2027-07-05T00:00:00.000Z',
          ),
          updatedAt: new Date(
            '2027-07-05T00:00:00.000Z',
          ),
          ticketType: {
            id: 'ticket-type-1',
            name: 'Adult',
            description:
              'Adult admission',
            price: 24,
            capacity: 200,
            active: true,
            saleStart: null,
            saleEnd: null,
            eventId: 'event-1',
          },
        },
      ],
      products: [],
    },
    ruleEvaluation: {
      valid: true,
      matchedRuleIds: [],
      requiredProducts: [],
      errors: [],
      warnings: [],
    },
  };

  const expectedPublicBookingResult = {
    booking: {
      id: 'booking-1',
      bookingNumber:
        'PG-1234567890-1234',
      status: 'RESERVED',
      paymentStatus: 'UNPAID',
      total: 24,
      reservedUntil: new Date(
        '2027-07-05T00:15:00.000Z',
      ),
      flexibleBooking: false,
      publicAccessToken: expect.any(String),
      customer: {
        id: 'customer-1',
        firstName: 'Jamie',
        lastName: 'Stoller',
        email: 'jamie@example.com',
        phone: '0400000000',
      },
      event: {
        id: 'event-1',
        name:
          'Australian Ice Festival 2027',
        slug:
          'australian-ice-festival-2027',
        timezone: 'Australia/Melbourne',
      },
      session: {
        id: 'session-1',
        name: 'Morning Public Skate',
        startDate: new Date(
          '2027-07-05T00:00:00.000Z',
        ),
        endDate: new Date(
          '2027-07-05T01:00:00.000Z',
        ),
      },
      items: [
        {
          ticketTypeId:
            'ticket-type-1',
          quantity: 1,
          unitPrice: 24,
          totalPrice: 24,
          ticketType: {
            id: 'ticket-type-1',
            name: 'Adult',
          },
        },
      ],
      participants: [
        {
          id: 'participant-1',
          firstName: 'Jamie',
          lastName: 'Stoller',
          age: 35,
          ticketTypeId:
            'ticket-type-1',
        },
      ],
      products: [],
    },
    ruleEvaluation: {
      valid: true,
      matchedRuleIds: [],
      requiredProducts: [],
      errors: [],
      warnings: [],
    },
  };

  const prisma = {
    event: {
      findFirst: jest.fn(),
    },
    session: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    ticketType: {
      findMany: jest.fn(),
    },
    sessionProduct: {
      findMany: jest.fn(),
    },
    customer: {
      create: jest.fn(),
    },
    booking: {
  update: jest.fn(),
},
  };

  const bookingService = {
    create: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    prisma.event.findFirst.mockResolvedValue(
      activeEvent,
    );

    prisma.session.findMany.mockResolvedValue(
      activeSessions,
    );

    prisma.session.findFirst.mockResolvedValue({
      id: 'session-1',
    });

    prisma.ticketType.findMany.mockResolvedValue(
      activeTicketTypes,
    );

    prisma.sessionProduct.findMany.mockResolvedValue(
      sessionProducts,
    );

    prisma.customer.create.mockResolvedValue(
      createdCustomer,
    );

    bookingService.create.mockResolvedValue(
      internalBookingResult,
    );

    service = new PublicBookingService(
      prisma as never,
      bookingService as unknown as BookingService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return an active public event', async () => {
    const result =
      await service.findEvent(
        'event-1',
      );

    expect(
      prisma.event.findFirst,
    ).toHaveBeenCalledWith({
      where: {
        id: 'event-1',
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        startDate: true,
        endDate: true,
        timezone: true,
        status: true,
      },
    });

    expect(result).toEqual(
      activeEvent,
    );
  });

  it('should reject a missing or inactive public event', async () => {
    prisma.event.findFirst.mockResolvedValue(
      null,
    );

    await expect(
      service.findEvent('event-1'),
    ).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should return only active sessions for an active event', async () => {
    const result =
      await service.findSessions(
        'event-1',
      );

    expect(
      prisma.session.findMany,
    ).toHaveBeenCalledWith({
      where: {
        eventId: 'event-1',
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        capacity: true,
        status: true,
        salesStart: true,
        salesEnd: true,
        eventId: true,
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    expect(result).toEqual(
      activeSessions,
    );
  });

  it('should verify the event is active before returning sessions', async () => {
    await service.findSessions(
      'event-1',
    );

    expect(
      prisma.event.findFirst,
    ).toHaveBeenCalledWith({
      where: {
        id: 'event-1',
        status: 'ACTIVE',
      },
      select: {
        id: true,
      },
    });

    expect(
      prisma.event.findFirst.mock
        .invocationCallOrder[0],
    ).toBeLessThan(
      prisma.session.findMany.mock
        .invocationCallOrder[0],
    );
  });

  it('should reject session discovery for a missing or inactive event', async () => {
    prisma.event.findFirst.mockResolvedValue(
      null,
    );

    await expect(
      service.findSessions(
        'event-1',
      ),
    ).rejects.toThrow(
      NotFoundException,
    );

    expect(
      prisma.session.findMany,
    ).not.toHaveBeenCalled();
  });

  it('should request sessions ordered by start date ascending', async () => {
    await service.findSessions(
      'event-1',
    );

    expect(
      prisma.session.findMany,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: {
          startDate: 'asc',
        },
      }),
    );
  });

  it('should return only active ticket types for an active event', async () => {
    const result =
      await service.findTicketTypes(
        'event-1',
      );

    expect(
      prisma.ticketType.findMany,
    ).toHaveBeenCalledWith({
      where: {
        eventId: 'event-1',
        active: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        capacity: true,
        active: true,
        saleStart: true,
        saleEnd: true,
        eventId: true,
      },
    });

    expect(result).toEqual(
      activeTicketTypes,
    );
  });

  it('should verify the event is active before returning ticket types', async () => {
    await service.findTicketTypes(
      'event-1',
    );

    expect(
      prisma.event.findFirst,
    ).toHaveBeenCalledWith({
      where: {
        id: 'event-1',
        status: 'ACTIVE',
      },
      select: {
        id: true,
      },
    });

    expect(
      prisma.event.findFirst.mock
        .invocationCallOrder[0],
    ).toBeLessThan(
      prisma.ticketType.findMany.mock
        .invocationCallOrder[0],
    );
  });

  it('should reject ticket type discovery for a missing or inactive event', async () => {
    prisma.event.findFirst.mockResolvedValue(
      null,
    );

    await expect(
      service.findTicketTypes(
        'event-1',
      ),
    ).rejects.toThrow(
      NotFoundException,
    );

    expect(
      prisma.ticketType.findMany,
    ).not.toHaveBeenCalled();
  });

  it('should return active online non-admission products assigned to an active public session', async () => {
    const result =
      await service.findSessionProducts(
        'session-1',
      );

    expect(
      prisma.session.findFirst,
    ).toHaveBeenCalledWith({
      where: {
        id: 'session-1',
        status: 'ACTIVE',
        event: {
          status: 'ACTIVE',
        },
      },
      select: {
        id: true,
      },
    });

    expect(
      prisma.sessionProduct.findMany,
    ).toHaveBeenCalledWith({
      where: {
        sessionId: 'session-1',
        active: true,
        product: {
          status: 'ACTIVE',
          availableOnline: true,
          productType: {
            not: 'ADMISSION',
          },
        },
      },
      select: {
        id: true,
        sessionId: true,
        productId: true,
        sortOrder: true,
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            price: true,
            imageUrl: true,
            minQuantity: true,
            maxQuantity: true,
            salesStart: true,
            salesEnd: true,
            eventId: true,
          },
        },
      },
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          createdAt: 'asc',
        },
      ],
    });

    expect(result).toEqual(
      sessionProducts,
    );
  });

  it('should reject product discovery for a missing or unavailable session', async () => {
    prisma.session.findFirst.mockResolvedValue(
      null,
    );

    await expect(
      service.findSessionProducts(
        'session-1',
      ),
    ).rejects.toThrow(
      NotFoundException,
    );

    expect(
      prisma.sessionProduct.findMany,
    ).not.toHaveBeenCalled();
  });

  it('should verify the public session before returning session products', async () => {
    await service.findSessionProducts(
      'session-1',
    );

    expect(
      prisma.session.findFirst.mock
        .invocationCallOrder[0],
    ).toBeLessThan(
      prisma.sessionProduct.findMany.mock
        .invocationCallOrder[0],
    );
  });

  it('should create a public customer', async () => {
    const result =
      await service.createCustomer({
        firstName: 'Jamie',
        lastName: 'Stoller',
        email: 'jamie@example.com',
        phone: '0400000000',
      });

    expect(
      prisma.customer.create,
    ).toHaveBeenCalledWith({
      data: {
        firstName: 'Jamie',
        lastName: 'Stoller',
        email: 'jamie@example.com',
        phone: '0400000000',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });

    expect(result).toEqual(
      createdCustomer,
    );
  });

  it('should allow a public customer to be created without a phone number', async () => {
    const customerWithoutPhone = {
      id: 'customer-2',
      firstName: 'Alex',
      lastName: 'Smith',
      email: 'alex@example.com',
      phone: null,
    };

    prisma.customer.create.mockResolvedValue(
      customerWithoutPhone,
    );

    const result =
      await service.createCustomer({
        firstName: 'Alex',
        lastName: 'Smith',
        email: 'alex@example.com',
      });

    expect(
      prisma.customer.create,
    ).toHaveBeenCalledWith({
      data: {
        firstName: 'Alex',
        lastName: 'Smith',
        email: 'alex@example.com',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });

    expect(result).toEqual(
      customerWithoutPhone,
    );
  });

  it('should create a public booking through the existing booking engine', async () => {
    const bookingData = {
      customerId: 'customer-1',
      eventId: 'event-1',
      sessionId: 'session-1',
      flexibleBooking: false,
      participants: [
        {
          firstName: 'Jamie',
          lastName: 'Stoller',
          age: 35,
          ticketTypeId:
            'ticket-type-1',
        },
      ],
      products: [],
    };

    await service.createBooking(
      bookingData,
    );

    expect(
      bookingService.create,
    ).toHaveBeenCalledWith(
      bookingData,
    );
  });

  it('should generate and persist a secure public booking access token', async () => {
  const bookingData = {
    customerId: 'customer-1',
    eventId: 'event-1',
    sessionId: 'session-1',
    flexibleBooking: false,
    participants: [
      {
        firstName: 'Jamie',
        lastName: 'Stoller',
        age: 35,
        ticketTypeId:
          'ticket-type-1',
      },
    ],
    products: [],
  };

  const result =
    await service.createBooking(
      bookingData,
    );

  expect(
    prisma.booking.update,
  ).toHaveBeenCalledWith({
    where: {
      id: 'booking-1',
    },
    data: {
      publicAccessTokenHash:
        expect.stringMatching(
          /^[a-f0-9]{64}$/,
        ),
      publicAccessTokenCreatedAt:
        expect.any(Date),
    },
  });

  expect(
    result.booking,
  ).toHaveProperty(
    'publicAccessToken',
  );

  expect(
    result.booking.publicAccessToken,
  ).toEqual(
    expect.any(String),
  );

  expect(
    result.booking.publicAccessToken.length,
  ).toBeGreaterThanOrEqual(40);

  expect(
    result.booking,
  ).not.toHaveProperty(
    'publicAccessTokenHash',
  );
});

  it('should return a narrow public booking response without internal fields', async () => {
    const bookingData = {
      customerId: 'customer-1',
      eventId: 'event-1',
      sessionId: 'session-1',
      flexibleBooking: false,
      participants: [
        {
          firstName: 'Jamie',
          lastName: 'Stoller',
          age: 35,
          ticketTypeId:
            'ticket-type-1',
        },
      ],
      products: [],
    };

    const result =
      await service.createBooking(
        bookingData,
      );

    expect(result).toEqual(
      expectedPublicBookingResult,
    );

    expect(
      result.booking,
    ).not.toHaveProperty(
      'customerId',
    );

    expect(
      result.booking,
    ).not.toHaveProperty(
      'eventId',
    );

    expect(
      result.booking,
    ).not.toHaveProperty(
      'sessionId',
    );

    expect(
      result.booking,
    ).not.toHaveProperty(
      'createdAt',
    );

    expect(
      result.booking,
    ).not.toHaveProperty(
      'updatedAt',
    );

    expect(
      result.booking.event,
    ).not.toHaveProperty(
      'organizationId',
    );

    expect(
      result.booking.session,
    ).not.toHaveProperty(
      'operationalScheduleId',
    );

    expect(
      result.booking.session,
    ).not.toHaveProperty(
      'scheduleEntryId',
    );
  });
});