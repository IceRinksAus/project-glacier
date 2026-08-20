import { AustralianJurisdiction, EventActivityType } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createHash } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { EventWaiverService } from './event-waiver.service';
import { WaiverTemplateService } from './waiver-template.service';

describe('EventWaiverService', () => {
  let service: EventWaiverService;

  const transactionMock = {
    eventWaiver: {
      create: jest.fn(),
    },
    waiverVersion: {
      create: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
  };
  const prismaMock = {
    event: {
      findFirst: jest.fn(),
    },
    eventWaiver: {
      findFirst: jest.fn(),
    },
    waiverSubmission: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    waiverVersion: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(
      (callback: (transaction: typeof transactionMock) => unknown) =>
        callback(transactionMock),
    ),
  };
  const waiverTemplateServiceMock = {
    findApprovedTemplate: jest.fn(),
  };

  const event = {
    id: 'event-1',
    name: 'Bathurst Ice Rink',
    activityType: EventActivityType.ICE_SKATING,
    jurisdiction: AustralianJurisdiction.NSW,
    venueName: 'Bathurst Showground',
    addressLine1: '1 Kendall Avenue',
    addressLine2: null,
    suburb: 'Bathurst',
    postcode: '2795',
    country: 'AU',
    startDate: new Date('2026-06-20T00:00:00.000Z'),
    endDate: new Date('2026-07-19T00:00:00.000Z'),
    organization: {
      name: 'Ice Rinks Australia',
      legalName: 'Ice Rinks Australia Pty Ltd',
      tradingName: 'Ice Rinks Australia',
      abn: '12 345 678 901',
    },
    waiver: null,
  };
  const template = {
    id: 'template-1',
    contentTemplate:
      '{{organizationLegalName}} operates {{eventName}} at {{venueName}}, {{eventAddress}}.',
    acceptanceStatement: 'I accept the waiver for {{eventName}}.',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventWaiverService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: WaiverTemplateService,
          useValue: waiverTemplateServiceMock,
        },
      ],
    }).compile();

    service = module.get<EventWaiverService>(EventWaiverService);

    prismaMock.event.findFirst.mockResolvedValue(event);
    waiverTemplateServiceMock.findApprovedTemplate.mockResolvedValue(template);
    transactionMock.eventWaiver.create.mockResolvedValue({
      id: 'event-waiver-1',
      eventId: event.id,
      publicSlug: 'stable-public-slug',
    });
    transactionMock.waiverVersion.create.mockImplementation(({ data }) =>
      Promise.resolve(data),
    );
  });

  afterEach(() => {
    delete process.env.WEB_APP_URL;
  });

  it('retrieves version history within the authenticated organization', async () => {
    prismaMock.eventWaiver.findFirst.mockResolvedValue({
      id: 'event-waiver-1',
      versions: [],
    });

    await expect(
      service.findForEvent('organization-1', event.id),
    ).resolves.toEqual({
      id: 'event-waiver-1',
      versions: [],
    });
    expect(prismaMock.eventWaiver.findFirst).toHaveBeenCalledWith({
      where: {
        eventId: event.id,
        event: {
          organizationId: 'organization-1',
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
  });

  it('generates a QR code for the stable published Waiver URL', async () => {
    process.env.WEB_APP_URL = 'https://events.example/';
    prismaMock.eventWaiver.findFirst.mockResolvedValue({
      publicSlug: 'stable-public-slug',
    });

    const result = await service.generatePublicQrCode(
      'organization-1',
      event.id,
    );

    expect(result.publicUrl).toBe(
      'https://events.example/waivers/stable-public-slug',
    );
    expect(result.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(prismaMock.eventWaiver.findFirst).toHaveBeenCalledWith({
      where: {
        eventId: event.id,
        event: {
          organizationId: 'organization-1',
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
  });

  it('does not generate a QR code without a tenant-owned published Waiver', async () => {
    prismaMock.eventWaiver.findFirst.mockResolvedValue(null);

    await expect(
      service.generatePublicQrCode('organization-1', event.id),
    ).rejects.toThrow(NotFoundException);
  });

  it('lists recent submissions with tenant scope and bounded search', async () => {
    prismaMock.waiverSubmission.findMany.mockResolvedValue([]);

    await expect(
      service.listSubmissions('organization-1', event.id, '  Jamie  '),
    ).resolves.toEqual([]);
    expect(prismaMock.waiverSubmission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          eventWaiver: {
            event: {
              id: event.id,
              organizationId: 'organization-1',
            },
          },
          signatoryFullName: {
            contains: 'Jamie',
            mode: 'insensitive',
          },
        },
        orderBy: {
          acceptedAt: 'desc',
        },
        take: 100,
      }),
    );
  });

  it('rejects an oversized submission search', () => {
    expect(() =>
      service.listSubmissions('organization-1', event.id, 'x'.repeat(201)),
    ).toThrow(BadRequestException);
    expect(prismaMock.waiverSubmission.findMany).not.toHaveBeenCalled();
  });

  it('retrieves submission evidence only within the authenticated organization', async () => {
    prismaMock.waiverSubmission.findFirst.mockResolvedValue({
      id: 'submission-1',
      signatoryFullName: 'Jamie Stoller',
    });

    await service.findSubmission('organization-1', event.id, 'submission-1');

    expect(prismaMock.waiverSubmission.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'submission-1',
          eventWaiver: {
            event: {
              id: event.id,
              organizationId: 'organization-1',
            },
          },
        },
      }),
    );
  });

  it('does not expose cross-tenant submission evidence', async () => {
    prismaMock.waiverSubmission.findFirst.mockResolvedValue(null);

    await expect(
      service.findSubmission('organization-2', event.id, 'submission-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('creates a rendered draft with template provenance and a content hash', async () => {
    const result = await service.createDraft('organization-1', event.id);

    const content =
      'Ice Rinks Australia Pty Ltd operates Bathurst Ice Rink at Bathurst Showground, 1 Kendall Avenue, Bathurst, NSW, 2795, AU.';

    expect(prismaMock.event.findFirst).toHaveBeenCalledWith({
      where: {
        id: event.id,
        organizationId: 'organization-1',
      },
      include: expect.any(Object),
    });
    expect(waiverTemplateServiceMock.findApprovedTemplate).toHaveBeenCalledWith(
      EventActivityType.ICE_SKATING,
      AustralianJurisdiction.NSW,
    );
    expect(transactionMock.eventWaiver.create).toHaveBeenCalledWith({
      data: {
        eventId: event.id,
        publicSlug: expect.stringMatching(/^[a-f0-9]{48}$/),
      },
    });
    expect(transactionMock.waiverVersion.create).toHaveBeenCalledWith({
      data: {
        eventWaiverId: 'event-waiver-1',
        sourceTemplateId: template.id,
        version: 1,
        title: 'Bathurst Ice Rink Waiver',
        content,
        acceptanceStatement: 'I accept the waiver for Bathurst Ice Rink.',
        contentHash: createHash('sha256').update(content).digest('hex'),
        status: 'DRAFT',
      },
    });
    expect(result).toEqual(
      expect.objectContaining({
        eventWaiverId: 'event-waiver-1',
        version: 1,
        content,
      }),
    );
  });

  it('reuses the stable Event waiver and increments the draft version', async () => {
    prismaMock.event.findFirst.mockResolvedValue({
      ...event,
      waiver: {
        id: 'event-waiver-1',
        eventId: event.id,
        publicSlug: 'existing-public-slug',
        versions: [{ version: 4 }],
      },
    });

    await service.createDraft('organization-1', event.id);

    expect(transactionMock.eventWaiver.create).not.toHaveBeenCalled();
    expect(transactionMock.waiverVersion.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        eventWaiverId: 'event-waiver-1',
        version: 5,
      }),
    });
  });

  it('rejects an Event outside the authenticated organization', async () => {
    prismaMock.event.findFirst.mockResolvedValue(null);

    await expect(
      service.createDraft('organization-2', event.id),
    ).rejects.toThrow(NotFoundException);

    expect(
      waiverTemplateServiceMock.findApprovedTemplate,
    ).not.toHaveBeenCalled();
  });

  it('requires activity type and jurisdiction', async () => {
    prismaMock.event.findFirst.mockResolvedValue({
      ...event,
      activityType: null,
    });

    await expect(
      service.createDraft('organization-1', event.id),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects unsupported template variables', async () => {
    waiverTemplateServiceMock.findApprovedTemplate.mockResolvedValue({
      ...template,
      contentTemplate: 'Hello {{inventedLegalClause}}',
    });

    await expect(
      service.createDraft('organization-1', event.id),
    ).rejects.toThrow(
      'Waiver template contains unsupported variable "inventedLegalClause".',
    );

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('rejects a required template variable with no source value', async () => {
    prismaMock.event.findFirst.mockResolvedValue({
      ...event,
      venueName: null,
    });

    await expect(
      service.createDraft('organization-1', event.id),
    ).rejects.toThrow(
      'Waiver template variable "venueName" has no Event or Organization value.',
    );

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('publishes a draft and supersedes the previously published version', async () => {
    prismaMock.waiverVersion.findFirst.mockResolvedValue({
      id: 'waiver-version-2',
      eventWaiverId: 'event-waiver-1',
      status: 'DRAFT',
    });
    transactionMock.waiverVersion.update.mockResolvedValue({
      id: 'waiver-version-2',
      status: 'PUBLISHED',
    });

    const result = await service.publishDraft(
      'organization-1',
      event.id,
      'waiver-version-2',
      'user-1',
    );

    expect(prismaMock.waiverVersion.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'waiver-version-2',
        eventWaiver: {
          event: {
            id: event.id,
            organizationId: 'organization-1',
          },
        },
      },
    });
    expect(transactionMock.waiverVersion.updateMany).toHaveBeenCalledWith({
      where: {
        eventWaiverId: 'event-waiver-1',
        status: 'PUBLISHED',
      },
      data: {
        status: 'SUPERSEDED',
      },
    });
    expect(transactionMock.waiverVersion.update).toHaveBeenCalledWith({
      where: {
        id: 'waiver-version-2',
      },
      data: {
        status: 'PUBLISHED',
        publishedAt: expect.any(Date),
        publishedByUserId: 'user-1',
      },
    });
    expect(result).toEqual({
      id: 'waiver-version-2',
      status: 'PUBLISHED',
    });
  });

  it('does not expose or publish a cross-tenant draft', async () => {
    prismaMock.waiverVersion.findFirst.mockResolvedValue(null);

    await expect(
      service.publishDraft(
        'organization-2',
        event.id,
        'waiver-version-2',
        'user-1',
      ),
    ).rejects.toThrow(NotFoundException);

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('does not republish an immutable published version', async () => {
    prismaMock.waiverVersion.findFirst.mockResolvedValue({
      id: 'waiver-version-1',
      eventWaiverId: 'event-waiver-1',
      status: 'PUBLISHED',
    });

    await expect(
      service.publishDraft(
        'organization-1',
        event.id,
        'waiver-version-1',
        'user-1',
      ),
    ).rejects.toThrow('Only a draft waiver version can be published.');

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});
