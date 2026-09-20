import { AustralianJurisdiction, EventActivityType } from '@prisma/client';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WaiverTemplateService {
  constructor(private readonly prisma: PrismaService) {}

  async findApprovedTemplate(
    activityType: EventActivityType,
    jurisdiction: AustralianJurisdiction,
    organizationId: string,
  ) {
    const templates = await this.prisma.waiverTemplate.findMany({
      where: {
        activityType,
        jurisdiction,
        status: 'APPROVED',
        OR: [
          { authority: 'PLATFORM_CURATED', organizationId: null },
          { authority: 'ORGANIZATION', organizationId },
        ],
      },
      orderBy: { revision: 'desc' },
    });
    const template =
      templates.find(
        (candidate) => candidate.organizationId === organizationId,
      ) ??
      templates.find((candidate) => candidate.authority === 'PLATFORM_CURATED');

    if (!template) {
      throw new NotFoundException(
        `No approved waiver template is available for ${activityType} in ${jurisdiction}.`,
      );
    }

    return template;
  }

  list(organizationId: string) {
    return this.prisma.waiverTemplate.findMany({
      where: {
        OR: [
          { authority: 'PLATFORM_CURATED', organizationId: null },
          { authority: 'ORGANIZATION', organizationId },
        ],
      },
      orderBy: [
        { jurisdiction: 'asc' },
        { activityType: 'asc' },
        { revision: 'desc' },
      ],
      select: {
        id: true,
        authority: true,
        organizationId: true,
        name: true,
        activityType: true,
        jurisdiction: true,
        revision: true,
        contentTemplate: true,
        acceptanceStatement: true,
        legislationReferences: true,
        status: true,
        approvedAt: true,
        approvalReference: true,
        approvedByUser: { select: { id: true, name: true } },
        createdAt: true,
        updatedAt: true,
        waiverVersions: {
          select: {
            eventWaiver: {
              select: { event: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });
  }

  async createDraft(
    organizationId: string,
    data: {
      name: string;
      activityType: EventActivityType;
      jurisdiction: AustralianJurisdiction;
      contentTemplate: string;
      acceptanceStatement: string;
      legislationReferences?: string[];
    },
  ) {
    const latest = await this.prisma.waiverTemplate.findFirst({
      where: {
        organizationId,
        authority: 'ORGANIZATION',
        activityType: data.activityType,
        jurisdiction: data.jurisdiction,
      },
      orderBy: { revision: 'desc' },
      select: { revision: true },
    });
    return this.prisma.waiverTemplate.create({
      data: {
        organizationId,
        authority: 'ORGANIZATION',
        name: data.name.trim(),
        activityType: data.activityType,
        jurisdiction: data.jurisdiction,
        revision: (latest?.revision ?? 0) + 1,
        contentTemplate: data.contentTemplate.trim(),
        acceptanceStatement: data.acceptanceStatement.trim(),
        legislationReferences: data.legislationReferences ?? [],
        status: 'DRAFT',
      },
    });
  }

  async approve(
    organizationId: string,
    templateId: string,
    userId: string,
    approvalReference: string,
  ) {
    const template = await this.findOwnedDraft(organizationId, templateId);
    return this.prisma.$transaction(async (transaction) => {
      await transaction.waiverTemplate.updateMany({
        where: {
          organizationId,
          authority: 'ORGANIZATION',
          activityType: template.activityType,
          jurisdiction: template.jurisdiction,
          status: 'APPROVED',
        },
        data: { status: 'RETIRED' },
      });
      return transaction.waiverTemplate.update({
        where: { id: template.id },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedByUserId: userId,
          approvalReference: approvalReference.trim(),
        },
      });
    });
  }

  async retire(organizationId: string, templateId: string) {
    const template = await this.prisma.waiverTemplate.findFirst({
      where: { id: templateId, organizationId, authority: 'ORGANIZATION' },
    });
    if (!template)
      throw new NotFoundException('Waiver template was not found.');
    if (template.status === 'RETIRED') {
      throw new BadRequestException('Waiver template is already retired.');
    }
    return this.prisma.waiverTemplate.update({
      where: { id: template.id },
      data: { status: 'RETIRED' },
    });
  }

  private async findOwnedDraft(organizationId: string, templateId: string) {
    const template = await this.prisma.waiverTemplate.findFirst({
      where: { id: templateId, organizationId, authority: 'ORGANIZATION' },
    });
    if (!template)
      throw new NotFoundException('Waiver template was not found.');
    if (template.status !== 'DRAFT') {
      throw new BadRequestException('Only a draft template can be approved.');
    }
    return template;
  }
}
