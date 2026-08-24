import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { BookingValidationService } from '../booking-validation/booking-validation.service';
import { PaymentService } from '../payment/payment.service';
import { PrismaService } from '../prisma/prisma.service';
import { RuleEvaluationService } from '../rule/rule-evaluation/rule-evaluation.service';

import { CreateBookingDto } from './dto/create-booking.dto';
import { SearchBookingsQueryDto } from './dto/search-bookings-query.dto';

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ruleEvaluationService: RuleEvaluationService,
    private readonly bookingValidationService: BookingValidationService,
    private readonly paymentService: PaymentService,
  ) {}

  private summarizeProviderReference(
    providerReference: string | null,
  ) {
    if (!providerReference) {
      return null;
    }

    return `••••${providerReference.slice(-8)}`;
  }

  private async createWithCapacityProtection<T>(
    operation: (transaction: Prisma.TransactionClient) => Promise<T>,
  ) {
    const maximumAttempts = 3;

    for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
      try {
        return await this.prisma.$transaction(operation, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error) {
        const isWriteConflict =
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          error.code === 'P2034';

        if (!isWriteConflict || attempt === maximumAttempts) {
          throw error;
        }
      }
    }

    throw new BadRequestException('Unable to reserve booking capacity.');
  }

  findAll(organizationId: string) {
    return this.prisma.booking.findMany({
      where: {
        event: {
          organizationId,
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
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async search(
    organizationId: string,
    query: SearchBookingsQueryDto,
  ) {
    const searchTerms = query.search
      ? query.search
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 5)
      : [];

    const where: Prisma.BookingWhereInput = {
      event: {
        organizationId,
      },
      ...(query.eventId
        ? {
            eventId: query.eventId,
          }
        : {}),
      ...(query.sessionId
        ? {
            sessionId: query.sessionId,
          }
        : {}),
      ...(query.bookingStatus
        ? {
            status:
              query.bookingStatus,
          }
        : {}),
      ...(query.paymentStatus
        ? {
            paymentStatus:
              query.paymentStatus,
          }
        : {}),
      ...(searchTerms.length > 0
        ? {
            AND: searchTerms.map(
              (term) => ({
                OR: [
                  {
                    bookingNumber: {
                      contains: term,
                      mode: 'insensitive',
                    },
                  },
                  {
                    customer: {
                      firstName: {
                        contains: term,
                        mode: 'insensitive',
                      },
                    },
                  },
                  {
                    customer: {
                      lastName: {
                        contains: term,
                        mode: 'insensitive',
                      },
                    },
                  },
                  {
                    customer: {
                      email: {
                        contains: term,
                        mode: 'insensitive',
                      },
                    },
                  },
                ],
              }),
            ),
          }
        : {}),
    };

    const direction =
      query.sortDirection;
    const orderBy: Prisma.BookingOrderByWithRelationInput[] =
      query.sortBy ===
      'sessionStart'
        ? [
            {
              session: {
                startDate: direction,
              },
            },
            {
              id: direction,
            },
          ]
        : query.sortBy ===
            'customerName'
          ? [
              {
                customer: {
                  lastName: direction,
                },
              },
              {
                customer: {
                  firstName: direction,
                },
              },
              {
                id: direction,
              },
            ]
          : [
              {
                [query.sortBy]:
                  direction,
              },
              {
                id: direction,
              },
            ];

    const skip =
      (query.page - 1) *
      query.pageSize;

    const [totalItems, items] =
      await this.prisma.$transaction([
        this.prisma.booking.count({
          where,
        }),
        this.prisma.booking.findMany({
          where,
          select: {
            id: true,
            bookingNumber: true,
            status: true,
            paymentStatus: true,
            total: true,
            createdAt: true,
            customer: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            event: {
              select: {
                id: true,
                name: true,
              },
            },
            session: {
              select: {
                id: true,
                name: true,
                startDate: true,
              },
            },
          },
          orderBy,
          skip,
          take: query.pageSize,
        }),
      ]);

    return {
      items: items.map(
        (booking) => ({
          ...booking,
          total:
            booking.total.toNumber(),
        }),
      ),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems,
        totalPages: Math.max(
          1,
          Math.ceil(
            totalItems /
              query.pageSize,
          ),
        ),
      },
    };
  }

  async findOne(organizationId: string, id: string) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        id,
        event: {
          organizationId,
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

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async findPaymentInvestigation(
    organizationId: string,
    id: string,
  ) {
    const booking =
      await this.prisma.booking.findFirst({
        where: {
          id,
          event: {
            organizationId,
          },
        },
        select: {
          id: true,
          bookingNumber: true,
          status: true,
          paymentStatus: true,
          total: true,
          reservedUntil: true,
          confirmedAt: true,
          paidAt: true,
          expiredAt: true,
          createdAt: true,
          customer: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          event: {
            select: {
              id: true,
              name: true,
            },
          },
          session: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
            },
          },
          tickets: {
            select: {
              ticketNumber: true,
              status: true,
              issuedAt: true,
            },
            orderBy: {
              issuedAt: 'asc',
            },
          },
          payments: {
            select: {
              id: true,
              provider: true,
              providerReference: true,
              amount: true,
              currency: true,
              status: true,
              failureCode: true,
              failureMessage: true,
              succeededAt: true,
              failedAt: true,
              cancelledAt: true,
              createdAt: true,
              updatedAt: true,
              refunds: {
                select: {
                  id: true,
                  amount: true,
                  currency: true,
                  status: true,
                  reason: true,
                  succeededAt: true,
                  failedAt: true,
                  cancelledAt: true,
                  createdAt: true,
                },
                orderBy: {
                  createdAt: 'desc',
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          paymentReconciliationAttempts: {
            select: {
              id: true,
              trigger: true,
              outcome: true,
              providerStatus: true,
              succeeded: true,
              errorMessage: true,
              attemptedAt: true,
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              attemptedAt: 'desc',
            },
          },
        },
      });

    if (!booking) {
      throw new NotFoundException(
        'Booking not found',
      );
    }

    const payments = booking.payments.map(
      (payment) => ({
        ...payment,
        providerReference:
          undefined,
        providerReferenceSummary:
          this.summarizeProviderReference(
            payment.providerReference,
          ),
      }),
    );

    return {
      ...booking,
      total: booking.total.toNumber(),
      payments: payments.map(
        ({ providerReference: _reference, ...payment }) => ({
          ...payment,
          amount: payment.amount.toNumber(),
          refunds: payment.refunds.map(
            (refund) => ({
              ...refund,
              amount:
                refund.amount.toNumber(),
            }),
          ),
        }),
      ),
      requiresReconciliation:
        payments.some(
          (payment) =>
            payment.status ===
            'PENDING',
        ),
    };
  }

  async reconcilePayment(
    organizationId: string,
    userId: string,
    id: string,
  ) {
    const booking =
      await this.prisma.booking.findFirst({
        where: {
          id,
          event: {
            organizationId,
          },
        },
        select: {
          id: true,
          eventId: true,
          payments: {
            where: {
              status: 'PENDING',
            },
            select: {
              id: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
      });

    if (!booking) {
      throw new NotFoundException(
        'Booking not found',
      );
    }

    const paymentId =
      booking.payments[0]?.id ?? null;

    try {
      const result =
        await this.paymentService.reconcilePendingPaymentForBooking(
          booking.id,
        );

      const outcome = result.reconciled
        ? `RECONCILED_${result.providerStatus}`
        : result.reason;

      await this.prisma.paymentReconciliationAttempt.create({
        data: {
          organizationId,
          eventId: booking.eventId,
          bookingId: booking.id,
          paymentId:
            result.paymentId ?? paymentId,
          userId,
          trigger: 'MANUAL',
          outcome,
          providerStatus:
            'providerStatus' in result
              ? result.providerStatus
              : null,
          succeeded: result.reconciled,
        },
      });

      return {
        result,
        investigation:
          await this.findPaymentInvestigation(
            organizationId,
            booking.id,
          ),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message.slice(0, 500)
          : 'Unknown reconciliation error';

      await this.prisma.paymentReconciliationAttempt.create({
        data: {
          organizationId,
          eventId: booking.eventId,
          bookingId: booking.id,
          paymentId,
          userId,
          trigger: 'MANUAL',
          outcome: 'ERROR',
          succeeded: false,
          errorMessage,
        },
      });

      throw error;
    }
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

    const bookingTicketTypeIds = data.participants.map(
      (participant) => participant.ticketTypeId,
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
              requiredProduct.message ? [requiredProduct.message] : [],
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

    const requiredProducts = Array.from(requiredProductMap.values()).map(
      (requirement) => ({
        productSlug: requirement.productSlug,
        quantity: requirement.quantity,
        ruleIds: Array.from(requirement.ruleIds),
        messages: Array.from(requirement.messages),
      }),
    );

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
      ticketTypes.map((ticketType) => [ticketType.id, ticketType]),
    );

    /*
     * Validate session capacity.
     */
    const requestedSessionQuantity = data.participants.length;

    const bookedQuantity = await this.prisma.bookingItem.aggregate({
      where: {
        booking: {
          sessionId: data.sessionId,
          status: {
            in: ['RESERVED', 'CONFIRMED'],
          },
        },
      },
      _sum: {
        quantity: true,
      },
    });

    const quantityAlreadyBooked = bookedQuantity._sum.quantity ?? 0;

    const remainingSessionCapacity = session.capacity - quantityAlreadyBooked;

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
    const selectedProductSelections = new Map<
      string,
      {
        productId: string;
        productVariantId: string | null;
        quantity: number;
      }
    >();

    for (const selectedProduct of data.products ?? []) {
      const currentQuantity =
        selectedProductQuantities.get(selectedProduct.productId) ?? 0;

      selectedProductQuantities.set(
        selectedProduct.productId,
        currentQuantity + selectedProduct.quantity,
      );

      const selectionKey = `${selectedProduct.productId}:${
        selectedProduct.productVariantId ?? ''
      }`;
      const currentSelection = selectedProductSelections.get(selectionKey);

      selectedProductSelections.set(selectionKey, {
        productId: selectedProduct.productId,
        productVariantId: selectedProduct.productVariantId ?? null,
        quantity: (currentSelection?.quantity ?? 0) + selectedProduct.quantity,
      });
    }

    const selectedProductIds = Array.from(selectedProductQuantities.keys());

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
      selectedProducts.map((product) => [product.id, product]),
    );

    const selectedVariantIds = Array.from(selectedProductSelections.values())
      .map((selection) => selection.productVariantId)
      .filter((variantId): variantId is string => variantId !== null);

    const selectedVariants =
      selectedVariantIds.length > 0
        ? await this.prisma.productVariant.findMany({
            where: {
              id: {
                in: selectedVariantIds,
              },
            },
          })
        : [];

    if (selectedVariants.length !== new Set(selectedVariantIds).size) {
      throw new BadRequestException(
        'One or more selected Product Variants are invalid',
      );
    }

    const selectedVariantMap = new Map(
      selectedVariants.map((variant) => [variant.id, variant]),
    );

    for (const selection of selectedProductSelections.values()) {
      if (!selection.productVariantId) {
        continue;
      }

      const variant = selectedVariantMap.get(selection.productVariantId);

      if (!variant || variant.productId !== selection.productId) {
        throw new BadRequestException(
          'The selected Product Variant does not belong to the selected Product',
        );
      }

      if (variant.status !== 'ACTIVE' || !variant.availableOnline) {
        throw new BadRequestException(
          `${variant.name} is not currently available`,
        );
      }
    }

    /*
     * Check product availability and quantity restrictions.
     */
    for (const [productId, quantity] of selectedProductQuantities.entries()) {
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

      if (product.maxQuantity !== null && quantity > product.maxQuantity) {
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

    for (const [productId, quantity] of selectedProductQuantities.entries()) {
      const product = selectedProductMap.get(productId);

      if (!product) {
        continue;
      }

      const currentQuantity = selectedQuantityBySlug.get(product.slug) ?? 0;

      selectedQuantityBySlug.set(product.slug, currentQuantity + quantity);
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
          missingQuantity: Math.max(requirement.quantity - selectedQuantity, 0),
        };
      })
      .filter((requirement) => requirement.missingQuantity > 0);

    if (missingRequiredProducts.length > 0) {
      throw new BadRequestException({
        message: 'The booking is missing one or more required products',
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
    const bookingParticipants = data.participants.map((participant) => ({
      firstName: participant.firstName,
      lastName: participant.lastName,
      age: participant.age,
      ticketTypeId: participant.ticketTypeId,
    }));

    /*
     * Calculate product total and prepare booking product records.
     */
    const bookingProducts = Array.from(selectedProductSelections.values()).map(
      ({ productId, productVariantId, quantity }) => {
        const product = selectedProductMap.get(productId);

        if (!product) {
          throw new BadRequestException('Product not found');
        }

        const variant = productVariantId
          ? selectedVariantMap.get(productVariantId)
          : null;
        const unitPrice = variant?.priceOverride ?? product.price;

        total = total.add(unitPrice.mul(quantity));

        return {
          productId: product.id,
          productVariantId,
          quantity,
          unitPrice,
        };
      },
    );

    const bookingNumber = `PG-${Date.now()}-${Math.floor(
      1000 + Math.random() * 9000,
    )}`;

    const booking = await this.createWithCapacityProtection(
      async (transaction) => {
        const currentSession = await transaction.session.findUnique({
          where: {
            id: data.sessionId,
          },
          select: {
            id: true,
            name: true,
            capacity: true,
            status: true,
            eventId: true,
          },
        });

        if (
          !currentSession ||
          currentSession.status !== 'ACTIVE' ||
          currentSession.eventId !== data.eventId
        ) {
          throw new BadRequestException(
            'The selected session is no longer available for booking',
          );
        }

        const currentBookedQuantity = await transaction.bookingItem.aggregate({
          where: {
            booking: {
              sessionId: data.sessionId,
              status: {
                in: ['RESERVED', 'CONFIRMED'],
              },
            },
          },
          _sum: {
            quantity: true,
          },
        });

        const currentSessionRemaining =
          currentSession.capacity - (currentBookedQuantity._sum.quantity ?? 0);

        if (requestedSessionQuantity > currentSessionRemaining) {
          throw new BadRequestException(
            `${currentSession.name} does not have enough capacity. ` +
              `Requested: ${requestedSessionQuantity}. ` +
              `Remaining: ${currentSessionRemaining}.`,
          );
        }

        if (selectedProductIds.length > 0) {
          const sessionProducts = await transaction.sessionProduct.findMany({
            where: {
              sessionId: data.sessionId,
              productId: {
                in: selectedProductIds,
              },
              active: true,
            },
            select: {
              productId: true,
              capacityOverride: true,
            },
          });

          if (sessionProducts.length !== selectedProductIds.length) {
            throw new BadRequestException(
              'One or more selected products are not active for the selected session',
            );
          }

          const sessionProductMap = new Map(
            sessionProducts.map((assignment) => [
              assignment.productId,
              assignment,
            ]),
          );

          for (const [productId, quantity] of selectedProductQuantities) {
            const product = selectedProductMap.get(productId);
            const assignment = sessionProductMap.get(productId);

            if (!product || !assignment) {
              throw new BadRequestException('Product availability changed.');
            }

            if (product.capacityControlled) {
              const capacityLimit =
                assignment.capacityOverride ?? product.capacity;

              if (capacityLimit === null) {
                throw new BadRequestException(
                  `${product.name} capacity has not been configured`,
                );
              }

              const occupied = await transaction.bookingProduct.aggregate({
                where: {
                  productId,
                  booking: {
                    sessionId: data.sessionId,
                    status: {
                      in: ['RESERVED', 'CONFIRMED'],
                    },
                  },
                },
                _sum: {
                  quantity: true,
                },
              });

              const remaining = capacityLimit - (occupied._sum.quantity ?? 0);

              if (quantity > remaining) {
                throw new BadRequestException(
                  `${product.name} does not have enough capacity for this Session. ` +
                    `Requested: ${quantity}. Remaining: ${Math.max(remaining, 0)}.`,
                );
              }
            }

            if (product.inventoryTracked && product.inventoryQuantity !== null) {
              const committed = await transaction.bookingProduct.aggregate({
                where: {
                  productId,
                  booking: {
                    status: {
                      in: ['RESERVED', 'CONFIRMED'],
                    },
                  },
                },
                _sum: {
                  quantity: true,
                },
              });

              const remainingInventory =
                product.inventoryQuantity - (committed._sum.quantity ?? 0);

              if (quantity > remainingInventory) {
                throw new BadRequestException(
                  `${product.name} does not have enough inventory available. ` +
                    `Requested: ${quantity}. Remaining: ${Math.max(
                      remainingInventory,
                      0,
                    )}.`,
                );
              }
            }
          }

          if (selectedVariantIds.length > 0) {
            const currentVariants = await transaction.productVariant.findMany({
              where: {
                id: {
                  in: selectedVariantIds,
                },
                status: 'ACTIVE',
                availableOnline: true,
              },
            });

            if (currentVariants.length !== new Set(selectedVariantIds).size) {
              throw new BadRequestException(
                'One or more selected Product Variants are no longer available',
              );
            }

            const currentVariantMap = new Map(
              currentVariants.map((variant) => [variant.id, variant]),
            );

            for (const selection of selectedProductSelections.values()) {
              if (!selection.productVariantId) {
                continue;
              }

              const variant = currentVariantMap.get(selection.productVariantId);

              if (!variant || variant.productId !== selection.productId) {
                throw new BadRequestException(
                  'Product Variant availability changed.',
                );
              }

              if (
                variant.inventoryTracked &&
                variant.inventoryQuantity !== null
              ) {
                const committed = await transaction.bookingProduct.aggregate({
                  where: {
                    productVariantId: variant.id,
                    booking: {
                      status: {
                        in: ['RESERVED', 'CONFIRMED'],
                      },
                    },
                  },
                  _sum: {
                    quantity: true,
                  },
                });

                const remainingInventory =
                  variant.inventoryQuantity -
                  (committed._sum.quantity ?? 0);

                if (selection.quantity > remainingInventory) {
                  throw new BadRequestException(
                    `${variant.name} does not have enough inventory available. ` +
                      `Requested: ${selection.quantity}. Remaining: ${Math.max(
                        remainingInventory,
                        0,
                      )}.`,
                  );
                }
              }
            }
          }
        }

        return transaction.booking.create({
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
      },
    );

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
