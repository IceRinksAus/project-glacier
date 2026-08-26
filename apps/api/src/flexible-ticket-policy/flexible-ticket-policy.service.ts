import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FlexibleTicketEventMode,
  FlexibleTicketFeeType,
  FlexibleTicketPolicyStatus,
  Prisma,
} from '@prisma/client';

import {
  AccessControlService,
  AuthenticatedAccessContext,
} from '../access-control/access-control.service';
import { PrismaService } from '../prisma/prisma.service';

import { CreateFlexibleTicketPolicyDto } from './dto/create-flexible-ticket-policy.dto';

const policyInclude = {
  createdByUser: { select: { id: true, name: true } },
  publishedByUser: { select: { id: true, name: true } },
} satisfies Prisma.FlexibleTicketPolicyInclude;

type PolicyWithActors = Prisma.FlexibleTicketPolicyGetPayload<{
  include: typeof policyInclude;
}>;

@Injectable()
export class FlexibleTicketPolicyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControl: AccessControlService,
  ) {}

  async organizationContext(access: AuthenticatedAccessContext) {
    await this.assertCurrentOwner(access);

    const policies = await this.prisma.flexibleTicketPolicy.findMany({
      where: {
        organizationId: access.organizationId,
        eventId: null,
      },
      include: policyInclude,
      orderBy: { version: 'desc' },
    });

    return this.serializeContext(policies);
  }

  async eventContext(access: AuthenticatedAccessContext, eventId: string) {
    this.assertManagementRole(access);
    await this.accessControl.assertEventAccess(eventId, access);

    const event = await this.prisma.event.findFirst({
      where: this.accessControl.eventWhere(access, { id: eventId }),
      select: {
        id: true,
        name: true,
        flexibleTicketMode: true,
      },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const [organizationPolicies, eventPolicies] = await Promise.all([
      this.prisma.flexibleTicketPolicy.findMany({
        where: {
          organizationId: access.organizationId,
          eventId: null,
        },
        include: policyInclude,
        orderBy: { version: 'desc' },
      }),
      this.prisma.flexibleTicketPolicy.findMany({
        where: {
          organizationId: access.organizationId,
          eventId,
        },
        include: policyInclude,
        orderBy: { version: 'desc' },
      }),
    ]);

    const organizationPublished = organizationPolicies.find(
      ({ status }) => status === FlexibleTicketPolicyStatus.PUBLISHED,
    );
    const eventPublished = eventPolicies.find(
      ({ status }) => status === FlexibleTicketPolicyStatus.PUBLISHED,
    );
    const effective = this.effectiveForMode(
      event.flexibleTicketMode,
      organizationPublished,
      eventPublished,
    );

    return {
      event,
      organization: this.serializeContext(organizationPolicies),
      override: this.serializeContext(eventPolicies),
      effectivePolicy: effective
        ? this.serializePolicy(effective.policy, effective.sourceMode)
        : null,
      ready:
        event.flexibleTicketMode === FlexibleTicketEventMode.DISABLED ||
        Boolean(effective?.policy.available),
    };
  }

  async createOrganizationDraft(
    access: AuthenticatedAccessContext,
    input: CreateFlexibleTicketPolicyDto,
  ) {
    await this.assertCurrentOwner(access);
    this.validatePolicyInput(input);

    return this.createDraft(access, null, input);
  }

  async createEventDraft(
    access: AuthenticatedAccessContext,
    eventId: string,
    input: CreateFlexibleTicketPolicyDto,
  ) {
    await this.assertCurrentOwner(access);
    await this.assertOwnedEvent(access.organizationId, eventId);
    this.validatePolicyInput(input);

    return this.createDraft(access, eventId, input);
  }

  async publishOrganizationPolicy(
    access: AuthenticatedAccessContext,
    policyId: string,
  ) {
    await this.assertCurrentOwner(access);
    return this.publishPolicy(access, policyId, null);
  }

  async publishEventPolicy(
    access: AuthenticatedAccessContext,
    eventId: string,
    policyId: string,
  ) {
    await this.assertCurrentOwner(access);
    await this.assertOwnedEvent(access.organizationId, eventId);
    return this.publishPolicy(access, policyId, eventId);
  }

  async updateEventMode(
    access: AuthenticatedAccessContext,
    eventId: string,
    mode: FlexibleTicketEventMode,
  ) {
    await this.assertCurrentOwner(access);
    await this.assertOwnedEvent(access.organizationId, eventId);

    const event = await this.prisma.event.update({
      where: { id: eventId },
      data: { flexibleTicketMode: mode },
      select: { id: true, name: true, flexibleTicketMode: true },
    });

    return { event };
  }

  async resolveEffectivePolicy(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        organizationId: true,
        flexibleTicketMode: true,
      },
    });
    if (
      !event ||
      event.flexibleTicketMode === FlexibleTicketEventMode.DISABLED
    ) {
      return null;
    }

    const policy = await this.prisma.flexibleTicketPolicy.findFirst({
      where:
        event.flexibleTicketMode === FlexibleTicketEventMode.INHERIT
          ? {
              organizationId: event.organizationId,
              eventId: null,
              status: FlexibleTicketPolicyStatus.PUBLISHED,
              available: true,
            }
          : {
              organizationId: event.organizationId,
              eventId: event.id,
              status: FlexibleTicketPolicyStatus.PUBLISHED,
              available: true,
            },
    });

    return policy
      ? {
          policy,
          sourceMode: event.flexibleTicketMode,
        }
      : null;
  }

  private async createDraft(
    access: AuthenticatedAccessContext,
    eventId: string | null,
    input: CreateFlexibleTicketPolicyDto,
  ) {
    const existingDraft = await this.prisma.flexibleTicketPolicy.findFirst({
      where: {
        organizationId: access.organizationId,
        eventId,
        status: FlexibleTicketPolicyStatus.DRAFT,
      },
      select: { id: true },
    });
    if (existingDraft) {
      throw new ConflictException(
        'A Flexible Ticket policy draft already exists for this scope.',
      );
    }

    const latest = await this.prisma.flexibleTicketPolicy.findFirst({
      where: { organizationId: access.organizationId, eventId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    try {
      const policy = await this.prisma.flexibleTicketPolicy.create({
        data: {
          organizationId: access.organizationId,
          eventId,
          version: (latest?.version ?? 0) + 1,
          ...this.policyData(input),
          createdByUserId: access.userId,
        },
        include: policyInclude,
      });
      return this.serializePolicy(policy);
    } catch (error) {
      if (this.prismaErrorCode(error) === 'P2002') {
        throw new ConflictException(
          'A Flexible Ticket policy draft already exists for this scope.',
        );
      }
      throw error;
    }
  }

  private async publishPolicy(
    access: AuthenticatedAccessContext,
    policyId: string,
    eventId: string | null,
  ) {
    try {
      const policy = await this.prisma.$transaction(
        async (transaction) => {
          const draft = await transaction.flexibleTicketPolicy.findFirst({
            where: {
              id: policyId,
              organizationId: access.organizationId,
              eventId,
              status: FlexibleTicketPolicyStatus.DRAFT,
            },
          });
          if (!draft) {
            throw new NotFoundException(
              'Flexible Ticket policy draft not found',
            );
          }

          const now = new Date();
          await transaction.flexibleTicketPolicy.updateMany({
            where: {
              organizationId: access.organizationId,
              eventId,
              status: FlexibleTicketPolicyStatus.PUBLISHED,
            },
            data: {
              status: FlexibleTicketPolicyStatus.SUPERSEDED,
              supersededAt: now,
            },
          });

          return transaction.flexibleTicketPolicy.update({
            where: { id: draft.id },
            data: {
              status: FlexibleTicketPolicyStatus.PUBLISHED,
              publishedAt: now,
              publishedByUserId: access.userId,
            },
            include: policyInclude,
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      return this.serializePolicy(policy);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      if (this.prismaErrorCode(error) === 'P2002') {
        throw new ConflictException(
          'The Flexible Ticket policy changed concurrently. Reload and try again.',
        );
      }
      throw error;
    }
  }

  private async assertCurrentOwner(access: AuthenticatedAccessContext) {
    if (access.role !== 'OWNER') {
      throw new ForbiddenException('OWNER access is required');
    }

    const membership = await this.prisma.userOrganization.findFirst({
      where: {
        userId: access.userId,
        organizationId: access.organizationId,
        role: 'OWNER',
      },
      select: { id: true },
    });
    if (!membership) {
      throw new ForbiddenException('OWNER access is required');
    }
  }

  private assertManagementRole(access: AuthenticatedAccessContext) {
    if (access.role !== 'OWNER' && access.role !== 'MANAGER') {
      throw new ForbiddenException('Management access is required');
    }
  }

  private async assertOwnedEvent(organizationId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, organizationId },
      select: { id: true },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
  }

  private validatePolicyInput(input: CreateFlexibleTicketPolicyDto) {
    if (
      input.feeType === FlexibleTicketFeeType.PERCENTAGE &&
      input.feeValue > 100
    ) {
      throw new BadRequestException(
        'Percentage Flexible Ticket fees cannot exceed 100%.',
      );
    }

    if (!input.allowsSessionChange && !input.allowsRefundRequest) {
      throw new BadRequestException(
        'A Flexible Ticket policy must provide a change or refund-request right.',
      );
    }
  }

  private policyData(input: CreateFlexibleTicketPolicyDto) {
    return {
      available: input.available,
      feeType: input.feeType,
      feeValue: new Prisma.Decimal(input.feeValue),
      currency: 'AUD',
      allowsSessionChange: input.allowsSessionChange,
      allowsRefundRequest: input.allowsRefundRequest,
      cutoffMinutesBeforeSession: input.cutoffMinutesBeforeSession,
      permittedUseLimit: input.permittedUseLimit,
      priceIncreaseTreatment: input.priceIncreaseTreatment,
      priceDecreaseTreatment: input.priceDecreaseTreatment,
      feeRefundability: input.feeRefundability,
      customerSummary: input.customerSummary.trim(),
      materialTerms: input.materialTerms.trim(),
    };
  }

  private effectiveForMode(
    mode: FlexibleTicketEventMode,
    organizationPolicy?: PolicyWithActors,
    eventPolicy?: PolicyWithActors,
  ) {
    if (mode === FlexibleTicketEventMode.INHERIT && organizationPolicy) {
      return { policy: organizationPolicy, sourceMode: mode };
    }
    if (mode === FlexibleTicketEventMode.OVERRIDE && eventPolicy) {
      return { policy: eventPolicy, sourceMode: mode };
    }
    return null;
  }

  private serializeContext(policies: PolicyWithActors[]) {
    return {
      draft: policies.find(
        ({ status }) => status === FlexibleTicketPolicyStatus.DRAFT,
      )
        ? this.serializePolicy(
            policies.find(
              ({ status }) => status === FlexibleTicketPolicyStatus.DRAFT,
            )!,
          )
        : null,
      published: policies.find(
        ({ status }) => status === FlexibleTicketPolicyStatus.PUBLISHED,
      )
        ? this.serializePolicy(
            policies.find(
              ({ status }) => status === FlexibleTicketPolicyStatus.PUBLISHED,
            )!,
          )
        : null,
      history: policies
        .filter(
          ({ status }) => status === FlexibleTicketPolicyStatus.SUPERSEDED,
        )
        .map((policy) => this.serializePolicy(policy)),
    };
  }

  private serializePolicy(
    policy: PolicyWithActors,
    sourceMode?: FlexibleTicketEventMode,
  ) {
    return {
      ...policy,
      feeValue: policy.feeValue.toNumber(),
      sourceMode,
    };
  }

  private prismaErrorCode(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError
      ? error.code
      : null;
  }
}
