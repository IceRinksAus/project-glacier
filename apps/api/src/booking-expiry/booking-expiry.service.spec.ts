import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { BookingExpiryService } from './booking-expiry.service';

describe('BookingExpiryService', () => {
  let service: BookingExpiryService;

  const prismaMock = {
    booking: {
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingExpiryService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<BookingExpiryService>(
      BookingExpiryService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should expire overdue reserved bookings', async () => {
    prismaMock.booking.updateMany.mockResolvedValue({
      count: 2,
    });

    await service.expireReservations();

    expect(prismaMock.booking.updateMany).toHaveBeenCalledTimes(1);

    expect(prismaMock.booking.updateMany).toHaveBeenCalledWith({
      where: {
        status: 'RESERVED',
        reservedUntil: {
          lt: expect.any(Date),
        },
      },
      data: {
        status: 'EXPIRED',
        expiredAt: expect.any(Date),
      },
    });
  });

  it('should handle no overdue reservations', async () => {
    prismaMock.booking.updateMany.mockResolvedValue({
      count: 0,
    });

    await expect(
      service.expireReservations(),
    ).resolves.toBeUndefined();

    expect(prismaMock.booking.updateMany).toHaveBeenCalledTimes(1);
  });

  it('should propagate database errors', async () => {
    prismaMock.booking.updateMany.mockRejectedValue(
      new Error('Database unavailable'),
    );

    await expect(
      service.expireReservations(),
    ).rejects.toThrow('Database unavailable');
  });
});