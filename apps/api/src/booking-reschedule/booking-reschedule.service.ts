import { createHash, randomBytes } from 'crypto';

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
import { PrismaService } from '../prisma/prisma.service';
import { RuleEvaluationService } from '../rule/rule-evaluation/rule-evaluation.service';

import { PreviewBookingRescheduleDto } from './dto/preview-booking-reschedule.dto';
import { ExecuteBookingRescheduleDto } from './dto/execute-booking-reschedule.dto';

type ProductEffect = {
  bookingProductId: string;
  productId: string;
  name: string;
  quantity: number;
  capacityTransferred: number;
  remainingCapacity: number | null;
  originalSessionProductId: string | null;
  destinationSessionProductId: string;
  finiteInventoryUnchanged: boolean;
};

type DestinationOption = {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  capacity: number;
  available: boolean;
  reasons: string[];
  remainingAdmissionBeforeMove: number;
  remainingAdmissionAfterMove: number;
  productEffects: ProductEffect[];
};

@Injectable()
export class BookingRescheduleService {
  private readonly resultInclude = {
    originalSession: {
      select: { id: true, name: true, startDate: true, endDate: true },
    },
    destinationSession: {
      select: { id: true, name: true, startDate: true, endDate: true },
    },
    requestedByUser: { select: { id: true, name: true } },
    ticketMappings: {
      include: {
        originalTicket: {
          select: { id: true, ticketNumber: true, status: true },
        },
        replacementTicket: {
          select: { id: true, ticketNumber: true, status: true },
        },
      },
      orderBy: { createdAt: 'asc' as const },
    },
    productAllocations: { orderBy: { createdAt: 'asc' as const } },
  } satisfies Prisma.BookingRescheduleInclude;

  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControl: AccessControlService,
    private readonly ruleEvaluation: RuleEvaluationService,
  ) {}

  async context(access: AuthenticatedAccessContext, bookingId: string) {
    const booking = await this.loadBooking(access, bookingId);
    const eligibilityReasons = this.bookingEligibilityReasons(booking);
    const destinations: DestinationOption[] = [];

    if (eligibilityReasons.length === 0) {
      const sessions = await this.prisma.session.findMany({
        where: {
          eventId: booking.eventId,
          id: { not: booking.sessionId! },
          status: 'ACTIVE',
          startDate: { gt: new Date() },
        },
        orderBy: { startDate: 'asc' },
        take: 100,
      });

      for (const session of sessions) {
        const assessment = await this.assessDestination(booking, session.id);
        destinations.push({
          id: session.id,
          name: session.name,
          startDate: session.startDate,
          endDate: session.endDate,
          capacity: session.capacity,
          ...assessment,
        });
      }
    }

    return {
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      eligible: eligibilityReasons.length === 0,
      eligibilityReasons,
      currentSession: booking.session,
      ticketCount: this.currentTickets(booking).length,
      total: booking.total.toNumber(),
      products: booking.products.map((item) => ({
        bookingProductId: item.id,
        name: item.productVariant
          ? `${item.product.name} — ${item.productVariant.name}`
          : item.product.name,
        quantity: item.quantity,
        capacityControlled: item.product.capacityControlled,
        finiteInventoryUnchanged:
          item.product.inventoryTracked ||
          Boolean(item.productVariant?.inventoryTracked),
      })),
      destinations: destinations.filter(({ available }) => available),
      history: booking.reschedules.map((reschedule) => ({
        ...reschedule,
        requestedByUser: reschedule.requestedByUser,
      })),
    };
  }

  async execute(
    access: AuthenticatedAccessContext,
    bookingId: string,
    input: ExecuteBookingRescheduleDto,
  ) {
    const existing = await this.prisma.bookingReschedule.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: this.resultInclude,
    });
    if (existing) {
      this.assertExactRetry(existing, access, bookingId, input);
      if (existing.status === 'PENDING') {
        throw new ConflictException('The Session change is still in progress');
      }
      return this.serializeResult(existing);
    }

    const preview = await this.preview(access, bookingId, input);
    if (preview.previewHash !== input.previewHash) {
      throw new BadRequestException(
        'The Session change changed after review. Review it again.',
      );
    }

    try {
      const result = await this.withSerializableRetry((transaction) =>
        this.executeTransaction(transaction, access, bookingId, input, preview),
      );
      return this.serializeResult(result);
    } catch (error) {
      if (this.prismaErrorCode(error) === 'P2002') {
        const raced = await this.prisma.bookingReschedule.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
          include: this.resultInclude,
        });
        if (raced) {
          this.assertExactRetry(raced, access, bookingId, input);
          return this.serializeResult(raced);
        }
      }
      throw error;
    }
  }

  async preview(
    access: AuthenticatedAccessContext,
    bookingId: string,
    input: PreviewBookingRescheduleDto,
  ) {
    const booking = await this.loadBooking(access, bookingId);
    const reasons = this.bookingEligibilityReasons(booking);
    if (reasons.length > 0) {
      throw new BadRequestException(reasons[0]);
    }
    if (input.destinationSessionId === booking.sessionId) {
      throw new BadRequestException(
        'Choose a destination Session different from the current Session',
      );
    }

    const destination = await this.prisma.session.findFirst({
      where: {
        id: input.destinationSessionId,
        eventId: booking.eventId,
      },
    });
    if (!destination) throw new NotFoundException('Session not found');

    const assessment = await this.assessDestination(booking, destination.id);
    if (!assessment.available) {
      throw new BadRequestException(
        assessment.reasons[0] ?? 'The destination Session is not available',
      );
    }

    const note = input.note.trim();
    const currentTickets = this.currentTickets(booking);
    const previewHash = createHash('sha256')
      .update(
        JSON.stringify({
          organizationId: access.organizationId,
          userId: access.userId,
          bookingId,
          originalSessionId: booking.sessionId,
          destinationSessionId: destination.id,
          reason: input.reason,
          note,
          ticketIds: currentTickets.map(({ id }) => id).sort(),
          productEffects: assessment.productEffects,
          total: booking.total.toString(),
        }),
      )
      .digest('hex');

    return {
      previewHash,
      bookingId,
      bookingNumber: booking.bookingNumber,
      eventId: booking.eventId,
      reason: input.reason,
      note,
      originalSession: booking.session,
      destinationSession: {
        id: destination.id,
        name: destination.name,
        startDate: destination.startDate,
        endDate: destination.endDate,
      },
      ticketCount: currentTickets.length,
      admissionPlacesTransferred: currentTickets.length,
      tickets: currentTickets.map((ticket) => ({
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        participantId: ticket.participant.id,
        participantName: [
          ticket.participant.firstName,
          ticket.participant.lastName,
        ]
          .filter(Boolean)
          .join(' '),
        ticketTypeId: ticket.participant.ticketTypeId,
        ticketTypeName: ticket.participant.ticketType.name,
      })),
      productEffects: assessment.productEffects,
      totalUnchanged: booking.total.toNumber(),
      priceDifference: 0,
      finiteInventoryUnchanged: true,
    };
  }

  private async executeTransaction(
    transaction: Prisma.TransactionClient,
    access: AuthenticatedAccessContext,
    bookingId: string,
    input: ExecuteBookingRescheduleDto,
    preview: Awaited<ReturnType<BookingRescheduleService['preview']>>,
  ) {
    const existing = await transaction.bookingReschedule.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: this.resultInclude,
    });
    if (existing) {
      this.assertExactRetry(existing, access, bookingId, input);
      return existing;
    }

    const booking = await this.loadBooking(access, bookingId, transaction);
    const reasons = this.bookingEligibilityReasons(booking);
    if (reasons.length > 0) throw new BadRequestException(reasons[0]);
    if (booking.sessionId !== preview.originalSession?.id) {
      throw new BadRequestException(
        'The Booking Session changed after review. Review it again.',
      );
    }

    const currentTickets = this.currentTickets(booking);
    if (
      JSON.stringify(currentTickets.map(({ id }) => id).sort()) !==
      JSON.stringify(preview.tickets.map(({ id }) => id).sort())
    ) {
      throw new BadRequestException(
        'The Booking Tickets changed after review. Review it again.',
      );
    }

    const destination = await transaction.session.findFirst({
      where: {
        id: input.destinationSessionId,
        eventId: booking.eventId,
        status: 'ACTIVE',
        startDate: { gt: new Date() },
      },
    });
    if (!destination) {
      throw new BadRequestException(
        'The destination Session is no longer available',
      );
    }
    const occupiedAdmission = await this.occupiedAdmission(
      destination.id,
      transaction,
    );
    if (currentTickets.length > destination.capacity - occupiedAdmission) {
      throw new BadRequestException(
        `${destination.name} does not have enough admission capacity`,
      );
    }

    const productIds = [
      ...new Set(booking.products.map(({ productId }) => productId)),
    ];
    const assignments = productIds.length
      ? await transaction.sessionProduct.findMany({
          where: {
            sessionId: { in: [booking.sessionId!, destination.id] },
            productId: { in: productIds },
          },
        })
      : [];
    const destinationAssignments = new Map(
      assignments
        .filter(({ sessionId }) => sessionId === destination.id)
        .map((assignment) => [assignment.productId, assignment]),
    );
    const originalAssignments = new Map(
      assignments
        .filter(({ sessionId }) => sessionId === booking.sessionId)
        .map((assignment) => [assignment.productId, assignment]),
    );

    for (const item of booking.products) {
      const assignment = destinationAssignments.get(item.productId);
      if (item.product.status !== 'ACTIVE' || !assignment?.active) {
        throw new BadRequestException(
          `${item.product.name} is no longer active for the destination Session`,
        );
      }
      if (item.product.capacityControlled) {
        const limit = assignment.capacityOverride ?? item.product.capacity;
        if (limit === null) {
          throw new BadRequestException(
            `${item.product.name} capacity is not configured`,
          );
        }
        const occupied = await transaction.bookingProduct.aggregate({
          where: {
            productId: item.productId,
            booking: {
              sessionId: destination.id,
              status: { in: ['RESERVED', 'CONFIRMED'] },
            },
          },
          _sum: { quantity: true },
        });
        if (item.quantity > limit - (occupied._sum.quantity ?? 0)) {
          throw new BadRequestException(
            `${item.product.name} does not have enough capacity for the destination Session`,
          );
        }
      }
    }

    const reschedule = await transaction.bookingReschedule.create({
      data: {
        rescheduleNumber: `BR-${Date.now()}-${randomBytes(3)
          .toString('hex')
          .toUpperCase()}`,
        idempotencyKey: input.idempotencyKey,
        reason: input.reason,
        note: input.note.trim(),
        organizationId: access.organizationId,
        eventId: booking.eventId,
        bookingId,
        originalSessionId: booking.sessionId!,
        destinationSessionId: destination.id,
        originalSessionNameSnapshot: booking.session!.name,
        originalSessionStartSnapshot: booking.session!.startDate,
        destinationSessionNameSnapshot: destination.name,
        destinationSessionStartSnapshot: destination.startDate,
        requestedByUserId: access.userId,
        ticketCount: currentTickets.length,
        admissionPlacesTransferred: currentTickets.length,
        ticketMappings: {
          create: currentTickets.map((ticket) => ({
            originalTicketId: ticket.id,
            participantId: ticket.participant.id,
            ticketTypeId: ticket.participant.ticketTypeId,
            participantNameSnapshot: [
              ticket.participant.firstName,
              ticket.participant.lastName,
            ]
              .filter(Boolean)
              .join(' '),
            ticketTypeNameSnapshot: ticket.participant.ticketType.name,
            originalTicketNumberSnapshot: ticket.ticketNumber,
          })),
        },
        productAllocations: {
          create: booking.products.map((item) => ({
            bookingProductId: item.id,
            productId: item.productId,
            productNameSnapshot: item.product.name,
            variantNameSnapshot: item.productVariant?.name ?? null,
            quantity: item.quantity,
            capacityTransferred: item.product.capacityControlled
              ? item.quantity
              : 0,
            originalSessionProductId:
              originalAssignments.get(item.productId)?.id ?? null,
            destinationSessionProductId: destinationAssignments.get(
              item.productId,
            )!.id,
          })),
        },
      },
      include: { ticketMappings: true },
    });

    const now = new Date();
    const cancelled = await transaction.ticket.updateMany({
      where: {
        id: { in: currentTickets.map(({ id }) => id) },
        bookingId,
        status: 'ACTIVE',
        checkedInAt: null,
      },
      data: { status: 'CANCELLED', cancelledAt: now },
    });
    if (cancelled.count !== currentTickets.length) {
      throw new BadRequestException(
        'One or more Tickets are no longer eligible to change Session',
      );
    }

    const moved = await transaction.booking.updateMany({
      where: {
        id: bookingId,
        sessionId: booking.sessionId,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
      },
      data: { sessionId: destination.id },
    });
    if (moved.count !== 1) {
      throw new BadRequestException(
        'The Booking changed while the Session move was being completed',
      );
    }

    const mappingsByOriginal = new Map(
      reschedule.ticketMappings.map((mapping) => [
        mapping.originalTicketId,
        mapping,
      ]),
    );
    for (const ticket of currentTickets) {
      const replacement = await transaction.ticket.create({
        data: {
          bookingId,
          participantId: ticket.participant.id,
          ticketNumber: `TKT-${Date.now()}-${randomBytes(3)
            .toString('hex')
            .toUpperCase()}`,
          secureToken: randomBytes(32).toString('hex'),
          status: 'ACTIVE',
        },
      });
      await transaction.bookingRescheduleTicket.update({
        where: { id: mappingsByOriginal.get(ticket.id)!.id },
        data: {
          replacementTicketId: replacement.id,
          replacementTicketNumberSnapshot: replacement.ticketNumber,
        },
      });
    }

    return transaction.bookingReschedule.update({
      where: { id: reschedule.id },
      data: { status: 'COMPLETED', completedAt: now },
      include: this.resultInclude,
    });
  }

  private assertExactRetry(
    existing: {
      organizationId: string;
      bookingId: string;
      destinationSessionId: string;
      reason: string;
      note: string;
    },
    access: AuthenticatedAccessContext,
    bookingId: string,
    input: ExecuteBookingRescheduleDto,
  ) {
    if (
      existing.organizationId !== access.organizationId ||
      existing.bookingId !== bookingId ||
      existing.destinationSessionId !== input.destinationSessionId ||
      existing.reason !== input.reason ||
      existing.note !== input.note.trim()
    ) {
      throw new BadRequestException(
        'This idempotency key was already used for a different Session change',
      );
    }
  }

  private serializeResult<T extends { status: string }>(result: T) {
    return result;
  }

  private async withSerializableRetry<T>(
    operation: (transaction: Prisma.TransactionClient) => Promise<T>,
  ) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        return await this.prisma.$transaction(operation, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error) {
        if (this.prismaErrorCode(error) !== 'P2034' || attempt === 3) {
          throw error;
        }
      }
    }
    throw new ConflictException('Unable to transfer Session capacity');
  }

  private prismaErrorCode(error: unknown) {
    return typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : null;
  }

  private async loadBooking(
    access: AuthenticatedAccessContext,
    bookingId: string,
    client: PrismaService | Prisma.TransactionClient = this.prisma,
  ) {
    const booking = await client.booking.findFirst({
      where: { id: bookingId, event: this.accessControl.eventWhere(access) },
      include: {
        session: true,
        items: true,
        participants: { include: { ticketType: true } },
        tickets: {
          include: {
            participant: { include: { ticketType: true } },
            adjustmentAllocation: true,
            originalRescheduleMapping: { select: { id: true } },
          },
          orderBy: { issuedAt: 'asc' },
        },
        products: {
          include: { product: true, productVariant: true },
        },
        ticketAdjustments: {
          where: { status: { in: ['PENDING', 'COMPLETED'] } },
          select: { id: true },
        },
        reschedules: {
          include: {
            requestedByUser: { select: { id: true, name: true } },
            ticketMappings: true,
            productAllocations: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  private bookingEligibilityReasons(
    booking: Awaited<ReturnType<BookingRescheduleService['loadBooking']>>,
  ) {
    const reasons: string[] = [];
    if (booking.status !== 'CONFIRMED' || booking.paymentStatus !== 'PAID') {
      reasons.push('Only confirmed and paid Bookings can change Session');
    }
    if (!booking.sessionId || !booking.session) {
      reasons.push('The Booking has no current Session');
    } else if (booking.session.startDate <= new Date()) {
      reasons.push('The original Session has already started');
    }
    if (booking.ticketAdjustments.length > 0) {
      reasons.push('A Booking with Ticket adjustments cannot change Session');
    }
    if (booking.reschedules.some(({ status }) => status === 'PENDING')) {
      reasons.push('A Session change is already in progress');
    }

    const currentTickets = this.currentTickets(booking);
    if (
      currentTickets.length === 0 ||
      currentTickets.length !== booking.participants.length
    ) {
      reasons.push('Every participant must have one active current Ticket');
    }
    if (currentTickets.some(({ checkedInAt }) => checkedInAt !== null)) {
      reasons.push('A scanned Ticket cannot change Session');
    }
    if (
      booking.tickets.some(
        (ticket) =>
          ticket.status !== 'ACTIVE' && !ticket.originalRescheduleMapping,
      )
    ) {
      reasons.push('A cancelled or adjusted Ticket cannot change Session');
    }
    if (booking.participants.some(({ ticketType }) => !ticketType.active)) {
      reasons.push('One or more Ticket Types are no longer active');
    }
    return [...new Set(reasons)];
  }

  private currentTickets(
    booking: Awaited<ReturnType<BookingRescheduleService['loadBooking']>>,
  ) {
    return booking.tickets.filter(({ status }) => status === 'ACTIVE');
  }

  private async assessDestination(
    booking: Awaited<ReturnType<BookingRescheduleService['loadBooking']>>,
    destinationSessionId: string,
  ) {
    const reasons: string[] = [];
    const destination = await this.prisma.session.findFirst({
      where: { id: destinationSessionId, eventId: booking.eventId },
    });
    if (!destination) {
      return {
        available: false,
        reasons: ['Session not found'],
        remainingAdmissionBeforeMove: 0,
        remainingAdmissionAfterMove: 0,
        productEffects: [],
      };
    }
    if (destination.status !== 'ACTIVE') {
      reasons.push('The destination Session is not active');
    }
    if (destination.startDate <= new Date()) {
      reasons.push('The destination Session has already started');
    }

    const ticketCount = this.currentTickets(booking).length;
    const occupiedAdmission =
      await this.occupiedAdmission(destinationSessionId);
    const remainingAdmission = Math.max(
      destination.capacity - occupiedAdmission,
      0,
    );
    if (ticketCount > remainingAdmission) {
      reasons.push(
        `${destination.name} does not have enough admission capacity`,
      );
    }

    const productIds = [
      ...new Set(booking.products.map(({ productId }) => productId)),
    ];
    const assignments = productIds.length
      ? await this.prisma.sessionProduct.findMany({
          where: {
            sessionId: { in: [booking.sessionId!, destinationSessionId] },
            productId: { in: productIds },
          },
        })
      : [];
    const destinationAssignments = new Map(
      assignments
        .filter(({ sessionId }) => sessionId === destinationSessionId)
        .map((assignment) => [assignment.productId, assignment]),
    );
    const originalAssignments = new Map(
      assignments
        .filter(({ sessionId }) => sessionId === booking.sessionId)
        .map((assignment) => [assignment.productId, assignment]),
    );
    const productEffects: ProductEffect[] = [];

    for (const item of booking.products) {
      const assignment = destinationAssignments.get(item.productId);
      if (item.product.status !== 'ACTIVE' || !assignment?.active) {
        reasons.push(
          `${item.product.name} is not active for the destination Session`,
        );
        continue;
      }
      let capacityTransferred = 0;
      let remainingCapacity: number | null = null;
      if (item.product.capacityControlled) {
        const limit = assignment.capacityOverride ?? item.product.capacity;
        if (limit === null) {
          reasons.push(`${item.product.name} capacity is not configured`);
        } else {
          const occupied = await this.prisma.bookingProduct.aggregate({
            where: {
              productId: item.productId,
              booking: {
                sessionId: destinationSessionId,
                status: { in: ['RESERVED', 'CONFIRMED'] },
              },
            },
            _sum: { quantity: true },
          });
          remainingCapacity = Math.max(
            limit - (occupied._sum.quantity ?? 0),
            0,
          );
          capacityTransferred = item.quantity;
          if (item.quantity > remainingCapacity) {
            reasons.push(
              `${item.product.name} does not have enough capacity for the destination Session`,
            );
          }
        }
      }
      productEffects.push({
        bookingProductId: item.id,
        productId: item.productId,
        name: item.productVariant
          ? `${item.product.name} — ${item.productVariant.name}`
          : item.product.name,
        quantity: item.quantity,
        capacityTransferred,
        remainingCapacity,
        originalSessionProductId:
          originalAssignments.get(item.productId)?.id ?? null,
        destinationSessionProductId: assignment.id,
        finiteInventoryUnchanged:
          item.product.inventoryTracked ||
          Boolean(item.productVariant?.inventoryTracked),
      });
    }

    const bookingTicketTypeIds = booking.participants.map(
      ({ ticketTypeId }) => ticketTypeId,
    );
    const requiredBySlug = new Map<string, number>();
    for (const participant of booking.participants) {
      const evaluation = await this.ruleEvaluation.evaluate(booking.eventId, {
        customerAge: participant.age,
        participantAge: participant.age,
        participantFirstName: participant.firstName,
        participantLastName: participant.lastName ?? null,
        ticketTypeId: participant.ticketTypeId,
        sessionId: destinationSessionId,
        eventId: booking.eventId,
        flexibleBooking: booking.flexibleBooking,
        participantCount: booking.participants.length,
        bookingTicketTypeIds,
      });
      if (!evaluation.valid || evaluation.errors.length > 0) {
        reasons.push(
          evaluation.errors[0] ??
            'Current Event Rules block this Session change',
        );
      }
      for (const required of evaluation.requiredProducts) {
        requiredBySlug.set(
          required.productSlug,
          (requiredBySlug.get(required.productSlug) ?? 0) + required.quantity,
        );
      }
    }
    const selectedBySlug = new Map<string, number>();
    for (const item of booking.products) {
      selectedBySlug.set(
        item.product.slug,
        (selectedBySlug.get(item.product.slug) ?? 0) + item.quantity,
      );
    }
    for (const [slug, quantity] of requiredBySlug) {
      if ((selectedBySlug.get(slug) ?? 0) < quantity) {
        reasons.push('The Booking no longer satisfies required Product Rules');
      }
    }

    return {
      available: reasons.length === 0,
      reasons: [...new Set(reasons)],
      remainingAdmissionBeforeMove: remainingAdmission,
      remainingAdmissionAfterMove: Math.max(
        remainingAdmission - ticketCount,
        0,
      ),
      productEffects,
    };
  }

  private async occupiedAdmission(
    sessionId: string,
    client: PrismaService | Prisma.TransactionClient = this.prisma,
  ) {
    const bookings = await client.booking.findMany({
      where: {
        sessionId,
        status: { in: ['RESERVED', 'CONFIRMED'] },
      },
      select: {
        status: true,
        items: { select: { quantity: true } },
        tickets: { select: { status: true } },
      },
    });

    return bookings.reduce((total, booking) => {
      const itemQuantity = booking.items.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );
      if (booking.status === 'RESERVED' || booking.tickets.length === 0) {
        return total + itemQuantity;
      }
      return (
        total +
        booking.tickets.filter(({ status }) => status === 'ACTIVE').length
      );
    }, 0);
  }
}
