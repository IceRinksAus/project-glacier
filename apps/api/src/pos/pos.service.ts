import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  AccessControlService,
  AuthenticatedAccessContext,
} from '../access-control/access-control.service';
import { BookingService } from '../booking/booking.service';
import { PrismaService } from '../prisma/prisma.service';
import { RuleEvaluationService } from '../rule/rule-evaluation/rule-evaluation.service';
import { TicketService } from '../ticket/ticket.service';
import { EvaluatePublicRulesDto } from '../public-booking/dto/evaluate-public-rules.dto';

import { CompletePosPaymentDto } from './dto/complete-pos-payment.dto';
import { CreatePosCustomerDto } from './dto/create-pos-customer.dto';
import { CreatePosReservationDto } from './dto/create-pos-reservation.dto';

@Injectable()
export class PosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControl: AccessControlService,
    private readonly bookingService: BookingService,
    private readonly ticketService: TicketService,
    private readonly ruleEvaluationService: RuleEvaluationService,
  ) {}

  async findCatalogue(
    access: AuthenticatedAccessContext,
    eventId: string,
    sessionId?: string,
  ) {
    const event = await this.prisma.event.findFirst({
      where: this.accessControl.eventWhere(access, {
        id: eventId,
        status: 'ACTIVE',
      }),
      select: {
        id: true,
        name: true,
        timezone: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const sessions = await this.prisma.session.findMany({
      where: {
        eventId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        capacity: true,
        salesStart: true,
        salesEnd: true,
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    if (sessionId && !sessions.some((session) => session.id === sessionId)) {
      throw new NotFoundException('Session not found');
    }

    const [ticketTypes, sessionProducts] = await Promise.all([
      this.prisma.ticketType.findMany({
        where: {
          eventId,
          active: true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          saleStart: true,
          saleEnd: true,
        },
        orderBy: {
          price: 'asc',
        },
      }),
      sessionId
        ? this.prisma.sessionProduct.findMany({
            where: {
              sessionId,
              active: true,
              product: {
                status: 'ACTIVE',
                availablePos: true,
                productType: {
                  not: 'ADMISSION',
                },
              },
            },
            select: {
              id: true,
              productId: true,
              capacityOverride: true,
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
                  capacityControlled: true,
                  capacity: true,
                  inventoryTracked: true,
                  inventoryQuantity: true,
                  productGroup: {
                    select: {
                      id: true,
                      name: true,
                      sortOrder: true,
                    },
                  },
                  variants: {
                    where: {
                      status: 'ACTIVE',
                      availablePos: true,
                    },
                    select: {
                      id: true,
                      name: true,
                      priceOverride: true,
                      inventoryTracked: true,
                      inventoryQuantity: true,
                      sortOrder: true,
                    },
                    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
                  },
                },
              },
            },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          })
        : Promise.resolve([]),
    ]);

    return {
      event,
      sessions,
      ticketTypes,
      sessionProducts,
    };
  }

  async createCustomer(
    access: AuthenticatedAccessContext,
    eventId: string,
    data: CreatePosCustomerDto,
  ) {
    await this.accessControl.assertEventAccess(eventId, access);

    return this.prisma.customer.create({
      data: {
        firstName: data.firstName.trim(),
        lastName: data.lastName?.trim() ?? '',
        email: data.email?.trim().toLowerCase() || null,
        phone: data.phone?.trim() || null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });
  }

  async evaluateRules(
    access: AuthenticatedAccessContext,
    eventId: string,
    data: EvaluatePublicRulesDto,
  ) {
    await this.accessControl.assertEventAccess(eventId, access);

    const session = await this.prisma.session.findFirst({
      where: {
        id: data.sessionId,
        eventId,
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const requiredProductMap = new Map<string, number>();
    const errors: string[] = [];
    const warnings: string[] = [];
    const matchedRuleIds = new Set<string>();
    const bookingTicketTypeIds = data.participants.map(
      (participant) => participant.ticketTypeId,
    );

    for (const participant of data.participants) {
      const evaluation = await this.ruleEvaluationService.evaluate(eventId, {
        customerAge: participant.age,
        participantAge: participant.age,
        participantFirstName: participant.firstName,
        participantLastName: participant.lastName ?? null,
        ticketTypeId: participant.ticketTypeId,
        sessionId: data.sessionId,
        eventId,
        flexibleBooking: data.flexibleBooking ?? false,
        participantCount: data.participants.length,
        bookingTicketTypeIds,
      });

      evaluation.matchedRuleIds.forEach((id) => matchedRuleIds.add(id));
      errors.push(
        ...evaluation.errors.map(
          (message) => `${participant.firstName}: ${message}`,
        ),
      );
      warnings.push(
        ...evaluation.warnings.map(
          (message) => `${participant.firstName}: ${message}`,
        ),
      );

      for (const required of evaluation.requiredProducts) {
        requiredProductMap.set(
          required.productSlug,
          (requiredProductMap.get(required.productSlug) ?? 0) +
            required.quantity,
        );
      }
    }

    return {
      valid: errors.length === 0,
      matchedRuleIds: Array.from(matchedRuleIds),
      requiredProducts: Array.from(requiredProductMap.entries()).map(
        ([productSlug, quantity]) => ({ productSlug, quantity }),
      ),
      errors,
      warnings,
    };
  }

  async createReservation(
    access: AuthenticatedAccessContext,
    eventId: string,
    data: CreatePosReservationDto,
  ) {
    await this.accessControl.assertEventAccess(eventId, access);

    return this.bookingService.create(
      {
        ...data,
        eventId,
      },
      'WALK_UP',
    );
  }

  async completePayment(
    access: AuthenticatedAccessContext,
    eventId: string,
    bookingId: string,
    data: CompletePosPaymentDto,
  ) {
    const standaloneReference = data.standaloneReference?.trim() || null;
    const amount = new Prisma.Decimal(data.amount);

    const existingPayment = await this.prisma.payment.findUnique({
      where: {
        idempotencyKey: data.idempotencyKey,
      },
    });

    if (existingPayment) {
      if (
        existingPayment.bookingId !== bookingId ||
        existingPayment.method !== data.method ||
        !existingPayment.amount.equals(amount) ||
        existingPayment.standaloneReference !== standaloneReference
      ) {
        throw new ConflictException(
          'This payment confirmation key has already been used',
        );
      }

      await this.assertWalkUpBookingAccess(access, eventId, bookingId);
      await this.ticketService.issueTicketsForBooking(bookingId);
      return this.findCompletion(access, eventId, bookingId);
    }

    const booking = await this.assertWalkUpBookingAccess(
      access,
      eventId,
      bookingId,
    );

    if (!booking.total.equals(amount)) {
      throw new BadRequestException(
        'The confirmed payment amount must equal the authoritative amount due',
      );
    }

    if (booking.status !== 'RESERVED' || booking.paymentStatus !== 'UNPAID') {
      throw new BadRequestException(
        'Only an unpaid walk-up reservation can be completed',
      );
    }

    const now = new Date();

    if (
      booking.reservedUntil &&
      booking.reservedUntil.getTime() < now.getTime()
    ) {
      throw new BadRequestException('This booking reservation has expired');
    }

    await this.prisma.$transaction(
      async (transaction) => {
        const updated = await transaction.booking.updateMany({
          where: {
            id: bookingId,
            eventId,
            source: 'WALK_UP',
            status: 'RESERVED',
            paymentStatus: 'UNPAID',
            OR: [{ reservedUntil: null }, { reservedUntil: { gte: now } }],
          },
          data: {
            status: 'CONFIRMED',
            paymentStatus: 'PAID',
            paymentReference: standaloneReference,
            paidAt: now,
            confirmedAt: now,
          },
        });

        if (updated.count !== 1) {
          throw new ConflictException(
            'The walk-up reservation changed before payment could be recorded',
          );
        }

        await transaction.payment.create({
          data: {
            bookingId,
            provider: data.method,
            method: data.method,
            providerReference: null,
            standaloneReference,
            idempotencyKey: data.idempotencyKey,
            amount,
            currency: 'AUD',
            status: 'SUCCEEDED',
            succeededAt: now,
            receivedAt: now,
            receivedByUserId: access.userId,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    await this.ticketService.issueTicketsForBooking(bookingId);

    return this.findCompletion(access, eventId, bookingId);
  }

  private async assertWalkUpBookingAccess(
    access: AuthenticatedAccessContext,
    eventId: string,
    bookingId: string,
  ) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        eventId,
        source: 'WALK_UP',
        event: this.accessControl.eventWhere(access),
      },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        total: true,
        reservedUntil: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Walk-up reservation not found');
    }

    return booking;
  }

  private async findCompletion(
    access: AuthenticatedAccessContext,
    eventId: string,
    bookingId: string,
  ) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        eventId,
        source: 'WALK_UP',
        event: this.accessControl.eventWhere(access),
      },
      select: {
        id: true,
        bookingNumber: true,
        source: true,
        status: true,
        paymentStatus: true,
        total: true,
        confirmedAt: true,
        session: {
          select: {
            id: true,
            name: true,
            startDate: true,
          },
        },
        payments: {
          where: {
            status: 'SUCCEEDED',
          },
          select: {
            id: true,
            method: true,
            amount: true,
            currency: true,
            standaloneReference: true,
            receivedAt: true,
            receivedByUser: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
        tickets: {
          select: {
            id: true,
            ticketNumber: true,
            credentialSelector: true,
            credentialKeyId: true,
            status: true,
            participant: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            issuedAt: 'asc',
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Walk-up reservation not found');
    }

    return {
      ...booking,
      tickets: booking.tickets.map((ticket) => ({
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        secureToken: this.ticketService.presentCredential(ticket),
        status: ticket.status,
        participant: ticket.participant,
      })),
      total: booking.total.toNumber(),
      payments: booking.payments.map((payment) => ({
        ...payment,
        amount: payment.amount.toNumber(),
      })),
    };
  }
}
