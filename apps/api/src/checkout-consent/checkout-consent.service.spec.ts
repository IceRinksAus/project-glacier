import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  CheckoutAcceptanceChannel,
  CheckoutDocumentStatus,
  CheckoutDocumentType,
  MarketingConsentDecision,
} from '@prisma/client';

import type { AuthenticatedAccessContext } from '../access-control/access-control.service';

import { CheckoutConsentService } from './checkout-consent.service';

const owner: AuthenticatedAccessContext = {
  userId: 'owner-1',
  organizationId: 'org-1',
  role: 'OWNER',
  accessScope: 'ALL_EVENTS',
};

describe('CheckoutConsentService', () => {
  let prisma: any;
  let accessControl: any;
  let service: CheckoutConsentService;

  beforeEach(() => {
    prisma = {
      event: { findFirst: jest.fn() },
      checkoutDocument: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
      },
      booking: { findFirst: jest.fn() },
      customer: { findFirst: jest.fn() },
      bookingCheckoutAcceptance: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
      marketingConsentEvidence: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    accessControl = { assertEventAccess: jest.fn() };
    service = new CheckoutConsentService(prisma, accessControl, {
      get: jest.fn().mockReturnValue('test'),
    } as any);
  });

  it('creates a new immutable Event-scoped version with a server hash', async () => {
    prisma.checkoutDocument.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ version: 2 });
    prisma.checkoutDocument.create.mockImplementation(({ data }) => data);

    const result = await service.createDraft(owner, 'event-1', {
      type: CheckoutDocumentType.TICKETING_TERMS,
      title: ' Test terms ',
      content: ' Fictional terms version three. ',
    });

    expect(accessControl.assertEventAccess).toHaveBeenCalledWith(
      'event-1',
      owner,
    );
    expect(result).toEqual(
      expect.objectContaining({
        organizationId: 'org-1',
        eventId: 'event-1',
        version: 3,
        title: 'Test terms',
        content: 'Fictional terms version three.',
        contentHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        createdByUserId: 'owner-1',
      }),
    );
  });

  it('preserves the old document while atomically superseding publication', async () => {
    prisma.checkoutDocument.findFirst.mockResolvedValue({
      id: 'document-2',
      type: CheckoutDocumentType.PRIVACY_NOTICE,
      status: CheckoutDocumentStatus.DRAFT,
    });
    const transaction = {
      checkoutDocument: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue({ id: 'document-2' }),
      },
    };
    prisma.$transaction.mockImplementation((callback) => callback(transaction));

    await service.publish(owner, 'event-1', 'document-2');

    expect(transaction.checkoutDocument.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        organizationId: 'org-1',
        eventId: 'event-1',
        type: CheckoutDocumentType.PRIVACY_NOTICE,
        status: CheckoutDocumentStatus.PUBLISHED,
      }),
      data: { status: CheckoutDocumentStatus.SUPERSEDED },
    });
    expect(transaction.checkoutDocument.update).toHaveBeenCalledWith({
      where: { id: 'document-2' },
      data: expect.objectContaining({
        status: CheckoutDocumentStatus.PUBLISHED,
        publishedByUserId: 'owner-1',
      }),
    });
  });

  it('reports checkout readiness only when both required documents are published', async () => {
    prisma.event.findFirst.mockResolvedValue({
      id: 'event-1',
      name: 'Fictional Event',
      status: 'DRAFT',
    });
    prisma.checkoutDocument.findMany.mockResolvedValue([
      {
        type: CheckoutDocumentType.TICKETING_TERMS,
        status: CheckoutDocumentStatus.PUBLISHED,
      },
    ]);
    accessControl.eventWhere = jest.fn((_access, where) => ({
      organizationId: 'org-1',
      ...where,
    }));

    const context = await service.eventContext(owner, 'event-1');

    expect(context.readiness).toEqual({
      readyForTicketCheckout: false,
      termsPublished: true,
      privacyPublished: false,
      marketingChoiceAvailable: false,
    });
  });

  it('fails closed when a test-only document is published in production', async () => {
    service = new CheckoutConsentService(prisma, accessControl, {
      get: jest.fn().mockReturnValue('production'),
    } as any);
    prisma.checkoutDocument.findFirst.mockResolvedValue({
      id: 'document-1',
      type: CheckoutDocumentType.TICKETING_TERMS,
      status: CheckoutDocumentStatus.DRAFT,
      testOnly: true,
    });

    await expect(
      service.publish(owner, 'event-1', 'document-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects unassigned document management before reading a draft', async () => {
    accessControl.assertEventAccess.mockRejectedValue(
      new NotFoundException('Event not found'),
    );

    await expect(
      service.publish(owner, 'foreign-event', 'document-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.checkoutDocument.findFirst).not.toHaveBeenCalled();
  });

  it('rejects cross-Event checkout documents and snapshots trusted versions', async () => {
    prisma.booking.findFirst.mockResolvedValue({ id: 'booking-1' });
    prisma.checkoutDocument.findMany.mockResolvedValue([
      {
        id: 'terms-1',
        type: CheckoutDocumentType.TICKETING_TERMS,
        version: 4,
        contentHash: 'terms-hash',
      },
    ]);

    await expect(
      service.recordBookingAcceptance({
        organizationId: 'org-1',
        eventId: 'event-1',
        bookingId: 'booking-1',
        customerId: 'customer-1',
        termsDocumentId: 'terms-1',
        privacyDocumentId: 'foreign-privacy',
        channel: CheckoutAcceptanceChannel.ONLINE,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.bookingCheckoutAcceptance.create).not.toHaveBeenCalled();

    prisma.checkoutDocument.findMany.mockResolvedValue([
      {
        id: 'terms-1',
        type: CheckoutDocumentType.TICKETING_TERMS,
        version: 4,
        contentHash: 'terms-hash',
      },
      {
        id: 'privacy-2',
        type: CheckoutDocumentType.PRIVACY_NOTICE,
        version: 2,
        contentHash: 'privacy-hash',
      },
    ]);
    prisma.bookingCheckoutAcceptance.create.mockImplementation(
      ({ data }) => data,
    );

    const evidence = await service.recordBookingAcceptance({
      organizationId: 'org-1',
      eventId: 'event-1',
      bookingId: 'booking-1',
      customerId: 'customer-1',
      termsDocumentId: 'terms-1',
      privacyDocumentId: 'privacy-2',
      channel: CheckoutAcceptanceChannel.ONLINE,
    });
    expect(evidence).toEqual(
      expect.objectContaining({
        termsVersion: 4,
        termsContentHash: 'terms-hash',
        privacyVersion: 2,
        privacyContentHash: 'privacy-hash',
      }),
    );
  });

  it('records withdrawal as a new attributed row and never mutates history', async () => {
    prisma.customer.findFirst.mockResolvedValue({ id: 'customer-1' });
    prisma.marketingConsentEvidence.create.mockImplementation(
      ({ data }) => data,
    );

    const result = await service.withdrawMarketing(
      owner,
      'event-1',
      'customer-1',
    );

    expect(result).toEqual(
      expect.objectContaining({
        organizationId: 'org-1',
        eventId: 'event-1',
        customerId: 'customer-1',
        decision: MarketingConsentDecision.WITHDRAWN,
        actorUserId: 'owner-1',
      }),
    );
    expect(prisma.marketingConsentEvidence.update).toBeUndefined();
  });

  it('does not permit operational roles to manage consent documents', async () => {
    await expect(
      service.createDraft({ ...owner, role: 'STAFF' }, 'event-1', {
        type: CheckoutDocumentType.PRIVACY_NOTICE,
        title: 'Notice',
        content: 'Fictional notice.',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
