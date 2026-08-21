import { PublicBookingController } from './public-booking.controller';
import { PublicBookingService } from './public-booking.service';
import { PublicPaymentService } from './public-payment.service';
import { FileAssetService } from '../file-asset/file-asset.service';

describe('PublicBookingController', () => {
  let controller: PublicBookingController;

  const publicBookingService = {
    findEvent: jest.fn(),
    findSessions: jest.fn(),
    findTicketTypes: jest.fn(),
    evaluateRules: jest.fn(),
    findSessionProducts: jest.fn(),
    createCustomer: jest.fn(),
    createBooking: jest.fn(),
  };

  const publicPaymentService = {
    createPayment: jest.fn(),
    getBookingStatus: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    controller = new PublicBookingController(
      publicBookingService as unknown as PublicBookingService,
      publicPaymentService as unknown as PublicPaymentService,
      { getPublicBrandingAsset: jest.fn() } as unknown as FileAssetService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return a public event', async () => {
    const event = {
      id: 'event-1',
      name: 'Australian Ice Festival 2027',
      slug: 'australian-ice-festival-2027',
      description: 'A winter ice skating festival.',
      startDate: new Date('2027-06-25T00:00:00.000Z'),
      endDate: new Date('2027-07-18T23:59:59.999Z'),
      timezone: 'Australia/Melbourne',
      status: 'ACTIVE',
    };

    publicBookingService.findEvent.mockResolvedValue(event);

    const result = await controller.findEvent('event-1');

    expect(publicBookingService.findEvent).toHaveBeenCalledWith('event-1');

    expect(result).toEqual(event);
  });

  it('should return public sessions for an event', async () => {
    const sessions = [
      {
        id: 'session-1',
        name: 'Morning Public Skate',
        startDate: new Date('2027-07-05T00:00:00.000Z'),
        endDate: new Date('2027-07-05T01:00:00.000Z'),
        capacity: 200,
        status: 'ACTIVE',
        salesStart: null,
        salesEnd: null,
        eventId: 'event-1',
      },
    ];

    publicBookingService.findSessions.mockResolvedValue(sessions);

    const result = await controller.findSessions('event-1');

    expect(publicBookingService.findSessions).toHaveBeenCalledWith('event-1');

    expect(result).toEqual(sessions);
  });

  it('should return public ticket types for an event', async () => {
    const ticketTypes = [
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
    ];

    publicBookingService.findTicketTypes.mockResolvedValue(ticketTypes);

    const result = await controller.findTicketTypes('event-1');

    expect(publicBookingService.findTicketTypes).toHaveBeenCalledWith(
      'event-1',
    );

    expect(result).toEqual(ticketTypes);
  });

  it('should evaluate public booking rules', async () => {
    const evaluationData = {
      sessionId: 'session-1',
      flexibleBooking: false,
      participants: [
        {
          firstName: 'Young',
          lastName: 'Skater',
          age: 4,
          ticketTypeId: 'ticket-type-1',
        },
      ],
    };

    const evaluationResult = {
      valid: true,
      matchedRuleIds: ['rule-kanga-age-3-5'],
      requiredProducts: [
        {
          productSlug: 'kanga-skating-aid',
          quantity: 1,
          ruleIds: ['rule-kanga-age-3-5'],
          messages: ['Children aged 3 to 5 require a Kanga Skating Aid.'],
        },
      ],
      errors: [],
      warnings: [],
    };

    publicBookingService.evaluateRules.mockResolvedValue(evaluationResult);

    const result = await controller.evaluateRules('event-1', evaluationData);

    expect(publicBookingService.evaluateRules).toHaveBeenCalledWith(
      'event-1',
      evaluationData,
    );

    expect(result).toEqual(evaluationResult);
  });

  it('should return public products for a session', async () => {
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

    publicBookingService.findSessionProducts.mockResolvedValue(sessionProducts);

    const result = await controller.findSessionProducts('session-1');

    expect(publicBookingService.findSessionProducts).toHaveBeenCalledWith(
      'session-1',
    );

    expect(result).toEqual(sessionProducts);
  });

  it('should create a public customer', async () => {
    const customerData = {
      firstName: 'Jamie',
      lastName: 'Stoller',
      email: 'jamie@example.com',
      phone: '0400000000',
    };

    const createdCustomer = {
      id: 'customer-1',
      ...customerData,
    };

    publicBookingService.createCustomer.mockResolvedValue(createdCustomer);

    const result = await controller.createCustomer(customerData);

    expect(publicBookingService.createCustomer).toHaveBeenCalledWith(
      customerData,
    );

    expect(result).toEqual(createdCustomer);
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
          ticketTypeId: 'ticket-type-1',
        },
      ],
      products: [],
    };

    const createdBookingResult = {
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
        reservedUntil: new Date('2027-07-05T00:15:00.000Z'),
        publicAccessToken: 'public-access-token',
      },
      ruleEvaluation: {
        valid: true,
        matchedRuleIds: [],
        requiredProducts: [],
        errors: [],
        warnings: [],
      },
    };

    publicBookingService.createBooking.mockResolvedValue(createdBookingResult);

    const result = await controller.createBooking(bookingData);

    expect(publicBookingService.createBooking).toHaveBeenCalledWith(
      bookingData,
    );

    expect(result).toEqual(createdBookingResult);
  });

  it('should create a public payment only through the secure public payment service', async () => {
    const paymentResult = {
      provider: 'MOCK',
      paymentReference: 'mock-payment-1',
      status: 'PENDING',
    };

    publicPaymentService.createPayment.mockResolvedValue(paymentResult);

    const result = await controller.createPayment('booking-1', {
      publicAccessToken: 'customer-public-access-token',
    });

    expect(publicPaymentService.createPayment).toHaveBeenCalledWith(
      'booking-1',
      'customer-public-access-token',
    );

    expect(result).toEqual(paymentResult);
  });

  it('should read public Booking status only through the secure public payment service', async () => {
    const statusResult = {
      bookingNumber: 'PG-1234',
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      tickets: [],
    };
    publicPaymentService.getBookingStatus.mockResolvedValue(statusResult);

    const result = await controller.getBookingStatus('booking-1', {
      publicAccessToken: 'customer-public-access-token',
    });

    expect(publicPaymentService.getBookingStatus).toHaveBeenCalledWith(
      'booking-1',
      'customer-public-access-token',
    );
    expect(result).toEqual(statusResult);
  });
});
