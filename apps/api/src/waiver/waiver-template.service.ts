import { AustralianJurisdiction, EventActivityType } from '@prisma/client';
import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WaiverTemplateService {
  constructor(private readonly prisma: PrismaService) {}

  async findApprovedTemplate(
    activityType: EventActivityType,
    jurisdiction: AustralianJurisdiction,
  ) {
    const template = await this.prisma.waiverTemplate.findFirst({
      where: {
        activityType,
        jurisdiction,
        status: 'APPROVED',
      },
      orderBy: {
        revision: 'desc',
      },
    });

    if (!template) {
      throw new NotFoundException(
        `No approved waiver template is available for ${activityType} in ${jurisdiction}.`,
      );
    }

    return template;
  }
}
