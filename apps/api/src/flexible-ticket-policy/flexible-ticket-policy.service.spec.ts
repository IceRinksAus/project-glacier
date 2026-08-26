import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  FlexibleTicketEventMode,
  FlexibleTicketFeeRefundability,
  FlexibleTicketFeeType,
  FlexibleTicketPolicyStatus,
  FlexibleTicketPriceDecreaseTreatment,
  FlexibleTicketPriceIncreaseTreatment,
  Prisma,
} from '@prisma/client';

import type { AuthenticatedAccessContext } from '../access-control/access-control.service';

import { FlexibleTicketPolicyService } from './flexible-ticket-policy.service';

const owner: AuthenticatedAccessContext = {
  userId: 'owner-1',
  organizationId: 'org-1',
  role: 'OWNER',
  accessScope: 'ALL_EVENTS',
};

const manager: AuthenticatedAccessContext = {
  userId: 'manager-1',
  organizationId: 'org-1',
  role: 'MANAGER',
  accessScope: 'ASSIGNED_EVENTS',
};

const input = {
  available: true,
  feeType: FlexibleTicketFeeType.FIXED,
  feeValue: 5,
  allowsSessionChange: true,
  allowsRefundRequest: true,
  cutoffMinutesBeforeSession: 1440,
  permittedUseLimit: 1,
  priceIncreaseTreatment:
    FlexibleTicketPriceIncreaseTreatment.CUSTOMER_PAYS_DIFFERENCE,
  priceDecreaseTreatment:
    FlexibleTicketPriceDecreaseTreatment.KEEP_ORIGINAL_PRICE,
  feeRefundability: FlexibleTicketFeeRefundability.NON_REFUNDABLE,
  customerSummary: 'Change or request a refund before the cut-off.',
  materialTerms: 'Fictional test terms.',
};

function policy(overrides: Record<string, unknown> = {}) {
  return {
    id: 'policy-1',
    organizationId: 'org-1',
    eventId: null,
    version: 1,
    status: FlexibleTicketPolicyStatus.DRAFT,
    available: true,
    feeType: FlexibleTicketFeeType.FIXED,
    feeValue: new Prisma.Decimal(5),
    currency: 'AUD',
    allowsSessionChange: true,
    allowsRefundRequest: true,
    cutoffMinutesBeforeSession: 1440,
    permittedUseLimit: 1,
    priceIncreaseTreatment:
      FlexibleTicketPriceIncreaseTreatment.CUSTOMER_PAYS_DIFFERENCE,
    priceDecreaseTreatment:
      FlexibleTicketPriceDecreaseTreatment.KEEP_ORIGINAL_PRICE,
    feeRefundability: FlexibleTicketFeeRefundability.NON_REFUNDABLE,
    customerSummary: 'Summary',
    materialTerms: 'Terms',
    createdByUserId: 'owner-1',
    publishedByUserId: null,
    publishedAt: null,
    supersededAt: null,
    createdAt: new Date('2026-08-27T00:00:00.000Z'),
    updatedAt: new Date('2026-08-27T00:00:00.000Z'),
    createdByUser: { id: 'owner-1', name: 'Owner' },
    publishedByUser: null,
    ...overrides,
  };
}

describe('FlexibleTicketPolicyService', () => {
  let prisma: any;
  let accessControl: any;
  let service: FlexibleTicketPolicyService;

  beforeEach(() => {
    prisma = {
      userOrganization: {
        findFirst: jest.fn().mockResolvedValue({ id: 'm-1' }),
      },
      event: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'event-1',
          name: 'Event',
          flexibleTicketMode: FlexibleTicketEventMode.DISABLED,
        }),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      flexibleTicketPolicy: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    accessControl = {
      assertEventAccess: jest.fn().mockResolvedValue(undefined),
      eventWhere: jest.fn((_access, where) => ({
        organizationId: 'org-1',
        ...where,
      })),
    };
    service = new FlexibleTicketPolicyService(prisma, accessControl);
  });

  it('requires a current OWNER membership for policy mutation', async () => {
    await expect(
      service.createOrganizationDraft(manager, input),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.flexibleTicketPolicy.create).not.toHaveBeenCalled();

    prisma.userOrganization.findFirst.mockResolvedValue(null);
    await expect(
      service.createOrganizationDraft(owner, input),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a policy with no usable right', async () => {
    await expect(
      service.createOrganizationDraft(owner, {
        ...input,
        allowsSessionChange: false,
        allowsRefundRequest: false,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a percentage fee above 100 percent', async () => {
    await expect(
      service.createOrganizationDraft(owner, {
        ...input,
        feeType: FlexibleTicketFeeType.PERCENTAGE,
        feeValue: 100.01,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates the next immutable Organisation draft version', async () => {
    prisma.flexibleTicketPolicy.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ version: 3 });
    prisma.flexibleTicketPolicy.create.mockImplementation(({ data }) =>
      Promise.resolve(policy({ ...data, id: 'policy-4' })),
    );

    const result = await service.createOrganizationDraft(owner, input);

    expect(prisma.flexibleTicketPolicy.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: 'org-1',
          eventId: null,
          version: 4,
          createdByUserId: 'owner-1',
          currency: 'AUD',
        }),
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({ id: 'policy-4', feeValue: 5 }),
    );
  });

  it('does not create a second draft for the same scope', async () => {
    prisma.flexibleTicketPolicy.findFirst.mockResolvedValue({ id: 'draft-1' });

    await expect(
      service.createOrganizationDraft(owner, input),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('uses privacy-safe Event ownership checks for Event drafts', async () => {
    prisma.event.findFirst.mockResolvedValue(null);

    await expect(
      service.createEventDraft(owner, 'foreign-event', input),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('allows an assigned MANAGER to inspect an Event context', async () => {
    prisma.flexibleTicketPolicy.findMany
      .mockResolvedValueOnce([
        policy({
          status: FlexibleTicketPolicyStatus.PUBLISHED,
          publishedAt: new Date(),
          publishedByUserId: 'owner-1',
        }),
      ])
      .mockResolvedValueOnce([]);
    prisma.event.findFirst.mockResolvedValue({
      id: 'event-1',
      name: 'Event',
      flexibleTicketMode: FlexibleTicketEventMode.INHERIT,
    });

    const result = await service.eventContext(manager, 'event-1');

    expect(accessControl.assertEventAccess).toHaveBeenCalledWith(
      'event-1',
      manager,
    );
    expect(result.effectivePolicy).toEqual(
      expect.objectContaining({
        sourceMode: FlexibleTicketEventMode.INHERIT,
      }),
    );
  });

  it('denies direct STAFF Event-context service access', async () => {
    await expect(
      service.eventContext({ ...manager, role: 'STAFF' }, 'event-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('publishes a draft and supersedes prior authority transactionally', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const update = jest.fn().mockResolvedValue(
      policy({
        status: FlexibleTicketPolicyStatus.PUBLISHED,
        publishedAt: new Date(),
        publishedByUserId: 'owner-1',
      }),
    );
    prisma.$transaction.mockImplementation((callback) =>
      callback({
        flexibleTicketPolicy: {
          findFirst: jest.fn().mockResolvedValue(policy()),
          updateMany,
          update,
        },
      }),
    );

    const result = await service.publishOrganizationPolicy(owner, 'policy-1');

    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: FlexibleTicketPolicyStatus.SUPERSEDED,
        }),
      }),
    );
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: FlexibleTicketPolicyStatus.PUBLISHED,
          publishedByUserId: 'owner-1',
        }),
      }),
    );
    expect(result.status).toBe(FlexibleTicketPolicyStatus.PUBLISHED);
  });

  it('resolves only an available published policy for a public Event', async () => {
    prisma.event.findUnique.mockResolvedValue({
      id: 'event-1',
      organizationId: 'org-1',
      flexibleTicketMode: FlexibleTicketEventMode.OVERRIDE,
    });
    prisma.flexibleTicketPolicy.findFirst.mockResolvedValue(policy());

    const result = await service.resolveEffectivePolicy('event-1');

    expect(prisma.flexibleTicketPolicy.findFirst).toHaveBeenCalledWith({
      where: {
        organizationId: 'org-1',
        eventId: 'event-1',
        status: FlexibleTicketPolicyStatus.PUBLISHED,
        available: true,
      },
    });
    expect(result?.sourceMode).toBe(FlexibleTicketEventMode.OVERRIDE);
  });

  it('returns no public policy when the Event is disabled', async () => {
    prisma.event.findUnique.mockResolvedValue({
      id: 'event-1',
      organizationId: 'org-1',
      flexibleTicketMode: FlexibleTicketEventMode.DISABLED,
    });

    await expect(service.resolveEffectivePolicy('event-1')).resolves.toBeNull();
    expect(prisma.flexibleTicketPolicy.findFirst).not.toHaveBeenCalled();
  });
});
