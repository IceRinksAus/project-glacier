import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import {
  CheckoutAcceptanceChannel,
  CheckoutDocumentStatus,
  CheckoutDocumentType,
} from '@prisma/client';

import { PaymentService } from '../payment/payment.service';
import { PrismaService } from '../prisma/prisma.service';
import { TicketCredentialService } from '../ticket/ticket-credential.service';
import { CheckoutConsentService } from '../checkout-consent/checkout-consent.service';
import { CreatePublicPaymentDto } from './dto/create-public-payment.dto';

@Injectable()
export class PublicPaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
    private readonly ticketCredentials: TicketCredentialService,
    private readonly checkoutConsent: CheckoutConsentService,
  ) {}

  async checkoutDocuments(bookingId: string, publicAccessToken: string) {
    const booking = await this.findBookingAccess(bookingId, publicAccessToken);
    const documents = await this.prisma.checkoutDocument.findMany({
      where: {
        organizationId: booking.event.organizationId,
        eventId: booking.eventId,
        status: CheckoutDocumentStatus.PUBLISHED,
      },
      select: {
        id: true,
        type: true,
        version: true,
        title: true,
        content: true,
      },
      orderBy: { type: 'asc' },
    });
    const terms = documents.find(
      ({ type }) => type === CheckoutDocumentType.TICKETING_TERMS,
    );
    const privacy = documents.find(
      ({ type }) => type === CheckoutDocumentType.PRIVACY_NOTICE,
    );
    if (!terms || !privacy) {
      throw new BadRequestException(
        'This Event is not ready to accept Ticket payments.',
      );
    }
    return {
      terms,
      privacy,
      marketing:
        documents.find(
          ({ type }) => type === CheckoutDocumentType.MARKETING_DISCLOSURE,
        ) ?? null,
      marketingSenderName:
        booking.event.organization.tradingName ??
        booking.event.organization.name,
    };
  }

  async createPayment(bookingId: string, data: CreatePublicPaymentDto) {
    if (!data.termsAccepted) {
      throw new BadRequestException(
        'Ticketing Terms must be accepted before payment.',
      );
    }
    const booking = await this.findBookingAccess(
      bookingId,
      data.publicAccessToken,
    );
    const context = await this.checkoutDocuments(
      bookingId,
      data.publicAccessToken,
    );
    if (
      data.termsDocumentId !== context.terms.id ||
      data.privacyDocumentId !== context.privacy.id
    ) {
      throw new BadRequestException(
        'Checkout documents have changed. Review them before payment.',
      );
    }
    await this.checkoutConsent.recordBookingAcceptance({
      organizationId: booking.event.organizationId,
      eventId: booking.eventId,
      bookingId: booking.id,
      customerId: booking.customerId,
      termsDocumentId: data.termsDocumentId,
      privacyDocumentId: data.privacyDocumentId,
      channel: CheckoutAcceptanceChannel.ONLINE,
    });
    if (context.marketing) {
      if (data.marketingDisclosureDocumentId !== context.marketing.id) {
        throw new BadRequestException(
          'Marketing disclosure has changed. Review it before payment.',
        );
      }
      await this.checkoutConsent.recordOnlineMarketingChoice({
        organizationId: booking.event.organizationId,
        eventId: booking.eventId,
        bookingId: booking.id,
        customerId: booking.customerId,
        disclosureDocumentId: context.marketing.id,
        granted: data.marketingAccepted === true,
        senderName: context.marketingSenderName,
      });
    }
    return this.paymentService.createPayment(booking.id);
  }

  private async findBookingAccess(
    bookingId: string,
    publicAccessToken: string,
  ) {
    const publicAccessTokenHash = createHash('sha256')
      .update(publicAccessToken)
      .digest('hex');

    const booking = await this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        publicAccessTokenHash,
      },
      select: {
        id: true,
        eventId: true,
        customerId: true,
        event: {
          select: {
            organizationId: true,
            organization: { select: { name: true, tradingName: true } },
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found or access token invalid.');
    }

    return booking;
  }

  async getBookingStatus(bookingId: string, publicAccessToken: string) {
    const publicAccessTokenHash = createHash('sha256')
      .update(publicAccessToken)
      .digest('hex');

    const booking = await this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        publicAccessTokenHash,
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
        event: {
          select: {
            name: true,
            slug: true,
            waiver: {
              select: {
                publicSlug: true,
              },
            },
          },
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
        flexibleTicketEntitlements: {
          select: {
            entitlementNumber: true,
            status: true,
            feeAmount: true,
            currency: true,
            remainingUses: true,
            allowsSessionChangeSnapshot: true,
            allowsRefundRequestSnapshot: true,
            customerSummarySnapshot: true,
            materialTermsSnapshot: true,
            initialTicket: {
              select: { ticketNumber: true },
            },
            participant: {
              select: { firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found or access token invalid.');
    }

    const confirmed =
      booking.status === 'CONFIRMED' && booking.paymentStatus === 'PAID';

    return {
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      total: Number(booking.total),
      reservedUntil: booking.reservedUntil,
      confirmedAt: booking.confirmedAt,
      paidAt: booking.paidAt,
      event: {
        name: booking.event.name,
        slug: booking.event.slug,
        waiverPublicSlug: booking.event.waiver?.publicSlug ?? null,
      },
      tickets: confirmed
        ? booking.tickets.map((ticket) => ({
            ticketNumber: ticket.ticketNumber,
            secureToken: this.ticketCredentials.present(ticket),
            status: ticket.status,
            participant: ticket.participant,
          }))
        : [],
      flexibleTicketEntitlements: confirmed
        ? booking.flexibleTicketEntitlements.map((entitlement) => ({
            ...entitlement,
            feeAmount: entitlement.feeAmount.toNumber(),
          }))
        : [],
    };
  }
}
