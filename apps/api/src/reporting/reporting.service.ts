import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { fromZonedTime } from 'date-fns-tz';

import { PrismaService } from '../prisma/prisma.service';
import { EventReportQueryDto } from './dto/event-report-query.dto';

@Injectable()
export class ReportingService {
  constructor(private readonly prisma: PrismaService) {}

  async getEventReport(
    organizationId: string,
    eventId: string,
    query: EventReportQueryDto,
  ) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, organizationId },
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
        timezone: true,
      },
    });
    if (!event) throw new NotFoundException('Event not found.');

    const timezone = event.timezone || 'Australia/Melbourne';
    const dateWindow = query.date
      ? this.eventDateWindow(query.date, timezone)
      : null;

    const sessions = await this.prisma.session.findMany({
      where: {
        eventId,
        ...(query.sessionId ? { id: query.sessionId } : {}),
        ...(dateWindow
          ? { startDate: { gte: dateWindow.start, lt: dateWindow.end } }
          : {}),
      },
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
        capacity: true,
      },
      orderBy: [{ startDate: 'asc' }, { id: 'asc' }],
      take: 500,
    });

    if (query.sessionId && sessions.length === 0) {
      throw new NotFoundException(
        'Session not found for this Event and filter.',
      );
    }

    const sessionIds = sessions.map(({ id }) => id);
    const bookings = sessionIds.length
      ? await this.prisma.booking.findMany({
          where: { eventId, sessionId: { in: sessionIds } },
          select: {
            id: true,
            bookingNumber: true,
            sessionId: true,
            status: true,
            total: true,
            items: { select: { quantity: true } },
            tickets: {
              select: { id: true, status: true, checkedInAt: true },
            },
            payments: {
              select: {
                id: true,
                status: true,
                amount: true,
                refunds: {
                  select: { status: true, amount: true },
                },
              },
            },
            paymentReconciliationAttempts: {
              select: {
                succeeded: true,
                outcome: true,
                attemptedAt: true,
              },
              orderBy: { attemptedAt: 'desc' },
              take: 1,
            },
          },
        })
      : [];

    const confirmedBookings = bookings.filter(
      ({ status }) => status === 'CONFIRMED',
    );
    const successfulPayments = bookings.flatMap(({ payments }) =>
      payments.filter(({ status }) => status === 'SUCCEEDED'),
    );
    const successfulRefunds = successfulPayments.flatMap(({ refunds }) =>
      refunds.filter(({ status }) => status === 'SUCCEEDED'),
    );
    const grossCollected = this.sum(
      successfulPayments.map(({ amount }) => Number(amount)),
    );
    const refunded = this.sum(
      successfulRefunds.map(({ amount }) => Number(amount)),
    );
    const issuedTickets = confirmedBookings.flatMap(({ tickets }) => tickets);
    const admissions = issuedTickets.filter(
      ({ status, checkedInAt }) => status === 'SCANNED' || checkedInAt !== null,
    ).length;
    const pendingPaymentBookings = bookings.filter(({ payments }) =>
      payments.some(({ status }) => status === 'PENDING'),
    );

    const sessionRows = sessions.map((session) => {
      const sessionBookings = bookings.filter(
        ({ sessionId }) => sessionId === session.id,
      );
      const reservedAttendance = this.ticketQuantity(
        sessionBookings.filter(({ status }) =>
          ['RESERVED', 'CONFIRMED'].includes(status),
        ),
      );
      const confirmedAttendance = this.ticketQuantity(
        sessionBookings.filter(({ status }) => status === 'CONFIRMED'),
      );
      const tickets = sessionBookings
        .filter(({ status }) => status === 'CONFIRMED')
        .flatMap(({ tickets }) => tickets);
      const admitted = tickets.filter(
        ({ status, checkedInAt }) =>
          status === 'SCANNED' || checkedInAt !== null,
      ).length;

      return {
        ...session,
        reservedAttendance,
        confirmedAttendance,
        remainingCapacity: Math.max(session.capacity - reservedAttendance, 0),
        utilisationPercent:
          session.capacity > 0
            ? Number(((reservedAttendance / session.capacity) * 100).toFixed(1))
            : 0,
        ticketsIssued: tickets.length,
        admissions: admitted,
      };
    });

    return {
      event: { ...event, timezone },
      filter: {
        date: query.date ?? null,
        sessionId: query.sessionId ?? null,
        startsAt: dateWindow?.start ?? event.startDate,
        endsAt: dateWindow?.end ?? event.endDate,
      },
      commercial: {
        confirmedBookings: confirmedBookings.length,
        grossCollected,
        refunded,
        netCollected: Number((grossCollected - refunded).toFixed(2)),
        averageBookingValue:
          confirmedBookings.length > 0
            ? Number(
                (
                  this.sum(
                    confirmedBookings.map(({ total }) => Number(total)),
                  ) / confirmedBookings.length
                ).toFixed(2),
              )
            : 0,
      },
      tickets: {
        issued: issuedTickets.length,
        admissions,
        attendanceRate:
          issuedTickets.length > 0
            ? Number(((admissions / issuedTickets.length) * 100).toFixed(1))
            : 0,
      },
      bookings: {
        total: bookings.length,
        byStatus: this.countBy(bookings.map(({ status }) => status)),
      },
      payments: {
        byStatus: this.countBy(
          bookings.flatMap(({ payments }) =>
            payments.map(({ status }) => status),
          ),
        ),
        exceptionCount: pendingPaymentBookings.length,
        exceptions: pendingPaymentBookings.slice(0, 25).map((booking) => ({
          bookingId: booking.id,
          bookingNumber: booking.bookingNumber,
          latestReconciliation:
            booking.paymentReconciliationAttempts[0] ?? null,
        })),
      },
      sessions: sessionRows,
    };
  }

  private eventDateWindow(date: string, timezone: string) {
    const parsed = new Date(`${date}T00:00:00.000Z`);
    if (
      Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== date
    ) {
      throw new BadRequestException('date must be a valid calendar date.');
    }
    const next = new Date(parsed);
    next.setUTCDate(next.getUTCDate() + 1);
    const nextDate = next.toISOString().slice(0, 10);
    return {
      start: fromZonedTime(`${date}T00:00:00`, timezone),
      end: fromZonedTime(`${nextDate}T00:00:00`, timezone),
    };
  }

  private ticketQuantity(
    bookings: Array<{ items: Array<{ quantity: number }> }>,
  ) {
    return bookings.reduce(
      (total, booking) =>
        total + booking.items.reduce((sum, item) => sum + item.quantity, 0),
      0,
    );
  }

  private sum(values: number[]) {
    return Number(values.reduce((total, value) => total + value, 0).toFixed(2));
  }

  private countBy(values: string[]) {
    return values.reduce<Record<string, number>>((counts, value) => {
      counts[value] = (counts[value] ?? 0) + 1;
      return counts;
    }, {});
  }
}
