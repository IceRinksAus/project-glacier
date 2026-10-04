import { createHash } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CheckoutAcceptanceChannel,
  CheckoutDocumentStatus,
  CheckoutDocumentType,
  MarketingConsentDecision,
  MarketingConsentChannel,
} from '@prisma/client';

import {
  AccessControlService,
  AuthenticatedAccessContext,
} from '../access-control/access-control.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CheckoutConsentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControl: AccessControlService,
  ) {}

  async createDraft(
    access: AuthenticatedAccessContext,
    eventId: string,
    input: {
      type: CheckoutDocumentType;
      title: string;
      content: string;
      testOnly?: boolean;
    },
  ) {
    this.assertManagementRole(access);
    await this.accessControl.assertEventAccess(eventId, access);
    const title = input.title.trim();
    const content = input.content.trim();
    if (!title || !content) {
      throw new BadRequestException('Document title and content are required.');
    }

    const existingDraft = await this.prisma.checkoutDocument.findFirst({
      where: {
        organizationId: access.organizationId,
        eventId,
        type: input.type,
        status: CheckoutDocumentStatus.DRAFT,
      },
      select: { id: true },
    });
    if (existingDraft) {
      throw new ConflictException(
        'Finish or discard the existing draft before creating another version.',
      );
    }

    const latest = await this.prisma.checkoutDocument.findFirst({
      where: {
        organizationId: access.organizationId,
        eventId,
        type: input.type,
      },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    return this.prisma.checkoutDocument.create({
      data: {
        organizationId: access.organizationId,
        eventId,
        type: input.type,
        version: (latest?.version ?? 0) + 1,
        title,
        content,
        contentHash: this.hash(content),
        testOnly: input.testOnly ?? true,
        createdByUserId: access.userId,
      },
    });
  }

  async publish(
    access: AuthenticatedAccessContext,
    eventId: string,
    documentId: string,
  ) {
    this.assertManagementRole(access);
    await this.accessControl.assertEventAccess(eventId, access);

    const document = await this.prisma.checkoutDocument.findFirst({
      where: {
        id: documentId,
        organizationId: access.organizationId,
        eventId,
        status: CheckoutDocumentStatus.DRAFT,
      },
    });
    if (!document) throw new NotFoundException('Document draft not found.');

    const publishedAt = new Date();
    return this.prisma.$transaction(async (transaction) => {
      await transaction.checkoutDocument.updateMany({
        where: {
          organizationId: access.organizationId,
          eventId,
          type: document.type,
          status: CheckoutDocumentStatus.PUBLISHED,
        },
        data: { status: CheckoutDocumentStatus.SUPERSEDED },
      });
      return transaction.checkoutDocument.update({
        where: { id: document.id },
        data: {
          status: CheckoutDocumentStatus.PUBLISHED,
          publishedAt,
          publishedByUserId: access.userId,
        },
      });
    });
  }

  async recordBookingAcceptance(input: {
    organizationId: string;
    eventId: string;
    bookingId: string;
    customerId: string;
    termsDocumentId: string;
    privacyDocumentId: string;
    channel: CheckoutAcceptanceChannel;
    recordedByUserId?: string;
  }) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        id: input.bookingId,
        eventId: input.eventId,
        customerId: input.customerId,
        event: { organizationId: input.organizationId },
      },
      select: { id: true },
    });
    if (!booking) throw new NotFoundException('Booking not found.');
    if (
      (input.channel === CheckoutAcceptanceChannel.POS &&
        !input.recordedByUserId) ||
      (input.channel === CheckoutAcceptanceChannel.ONLINE &&
        input.recordedByUserId)
    ) {
      throw new BadRequestException(
        'Acceptance channel attribution is invalid.',
      );
    }

    const documents = await this.prisma.checkoutDocument.findMany({
      where: {
        id: { in: [input.termsDocumentId, input.privacyDocumentId] },
        organizationId: input.organizationId,
        eventId: input.eventId,
        status: CheckoutDocumentStatus.PUBLISHED,
      },
    });
    const terms = documents.find(
      ({ id, type }) =>
        id === input.termsDocumentId &&
        type === CheckoutDocumentType.TICKETING_TERMS,
    );
    const privacy = documents.find(
      ({ id, type }) =>
        id === input.privacyDocumentId &&
        type === CheckoutDocumentType.PRIVACY_NOTICE,
    );
    if (!terms || !privacy) {
      throw new BadRequestException(
        'Current published checkout documents are required.',
      );
    }

    return this.prisma.bookingCheckoutAcceptance.create({
      data: {
        organizationId: input.organizationId,
        eventId: input.eventId,
        bookingId: input.bookingId,
        customerId: input.customerId,
        termsDocumentId: terms.id,
        termsVersion: terms.version,
        termsContentHash: terms.contentHash,
        privacyDocumentId: privacy.id,
        privacyVersion: privacy.version,
        privacyContentHash: privacy.contentHash,
        channel: input.channel,
        recordedByUserId: input.recordedByUserId,
      },
    });
  }

  async recordOnlineMarketingChoice(input: {
    organizationId: string;
    eventId: string;
    bookingId: string;
    customerId: string;
    disclosureDocumentId: string;
    granted: boolean;
    senderName: string;
  }) {
    const senderName = input.senderName.trim();
    if (!senderName) throw new BadRequestException('Sender name is required.');
    const booking = await this.prisma.booking.findFirst({
      where: {
        id: input.bookingId,
        eventId: input.eventId,
        customerId: input.customerId,
        event: { organizationId: input.organizationId },
      },
      select: { id: true },
    });
    const disclosure = await this.prisma.checkoutDocument.findFirst({
      where: {
        id: input.disclosureDocumentId,
        organizationId: input.organizationId,
        eventId: input.eventId,
        type: CheckoutDocumentType.MARKETING_DISCLOSURE,
        status: CheckoutDocumentStatus.PUBLISHED,
      },
    });
    if (!booking || !disclosure) {
      throw new BadRequestException('Marketing evidence scope is invalid.');
    }

    return this.prisma.marketingConsentEvidence.create({
      data: {
        organizationId: input.organizationId,
        eventId: input.eventId,
        bookingId: input.bookingId,
        customerId: input.customerId,
        disclosureDocumentId: disclosure.id,
        disclosureVersion: disclosure.version,
        disclosureContentHash: disclosure.contentHash,
        senderName,
        decision: input.granted
          ? MarketingConsentDecision.GRANTED
          : MarketingConsentDecision.DECLINED,
        channel: MarketingConsentChannel.ONLINE,
      },
    });
  }

  async withdrawMarketing(
    access: AuthenticatedAccessContext,
    eventId: string,
    customerId: string,
  ) {
    this.assertManagementRole(access);
    await this.accessControl.assertEventAccess(eventId, access);
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        bookings: {
          some: {
            eventId,
            event: { organizationId: access.organizationId },
          },
        },
      },
      select: { id: true },
    });
    if (!customer) throw new NotFoundException('Customer not found.');

    return this.prisma.marketingConsentEvidence.create({
      data: {
        organizationId: access.organizationId,
        eventId,
        customerId,
        decision: MarketingConsentDecision.WITHDRAWN,
        channel: MarketingConsentChannel.ADMIN_RECORDED,
        actorUserId: access.userId,
      },
    });
  }

  private assertManagementRole(access: AuthenticatedAccessContext) {
    if (access.role !== 'OWNER' && access.role !== 'MANAGER') {
      throw new ForbiddenException('Management access is required.');
    }
  }

  private hash(content: string) {
    return createHash('sha256').update(content, 'utf8').digest('hex');
  }
}
