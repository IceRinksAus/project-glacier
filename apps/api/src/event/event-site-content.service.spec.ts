import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventSiteContentStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { EventSiteContentService } from './event-site-content.service';

describe('EventSiteContentService', () => {
  const transaction = {
    eventSiteContentVersion: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    eventSiteHighlight: { deleteMany: jest.fn() },
    eventSiteFaq: { deleteMany: jest.fn() },
  };
  const prisma = {
    event: { findFirst: jest.fn() },
    eventSiteContentVersion: { findFirst: jest.fn() },
    $transaction: jest.fn(
      (callback: (client: typeof transaction) => unknown) =>
        callback(transaction),
    ),
  };
  const service = new EventSiteContentService(
    prisma as unknown as PrismaService,
  );

  const content = {
    aboutTitle: ' About ',
    aboutBody: ' Fictional Event information. ',
    highlights: [
      { title: ' Skating ', description: ' Family skating sessions. ' },
    ],
    faqs: [{ question: ' What to bring? ', answer: ' Warm clothes. ' }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.event.findFirst.mockResolvedValue({ id: 'event-1' });
  });

  it('does not reveal another Organisation Event', async () => {
    prisma.event.findFirst.mockResolvedValue(null);

    await expect(
      service.getWorkspace('event-1', 'organization-2'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.event.findFirst).toHaveBeenCalledWith({
      where: { id: 'event-1', organizationId: 'organization-2' },
      select: { id: true },
    });
  });

  it('creates a normalised, ordered first draft', async () => {
    transaction.eventSiteContentVersion.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    transaction.eventSiteContentVersion.create.mockResolvedValue({
      id: 'content-1',
    });

    await service.saveDraft('event-1', 'organization-1', content as never);

    expect(transaction.eventSiteContentVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventId: 'event-1',
          version: 1,
          status: EventSiteContentStatus.DRAFT,
          aboutTitle: 'About',
          aboutBody: 'Fictional Event information.',
          highlights: {
            create: [
              {
                title: 'Skating',
                description: 'Family skating sessions.',
                sortOrder: 0,
              },
            ],
          },
          faqs: {
            create: [
              {
                question: 'What to bring?',
                answer: 'Warm clothes.',
                sortOrder: 0,
              },
            ],
          },
        }),
      }),
    );
  });

  it('replaces draft children rather than mutating a published version', async () => {
    transaction.eventSiteContentVersion.findFirst.mockResolvedValue({
      id: 'draft-1',
    });
    transaction.eventSiteContentVersion.update.mockResolvedValue({
      id: 'draft-1',
    });

    await service.saveDraft('event-1', 'organization-1', content as never);

    expect(transaction.eventSiteHighlight.deleteMany).toHaveBeenCalledWith({
      where: { contentVersionId: 'draft-1' },
    });
    expect(transaction.eventSiteFaq.deleteMany).toHaveBeenCalledWith({
      where: { contentVersionId: 'draft-1' },
    });
    expect(transaction.eventSiteContentVersion.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'draft-1' } }),
    );
  });

  it('archives the prior published version and publishes the complete draft', async () => {
    transaction.eventSiteContentVersion.findFirst.mockResolvedValue({
      id: 'draft-2',
      aboutBody: 'Fictional content',
      arrivalInfo: null,
      transportParkingInfo: null,
      accessibilityInfo: null,
      foodDrinkInfo: null,
      whatToBringInfo: null,
      highlights: [],
      faqs: [],
    });
    transaction.eventSiteContentVersion.update.mockResolvedValue({
      id: 'draft-2',
      status: EventSiteContentStatus.PUBLISHED,
    });

    await service.publish('event-1', 'organization-1');

    expect(transaction.eventSiteContentVersion.updateMany).toHaveBeenCalledWith(
      {
        where: {
          eventId: 'event-1',
          status: EventSiteContentStatus.PUBLISHED,
        },
        data: { status: EventSiteContentStatus.ARCHIVED },
      },
    );
    expect(transaction.eventSiteContentVersion.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'draft-2' },
        data: expect.objectContaining({
          status: EventSiteContentStatus.PUBLISHED,
          publishedAt: expect.any(Date),
        }),
      }),
    );
  });

  it('rejects an empty draft', async () => {
    transaction.eventSiteContentVersion.findFirst.mockResolvedValue({
      id: 'draft-empty',
      aboutBody: null,
      arrivalInfo: null,
      transportParkingInfo: null,
      accessibilityInfo: null,
      foodDrinkInfo: null,
      whatToBringInfo: null,
      highlights: [],
      faqs: [],
    });

    await expect(
      service.publish('event-1', 'organization-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(transaction.eventSiteContentVersion.updateMany).not.toHaveBeenCalled();
  });
});
