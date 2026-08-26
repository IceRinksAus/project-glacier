import { createHash } from 'crypto';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  AccessControlService,
  AuthenticatedAccessContext,
} from '../access-control/access-control.service';
import { PrismaService } from '../prisma/prisma.service';
import { RuleEvaluationService } from '../rule/rule-evaluation/rule-evaluation.service';

import { PreviewBookingRescheduleDto } from './dto/preview-booking-reschedule.dto';

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

  private async loadBooking(
    access: AuthenticatedAccessContext,
    bookingId: string,
  ) {
    const booking = await this.prisma.booking.findFirst({
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

  private async occupiedAdmission(sessionId: string) {
    const bookings = await this.prisma.booking.findMany({
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
