import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

import { PrismaService } from '../prisma/prisma.service';
import { EventReportQueryDto } from './dto/event-report-query.dto';

@Injectable()
export class ReportingService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrganizationSummary(
    organizationId: string,
    now: Date = new Date(),
  ) {
    const events = await this.prisma.event.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        startDate: true,
        endDate: true,
        timezone: true,
      },
      orderBy: [{ startDate: 'asc' }, { id: 'asc' }],
      take: 100,
    });
    const eventIds = events.map(({ id }) => id);
    const sessions = eventIds.length
      ? await this.prisma.session.findMany({
          where: { eventId: { in: eventIds } },
          select: {
            id: true,
            eventId: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true,
            capacity: true,
          },
          orderBy: [{ startDate: 'asc' }, { id: 'asc' }],
          take: 5000,
        })
      : [];
    const bookings = eventIds.length
      ? await this.prisma.booking.findMany({
          where: { eventId: { in: eventIds } },
          select: {
            eventId: true,
            sessionId: true,
            status: true,
            items: { select: { quantity: true } },
            tickets: {
              select: { status: true, checkedInAt: true },
            },
            payments: {
              select: {
                status: true,
                amount: true,
                refunds: { select: { status: true, amount: true } },
              },
            },
          },
          take: 50000,
        })
      : [];

    const eventRows = events.map((event) => {
      const eventSessions = sessions.filter(
        ({ eventId }) => eventId === event.id,
      );
      const eventBookings = bookings.filter(
        ({ eventId }) => eventId === event.id,
      );
      const confirmed = eventBookings.filter(
        ({ status }) => status === 'CONFIRMED',
      );
      const tickets = confirmed.flatMap(({ tickets }) => tickets);
      const admissions = tickets.filter(
        ({ status, checkedInAt }) =>
          status === 'SCANNED' || checkedInAt !== null,
      ).length;
      const successfulPayments = eventBookings.flatMap(({ payments }) =>
        payments.filter(({ status }) => status === 'SUCCEEDED'),
      );
      const grossCollected = this.sum(
        successfulPayments.map(({ amount }) => Number(amount)),
      );
      const refunded = this.sum(
        successfulPayments.flatMap(({ refunds }) =>
          refunds
            .filter(({ status }) => status === 'SUCCEEDED')
            .map(({ amount }) => Number(amount)),
        ),
      );
      const reservedAttendance = this.ticketQuantity(
        eventBookings.filter(({ status }) =>
          ['RESERVED', 'CONFIRMED'].includes(status),
        ),
      );
      const totalCapacity = eventSessions.reduce(
        (total, session) => total + session.capacity,
        0,
      );
      const timezone = event.timezone || 'Australia/Melbourne';
      const today = formatInTimeZone(now, timezone, 'yyyy-MM-dd');
      const todaySessions = eventSessions.filter(
        ({ startDate }) =>
          formatInTimeZone(startDate, timezone, 'yyyy-MM-dd') === today,
      );
      const nextSession = eventSessions.find(
        ({ startDate }) => startDate >= now,
      );

      return {
        event: { ...event, timezone },
        lifecycle:
          now < event.startDate
            ? 'UPCOMING'
            : now > event.endDate
              ? 'COMPLETED'
              : 'CURRENT',
        sessions: {
          total: eventSessions.length,
          today: todaySessions.length,
          next: nextSession
            ? {
                id: nextSession.id,
                name: nextSession.name,
                startDate: nextSession.startDate,
              }
            : null,
          totalCapacity,
          reservedAttendance,
          utilisationPercent:
            totalCapacity > 0
              ? Number(
                  ((reservedAttendance / totalCapacity) * 100).toFixed(1),
                )
              : 0,
        },
        bookings: { confirmed: confirmed.length },
        tickets: { issued: tickets.length, admissions },
        commercial: {
          grossCollected,
          refunded,
          netCollected: Number((grossCollected - refunded).toFixed(2)),
        },
        paymentExceptionCount: eventBookings.filter(({ payments }) =>
          payments.some(({ status }) => status === 'PENDING'),
        ).length,
      };
    });

    return {
      generatedAt: now,
      totals: {
        events: eventRows.length,
        currentEvents: eventRows.filter(({ lifecycle }) => lifecycle === 'CURRENT')
          .length,
        upcomingEvents: eventRows.filter(
          ({ lifecycle }) => lifecycle === 'UPCOMING',
        ).length,
        sessionsToday: eventRows.reduce(
          (total, row) => total + row.sessions.today,
          0,
        ),
        confirmedBookings: eventRows.reduce(
          (total, row) => total + row.bookings.confirmed,
          0,
        ),
        ticketsIssued: eventRows.reduce(
          (total, row) => total + row.tickets.issued,
          0,
        ),
        admissions: eventRows.reduce(
          (total, row) => total + row.tickets.admissions,
          0,
        ),
        grossCollected: this.sum(
          eventRows.map(({ commercial }) => commercial.grossCollected),
        ),
        refunded: this.sum(
          eventRows.map(({ commercial }) => commercial.refunded),
        ),
        netCollected: this.sum(
          eventRows.map(({ commercial }) => commercial.netCollected),
        ),
        paymentExceptions: eventRows.reduce(
          (total, row) => total + row.paymentExceptionCount,
          0,
        ),
      },
      events: eventRows,
    };
  }

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
    const paymentExceptionBookings = bookings.filter(
      ({ payments, paymentReconciliationAttempts }) =>
        payments.some(({ status }) => status === 'PENDING') ||
        paymentReconciliationAttempts[0]?.succeeded === false,
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
        exceptionCount: paymentExceptionBookings.length,
        exceptions: paymentExceptionBookings.slice(0, 25).map((booking) => ({
          bookingId: booking.id,
          bookingNumber: booking.bookingNumber,
          latestReconciliation:
            booking.paymentReconciliationAttempts[0] ?? null,
        })),
      },
      sessions: sessionRows,
    };
  }

  async getTicketTypeSales(organizationId: string, eventId: string, query: EventReportQueryDto) {
    const { event, sessions } = await this.detailedScope(organizationId, eventId, query);
    const sessionIds = sessions.map(({ id }) => id);
    const [ticketTypes, bookings] = await Promise.all([
      this.prisma.ticketType.findMany({
        where: { eventId },
        select: { id: true, name: true, active: true },
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        take: 500,
      }),
      sessionIds.length
        ? this.prisma.booking.findMany({
            where: { eventId, sessionId: { in: sessionIds }, status: 'CONFIRMED' },
            select: {
              items: { select: { ticketTypeId: true, quantity: true, totalPrice: true } },
              tickets: { select: { status: true, checkedInAt: true, participant: { select: { ticketTypeId: true } } } },
            },
            take: 50000,
          })
        : Promise.resolve([]),
    ]);
    const totalUnits = bookings.flatMap(({ items }) => items).reduce((sum, item) => sum + item.quantity, 0);
    const rows = ticketTypes.map((ticketType) => {
      const items = bookings.flatMap(({ items }) => items).filter(({ ticketTypeId }) => ticketTypeId === ticketType.id);
      const tickets = bookings.flatMap(({ tickets }) => tickets).filter(({ participant }) => participant.ticketTypeId === ticketType.id);
      const unitsSold = items.reduce((sum, item) => sum + item.quantity, 0);
      return {
        ...ticketType,
        unitsSold,
        grossItemSales: this.sum(items.map(({ totalPrice }) => Number(totalPrice))),
        unitSharePercent: totalUnits > 0 ? Number(((unitsSold / totalUnits) * 100).toFixed(1)) : 0,
        ticketsIssued: tickets.length,
        admissions: tickets.filter(({ status, checkedInAt }) => status === 'SCANNED' || checkedInAt !== null).length,
      };
    });
    return {
      event,
      filter: { date: query.date ?? null, sessionId: query.sessionId ?? null },
      totals: {
        unitsSold: totalUnits,
        grossItemSales: this.sum(rows.map(({ grossItemSales }) => grossItemSales)),
        ticketsIssued: rows.reduce((sum, row) => sum + row.ticketsIssued, 0),
        admissions: rows.reduce((sum, row) => sum + row.admissions, 0),
      },
      refundAllocation: 'UNALLOCATED_AT_EVENT_OR_SESSION_LEVEL',
      rows,
    };
  }

  async getSessionSales(organizationId: string, eventId: string, query: EventReportQueryDto) {
    const { event, sessions } = await this.detailedScope(organizationId, eventId, query);
    const sessionIds = sessions.map(({ id }) => id);
    const bookings = sessionIds.length
      ? await this.prisma.booking.findMany({
          where: { eventId, sessionId: { in: sessionIds } },
          select: {
            sessionId: true, status: true, total: true,
            items: { select: { quantity: true } },
            tickets: { select: { status: true, checkedInAt: true } },
            payments: { select: { status: true, amount: true, refunds: { select: { status: true, amount: true } } } },
          },
          take: 50000,
        })
      : [];
    const rows = sessions.map((session) => {
      const scoped = bookings.filter(({ sessionId }) => sessionId === session.id);
      const confirmed = scoped.filter(({ status }) => status === 'CONFIRMED');
      const successful = scoped.flatMap(({ payments }) => payments.filter(({ status }) => status === 'SUCCEEDED'));
      const grossCollected = this.sum(successful.map(({ amount }) => Number(amount)));
      const refunded = this.sum(successful.flatMap(({ refunds }) => refunds.filter(({ status }) => status === 'SUCCEEDED').map(({ amount }) => Number(amount))));
      const reserved = this.ticketQuantity(scoped.filter(({ status }) => ['RESERVED', 'CONFIRMED'].includes(status)));
      const tickets = confirmed.flatMap(({ tickets }) => tickets);
      return {
        ...session,
        confirmedBookings: confirmed.length,
        confirmedBookingValue: this.sum(confirmed.map(({ total }) => Number(total))),
        grossCollected,
        refunded,
        netCollected: Number((grossCollected - refunded).toFixed(2)),
        ticketUnits: this.ticketQuantity(confirmed),
        ticketsIssued: tickets.length,
        admissions: tickets.filter(({ status, checkedInAt }) => status === 'SCANNED' || checkedInAt !== null).length,
        reservedAttendance: reserved,
        remainingCapacity: Math.max(session.capacity - reserved, 0),
        utilisationPercent: session.capacity > 0 ? Number(((reserved / session.capacity) * 100).toFixed(1)) : 0,
      };
    });
    return { event, filter: { date: query.date ?? null, sessionId: query.sessionId ?? null }, rows };
  }

  private async detailedScope(organizationId: string, eventId: string, query: EventReportQueryDto) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, organizationId },
      select: { id: true, name: true, timezone: true },
    });
    if (!event) throw new NotFoundException('Event not found.');
    const timezone = event.timezone || 'Australia/Melbourne';
    const dateWindow = query.date ? this.eventDateWindow(query.date, timezone) : null;
    const sessions = await this.prisma.session.findMany({
      where: {
        eventId,
        ...(query.sessionId ? { id: query.sessionId } : {}),
        ...(dateWindow ? { startDate: { gte: dateWindow.start, lt: dateWindow.end } } : {}),
      },
      select: { id: true, name: true, status: true, startDate: true, endDate: true, capacity: true },
      orderBy: [{ startDate: 'asc' }, { id: 'asc' }],
      take: 500,
    });
    if (query.sessionId && sessions.length === 0) throw new NotFoundException('Session not found for this Event and filter.');
    return { event: { ...event, timezone }, sessions };
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
