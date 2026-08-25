import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

import { PrismaService } from '../prisma/prisma.service';
import {
  AccessControlService,
  AuthenticatedAccessContext,
} from '../access-control/access-control.service';
import { EventReportQueryDto } from './dto/event-report-query.dto';

@Injectable()
export class ReportingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControl: AccessControlService,
  ) {}

  async getOrganizationSummary(
    access: AuthenticatedAccessContext,
    now: Date = new Date(),
  ) {
    const events = await this.prisma.event.findMany({
      where: this.accessControl.eventWhere(access),
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
              ? Number(((reservedAttendance / totalCapacity) * 100).toFixed(1))
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
        currentEvents: eventRows.filter(
          ({ lifecycle }) => lifecycle === 'CURRENT',
        ).length,
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

  async getTicketTypeSales(
    organizationId: string,
    eventId: string,
    query: EventReportQueryDto,
  ) {
    const { event, sessions } = await this.detailedScope(
      organizationId,
      eventId,
      query,
    );
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
            where: {
              eventId,
              sessionId: { in: sessionIds },
              status: 'CONFIRMED',
            },
            select: {
              items: {
                select: {
                  ticketTypeId: true,
                  quantity: true,
                  totalPrice: true,
                },
              },
              tickets: {
                select: {
                  status: true,
                  checkedInAt: true,
                  participant: { select: { ticketTypeId: true } },
                },
              },
            },
            take: 50000,
          })
        : Promise.resolve([]),
    ]);
    const totalUnits = bookings
      .flatMap(({ items }) => items)
      .reduce((sum, item) => sum + item.quantity, 0);
    const rows = ticketTypes.map((ticketType) => {
      const items = bookings
        .flatMap(({ items }) => items)
        .filter(({ ticketTypeId }) => ticketTypeId === ticketType.id);
      const tickets = bookings
        .flatMap(({ tickets }) => tickets)
        .filter(
          ({ participant }) => participant.ticketTypeId === ticketType.id,
        );
      const unitsSold = items.reduce((sum, item) => sum + item.quantity, 0);
      return {
        ...ticketType,
        unitsSold,
        grossItemSales: this.sum(
          items.map(({ totalPrice }) => Number(totalPrice)),
        ),
        unitSharePercent:
          totalUnits > 0
            ? Number(((unitsSold / totalUnits) * 100).toFixed(1))
            : 0,
        ticketsIssued: tickets.length,
        admissions: tickets.filter(
          ({ status, checkedInAt }) =>
            status === 'SCANNED' || checkedInAt !== null,
        ).length,
      };
    });
    return {
      event,
      filter: { date: query.date ?? null, sessionId: query.sessionId ?? null },
      totals: {
        unitsSold: totalUnits,
        grossItemSales: this.sum(
          rows.map(({ grossItemSales }) => grossItemSales),
        ),
        ticketsIssued: rows.reduce((sum, row) => sum + row.ticketsIssued, 0),
        admissions: rows.reduce((sum, row) => sum + row.admissions, 0),
      },
      refundAllocation: 'UNALLOCATED_AT_EVENT_OR_SESSION_LEVEL',
      rows,
    };
  }

  async getSessionSales(
    organizationId: string,
    eventId: string,
    query: EventReportQueryDto,
  ) {
    const { event, sessions } = await this.detailedScope(
      organizationId,
      eventId,
      query,
    );
    const sessionIds = sessions.map(({ id }) => id);
    const bookings = sessionIds.length
      ? await this.prisma.booking.findMany({
          where: { eventId, sessionId: { in: sessionIds } },
          select: {
            sessionId: true,
            status: true,
            total: true,
            items: { select: { quantity: true } },
            tickets: { select: { status: true, checkedInAt: true } },
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
    const rows = sessions.map((session) => {
      const scoped = bookings.filter(
        ({ sessionId }) => sessionId === session.id,
      );
      const confirmed = scoped.filter(({ status }) => status === 'CONFIRMED');
      const successful = scoped.flatMap(({ payments }) =>
        payments.filter(({ status }) => status === 'SUCCEEDED'),
      );
      const grossCollected = this.sum(
        successful.map(({ amount }) => Number(amount)),
      );
      const refunded = this.sum(
        successful.flatMap(({ refunds }) =>
          refunds
            .filter(({ status }) => status === 'SUCCEEDED')
            .map(({ amount }) => Number(amount)),
        ),
      );
      const reserved = this.ticketQuantity(
        scoped.filter(({ status }) =>
          ['RESERVED', 'CONFIRMED'].includes(status),
        ),
      );
      const tickets = confirmed.flatMap(({ tickets }) => tickets);
      return {
        ...session,
        confirmedBookings: confirmed.length,
        confirmedBookingValue: this.sum(
          confirmed.map(({ total }) => Number(total)),
        ),
        grossCollected,
        refunded,
        netCollected: Number((grossCollected - refunded).toFixed(2)),
        ticketUnits: this.ticketQuantity(confirmed),
        ticketsIssued: tickets.length,
        admissions: tickets.filter(
          ({ status, checkedInAt }) =>
            status === 'SCANNED' || checkedInAt !== null,
        ).length,
        reservedAttendance: reserved,
        remainingCapacity: Math.max(session.capacity - reserved, 0),
        utilisationPercent:
          session.capacity > 0
            ? Number(((reserved / session.capacity) * 100).toFixed(1))
            : 0,
      };
    });
    return {
      event,
      filter: { date: query.date ?? null, sessionId: query.sessionId ?? null },
      rows,
    };
  }

  async getProductSales(
    organizationId: string,
    eventId: string,
    query: EventReportQueryDto,
  ) {
    const { event, sessions } = await this.detailedScope(
      organizationId,
      eventId,
      query,
    );
    const sessionIds = sessions.map(({ id }) => id);
    const [products, scopedBookings, committedBookings, rules] =
      await Promise.all([
        this.prisma.product.findMany({
          where: { eventId },
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            inventoryTracked: true,
            inventoryQuantity: true,
            capacityControlled: true,
            capacity: true,
            productGroup: { select: { id: true, name: true, sortOrder: true } },
            variants: {
              select: {
                id: true,
                name: true,
                status: true,
                inventoryTracked: true,
                inventoryQuantity: true,
                sortOrder: true,
              },
              orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }, { id: 'asc' }],
            },
            sessionProducts: {
              where: { sessionId: { in: sessionIds }, active: true },
              select: { sessionId: true, capacityOverride: true },
            },
          },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }, { id: 'asc' }],
          take: 1000,
        }),
        sessionIds.length
          ? this.prisma.booking.findMany({
              where: {
                eventId,
                sessionId: { in: sessionIds },
                status: 'CONFIRMED',
              },
              select: {
                id: true,
                sessionId: true,
                products: {
                  select: {
                    productId: true,
                    productVariantId: true,
                    quantity: true,
                    unitPrice: true,
                  },
                },
              },
              take: 50000,
            })
          : Promise.resolve([]),
        this.prisma.booking.findMany({
          where: { eventId, status: { in: ['RESERVED', 'CONFIRMED'] } },
          select: {
            sessionId: true,
            products: {
              select: {
                productId: true,
                productVariantId: true,
                quantity: true,
              },
            },
          },
          take: 50000,
        }),
        this.prisma.rule.findMany({
          where: { eventId, status: 'ACTIVE' },
          select: { actions: true },
          take: 1000,
        }),
      ]);

    const requiredSlugs = new Set(
      rules.flatMap(({ actions }) => {
        if (!actions || typeof actions !== 'object' || Array.isArray(actions))
          return [];
        const action = actions as Record<string, unknown>;
        return action.type === 'REQUIRE_PRODUCT' &&
          typeof action.productSlug === 'string'
          ? [action.productSlug]
          : [];
      }),
    );
    const scopedLines = scopedBookings.flatMap((booking) =>
      booking.products.map((line) => ({
        ...line,
        bookingId: booking.id,
        sessionId: booking.sessionId,
      })),
    );
    const committedLines = committedBookings.flatMap((booking) =>
      booking.products.map((line) => ({
        ...line,
        sessionId: booking.sessionId,
      })),
    );

    const rows = products.map((product) => {
      const sold = scopedLines.filter(
        ({ productId }) => productId === product.id,
      );
      const committed = committedLines.filter(
        ({ productId }) => productId === product.id,
      );
      const unitsSold = sold.reduce((total, line) => total + line.quantity, 0);
      const inventoryCommitted = committed.reduce(
        (total, line) => total + line.quantity,
        0,
      );
      const bookingCount = new Set(sold.map(({ bookingId }) => bookingId)).size;
      const capacitySessions = product.capacityControlled
        ? product.sessionProducts.map((assignment) => {
            const session = sessions.find(
              ({ id }) => id === assignment.sessionId,
            )!;
            const limit = assignment.capacityOverride ?? product.capacity;
            const reserved = committed
              .filter(({ sessionId }) => sessionId === assignment.sessionId)
              .reduce((total, line) => total + line.quantity, 0);
            return {
              sessionId: session.id,
              sessionName: session.name,
              startDate: session.startDate,
              limit,
              reserved,
              remaining: limit === null ? null : Math.max(limit - reserved, 0),
              utilisationPercent:
                limit && limit > 0
                  ? Number(((reserved / limit) * 100).toFixed(1))
                  : 0,
            };
          })
        : [];
      const peakSession =
        [...capacitySessions].sort(
          (a, b) =>
            b.utilisationPercent - a.utilisationPercent ||
            a.startDate.getTime() - b.startDate.getTime(),
        )[0] ?? null;
      const variants = product.variants.map((variant) => {
        const variantSold = sold.filter(
          ({ productVariantId }) => productVariantId === variant.id,
        );
        const variantCommitted = committed.filter(
          ({ productVariantId }) => productVariantId === variant.id,
        );
        const variantUnits = variantSold.reduce(
          (total, line) => total + line.quantity,
          0,
        );
        const currentCommitted = variantCommitted.reduce(
          (total, line) => total + line.quantity,
          0,
        );
        return {
          ...variant,
          unitsSold: variantUnits,
          grossItemSales: this.sum(
            variantSold.map((line) => Number(line.unitPrice) * line.quantity),
          ),
          inventoryCommitted: variant.inventoryTracked
            ? currentCommitted
            : null,
          inventoryRemaining:
            variant.inventoryTracked && variant.inventoryQuantity !== null
              ? Math.max(variant.inventoryQuantity - currentCommitted, 0)
              : null,
          sellThroughPercent:
            variant.inventoryTracked &&
            variant.inventoryQuantity &&
            variant.inventoryQuantity > 0
              ? Number(
                  (
                    (currentCommitted / variant.inventoryQuantity) *
                    100
                  ).toFixed(1),
                )
              : null,
        };
      });
      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        status: product.status,
        group: product.productGroup,
        requiredByRule: requiredSlugs.has(product.slug),
        unitsSold,
        grossItemSales: this.sum(
          sold.map((line) => Number(line.unitPrice) * line.quantity),
        ),
        bookingCount,
        attachRatePercent:
          scopedBookings.length > 0
            ? Number(((bookingCount / scopedBookings.length) * 100).toFixed(1))
            : 0,
        inventory: {
          tracked: product.inventoryTracked,
          quantity: product.inventoryQuantity,
          committed: product.inventoryTracked ? inventoryCommitted : null,
          remaining:
            product.inventoryTracked && product.inventoryQuantity !== null
              ? Math.max(product.inventoryQuantity - inventoryCommitted, 0)
              : null,
          sellThroughPercent:
            product.inventoryTracked &&
            product.inventoryQuantity &&
            product.inventoryQuantity > 0
              ? Number(
                  (
                    (inventoryCommitted / product.inventoryQuantity) *
                    100
                  ).toFixed(1),
                )
              : null,
        },
        capacity: {
          controlled: product.capacityControlled,
          defaultLimit: product.capacity,
          peakSession,
        },
        variants,
      };
    });
    const bookingsWithProducts = new Set(
      scopedLines.map(({ bookingId }) => bookingId),
    ).size;
    return {
      event,
      filter: { date: query.date ?? null, sessionId: query.sessionId ?? null },
      definitions: {
        inventoryScope: 'EVENT_CURRENT_RESERVED_AND_CONFIRMED',
        refundAllocation: 'UNALLOCATED_AT_EVENT_OR_SESSION_LEVEL',
      },
      totals: {
        confirmedBookings: scopedBookings.length,
        bookingsWithProducts,
        attachRatePercent:
          scopedBookings.length > 0
            ? Number(
                ((bookingsWithProducts / scopedBookings.length) * 100).toFixed(
                  1,
                ),
              )
            : 0,
        unitsSold: rows.reduce((total, row) => total + row.unitsSold, 0),
        grossItemSales: this.sum(
          rows.map(({ grossItemSales }) => grossItemSales),
        ),
      },
      rows,
    };
  }

  async getDateSales(
    organizationId: string,
    eventId: string,
    query: EventReportQueryDto,
  ) {
    const { event, sessions } = await this.detailedScope(
      organizationId,
      eventId,
      query,
    );
    const sessionIds = sessions.map(({ id }) => id);
    const bookings = sessionIds.length
      ? await this.prisma.booking.findMany({
          where: { eventId, sessionId: { in: sessionIds } },
          select: {
            sessionId: true,
            status: true,
            total: true,
            items: { select: { quantity: true } },
            tickets: { select: { status: true, checkedInAt: true } },
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
    const dates = [
      ...new Set(
        sessions.map(({ startDate }) =>
          formatInTimeZone(startDate, event.timezone, 'yyyy-MM-dd'),
        ),
      ),
    ].sort();
    const rows = dates.map((date) => {
      const dateSessions = sessions.filter(
        ({ startDate }) =>
          formatInTimeZone(startDate, event.timezone, 'yyyy-MM-dd') === date,
      );
      const dateSessionIds = new Set(dateSessions.map(({ id }) => id));
      const scoped = bookings.filter(
        ({ sessionId }) => sessionId && dateSessionIds.has(sessionId),
      );
      const confirmed = scoped.filter(({ status }) => status === 'CONFIRMED');
      const successful = scoped.flatMap(({ payments }) =>
        payments.filter(({ status }) => status === 'SUCCEEDED'),
      );
      const grossCollected = this.sum(
        successful.map(({ amount }) => Number(amount)),
      );
      const refunded = this.sum(
        successful.flatMap(({ refunds }) =>
          refunds
            .filter(({ status }) => status === 'SUCCEEDED')
            .map(({ amount }) => Number(amount)),
        ),
      );
      const tickets = confirmed.flatMap(({ tickets }) => tickets);
      const reservedAttendance = this.ticketQuantity(
        scoped.filter(({ status }) =>
          ['RESERVED', 'CONFIRMED'].includes(status),
        ),
      );
      const capacity = dateSessions.reduce(
        (total, session) => total + session.capacity,
        0,
      );
      return {
        date,
        sessionCount: dateSessions.length,
        confirmedBookings: confirmed.length,
        ticketUnits: this.ticketQuantity(confirmed),
        grossBookingValue: this.sum(
          confirmed.map(({ total }) => Number(total)),
        ),
        grossCollected,
        refunded,
        netCollected: Number((grossCollected - refunded).toFixed(2)),
        ticketsIssued: tickets.length,
        admissions: tickets.filter(
          ({ status, checkedInAt }) =>
            status === 'SCANNED' || checkedInAt !== null,
        ).length,
        capacity,
        reservedAttendance,
        remainingCapacity: Math.max(capacity - reservedAttendance, 0),
        utilisationPercent:
          capacity > 0
            ? Number(((reservedAttendance / capacity) * 100).toFixed(1))
            : 0,
      };
    });
    return {
      event,
      filter: { date: query.date ?? null, sessionId: query.sessionId ?? null },
      rows,
    };
  }

  async getSalesPace(
    organizationId: string,
    eventId: string,
    query: EventReportQueryDto,
  ) {
    const { event, sessions } = await this.detailedScope(
      organizationId,
      eventId,
      query,
    );
    const sessionIds = sessions.map(({ id }) => id);
    const bookings = sessionIds.length
      ? await this.prisma.booking.findMany({
          where: {
            eventId,
            sessionId: { in: sessionIds },
            status: 'CONFIRMED',
          },
          select: {
            sessionId: true,
            createdAt: true,
            confirmedAt: true,
            total: true,
            items: { select: { quantity: true } },
          },
          take: 50000,
        })
      : [];
    const sessionMap = new Map(
      sessions.map((session) => [session.id, session]),
    );
    const buckets = [
      {
        key: '61_PLUS',
        label: '61+ days before',
        minimum: 61,
        maximum: Number.POSITIVE_INFINITY,
      },
      { key: '31_TO_60', label: '31–60 days before', minimum: 31, maximum: 60 },
      { key: '15_TO_30', label: '15–30 days before', minimum: 15, maximum: 30 },
      { key: '8_TO_14', label: '8–14 days before', minimum: 8, maximum: 14 },
      { key: '4_TO_7', label: '4–7 days before', minimum: 4, maximum: 7 },
      { key: '2_TO_3', label: '2–3 days before', minimum: 2, maximum: 3 },
      { key: '1_DAY', label: '1 day before', minimum: 1, maximum: 1 },
      { key: 'SAME_DAY', label: 'Same day', minimum: 0, maximum: 0 },
      {
        key: 'AFTER_SESSION',
        label: 'After Session date',
        minimum: Number.NEGATIVE_INFINITY,
        maximum: -1,
      },
    ];
    const observations = bookings.map((booking) => {
      const session = sessionMap.get(booking.sessionId!);
      const sessionDate = formatInTimeZone(
        session!.startDate,
        event.timezone,
        'yyyy-MM-dd',
      );
      const bookingDate = formatInTimeZone(
        booking.createdAt,
        event.timezone,
        'yyyy-MM-dd',
      );
      return {
        daysBefore: this.calendarDayDifference(bookingDate, sessionDate),
        ticketUnits: booking.items.reduce(
          (total, item) => total + item.quantity,
          0,
        ),
        value: Number(booking.total),
        confirmedAt: booking.confirmedAt,
      };
    });
    let cumulativeTickets = 0;
    let cumulativeBookings = 0;
    const rows = buckets.map((bucket) => {
      const matches = observations.filter(
        ({ daysBefore }) =>
          daysBefore >= bucket.minimum && daysBefore <= bucket.maximum,
      );
      const ticketUnits = matches.reduce(
        (total, observation) => total + observation.ticketUnits,
        0,
      );
      cumulativeTickets += ticketUnits;
      cumulativeBookings += matches.length;
      return {
        key: bucket.key,
        label: bucket.label,
        confirmedBookings: matches.length,
        ticketUnits,
        grossBookingValue: this.sum(matches.map(({ value }) => value)),
        cumulativeBookings,
        cumulativeTicketUnits: cumulativeTickets,
      };
    });
    return {
      event,
      filter: { date: query.date ?? null, sessionId: query.sessionId ?? null },
      basis: 'BOOKING_CREATED_AT_FOR_CURRENTLY_CONFIRMED_BOOKINGS',
      confirmationDisclosure: 'CONFIRMED_AT_IS_NOT_USED_FOR_BUCKET_ASSIGNMENT',
      totals: {
        confirmedBookings: bookings.length,
        ticketUnits: observations.reduce(
          (total, observation) => total + observation.ticketUnits,
          0,
        ),
        grossBookingValue: this.sum(observations.map(({ value }) => value)),
      },
      rows,
    };
  }

  async getEventGroupComparison(organizationId: string, groupId: string) {
    const group = await this.prisma.eventGroup.findFirst({
      where: { id: groupId, organizationId },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        status: true,
        events: {
          select: {
            sortOrder: true,
            event: {
              select: {
                id: true,
                name: true,
                slug: true,
                status: true,
                startDate: true,
                endDate: true,
                timezone: true,
              },
            },
          },
          orderBy: [{ sortOrder: 'asc' }, { eventId: 'asc' }],
        },
      },
    });
    if (!group) throw new NotFoundException('Event Group not found.');
    const eventIds = group.events.map(({ event }) => event.id);
    const [sessions, bookings] = await Promise.all([
      eventIds.length
        ? this.prisma.session.findMany({
            where: { eventId: { in: eventIds } },
            select: { id: true, eventId: true, capacity: true },
            orderBy: [{ startDate: 'asc' }, { id: 'asc' }],
            take: 5000,
          })
        : Promise.resolve([]),
      eventIds.length
        ? this.prisma.booking.findMany({
            where: { eventId: { in: eventIds } },
            select: {
              eventId: true,
              status: true,
              total: true,
              items: { select: { quantity: true } },
              products: { select: { quantity: true, unitPrice: true } },
              tickets: { select: { status: true, checkedInAt: true } },
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
        : Promise.resolve([]),
    ]);
    const baseRows = group.events.map(({ event, sortOrder }) => {
      const eventSessions = sessions.filter(
        ({ eventId }) => eventId === event.id,
      );
      const eventBookings = bookings.filter(
        ({ eventId }) => eventId === event.id,
      );
      const confirmed = eventBookings.filter(
        ({ status }) => status === 'CONFIRMED',
      );
      const successful = eventBookings.flatMap(({ payments }) =>
        payments.filter(({ status }) => status === 'SUCCEEDED'),
      );
      const grossCollected = this.sum(
        successful.map(({ amount }) => Number(amount)),
      );
      const refunded = this.sum(
        successful.flatMap(({ refunds }) =>
          refunds
            .filter(({ status }) => status === 'SUCCEEDED')
            .map(({ amount }) => Number(amount)),
        ),
      );
      const netCollected = Number((grossCollected - refunded).toFixed(2));
      const tickets = confirmed.flatMap(({ tickets }) => tickets);
      const admissions = tickets.filter(
        ({ status, checkedInAt }) =>
          status === 'SCANNED' || checkedInAt !== null,
      ).length;
      const ticketUnits = this.ticketQuantity(confirmed);
      const totalCapacity = eventSessions.reduce(
        (total, session) => total + session.capacity,
        0,
      );
      const reservedAttendance = this.ticketQuantity(
        eventBookings.filter(({ status }) =>
          ['RESERVED', 'CONFIRMED'].includes(status),
        ),
      );
      const bookingsWithProducts = confirmed.filter(
        ({ products }) => products.length > 0,
      ).length;
      const grossProductSales = this.sum(
        confirmed.flatMap(({ products }) =>
          products.map(
            ({ quantity, unitPrice }) => quantity * Number(unitPrice),
          ),
        ),
      );
      const timezone = event.timezone || 'Australia/Melbourne';
      return {
        sortOrder,
        event: { ...event, timezone },
        durationDays: this.inclusiveEventDays(
          event.startDate,
          event.endDate,
          timezone,
        ),
        sessions: eventSessions.length,
        totalCapacity,
        reservedAttendance,
        unusedCapacity: Math.max(totalCapacity - reservedAttendance, 0),
        capacityUtilisationPercent:
          totalCapacity > 0
            ? Number(((reservedAttendance / totalCapacity) * 100).toFixed(1))
            : 0,
        confirmedBookings: confirmed.length,
        ticketUnits,
        ticketsIssued: tickets.length,
        admissions,
        attendanceRatePercent:
          tickets.length > 0
            ? Number(((admissions / tickets.length) * 100).toFixed(1))
            : 0,
        grossCollected,
        refunded,
        netCollected,
        averageBookingValue:
          confirmed.length > 0
            ? Number(
                (
                  this.sum(confirmed.map(({ total }) => Number(total))) /
                  confirmed.length
                ).toFixed(2),
              )
            : 0,
        ticketsPerBooking:
          confirmed.length > 0
            ? Number((ticketUnits / confirmed.length).toFixed(2))
            : 0,
        revenuePerSession:
          eventSessions.length > 0
            ? Number((netCollected / eventSessions.length).toFixed(2))
            : 0,
        revenuePerCapacityPlace:
          totalCapacity > 0
            ? Number((netCollected / totalCapacity).toFixed(2))
            : 0,
        bookingsWithProducts,
        productAttachRatePercent:
          confirmed.length > 0
            ? Number(
                ((bookingsWithProducts / confirmed.length) * 100).toFixed(1),
              )
            : 0,
        grossProductSales,
        productRevenuePerAdmission:
          admissions > 0
            ? Number((grossProductSales / admissions).toFixed(2))
            : 0,
        refundRatePercent:
          grossCollected > 0
            ? Number(((refunded / grossCollected) * 100).toFixed(1))
            : 0,
        paymentExceptionCount: eventBookings.filter(({ payments }) =>
          payments.some(({ status }) => status === 'PENDING'),
        ).length,
      };
    });
    const totals = {
      events: baseRows.length,
      sessions: baseRows.reduce((total, row) => total + row.sessions, 0),
      confirmedBookings: baseRows.reduce(
        (total, row) => total + row.confirmedBookings,
        0,
      ),
      ticketUnits: baseRows.reduce((total, row) => total + row.ticketUnits, 0),
      ticketsIssued: baseRows.reduce(
        (total, row) => total + row.ticketsIssued,
        0,
      ),
      admissions: baseRows.reduce((total, row) => total + row.admissions, 0),
      totalCapacity: baseRows.reduce(
        (total, row) => total + row.totalCapacity,
        0,
      ),
      grossCollected: this.sum(
        baseRows.map(({ grossCollected }) => grossCollected),
      ),
      refunded: this.sum(baseRows.map(({ refunded }) => refunded)),
      netCollected: this.sum(baseRows.map(({ netCollected }) => netCollected)),
      grossProductSales: this.sum(
        baseRows.map(({ grossProductSales }) => grossProductSales),
      ),
    };
    return {
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        type: group.type,
        status: group.status,
      },
      currency: 'AUD',
      timezoneSemantics: 'EACH_EVENT_RETAINS_ITS_OWN_TIMEZONE',
      totals: {
        ...totals,
        attendanceRatePercent:
          totals.ticketsIssued > 0
            ? Number(
                ((totals.admissions / totals.ticketsIssued) * 100).toFixed(1),
              )
            : 0,
        capacityUtilisationPercent:
          totals.totalCapacity > 0
            ? Number(
                (
                  (baseRows.reduce(
                    (total, row) => total + row.reservedAttendance,
                    0,
                  ) /
                    totals.totalCapacity) *
                  100
                ).toFixed(1),
              )
            : 0,
        productAttachRatePercent:
          totals.confirmedBookings > 0
            ? Number(
                (
                  (baseRows.reduce(
                    (total, row) => total + row.bookingsWithProducts,
                    0,
                  ) /
                    totals.confirmedBookings) *
                  100
                ).toFixed(1),
              )
            : 0,
      },
      rows: baseRows.map((row) => ({
        ...row,
        contributionToGroupNetPercent:
          totals.netCollected > 0
            ? Number(
                ((row.netCollected / totals.netCollected) * 100).toFixed(1),
              )
            : 0,
      })),
    };
  }

  async getEventCsv(
    organizationId: string,
    eventId: string,
    reportType: string,
    query: EventReportQueryDto,
  ) {
    const supported = [
      'ticket-types',
      'sessions',
      'dates',
      'products',
      'sales-pace',
    ];
    if (!supported.includes(reportType))
      throw new BadRequestException('Unsupported Event report export type.');
    const result =
      reportType === 'ticket-types'
        ? await this.getTicketTypeSales(organizationId, eventId, query)
        : reportType === 'sessions'
          ? await this.getSessionSales(organizationId, eventId, query)
          : reportType === 'dates'
            ? await this.getDateSales(organizationId, eventId, query)
            : reportType === 'products'
              ? await this.getProductSales(organizationId, eventId, query)
              : await this.getSalesPace(organizationId, eventId, query);
    const context = [
      result.event.name,
      result.event.timezone,
      query.date ?? 'Full Event',
      query.sessionId ?? 'All Sessions',
    ];
    let headers: string[];
    let rows: unknown[][];
    if (reportType === 'ticket-types') {
      const typed = result as Awaited<
        ReturnType<ReportingService['getTicketTypeSales']>
      >;
      headers = [
        'Event',
        'Event timezone',
        'Date filter',
        'Session filter',
        'Ticket Type',
        'Status',
        'Units sold',
        'Gross Ticket sales AUD',
        'Unit share percent',
        'Tickets issued',
        'Admissions',
        'Refund allocation',
      ];
      rows = typed.rows.map((row) => [
        ...context,
        row.name,
        row.active ? 'ACTIVE' : 'INACTIVE',
        row.unitsSold,
        row.grossItemSales,
        row.unitSharePercent,
        row.ticketsIssued,
        row.admissions,
        typed.refundAllocation,
      ]);
    } else if (reportType === 'sessions') {
      const typed = result as Awaited<
        ReturnType<ReportingService['getSessionSales']>
      >;
      headers = [
        'Event',
        'Event timezone',
        'Date filter',
        'Session filter',
        'Session',
        'Start ISO',
        'Status',
        'Confirmed bookings',
        'Confirmed Booking value AUD',
        'Gross collected AUD',
        'Refunded AUD',
        'Net collected AUD',
        'Ticket units',
        'Tickets issued',
        'Admissions',
        'Capacity',
        'Reserved attendance',
        'Remaining capacity',
        'Utilisation percent',
      ];
      rows = typed.rows.map((row) => [
        ...context,
        row.name,
        row.startDate.toISOString(),
        row.status,
        row.confirmedBookings,
        row.confirmedBookingValue,
        row.grossCollected,
        row.refunded,
        row.netCollected,
        row.ticketUnits,
        row.ticketsIssued,
        row.admissions,
        row.capacity,
        row.reservedAttendance,
        row.remainingCapacity,
        row.utilisationPercent,
      ]);
    } else if (reportType === 'dates') {
      const typed = result as Awaited<
        ReturnType<ReportingService['getDateSales']>
      >;
      headers = [
        'Event',
        'Event timezone',
        'Date filter',
        'Session filter',
        'Event-local Session date',
        'Sessions',
        'Confirmed bookings',
        'Ticket units',
        'Gross Booking value AUD',
        'Gross collected AUD',
        'Refunded AUD',
        'Net collected AUD',
        'Tickets issued',
        'Admissions',
        'Capacity',
        'Reserved attendance',
        'Remaining capacity',
        'Utilisation percent',
      ];
      rows = typed.rows.map((row) => [
        ...context,
        row.date,
        row.sessionCount,
        row.confirmedBookings,
        row.ticketUnits,
        row.grossBookingValue,
        row.grossCollected,
        row.refunded,
        row.netCollected,
        row.ticketsIssued,
        row.admissions,
        row.capacity,
        row.reservedAttendance,
        row.remainingCapacity,
        row.utilisationPercent,
      ]);
    } else if (reportType === 'products') {
      const typed = result as Awaited<
        ReturnType<ReportingService['getProductSales']>
      >;
      headers = [
        'Event',
        'Event timezone',
        'Date filter',
        'Session filter',
        'Product',
        'Product Group',
        'Demand type',
        'Product status',
        'Variant',
        'Variant status',
        'Units sold',
        'Gross Product sales AUD',
        'Attach rate percent',
        'Inventory scope',
        'Inventory quantity',
        'Inventory committed',
        'Inventory remaining',
        'Sell-through percent',
        'Peak Session',
        'Capacity limit',
        'Capacity reserved',
        'Capacity remaining',
        'Capacity utilisation percent',
        'Refund allocation',
      ];
      rows = typed.rows.flatMap((row) =>
        (row.variants.length ? row.variants : [null]).map((variant) => [
          ...context,
          row.name,
          row.group?.name ?? '',
          row.requiredByRule ? 'REQUIRED_BY_ACTIVE_RULE' : 'DISCRETIONARY',
          row.status,
          variant?.name ?? '',
          variant?.status ?? '',
          variant?.unitsSold ?? row.unitsSold,
          variant?.grossItemSales ?? row.grossItemSales,
          row.attachRatePercent,
          typed.definitions.inventoryScope,
          variant ? variant.inventoryQuantity : row.inventory.quantity,
          variant ? variant.inventoryCommitted : row.inventory.committed,
          variant ? variant.inventoryRemaining : row.inventory.remaining,
          variant
            ? variant.sellThroughPercent
            : row.inventory.sellThroughPercent,
          row.capacity.peakSession?.sessionName ?? '',
          row.capacity.peakSession?.limit ?? '',
          row.capacity.peakSession?.reserved ?? '',
          row.capacity.peakSession?.remaining ?? '',
          row.capacity.peakSession?.utilisationPercent ?? '',
          typed.definitions.refundAllocation,
        ]),
      );
    } else {
      const typed = result as Awaited<
        ReturnType<ReportingService['getSalesPace']>
      >;
      headers = [
        'Event',
        'Event timezone',
        'Date filter',
        'Session filter',
        'Lead-time bucket',
        'Confirmed bookings',
        'Ticket units',
        'Gross Booking value AUD',
        'Cumulative bookings',
        'Cumulative Ticket units',
        'Bucket basis',
      ];
      rows = typed.rows.map((row) => [
        ...context,
        row.label,
        row.confirmedBookings,
        row.ticketUnits,
        row.grossBookingValue,
        row.cumulativeBookings,
        row.cumulativeTicketUnits,
        typed.basis,
      ]);
    }
    return {
      filename: this.csvFilename(result.event.name, reportType),
      content: this.csvBuffer(
        headers,
        rows.length
          ? rows
          : [[...context, ...Array(headers.length - context.length).fill('')]],
      ),
    };
  }

  async getEventGroupComparisonCsv(organizationId: string, groupId: string) {
    const report = await this.getEventGroupComparison(organizationId, groupId);
    const headers = [
      'Event Group',
      'Group type',
      'Currency',
      'Event',
      'Event timezone',
      'Duration days',
      'Sessions',
      'Confirmed bookings',
      'Ticket units',
      'Net collected AUD',
      'Contribution to Group net percent',
      'Revenue per Session AUD',
      'Revenue per capacity place AUD',
      'Tickets per Booking',
      'Attendance rate percent',
      'Capacity utilisation percent',
      'Unused capacity',
      'Product attach rate percent',
      'Product revenue per admission AUD',
      'Refund rate percent',
      'Payment exceptions',
    ];
    const rows = report.rows.map((row) => [
      report.group.name,
      report.group.type,
      report.currency,
      row.event.name,
      row.event.timezone,
      row.durationDays,
      row.sessions,
      row.confirmedBookings,
      row.ticketUnits,
      row.netCollected,
      row.contributionToGroupNetPercent,
      row.revenuePerSession,
      row.revenuePerCapacityPlace,
      row.ticketsPerBooking,
      row.attendanceRatePercent,
      row.capacityUtilisationPercent,
      row.unusedCapacity,
      row.productAttachRatePercent,
      row.productRevenuePerAdmission,
      row.refundRatePercent,
      row.paymentExceptionCount,
    ]);
    return {
      filename: this.csvFilename(report.group.name, 'event-comparison'),
      content: this.csvBuffer(
        headers,
        rows.length
          ? rows
          : [
              [
                report.group.name,
                report.group.type,
                report.currency,
                ...Array(headers.length - 3).fill(''),
              ],
            ],
      ),
    };
  }

  private async detailedScope(
    organizationId: string,
    eventId: string,
    query: EventReportQueryDto,
  ) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, organizationId },
      select: { id: true, name: true, timezone: true },
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
    if (query.sessionId && sessions.length === 0)
      throw new NotFoundException(
        'Session not found for this Event and filter.',
      );
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

  private calendarDayDifference(fromDate: string, toDate: string) {
    const from = new Date(`${fromDate}T00:00:00.000Z`);
    const to = new Date(`${toDate}T00:00:00.000Z`);
    return Math.round((to.getTime() - from.getTime()) / 86_400_000);
  }

  private inclusiveEventDays(startDate: Date, endDate: Date, timezone: string) {
    const start = formatInTimeZone(startDate, timezone, 'yyyy-MM-dd');
    const end = formatInTimeZone(endDate, timezone, 'yyyy-MM-dd');
    return Math.max(this.calendarDayDifference(start, end) + 1, 1);
  }

  private csvFilename(name: string, reportType: string) {
    const safeName =
      name
        .normalize('NFKD')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase() || 'report';
    return `${safeName}-${reportType}-${new Date().toISOString().slice(0, 10)}.csv`;
  }

  private csvBuffer(headers: string[], rows: unknown[][]) {
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => this.csvCell(cell)).join(','))
      .join('\r\n');
    return Buffer.from(`\uFEFF${csv}\r\n`, 'utf8');
  }

  private csvCell(value: unknown) {
    let text = value === null || value === undefined ? '' : String(value);
    if (/^[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
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
