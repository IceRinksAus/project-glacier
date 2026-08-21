import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { UpdateEntryPolicyDto } from './dto/update-entry-policy.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { EventReadiness, EventReadinessItem } from './event-readiness.types';
import { EventBrandingDto } from './dto/event-branding.dto';

const readinessInclude = {
  sessions: {
    select: { id: true, status: true, startDate: true, endDate: true },
  },
  ticketTypes: {
    select: { id: true, active: true },
  },
  waiver: {
    select: {
      id: true,
      versions: {
        where: { status: 'PUBLISHED' as const },
        select: { id: true },
        take: 1,
      },
    },
  },
} satisfies Prisma.EventInclude;

type EventWithReadiness = Prisma.EventGetPayload<{
  include: typeof readinessInclude;
}>;

@Injectable()
export class EventService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organizationId: string) {
    return this.prisma.event.findMany({
      where: {
        organizationId,
      },
      include: { branding: true },
    });
  }

  async findOne(id: string, organizationId: string) {
    const event = await this.prisma.event.findFirst({
      where: {
        id,
        organizationId,
      },
      include: { branding: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async create(organizationId: string, data: CreateEventDto) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException('Event end must be after Event start.');
    }

    try {
      return await this.prisma.event.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          startDate,
          endDate,
          timezone: data.timezone,
          venueName: data.venueName,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2,
          suburb: data.suburb,
          postcode: data.postcode,
          country: data.country,
          jurisdiction: data.jurisdiction,
          activityType: data.activityType,
          organizationId,
          status: 'DRAFT',
          entryOpensMinutesBeforeStart: data.entryOpensMinutesBeforeStart,
          entryClosesMinutesAfterEnd: data.entryClosesMinutesAfterEnd,
          branding: data.branding
            ? {
                create: data.branding,
              }
            : undefined,
        },
        include: { branding: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'This Event URL is already in use. Choose a different slug.',
        );
      }

      throw error;
    }
  }

  async updateBranding(
    id: string,
    organizationId: string,
    branding: EventBrandingDto,
  ) {
    const event = await this.prisma.event.findFirst({
      where: { id, organizationId },
      select: { id: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return this.prisma.eventBranding.upsert({
      where: { eventId: event.id },
      create: { eventId: event.id, ...branding },
      update: branding,
    });
  }

  async updateStatus(id: string, organizationId: string, status: string) {
    const allowedStatuses = ['DRAFT', 'ACTIVE', 'INACTIVE'];

    if (!allowedStatuses.includes(status)) {
      throw new BadRequestException(
        `Event status must be one of: ${allowedStatuses.join(', ')}`,
      );
    }

    const event = await this.prisma.event.findFirst({
      where: {
        id,
        organizationId,
      },
      include: readinessInclude,
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (status === 'ACTIVE') {
      const readiness = this.buildReadiness(event);
      if (!readiness.readyToActivate) {
        throw new BadRequestException({
          message: 'Event setup is incomplete and cannot be activated.',
          missingItems: readiness.items
            .filter(({ status: itemStatus }) => itemStatus === 'INCOMPLETE')
            .map(({ id: itemId }) => itemId),
        });
      }
    }

    return this.prisma.event.update({
      where: {
        id: event.id,
      },
      data: {
        status,
      },
    });
  }

  async getReadiness(
    id: string,
    organizationId: string,
  ): Promise<EventReadiness> {
    const event = await this.prisma.event.findFirst({
      where: { id, organizationId },
      include: readinessInclude,
    });

    if (!event) throw new NotFoundException('Event not found');

    return this.buildReadiness(event);
  }

  private buildReadiness(event: EventWithReadiness): EventReadiness {
    const detailsComplete = Boolean(
      event.name.trim() &&
      event.slug.trim() &&
      event.timezone &&
      event.venueName?.trim() &&
      event.addressLine1?.trim() &&
      event.suburb?.trim() &&
      event.postcode?.trim() &&
      event.jurisdiction &&
      event.activityType &&
      event.endDate > event.startDate &&
      event.entryOpensMinutesBeforeStart >= 0 &&
      event.entryOpensMinutesBeforeStart <= 240 &&
      event.entryClosesMinutesAfterEnd >= 0 &&
      event.entryClosesMinutesAfterEnd <= 240,
    );
    const hasActiveSession = event.sessions.some(
      (session) =>
        session.status === 'ACTIVE' &&
        session.startDate >= event.startDate &&
        session.endDate <= event.endDate &&
        session.endDate > session.startDate,
    );
    const hasActiveTicketType = event.ticketTypes.some(({ active }) => active);
    const waiverStatus = !event.waiver
      ? 'NOT_REQUIRED'
      : event.waiver.versions.length > 0
        ? 'COMPLETE'
        : 'INCOMPLETE';

    const items: EventReadinessItem[] = [
      {
        id: 'EVENT_DETAILS',
        label: 'Event details',
        status: detailsComplete ? 'COMPLETE' : 'INCOMPLETE',
        explanation: detailsComplete
          ? 'Identity, dates, timezone, venue and gate policy are complete.'
          : 'Complete the required Event, venue, activity and gate-policy fields.',
        destinationTab: 'Overview',
      },
      {
        id: 'SESSIONS',
        label: 'Sessions',
        status: hasActiveSession ? 'COMPLETE' : 'INCOMPLETE',
        explanation: hasActiveSession
          ? 'At least one active Session is inside the Event dates.'
          : 'Add at least one active Session inside the Event dates.',
        destinationTab: 'Sessions',
      },
      {
        id: 'TICKET_TYPES',
        label: 'Ticket types',
        status: hasActiveTicketType ? 'COMPLETE' : 'INCOMPLETE',
        explanation: hasActiveTicketType
          ? 'At least one active Ticket Type is available.'
          : 'Add at least one active Ticket Type.',
        destinationTab: 'Ticket Types',
      },
      {
        id: 'WAIVER',
        label: 'Waiver',
        status: waiverStatus,
        explanation:
          waiverStatus === 'NOT_REQUIRED'
            ? 'No Waiver is configured for this Event.'
            : waiverStatus === 'COMPLETE'
              ? 'A current Waiver version is published.'
              : 'Publish the configured Waiver before activation.',
        destinationTab: 'Waiver',
      },
    ];
    const requiredItems = items.filter(
      ({ status }) => status !== 'NOT_REQUIRED',
    );
    const completedRequiredItems = requiredItems.filter(
      ({ status }) => status === 'COMPLETE',
    ).length;

    return {
      eventId: event.id,
      readyToActivate: requiredItems.every(
        ({ status }) => status === 'COMPLETE',
      ),
      completedRequiredItems,
      requiredItems: requiredItems.length,
      percentage: Math.round(
        (completedRequiredItems / requiredItems.length) * 100,
      ),
      items,
    };
  }

  async remove(id: string, organizationId: string) {
    const event = await this.prisma.event.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        sessions: true,
        bookings: true,
        ticketTypes: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.sessions.length > 0) {
      throw new BadRequestException(
        'This event cannot be deleted because it has sessions',
      );
    }

    if (event.bookings.length > 0) {
      throw new BadRequestException(
        'This event cannot be deleted because it has bookings',
      );
    }

    if (event.ticketTypes.length > 0) {
      throw new BadRequestException(
        'This event cannot be deleted because it has ticket types',
      );
    }

    return this.prisma.event.delete({
      where: {
        id: event.id,
      },
    });
  }

  async updateEntryPolicy(
    id: string,
    organizationId: string,
    data: UpdateEntryPolicyDto,
  ) {
    const event = await this.prisma.event.findFirst({
      where: { id, organizationId },
      select: { id: true },
    });

    if (!event) throw new NotFoundException('Event not found');

    return this.prisma.event.update({
      where: { id: event.id },
      data: {
        entryOpensMinutesBeforeStart: data.entryOpensMinutesBeforeStart,
        entryClosesMinutesAfterEnd: data.entryClosesMinutesAfterEnd,
      },
      select: {
        id: true,
        entryOpensMinutesBeforeStart: true,
        entryClosesMinutesAfterEnd: true,
      },
    });
  }
}
