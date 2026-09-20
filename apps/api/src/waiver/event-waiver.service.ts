import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import * as QRCode from 'qrcode';

import { PrismaService } from '../prisma/prisma.service';
import { getWebAppUrl } from '../config/application-security';
import { WaiverTemplateService } from './waiver-template.service';
import { MatchWaiverSubmissionDto } from './dto/match-waiver-submission.dto';

@Injectable()
export class EventWaiverService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly waiverTemplateService: WaiverTemplateService,
  ) {}

  findForEvent(organizationId: string, eventId: string) {
    return this.prisma.eventWaiver.findFirst({
      where: {
        eventId,
        event: {
          organizationId,
        },
      },
      include: {
        versions: {
          orderBy: {
            version: 'desc',
          },
          include: {
            sourceTemplate: true,
            publishedByUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async generatePublicQrCode(organizationId: string, eventId: string) {
    const waiver = await this.prisma.eventWaiver.findFirst({
      where: {
        eventId,
        event: {
          organizationId,
        },
        versions: {
          some: {
            status: 'PUBLISHED',
          },
        },
      },
      select: {
        publicSlug: true,
      },
    });

    if (!waiver) {
      throw new NotFoundException(
        'A published Waiver was not found for this Event in your organization.',
      );
    }

    const publicBaseUrl = getWebAppUrl();
    const publicUrl = `${publicBaseUrl}/waivers/${waiver.publicSlug}`;
    const qrCodeDataUrl = await QRCode.toDataURL(publicUrl, {
      errorCorrectionLevel: 'H',
      width: 512,
      margin: 2,
    });

    return {
      publicUrl,
      qrCodeDataUrl,
    };
  }

  listSubmissions(organizationId: string, eventId: string, search?: string) {
    const normalizedSearch = search?.trim();

    if (normalizedSearch && normalizedSearch.length > 200) {
      throw new BadRequestException(
        'Waiver submission search must not exceed 200 characters.',
      );
    }

    return this.prisma.waiverSubmission.findMany({
      where: {
        eventWaiver: {
          event: {
            id: eventId,
            organizationId,
          },
        },
        ...(normalizedSearch
          ? {
              signatoryFullName: {
                contains: normalizedSearch,
                mode: 'insensitive' as const,
              },
            }
          : {}),
      },
      orderBy: {
        acceptedAt: 'desc',
      },
      take: 100,
      select: {
        id: true,
        signatoryFullName: true,
        acceptedAt: true,
        booking: { select: { id: true, bookingNumber: true } },
        signatoryParticipantId: true,
        waiverVersion: {
          select: {
            version: true,
            title: true,
          },
        },
        _count: {
          select: {
            minors: true,
          },
        },
      },
    });
  }

  async findSubmission(
    organizationId: string,
    eventId: string,
    submissionId: string,
  ) {
    const submission = await this.prisma.waiverSubmission.findFirst({
      where: {
        id: submissionId,
        eventWaiver: {
          event: {
            id: eventId,
            organizationId,
          },
        },
      },
      select: {
        id: true,
        signatoryFullName: true,
        signatureData: true,
        acceptedAt: true,
        waiverContentHash: true,
        acceptanceStatementHash: true,
        waiverVersion: {
          select: {
            version: true,
            title: true,
            content: true,
            acceptanceStatement: true,
            publishedAt: true,
          },
        },
        minors: {
          orderBy: {
            createdAt: 'asc',
          },
          select: {
            id: true,
            fullName: true,
            dateOfBirth: true,
            bookingParticipantId: true,
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException(
        'Waiver submission was not found for this Event in your organization.',
      );
    }

    return submission;
  }

  async findAssociationBooking(
    organizationId: string,
    eventId: string,
    bookingNumber: string,
  ) {
    const booking = await this.prisma.booking.findFirst({
      where: { bookingNumber, event: { id: eventId, organizationId } },
      select: {
        id: true,
        bookingNumber: true,
        participants: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            age: true,
            ticketType: { select: { name: true } },
          },
        },
      },
    });
    if (!booking) throw new NotFoundException('Booking was not found.');
    return booking;
  }

  async matchSubmission(
    organizationId: string,
    eventId: string,
    submissionId: string,
    actorUserId: string,
    data: MatchWaiverSubmissionDto,
  ) {
    const [submission, booking] = await Promise.all([
      this.prisma.waiverSubmission.findFirst({
        where: {
          id: submissionId,
          eventWaiver: { event: { id: eventId, organizationId } },
        },
        select: { id: true, minors: { select: { id: true } } },
      }),
      this.prisma.booking.findFirst({
        where: { id: data.bookingId, event: { id: eventId, organizationId } },
        select: { id: true, participants: { select: { id: true } } },
      }),
    ]);
    if (!submission || !booking) {
      throw new NotFoundException(
        'Waiver submission or Booking was not found.',
      );
    }

    const participantIds = [
      ...(data.signatoryParticipantId ? [data.signatoryParticipantId] : []),
      ...data.minorMatches.map((match) => match.bookingParticipantId),
    ];
    if (new Set(participantIds).size !== participantIds.length) {
      throw new BadRequestException(
        'Each Booking participant can only be matched once.',
      );
    }
    const bookingParticipantIds = new Set(
      booking.participants.map(({ id }) => id),
    );
    const minorIds = new Set(submission.minors.map(({ id }) => id));
    if (
      participantIds.some((id) => !bookingParticipantIds.has(id)) ||
      data.minorMatches.some((match) => !minorIds.has(match.minorId))
    ) {
      throw new BadRequestException(
        'A selected participant or dependant is not in scope.',
      );
    }

    return this.prisma.$transaction(async (transaction) => {
      await transaction.waiverSubmission.update({
        where: { id: submission.id },
        data: {
          bookingId: booking.id,
          signatoryParticipantId: data.signatoryParticipantId ?? null,
        },
      });
      await transaction.waiverMinor.updateMany({
        where: { waiverSubmissionId: submission.id },
        data: { bookingParticipantId: null },
      });
      for (const match of data.minorMatches) {
        await transaction.waiverMinor.update({
          where: { id: match.minorId },
          data: { bookingParticipantId: match.bookingParticipantId },
        });
      }
      await transaction.waiverAssociationAudit.create({
        data: {
          organizationId,
          eventId,
          waiverSubmissionId: submission.id,
          bookingId: booking.id,
          actorUserId,
          action: 'STAFF_PARTICIPANT_MATCH',
          participantIds,
        },
      });
      return { matched: true, bookingId: booking.id, participantIds };
    });
  }

  async createDraft(organizationId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        organizationId,
      },
      include: {
        organization: true,
        waiver: {
          include: {
            versions: {
              orderBy: {
                version: 'desc',
              },
              take: 1,
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event was not found in your organization.');
    }

    if (!event.activityType || !event.jurisdiction) {
      throw new BadRequestException(
        'Event activity type and jurisdiction are required before generating a waiver.',
      );
    }

    const template = await this.waiverTemplateService.findApprovedTemplate(
      event.activityType,
      event.jurisdiction,
      organizationId,
    );

    const variables = this.buildVariables(event);
    const content = this.renderTemplate(template.contentTemplate, variables);
    const acceptanceStatement = this.renderTemplate(
      template.acceptanceStatement,
      variables,
    );
    const contentHash = createHash('sha256').update(content).digest('hex');
    const version = (event.waiver?.versions[0]?.version ?? 0) + 1;

    return this.prisma.$transaction(async (transaction) => {
      const eventWaiver =
        event.waiver ??
        (await transaction.eventWaiver.create({
          data: {
            eventId: event.id,
            publicSlug: randomBytes(24).toString('hex'),
          },
        }));

      return transaction.waiverVersion.create({
        data: {
          eventWaiverId: eventWaiver.id,
          sourceTemplateId: template.id,
          version,
          title: `${event.name} Waiver`,
          content,
          acceptanceStatement,
          contentHash,
          status: 'DRAFT',
        },
      });
    });
  }

  async publishDraft(
    organizationId: string,
    eventId: string,
    waiverVersionId: string,
    publishedByUserId: string,
  ) {
    const waiverVersion = await this.prisma.waiverVersion.findFirst({
      where: {
        id: waiverVersionId,
        eventWaiver: {
          event: {
            id: eventId,
            organizationId,
          },
        },
      },
    });

    if (!waiverVersion) {
      throw new NotFoundException(
        'Waiver draft was not found for this Event in your organization.',
      );
    }

    if (waiverVersion.status !== 'DRAFT') {
      throw new BadRequestException(
        'Only a draft waiver version can be published.',
      );
    }

    return this.prisma.$transaction(async (transaction) => {
      await transaction.waiverVersion.updateMany({
        where: {
          eventWaiverId: waiverVersion.eventWaiverId,
          status: 'PUBLISHED',
        },
        data: {
          status: 'SUPERSEDED',
        },
      });

      return transaction.waiverVersion.update({
        where: {
          id: waiverVersion.id,
        },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          publishedByUserId,
        },
      });
    });
  }

  private buildVariables(event: {
    name: string;
    venueName: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    suburb: string | null;
    postcode: string | null;
    country: string | null;
    jurisdiction: string | null;
    startDate: Date;
    endDate: Date;
    organization: {
      name: string;
      legalName: string | null;
      tradingName: string | null;
      abn: string | null;
    };
  }) {
    const address = [
      event.addressLine1,
      event.addressLine2,
      event.suburb,
      event.jurisdiction,
      event.postcode,
      event.country,
    ]
      .filter(Boolean)
      .join(', ');

    return {
      eventName: event.name,
      venueName: event.venueName ?? '',
      eventAddress: address,
      eventStartDate: event.startDate.toISOString(),
      eventEndDate: event.endDate.toISOString(),
      jurisdiction: event.jurisdiction ?? '',
      organizationName: event.organization.name,
      organizationLegalName: event.organization.legalName ?? '',
      organizationTradingName: event.organization.tradingName ?? '',
      organizationAbn: event.organization.abn ?? '',
    };
  }

  private renderTemplate(template: string, variables: Record<string, string>) {
    return template.replace(
      /{{\s*([a-zA-Z][a-zA-Z0-9]*)\s*}}/g,
      (_match, variable: string) => {
        if (!(variable in variables)) {
          throw new BadRequestException(
            `Waiver template contains unsupported variable "${variable}".`,
          );
        }

        if (!variables[variable].trim()) {
          throw new BadRequestException(
            `Waiver template variable "${variable}" has no Event or Organization value.`,
          );
        }

        return variables[variable];
      },
    );
  }
}
