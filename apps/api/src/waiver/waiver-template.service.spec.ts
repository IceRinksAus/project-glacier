import { AustralianJurisdiction, EventActivityType } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { WaiverTemplateService } from './waiver-template.service';

describe('WaiverTemplateService', () => {
  let service: WaiverTemplateService;

  const prismaMock = {
    waiverTemplate: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WaiverTemplateService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<WaiverTemplateService>(WaiverTemplateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns the latest approved template for the activity and jurisdiction', async () => {
    const template = {
      id: 'template-1',
      activityType: EventActivityType.ICE_SKATING,
      jurisdiction: AustralianJurisdiction.NSW,
      revision: 3,
      status: 'APPROVED',
    };

    prismaMock.waiverTemplate.findFirst.mockResolvedValue(template);

    const result = await service.findApprovedTemplate(
      EventActivityType.ICE_SKATING,
      AustralianJurisdiction.NSW,
    );

    expect(result).toEqual(template);
    expect(prismaMock.waiverTemplate.findFirst).toHaveBeenCalledWith({
      where: {
        activityType: EventActivityType.ICE_SKATING,
        jurisdiction: AustralianJurisdiction.NSW,
        status: 'APPROVED',
      },
      orderBy: {
        revision: 'desc',
      },
    });
  });

  it('throws when no approved template is available', async () => {
    prismaMock.waiverTemplate.findFirst.mockResolvedValue(null);

    await expect(
      service.findApprovedTemplate(
        EventActivityType.ICE_SKATING,
        AustralianJurisdiction.WA,
      ),
    ).rejects.toThrow(NotFoundException);
  });
});
