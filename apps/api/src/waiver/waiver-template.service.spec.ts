import { AustralianJurisdiction, EventActivityType } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { WaiverTemplateService } from './waiver-template.service';

describe('WaiverTemplateService', () => {
  let service: WaiverTemplateService;

  const prismaMock = {
    waiverTemplate: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
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

  it('prefers the organisation template over a platform template', async () => {
    const platformTemplate = {
      id: 'platform-template',
      authority: 'PLATFORM_CURATED',
      organizationId: null,
      activityType: EventActivityType.ICE_SKATING,
      jurisdiction: AustralianJurisdiction.NSW,
      revision: 4,
      status: 'APPROVED',
    };
    const organizationTemplate = {
      ...platformTemplate,
      id: 'organization-template',
      authority: 'ORGANIZATION',
      organizationId: 'organization-1',
      revision: 2,
    };

    prismaMock.waiverTemplate.findMany.mockResolvedValue([
      platformTemplate,
      organizationTemplate,
    ]);

    const result = await service.findApprovedTemplate(
      EventActivityType.ICE_SKATING,
      AustralianJurisdiction.NSW,
      'organization-1',
    );

    expect(result).toEqual(organizationTemplate);
    expect(prismaMock.waiverTemplate.findMany).toHaveBeenCalledWith({
      where: {
        activityType: EventActivityType.ICE_SKATING,
        jurisdiction: AustralianJurisdiction.NSW,
        status: 'APPROVED',
        OR: [
          { authority: 'PLATFORM_CURATED', organizationId: null },
          { authority: 'ORGANIZATION', organizationId: 'organization-1' },
        ],
      },
      orderBy: { revision: 'desc' },
    });
  });

  it('falls back to the approved platform template', async () => {
    const template = {
      id: 'platform-template',
      authority: 'PLATFORM_CURATED',
      organizationId: null,
    };
    prismaMock.waiverTemplate.findMany.mockResolvedValue([template]);

    await expect(
      service.findApprovedTemplate(
        EventActivityType.ICE_SKATING,
        AustralianJurisdiction.VIC,
        'organization-1',
      ),
    ).resolves.toEqual(template);
  });

  it('throws when no approved template is available', async () => {
    prismaMock.waiverTemplate.findMany.mockResolvedValue([]);

    await expect(
      service.findApprovedTemplate(
        EventActivityType.ICE_SKATING,
        AustralianJurisdiction.WA,
        'organization-1',
      ),
    ).rejects.toThrow(NotFoundException);
  });
});
