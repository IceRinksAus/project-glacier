import { NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';

import { PaymentService } from '../payment/payment.service';
import { PublicPaymentService } from './public-payment.service';
import { TicketCredentialService } from '../ticket/ticket-credential.service';

describe('PublicPaymentService', () => {
  let service: PublicPaymentService;

  const prisma = {
    booking: {
      findFirst: jest.fn(),
    },
  };

  const paymentService = {
    createPayment: jest.fn(),
  };
  const ticketCredentials = {
    present: jest.fn(() => 'current-ticket-token'),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new PublicPaymentService(
      prisma as never,
      paymentService as unknown as PaymentService,
      ticketCredentials as unknown as TicketCredentialService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should hash the supplied public access token before looking up the booking', async () => {
    const publicAccessToken = 'customer-public-access-token';

    const expectedHash = createHash('sha256')
      .update(publicAccessToken)
      .digest('hex');

    prisma.booking.findFirst.mockResolvedValue({
      id: 'booking-1',
    });

    paymentService.createPayment.mockResolvedValue({
      provider: 'MOCK',
      paymentReference: 'mock-payment-1',
      status: 'PENDING',
    });

    await service.createPayment('booking-1', publicAccessToken);

    expect(prisma.booking.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'booking-1',
        publicAccessTokenHash: expectedHash,
      },
      select: {
        id: true,
      },
    });
  });

  it('should reject an unknown booking without calling the payment service', async () => {
    prisma.booking.findFirst.mockResolvedValue(null);

    await expect(
      service.createPayment('missing-booking', 'some-token'),
    ).rejects.toThrow(
      new NotFoundException('Booking not found or access token invalid.'),
    );

    expect(paymentService.createPayment).not.toHaveBeenCalled();
  });

  it('should reject an invalid public access token without revealing whether the booking exists', async () => {
    prisma.booking.findFirst.mockResolvedValue(null);

    await expect(
      service.createPayment('booking-1', 'wrong-token'),
    ).rejects.toThrow(
      new NotFoundException('Booking not found or access token invalid.'),
    );

    expect(paymentService.createPayment).not.toHaveBeenCalled();
  });

  it('should delegate to PaymentService only after public booking access is verified', async () => {
    prisma.booking.findFirst.mockResolvedValue({
      id: 'booking-1',
    });

    paymentService.createPayment.mockResolvedValue({
      provider: 'MOCK',
      paymentReference: 'mock-payment-1',
      status: 'PENDING',
    });

    const result = await service.createPayment(
      'booking-1',
      'valid-public-token',
    );

    expect(paymentService.createPayment).toHaveBeenCalledTimes(1);

    expect(paymentService.createPayment).toHaveBeenCalledWith('booking-1');

    expect(result).toEqual({
      provider: 'MOCK',
      paymentReference: 'mock-payment-1',
      status: 'PENDING',
    });
  });

  it('should return a minimised pending Booking status without exposing Tickets', async () => {
    prisma.booking.findFirst.mockResolvedValue({
      id: 'booking-1',
      bookingNumber: 'PG-1',
      status: 'RESERVED',
      paymentStatus: 'UNPAID',
      total: 24,
      reservedUntil: new Date('2027-07-05T00:15:00.000Z'),
      confirmedAt: null,
      paidAt: null,
      event: {
        name: 'Test Event',
        slug: 'test-event',
        waiver: { publicSlug: 'test-waiver' },
      },
      tickets: [
        {
          ticketNumber: 'TKT-1',
          secureToken: 'ticket-token',
          status: 'ACTIVE',
          participant: { firstName: 'Jamie', lastName: 'Test' },
        },
      ],
      flexibleTicketEntitlements: [],
    });

    const result = await service.getBookingStatus(
      'booking-1',
      'valid-public-token',
    );

    expect(prisma.booking.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'booking-1',
          publicAccessTokenHash: createHash('sha256')
            .update('valid-public-token')
            .digest('hex'),
        },
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        bookingNumber: 'PG-1',
        status: 'RESERVED',
        paymentStatus: 'UNPAID',
        event: {
          name: 'Test Event',
          slug: 'test-event',
          waiverPublicSlug: 'test-waiver',
        },
        tickets: [],
      }),
    );
  });

  it('should expose issued Ticket presentation credentials only after confirmation', async () => {
    const ticket = {
      id: 'ticket-1',
      ticketNumber: 'TKT-1',
      credentialSelector: 'a'.repeat(32),
      credentialKeyId: 'local-v1',
      status: 'ACTIVE',
      participant: { firstName: 'Jamie', lastName: 'Test' },
    };
    prisma.booking.findFirst.mockResolvedValue({
      id: 'booking-1',
      bookingNumber: 'PG-1',
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      total: 24,
      reservedUntil: null,
      confirmedAt: new Date('2027-07-05T00:01:00.000Z'),
      paidAt: new Date('2027-07-05T00:01:00.000Z'),
      event: { name: 'Test Event', slug: 'test-event', waiver: null },
      tickets: [ticket],
      flexibleTicketEntitlements: [],
    });

    const result = await service.getBookingStatus(
      'booking-1',
      'valid-public-token',
    );

    expect(result.tickets).toEqual([
      {
        ticketNumber: 'TKT-1',
        secureToken: 'current-ticket-token',
        status: 'ACTIVE',
        participant: { firstName: 'Jamie', lastName: 'Test' },
      },
    ]);
  });

  it('should reject a status request with the same non-enumerating response', async () => {
    prisma.booking.findFirst.mockResolvedValue(null);

    await expect(
      service.getBookingStatus('booking-1', 'wrong-token'),
    ).rejects.toThrow(
      new NotFoundException('Booking not found or access token invalid.'),
    );
  });
});
