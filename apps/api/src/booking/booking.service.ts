import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { BookingValidationService } from '../booking-validation/booking-validation.service';
import { PrismaService } from '../prisma/prisma.service';
import { RuleEvaluationService } from '../rule/rule-evaluation/rule-evaluation.service';

import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingService {
 constructor(
  private readonly prisma: PrismaService,
  private readonly ruleEvaluationService: RuleEvaluationService,
  private readonly bookingValidationService: BookingValidationService,
) {}

  findAll() {
    return this.prisma.booking.findMany({
      include: {
        customer: true,
        event: true,
        session: true,
        items: {
          include: {
            ticketType: true,
          },
        },
        participants: {
          include: {
            ticketType: true,
          },
        },
        products: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: {
        id,
      },
      include: {
        customer: true,
        event: true,
        session: true,
        items: {
          include: {
            ticketType: true,
          },
        },
        participants: {
          include: {
            ticketType: true,
          },
        },
        products: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async create(data: CreateBookingDto) {
    await this.bookingValidationService.validateBooking(data);
    if (!data.participants || data.participants.length === 0) {
      throw new BadRequestException(
        'A booking must contain at least one participant',
      );
    }

    const customer = await this.prisma.customer.findUnique({
      where: {
        id: data.customerId,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const event = await this.prisma.event.findUnique({
      where: {
        id: data.eventId,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const session = await this.prisma.session.findUnique({
      where: {
        id: data.sessionId,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.eventId !== data.eventId) {
      throw new BadRequestException(
        'The selected session does not belong to the selected event',
      );
    }

    if (session.status !== 'ACTIVE') {
      throw new BadRequestException(
        'The selected session is not currently available for booking',
      );
    }

    /*
     * Evaluate all active event rules against each participant.
     */
    const matchedRuleIds = new Set<string>();

    const requiredProductMap = new Map<
      string,
      {
        productSlug: string;
        quantity: number;
        ruleIds: Set<string>;
        messages: Set<string>;
      }
    >();

    const ruleErrors: string[] = [];
    const ruleWarnings: string[] = [];

const bookingTicketTypeIds =
  data.participants.map(
    (participant) =>
      participant.ticketTypeId,
  );

    for (const participant of data.participants) {
      const evaluation = await this.ruleEvaluationService.evaluate(
        data.eventId,
        {
          customerAge: participant.age,
          participantAge: participant.age,
          participantFirstName: participant.firstName,
          participantLastName: participant.lastName ?? null,
          ticketTypeId: participant.ticketTypeId,
          sessionId: data.sessionId,
          eventId: data.eventId,
          flexibleBooking: data.flexibleBooking ?? false,
          participantCount: data.participants.length,
          bookingTicketTypeIds,
        },
      );

      for (const ruleId of evaluation.matchedRuleIds) {
        matchedRuleIds.add(ruleId);
      }

      for (const error of evaluation.errors) {
        ruleErrors.push(`${participant.firstName}: ${error}`);
      }

      for (const warning of evaluation.warnings) {
        ruleWarnings.push(`${participant.firstName}: ${warning}`);
      }

      for (const requiredProduct of evaluation.requiredProducts) {
        const existingRequirement = requiredProductMap.get(
          requiredProduct.productSlug,
        );

        if (existingRequirement) {
          existingRequirement.quantity += requiredProduct.quantity;
          existingRequirement.ruleIds.add(requiredProduct.ruleId);

          if (requiredProduct.message) {
            existingRequirement.messages.add(requiredProduct.message);
          }
        } else {
          requiredProductMap.set(requiredProduct.productSlug, {
            productSlug: requiredProduct.productSlug,
            quantity: requiredProduct.quantity,
            ruleIds: new Set([requiredProduct.ruleId]),
            messages: new Set(
              requiredProduct.message
                ? [requiredProduct.message]
                : [],
            ),
          });
        }
      }
    }

    if (ruleErrors.length > 0) {
      throw new BadRequestException({
        message: 'The booking does not satisfy the event rules',
        errors: ruleErrors,
        warnings: ruleWarnings,
        matchedRuleIds: Array.from(matchedRuleIds),
      });
    }

    const requiredProducts = Array.from(
      requiredProductMap.values(),
    ).map((requirement) => ({
      productSlug: requirement.productSlug,
      quantity: requirement.quantity,
      ruleIds: Array.from(requirement.ruleIds),
      messages: Array.from(requirement.messages),
    }));

    /*
     * Group participants by ticket type.
     */
    const requestedTicketQuantities = new Map<string, number>();

    for (const participant of data.participants) {
      const currentQuantity =
        requestedTicketQuantities.get(participant.ticketTypeId) ?? 0;

      requestedTicketQuantities.set(
        participant.ticketTypeId,
        currentQuantity + 1,
      );
    }

    const consolidatedTicketItems = Array.from(
      requestedTicketQuantities.entries(),
    ).map(([ticketTypeId, quantity]) => ({
      ticketTypeId,
      quantity,
    }));

    const ticketTypeIds = consolidatedTicketItems.map(
      (item) => item.ticketTypeId,
    );

    const ticketTypes = await this.prisma.ticketType.findMany({
      where: {
        id: {
          in: ticketTypeIds,
        },
        eventId: data.eventId,
        active: true,
      },
    });

    if (ticketTypes.length !== ticketTypeIds.length) {
      throw new BadRequestException(
        'One or more ticket types are invalid, inactive, or belong to another event',
      );
    }

    const ticketTypeMap = new Map(
      ticketTypes.map((ticketType) => [
        ticketType.id,
        ticketType,
      ]),
    );

    /*
     * Validate session capacity.
     */
    const requestedSessionQuantity = data.participants.length;

const bookedQuantity =
  await this.prisma.bookingItem.aggregate({
    where: {
      booking: {
        sessionId: data.sessionId,
        status: {
          in: [
            'RESERVED',
            'CONFIRMED',
          ],
        },
      },
    },
    _sum: {
      quantity: true,
    },
  });

    const quantityAlreadyBooked =
      bookedQuantity._sum.quantity ?? 0;

    const remainingSessionCapacity =
      session.capacity - quantityAlreadyBooked;

    if (requestedSessionQuantity > remainingSessionCapacity) {
      throw new BadRequestException(
        `${session.name} does not have enough capacity. ` +
          `Requested: ${requestedSessionQuantity}. ` +
          `Remaining: ${remainingSessionCapacity}.`,
      );
    }

    /*
     * Consolidate selected products in case the same product ID
     * appears more than once in the request.
     */
    const selectedProductQuantities = new Map<string, number>();

    for (const selectedProduct of data.products ?? []) {
      const currentQuantity =
        selectedProductQuantities.get(selectedProduct.productId) ?? 0;

      selectedProductQuantities.set(
        selectedProduct.productId,
        currentQuantity + selectedProduct.quantity,
      );
    }

    const selectedProductIds = Array.from(
      selectedProductQuantities.keys(),
    );

    const selectedProducts =
      selectedProductIds.length > 0
        ? await this.prisma.product.findMany({
            where: {
              id: {
                in: selectedProductIds,
              },
              eventId: data.eventId,
            },
          })
        : [];

    if (selectedProducts.length !== selectedProductIds.length) {
      throw new BadRequestException(
        'One or more selected products are invalid or belong to another event',
      );
    }

    const selectedProductMap = new Map(
      selectedProducts.map((product) => [
        product.id,
        product,
      ]),
    );

    /*
     * Check product availability and quantity restrictions.
     */
    for (const [
      productId,
      quantity,
    ] of selectedProductQuantities.entries()) {
      const product = selectedProductMap.get(productId);

      if (!product) {
        throw new BadRequestException(
          `Selected product ${productId} was not found`,
        );
      }

      if (product.status !== 'ACTIVE') {
        throw new BadRequestException(
          `${product.name} is not currently active`,
        );
      }

      if (!product.availableOnline) {
        throw new BadRequestException(
          `${product.name} is not available for online booking`,
        );
      }

      if (quantity < product.minQuantity) {
        throw new BadRequestException(
          `${product.name} requires a minimum quantity of ${product.minQuantity}`,
        );
      }

      if (
        product.maxQuantity !== null &&
        quantity > product.maxQuantity
      ) {
        throw new BadRequestException(
          `${product.name} has a maximum quantity of ${product.maxQuantity}`,
        );
      }

      if (
        product.inventoryTracked &&
        product.inventoryQuantity !== null &&
        quantity > product.inventoryQuantity
      ) {
        throw new BadRequestException(
          `${product.name} does not have enough inventory available`,
        );
      }
    }

    /*
     * Build a quantity lookup by product slug.
     *
     * Rules refer to products by slug rather than database ID.
     */
    const selectedQuantityBySlug = new Map<string, number>();

    for (const [
      productId,
      quantity,
    ] of selectedProductQuantities.entries()) {
      const product = selectedProductMap.get(productId);

      if (!product) {
        continue;
      }

      const currentQuantity =
        selectedQuantityBySlug.get(product.slug) ?? 0;

      selectedQuantityBySlug.set(
        product.slug,
        currentQuantity + quantity,
      );
    }

    /*
     * Enforce every product requirement generated by the rule engine.
     */
    const missingRequiredProducts = requiredProducts
      .map((requirement) => {
        const selectedQuantity =
          selectedQuantityBySlug.get(requirement.productSlug) ?? 0;

        return {
          ...requirement,
          selectedQuantity,
          missingQuantity: Math.max(
            requirement.quantity - selectedQuantity,
            0,
          ),
        };
      })
      .filter((requirement) => requirement.missingQuantity > 0);

    if (missingRequiredProducts.length > 0) {
      throw new BadRequestException({
        message:
          'The booking is missing one or more required products',
        requiredProducts,
        missingRequiredProducts,
        warnings: ruleWarnings,
        matchedRuleIds: Array.from(matchedRuleIds),
      });
    }

/*
 * Calculate ticket total and prepare booking item records.
 *
 * Monetary arithmetic uses Prisma.Decimal so booking totals remain
 * deterministic and do not rely on JavaScript floating-point maths.
 */
let total = new Prisma.Decimal(0);

const bookingItems = consolidatedTicketItems.map((item) => {
  const ticketType = ticketTypeMap.get(item.ticketTypeId);

  if (!ticketType) {
    throw new BadRequestException('Ticket type not found');
  }

  const totalPrice = ticketType.price.mul(item.quantity);

  total = total.add(totalPrice);

  return {
    ticketTypeId: ticketType.id,
    quantity: item.quantity,
    unitPrice: ticketType.price,
    totalPrice,
  };
});

/*
 * Prepare participant records.
 */
const bookingParticipants = data.participants.map(
  (participant) => ({
    firstName: participant.firstName,
    lastName: participant.lastName,
    age: participant.age,
    ticketTypeId: participant.ticketTypeId,
  }),
);

/*
 * Calculate product total and prepare booking product records.
 */
const bookingProducts = Array.from(
  selectedProductQuantities.entries(),
).map(([productId, quantity]) => {
  const product = selectedProductMap.get(productId);

  if (!product) {
    throw new BadRequestException('Product not found');
  }

  total = total.add(
    product.price.mul(quantity),
  );

  return {
    productId: product.id,
    quantity,
    unitPrice: product.price,
  };
});

    const bookingNumber = `PG-${Date.now()}-${Math.floor(
      1000 + Math.random() * 9000,
    )}`;

   const booking = await this.prisma.booking.create({
  data: {
    bookingNumber,
    status: 'RESERVED',
reservedUntil: new Date(Date.now() + 15 * 60 * 1000),
    paymentStatus: 'UNPAID',
    total,
    flexibleBooking: data.flexibleBooking ?? false,
    customerId: data.customerId,
    eventId: data.eventId,
    sessionId: data.sessionId,
        items: {
          create: bookingItems,
        },
        participants: {
          create: bookingParticipants,
        },
        products: {
          create: bookingProducts,
        },
      },
      include: {
        customer: true,
        event: true,
        session: true,
        items: {
          include: {
            ticketType: true,
          },
        },
        participants: {
          include: {
            ticketType: true,
          },
        },
        products: {
          include: {
            product: true,
          },
        },
      },
    });

    return {
      booking,
      ruleEvaluation: {
        valid: true,
        matchedRuleIds: Array.from(matchedRuleIds),
        requiredProducts,
        errors: [],
        warnings: ruleWarnings,
      },
    };
  }
}