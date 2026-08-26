import { Injectable, NotFoundException } from '@nestjs/common';

import { createHash, randomBytes } from 'node:crypto';

import { BookingService } from '../booking/booking.service';
import { CreateBookingDto } from '../booking/dto/create-booking.dto';
import { FlexibleTicketPolicyService } from '../flexible-ticket-policy/flexible-ticket-policy.service';
import { PrismaService } from '../prisma/prisma.service';
import { RuleEvaluationService } from '../rule/rule-evaluation/rule-evaluation.service';
import { QuoteFlexibleTicketDto } from './dto/quote-flexible-ticket.dto';

interface EvaluatePublicRulesParticipant {
  firstName: string;
  lastName?: string;
  age: number;
  ticketTypeId: string;
}

interface EvaluatePublicRulesData {
  sessionId: string;
  flexibleBooking?: boolean;
  participants: EvaluatePublicRulesParticipant[];
}

@Injectable()
export class PublicBookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bookingService: BookingService,
    private readonly ruleEvaluationService: RuleEvaluationService,
    private readonly flexibleTicketPolicies: FlexibleTicketPolicyService,
  ) {}

  async findEvent(eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        startDate: true,
        endDate: true,
        timezone: true,
        status: true,
        waiver: {
          select: {
            publicSlug: true,
            versions: {
              where: {
                status: 'PUBLISHED',
              },
              select: {
                id: true,
              },
              take: 1,
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found.');
    }

    const { waiver, ...publicEvent } = event;

    return {
      ...publicEvent,
      waiverPublicSlug:
        waiver && waiver.versions.length > 0 ? waiver.publicSlug : null,
    };
  }

  async findEventBySlug(eventSlug: string) {
    const event = await this.prisma.event.findFirst({
      where: { slug: eventSlug, status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        startDate: true,
        endDate: true,
        timezone: true,
        venueName: true,
        suburb: true,
        branding: {
          select: {
            primaryColor: true,
            secondaryColor: true,
            accentColor: true,
            backgroundColor: true,
            surfaceColor: true,
            textColor: true,
            headingFont: true,
            bodyFont: true,
            heroHeadline: true,
            heroDescription: true,
            logoAsset: { select: { id: true, width: true, height: true } },
            heroAsset: { select: { id: true, width: true, height: true } },
          },
        },
        waiver: {
          select: {
            publicSlug: true,
            versions: {
              where: { status: 'PUBLISHED' },
              select: { id: true },
              take: 1,
            },
          },
        },
      },
    });
    if (!event) throw new NotFoundException('Event not found.');
    const { waiver, ...publicEvent } = event;
    return {
      ...publicEvent,
      waiverPublicSlug:
        waiver && waiver.versions.length > 0 ? waiver.publicSlug : null,
    };
  }

  async findSessions(eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found.');
    }

    return this.prisma.session.findMany({
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
        status: true,
        salesStart: true,
        salesEnd: true,
        eventId: true,
      },
      orderBy: {
        startDate: 'asc',
      },
    });
  }

  async findTicketTypes(eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found.');
    }

    return this.prisma.ticketType.findMany({
      where: {
        eventId,
        active: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        capacity: true,
        active: true,
        saleStart: true,
        saleEnd: true,
        eventId: true,
      },
    });
  }

  quoteFlexibleTicket(eventId: string, data: QuoteFlexibleTicketDto) {
    return this.flexibleTicketPolicies.quotePublicOffer(eventId, data);
  }

  async evaluateRules(eventId: string, data: EvaluatePublicRulesData) {
    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found.');
    }

    const session = await this.prisma.session.findFirst({
      where: {
        id: data.sessionId,
        eventId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found.');
    }

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

    const errors: string[] = [];
    const warnings: string[] = [];

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

      for (const ruleId of evaluation.matchedRuleIds) {
        matchedRuleIds.add(ruleId);
      }

      for (const error of evaluation.errors) {
        errors.push(`${participant.firstName}: ${error}`);
      }

      for (const warning of evaluation.warnings) {
        warnings.push(`${participant.firstName}: ${warning}`);
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

          continue;
        }

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

    const requiredProducts = Array.from(requiredProductMap.values()).map(
      (requirement) => ({
        productSlug: requirement.productSlug,
        quantity: requirement.quantity,
        ruleIds: Array.from(requirement.ruleIds),
        messages: Array.from(requirement.messages),
      }),
    );

    return {
      valid: errors.length === 0,
      matchedRuleIds: Array.from(matchedRuleIds),
      requiredProducts,
      errors,
      warnings,
    };
  }

  async findSessionProducts(sessionId: string) {
    const session = await this.prisma.session.findFirst({
      where: {
        id: sessionId,
        status: 'ACTIVE',
        event: {
          status: 'ACTIVE',
        },
      },
      select: {
        id: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found.');
    }

    const sessionProducts = await this.prisma.sessionProduct.findMany({
      where: {
        sessionId,
        active: true,
        product: {
          status: 'ACTIVE',
          availableOnline: true,
          productType: {
            not: 'ADMISSION',
          },
        },
      },
      select: {
        id: true,
        sessionId: true,
        productId: true,
        sortOrder: true,
        capacityOverride: true,
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
            salesStart: true,
            salesEnd: true,
            eventId: true,
            sortOrder: true,
            productGroup: {
              select: {
                id: true,
                name: true,
                description: true,
                sortOrder: true,
              },
            },
            variants: {
              where: {
                status: 'ACTIVE',
                availableOnline: true,
              },
              select: {
                id: true,
                productId: true,
                name: true,
                slug: true,
                description: true,
                priceOverride: true,
                imageUrl: true,
                inventoryTracked: true,
                inventoryQuantity: true,
                sortOrder: true,
              },
              orderBy: [
                {
                  sortOrder: 'asc',
                },
                {
                  name: 'asc',
                },
              ],
            },
          },
        },
      },
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          createdAt: 'asc',
        },
      ],
    });

    const availableProducts = await Promise.all(
      sessionProducts.map(async (sessionProduct) => {
        const limits: number[] = [];

        const variantsWithAvailability = await Promise.all(
          sessionProduct.product.variants.map(async (variant) => {
            if (
              !variant.inventoryTracked ||
              variant.inventoryQuantity === null
            ) {
              return {
                ...variant,
                remainingQuantity: null,
              };
            }

            const committed = await this.prisma.bookingProduct.aggregate({
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

            const remainingQuantity = Math.max(
              variant.inventoryQuantity - (committed._sum.quantity ?? 0),
              0,
            );

            return remainingQuantity === 0
              ? null
              : {
                  ...variant,
                  remainingQuantity,
                };
          }),
        );

        const availableVariants = variantsWithAvailability.filter(
          (variant): variant is NonNullable<typeof variant> => variant !== null,
        );

        if (
          sessionProduct.product.variants.length > 0 &&
          availableVariants.length === 0
        ) {
          return null;
        }

        if (sessionProduct.product.capacityControlled) {
          const limit =
            sessionProduct.capacityOverride ?? sessionProduct.product.capacity;

          if (limit !== null) {
            const occupied = await this.prisma.bookingProduct.aggregate({
              where: {
                productId: sessionProduct.productId,
                booking: {
                  sessionId,
                  status: {
                    in: ['RESERVED', 'CONFIRMED'],
                  },
                },
              },
              _sum: {
                quantity: true,
              },
            });

            limits.push(Math.max(limit - (occupied._sum.quantity ?? 0), 0));
          }
        }

        if (
          sessionProduct.product.inventoryTracked &&
          sessionProduct.product.inventoryQuantity !== null
        ) {
          const committed = await this.prisma.bookingProduct.aggregate({
            where: {
              productId: sessionProduct.productId,
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

          limits.push(
            Math.max(
              sessionProduct.product.inventoryQuantity -
                (committed._sum.quantity ?? 0),
              0,
            ),
          );
        }

        const remainingQuantity =
          limits.length > 0 ? Math.min(...limits) : null;

        return remainingQuantity === 0
          ? null
          : {
              ...sessionProduct,
              product: {
                ...sessionProduct.product,
                variants: availableVariants,
              },
              remainingQuantity,
            };
      }),
    );

    return availableProducts
      .filter(
        (
          sessionProduct,
        ): sessionProduct is NonNullable<typeof sessionProduct> =>
          sessionProduct !== null,
      )
      .sort((left, right) => {
        const leftGroupOrder =
          left.product.productGroup?.sortOrder ?? Number.MAX_SAFE_INTEGER;
        const rightGroupOrder =
          right.product.productGroup?.sortOrder ?? Number.MAX_SAFE_INTEGER;
        return (
          leftGroupOrder - rightGroupOrder ||
          (left.product.productGroup?.name ?? '').localeCompare(
            right.product.productGroup?.name ?? '',
          ) ||
          left.product.sortOrder - right.product.sortOrder ||
          left.product.name.localeCompare(right.product.name) ||
          left.product.id.localeCompare(right.product.id)
        );
      });
  }

  createCustomer(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  }) {
    return this.prisma.customer.create({
      data,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });
  }

  async createBooking(data: CreateBookingDto) {
    const result = await this.bookingService.create(data);

    const booking = result.booking;
    const flexibleTicketEntitlements =
      'flexibleTicketEntitlements' in booking
        ? booking.flexibleTicketEntitlements
        : [];

    if (!booking.session) {
      throw new NotFoundException('Booking session not found.');
    }

    /*
     * Generate a high-entropy public access token.
     *
     * The raw token is returned once to the customer.
     * Glacier stores only its SHA-256 hash.
     */
    const publicAccessToken = randomBytes(32).toString('hex');

    const publicAccessTokenHash = createHash('sha256')
      .update(publicAccessToken)
      .digest('hex');

    const publicAccessTokenCreatedAt = new Date();

    await this.prisma.booking.update({
      where: {
        id: booking.id,
      },
      data: {
        publicAccessTokenHash,
        publicAccessTokenCreatedAt,
      },
    });

    return {
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        total: booking.total,
        reservedUntil: booking.reservedUntil,
        flexibleBooking: booking.flexibleBooking,
        flexibleTicketFeeTotal: flexibleTicketEntitlements.reduce(
          (total, entitlement) => total + entitlement.feeAmount.toNumber(),
          0,
        ),

        /*
         * Returned only through this public
         * reservation-creation response.
         *
         * The stored hash is never exposed.
         */
        publicAccessToken,

        customer: {
          id: booking.customer.id,
          firstName: booking.customer.firstName,
          lastName: booking.customer.lastName,
          email: booking.customer.email,
          phone: booking.customer.phone,
        },

        event: {
          id: booking.event.id,
          name: booking.event.name,
          slug: booking.event.slug,
          timezone: booking.event.timezone,
        },

        session: {
          id: booking.session.id,
          name: booking.session.name,
          startDate: booking.session.startDate,
          endDate: booking.session.endDate,
        },

        items: booking.items.map((item) => ({
          ticketTypeId: item.ticketTypeId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          ticketType: {
            id: item.ticketType.id,
            name: item.ticketType.name,
          },
        })),

        participants: booking.participants.map((participant) => ({
          id: participant.id,
          firstName: participant.firstName,
          lastName: participant.lastName,
          age: participant.age,
          ticketTypeId: participant.ticketTypeId,
        })),

        flexibleTicketEntitlements: flexibleTicketEntitlements.map(
          (entitlement) => ({
            entitlementNumber: entitlement.entitlementNumber,
            participantId: entitlement.participantId,
            status: 'PENDING',
            feeAmount: entitlement.feeAmount.toNumber(),
            currency: entitlement.currency,
            policyVersion: entitlement.policyVersion,
            customerSummary: entitlement.customerSummarySnapshot,
          }),
        ),

        products: booking.products.map((bookingProduct) => ({
          productId: bookingProduct.productId,
          quantity: bookingProduct.quantity,
          unitPrice: bookingProduct.unitPrice,
          product: {
            id: bookingProduct.product.id,
            name: bookingProduct.product.name,
            slug: bookingProduct.product.slug,
          },
        })),
      },

      ruleEvaluation: result.ruleEvaluation,
    };
  }
}
