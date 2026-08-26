import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { BookingService } from './booking.service';

describe('BookingService', () => {
  let service: BookingService;

  const ownerAccess = {
    userId: 'user-1',
    organizationId: 'organization-1',
    role: 'OWNER' as const,
    accessScope: 'ALL_EVENTS' as const,
  };

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
    organizationId: 'organization-1',
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
    $transaction: jest.fn(),
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
    bookingProduct: {
      aggregate: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
    productVariant: {
      findMany: jest.fn(),
    },
    sessionProduct: {
      findMany: jest.fn(),
    },
    paymentReconciliationAttempt: {
      create: jest.fn(),
    },
    flexibleTicketEntitlement: {
      createMany: jest.fn(),
    },
  };

  const ruleEvaluationService = {
    evaluate: jest.fn(),
  };

  const bookingValidationService = {
    validateBooking: jest.fn(),
  };

  const paymentService = {
    reconcilePendingPaymentForBooking: jest.fn(),
  };

  const flexibleTicketPolicies = {
    resolveReservationPolicy: jest.fn(),
    calculateFee: jest.fn(),
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

    prisma.bookingProduct.aggregate.mockResolvedValue({
      _sum: {
        quantity: 0,
      },
    });

    prisma.sessionProduct.findMany.mockResolvedValue([]);

    prisma.$transaction.mockImplementation(
      async (operation: (transaction: typeof prisma) => unknown) =>
        operation(prisma),
    );

    prisma.product.findMany.mockResolvedValue([]);

    prisma.productVariant.findMany.mockResolvedValue([]);

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
      paymentService as never,
      {
        eventWhere: ({ organizationId }: typeof ownerAccess) => ({
          organizationId,
        }),
      } as never,
      {
        productCommitted: async (_transaction: unknown, productId: string) => {
          const result = await prisma.bookingProduct.aggregate({
            where: {
              productId,
              booking: { status: { in: ['RESERVED', 'CONFIRMED'] } },
            },
            _sum: { quantity: true },
          });
          return result._sum.quantity ?? 0;
        },
        variantCommitted: async (
          _transaction: unknown,
          productVariantId: string,
        ) => {
          const result = await prisma.bookingProduct.aggregate({
            where: {
              productVariantId,
              booking: { status: { in: ['RESERVED', 'CONFIRMED'] } },
            },
            _sum: { quantity: true },
          });
          return result._sum.quantity ?? 0;
        },
      } as never,
      flexibleTicketPolicies as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should list bookings with related booking data', async () => {
    await service.findAll(ownerAccess);

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
    const result = await service.findOne(ownerAccess, 'booking-1');

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
      service.findOne(ownerAccess, 'missing-booking'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should run booking validation before creating a booking', async () => {
    await service.create(createBookingDto);

    expect(bookingValidationService.validateBooking).toHaveBeenCalledWith(
      createBookingDto,
      'ONLINE',
    );
  });

  it('persists and validates a walk-up booking through the POS channel', async () => {
    await service.create(createBookingDto, 'WALK_UP');

    expect(bookingValidationService.validateBooking).toHaveBeenCalledWith(
      createBookingDto,
      'WALK_UP',
    );
    expect(prisma.booking.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          source: 'WALK_UP',
        }),
      }),
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

  it('holds per-Session Product capacity across reserved and confirmed bookings', async () => {
    const kanga = {
      id: 'product-kanga',
      name: 'Kanga Skating Aid',
      slug: 'kanga-skating-aid',
      eventId: 'event-1',
      status: 'ACTIVE',
      availableOnline: true,
      minQuantity: 0,
      maxQuantity: null,
      price: new Prisma.Decimal(10),
      inventoryTracked: false,
      inventoryQuantity: null,
      capacityControlled: true,
      capacity: 20,
    };
    const bookingWithKangas = {
      ...createBookingDto,
      products: [{ productId: kanga.id, quantity: 3 }],
    };

    prisma.product.findMany.mockResolvedValue([kanga]);
    prisma.sessionProduct.findMany.mockResolvedValue([
      { productId: kanga.id, capacityOverride: null },
    ]);
    prisma.bookingProduct.aggregate.mockResolvedValue({
      _sum: { quantity: 18 },
    });

    await expect(service.create(bookingWithKangas)).rejects.toThrow(
      'Kanga Skating Aid does not have enough capacity for this Session. Requested: 3. Remaining: 2.',
    );

    expect(prisma.bookingProduct.aggregate).toHaveBeenCalledWith({
      where: {
        productId: kanga.id,
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
    expect(prisma.booking.create).not.toHaveBeenCalled();
  });

  it('uses a Session-specific Product capacity override', async () => {
    const kanga = {
      id: 'product-kanga',
      name: 'Kanga Skating Aid',
      slug: 'kanga-skating-aid',
      eventId: 'event-1',
      status: 'ACTIVE',
      availableOnline: true,
      minQuantity: 0,
      maxQuantity: null,
      price: new Prisma.Decimal(10),
      inventoryTracked: false,
      inventoryQuantity: null,
      capacityControlled: true,
      capacity: 20,
    };

    prisma.product.findMany.mockResolvedValue([kanga]);
    prisma.sessionProduct.findMany.mockResolvedValue([
      { productId: kanga.id, capacityOverride: 5 },
    ]);
    prisma.bookingProduct.aggregate.mockResolvedValue({
      _sum: { quantity: 5 },
    });

    await expect(
      service.create({
        ...createBookingDto,
        products: [{ productId: kanga.id, quantity: 1 }],
      }),
    ).rejects.toThrow(
      'Kanga Skating Aid does not have enough capacity for this Session. Requested: 1. Remaining: 0.',
    );
  });

  it('holds finite inventory independently for each Product Variant', async () => {
    const hoodie = {
      id: 'product-hoodie',
      name: 'Event Hoodie',
      slug: 'event-hoodie',
      eventId: 'event-1',
      status: 'ACTIVE',
      availableOnline: true,
      minQuantity: 0,
      maxQuantity: null,
      price: new Prisma.Decimal(60),
      inventoryTracked: false,
      inventoryQuantity: null,
      capacityControlled: false,
      capacity: null,
    };
    const small = {
      id: 'variant-small',
      productId: hoodie.id,
      name: 'Small',
      status: 'ACTIVE',
      availableOnline: true,
      inventoryTracked: true,
      inventoryQuantity: 50,
      priceOverride: new Prisma.Decimal(55),
    };

    prisma.product.findMany.mockResolvedValue([hoodie]);
    prisma.productVariant.findMany.mockResolvedValue([small]);
    prisma.sessionProduct.findMany.mockResolvedValue([
      { productId: hoodie.id, capacityOverride: null },
    ]);
    prisma.bookingProduct.aggregate.mockResolvedValue({
      _sum: { quantity: 49 },
    });

    await expect(
      service.create({
        ...createBookingDto,
        products: [
          {
            productId: hoodie.id,
            productVariantId: small.id,
            quantity: 2,
          },
        ],
      }),
    ).rejects.toThrow(
      'Small does not have enough inventory available. Requested: 2. Remaining: 1.',
    );

    expect(prisma.bookingProduct.aggregate).toHaveBeenCalledWith({
      where: {
        productVariantId: small.id,
        booking: {
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

  it('persists the selected Product Variant and its price override', async () => {
    const hoodie = {
      id: 'product-hoodie',
      name: 'Event Hoodie',
      slug: 'event-hoodie',
      eventId: 'event-1',
      status: 'ACTIVE',
      availableOnline: true,
      minQuantity: 0,
      maxQuantity: null,
      price: new Prisma.Decimal(60),
      inventoryTracked: false,
      inventoryQuantity: null,
      capacityControlled: false,
      capacity: null,
    };
    const small = {
      id: 'variant-small',
      productId: hoodie.id,
      name: 'Small',
      status: 'ACTIVE',
      availableOnline: true,
      inventoryTracked: true,
      inventoryQuantity: 50,
      priceOverride: new Prisma.Decimal(55),
    };

    prisma.product.findMany.mockResolvedValue([hoodie]);
    prisma.productVariant.findMany.mockResolvedValue([small]);
    prisma.sessionProduct.findMany.mockResolvedValue([
      { productId: hoodie.id, capacityOverride: null },
    ]);

    await service.create({
      ...createBookingDto,
      products: [
        {
          productId: hoodie.id,
          productVariantId: small.id,
          quantity: 1,
        },
      ],
    });

    expect(prisma.booking.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          products: {
            create: [
              {
                productId: hoodie.id,
                productVariantId: small.id,
                quantity: 1,
                unitPrice: new Prisma.Decimal(55),
              },
            ],
          },
        }),
      }),
    );
  });

  it('creates bookings in a serializable capacity transaction', async () => {
    await service.create(createBookingDto);

    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
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

  it('prices and persists one pending entitlement for a selected participant', async () => {
    flexibleTicketPolicies.resolveReservationPolicy.mockResolvedValue({
      sourceMode: 'INHERIT',
      policy: {
        id: 'policy-1',
        version: 2,
        feeType: 'FIXED',
        feeValue: new Prisma.Decimal(5),
        currency: 'AUD',
        allowsSessionChange: true,
        allowsRefundRequest: true,
        cutoffMinutesBeforeSession: 1440,
        permittedUseLimit: 1,
        priceIncreaseTreatment: 'CUSTOMER_PAYS_DIFFERENCE',
        priceDecreaseTreatment: 'KEEP_ORIGINAL_PRICE',
        feeRefundability: 'NON_REFUNDABLE',
        customerSummary: 'Peace of mind.',
        materialTerms: 'Test terms.',
      },
    });
    flexibleTicketPolicies.calculateFee.mockReturnValue(new Prisma.Decimal(5));

    const result = await service.create({
      ...createBookingDto,
      flexibleTicketPolicyId: 'policy-1',
      flexibleTicketParticipantIndexes: [0],
    });

    expect(
      flexibleTicketPolicies.resolveReservationPolicy,
    ).toHaveBeenCalledTimes(2);
    expect(prisma.booking.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          total: new Prisma.Decimal(29),
          flexibleBooking: false,
          participants: {
            create: [
              expect.objectContaining({
                id: expect.any(String),
                ticketTypeId: 'ticket-adult',
              }),
            ],
          },
        }),
      }),
    );
    expect(prisma.flexibleTicketEntitlement.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          bookingId: 'booking-1',
          participantId: expect.any(String),
          policyId: 'policy-1',
          ticketFaceValueSnapshot: new Prisma.Decimal(24),
          feeAmount: new Prisma.Decimal(5),
          remainingUses: 1,
        }),
      ],
    });
    expect(result.booking).toEqual(
      expect.objectContaining({
        flexibleTicketEntitlements: [
          expect.objectContaining({ feeAmount: new Prisma.Decimal(5) }),
        ],
      }),
    );
  });

  it('rejects legacy Booking-level flexibility authority', async () => {
    await expect(
      service.create({ ...createBookingDto, flexibleBooking: true }),
    ).rejects.toThrow('legacy Flexible Booking option is no longer accepted');
    expect(prisma.booking.create).not.toHaveBeenCalled();
  });

  it('rejects duplicate or out-of-range participant coverage', async () => {
    await expect(
      service.create({
        ...createBookingDto,
        flexibleTicketPolicyId: 'policy-1',
        flexibleTicketParticipantIndexes: [0, 0],
      }),
    ).rejects.toThrow('cannot receive Flexible Ticket twice');

    await expect(
      service.create({
        ...createBookingDto,
        flexibleTicketPolicyId: 'policy-1',
        flexibleTicketParticipantIndexes: [1],
      }),
    ).rejects.toThrow('Flexible Ticket selections are invalid');
  });
});
