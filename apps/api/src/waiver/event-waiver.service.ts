import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import * as QRCode from 'qrcode';

import { PrismaService } from '../prisma/prisma.service';
import { WaiverTemplateService } from './waiver-template.service';

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

    const publicBaseUrl = (
      process.env.WEB_APP_URL ?? 'http://localhost:3001'
    ).replace(/\/$/, '');
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
