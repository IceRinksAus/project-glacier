import { BookingReservationService } from './booking-reservation.service';

describe('BookingReservationService', () => {
  let service: BookingReservationService;

  const prisma = {
    booking: {
      updateMany: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const paymentService = {
    resolvePendingPaymentForExpiredBooking:
      jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    prisma.booking.updateMany.mockResolvedValue({
      count: 0,
    });

    prisma.booking.findMany.mockResolvedValue(
      [],
    );

    service =
      new BookingReservationService(
        prisma as never,
        paymentService as never,
      );
  });

  it('should expire overdue reserved bookings', async () => {
    prisma.booking.updateMany.mockResolvedValue({
      count: 2,
    });

    await service.expireReservations();

    expect(
      prisma.booking.updateMany,
    ).toHaveBeenCalledWith({
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

  it('should find expired bookings that still have pending payments', async () => {
    await service.expireReservations();

    expect(
      prisma.booking.findMany,
    ).toHaveBeenCalledWith({
      where: {
        status: 'EXPIRED',
        payments: {
          some: {
            status: 'PENDING',
          },
        },
      },
      select: {
        id: true,
      },
    });
  });

  it('should cancel pending payments for expired bookings', async () => {
    prisma.booking.findMany.mockResolvedValue([
      {
        id: 'booking-1',
      },
      {
        id: 'booking-2',
      },
    ]);

    paymentService.resolvePendingPaymentForExpiredBooking.mockResolvedValue({
      cancelled: true,
    });

    await service.expireReservations();

    expect(
      paymentService.resolvePendingPaymentForExpiredBooking,
    ).toHaveBeenCalledTimes(2);

    expect(
      paymentService.resolvePendingPaymentForExpiredBooking,
    ).toHaveBeenCalledWith(
      'booking-1',
    );

    expect(
      paymentService.resolvePendingPaymentForExpiredBooking,
    ).toHaveBeenCalledWith(
      'booking-2',
    );
  });

  it('should continue cleanup when one provider cancellation fails', async () => {
    prisma.booking.findMany.mockResolvedValue([
      {
        id: 'booking-1',
      },
      {
        id: 'booking-2',
      },
    ]);

    paymentService.resolvePendingPaymentForExpiredBooking
      .mockRejectedValueOnce(
        new Error(
          'Stripe unavailable',
        ),
      )
      .mockResolvedValueOnce({
        cancelled: true,
      });

    await expect(
      service.expireReservations(),
    ).resolves.toBeUndefined();

    expect(
      paymentService.resolvePendingPaymentForExpiredBooking,
    ).toHaveBeenCalledTimes(2);
  });

  it('should retry cleanup for previously expired bookings', async () => {
    prisma.booking.updateMany.mockResolvedValue({
      count: 0,
    });

    prisma.booking.findMany.mockResolvedValue([
      {
        id: 'already-expired-booking',
      },
    ]);

    paymentService.resolvePendingPaymentForExpiredBooking.mockResolvedValue({
      cancelled: true,
    });

    await service.expireReservations();

    expect(
      paymentService.resolvePendingPaymentForExpiredBooking,
    ).toHaveBeenCalledWith(
      'already-expired-booking',
    );
  });
});
