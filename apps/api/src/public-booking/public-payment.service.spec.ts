import { NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';

import { PaymentService } from '../payment/payment.service';
import { PublicPaymentService } from './public-payment.service';

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

  beforeEach(() => {
    jest.clearAllMocks();

    service = new PublicPaymentService(
      prisma as never,
      paymentService as unknown as PaymentService,
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
});
