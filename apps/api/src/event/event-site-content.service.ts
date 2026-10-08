import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventSiteContentStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { EventSiteContentDto } from './dto/event-site-content.dto';

const contentInclude = {
  highlights: { orderBy: { sortOrder: 'asc' as const } },
  faqs: { orderBy: { sortOrder: 'asc' as const } },
} satisfies Prisma.EventSiteContentVersionInclude;

@Injectable()
export class EventSiteContentService {
  constructor(private readonly prisma: PrismaService) {}

  async getWorkspace(eventId: string, organizationId: string) {
    await this.requireEvent(eventId, organizationId);

    const [draft, published] = await Promise.all([
      this.prisma.eventSiteContentVersion.findFirst({
        where: { eventId, status: EventSiteContentStatus.DRAFT },
        include: contentInclude,
      }),
      this.prisma.eventSiteContentVersion.findFirst({
        where: { eventId, status: EventSiteContentStatus.PUBLISHED },
        include: contentInclude,
      }),
    ]);

    return { draft, published };
  }

  async saveDraft(
    eventId: string,
    organizationId: string,
    data: EventSiteContentDto,
  ) {
    await this.requireEvent(eventId, organizationId);
    const content = this.normalise(data);

    return this.prisma.$transaction(
      async (transaction) => {
        const draft = await transaction.eventSiteContentVersion.findFirst({
          where: { eventId, status: EventSiteContentStatus.DRAFT },
          select: { id: true },
        });

        if (draft) {
          await transaction.eventSiteHighlight.deleteMany({
            where: { contentVersionId: draft.id },
          });
          await transaction.eventSiteFaq.deleteMany({
            where: { contentVersionId: draft.id },
          });
          return transaction.eventSiteContentVersion.update({
            where: { id: draft.id },
            data: this.versionData(content),
            include: contentInclude,
          });
        }

        const latest = await transaction.eventSiteContentVersion.findFirst({
          where: { eventId },
          orderBy: { version: 'desc' },
          select: { version: true },
        });

        return transaction.eventSiteContentVersion.create({
          data: {
            eventId,
            version: (latest?.version ?? 0) + 1,
            status: EventSiteContentStatus.DRAFT,
            ...this.versionData(content),
          },
          include: contentInclude,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async publish(eventId: string, organizationId: string) {
    await this.requireEvent(eventId, organizationId);

    return this.prisma.$transaction(
      async (transaction) => {
        const draft = await transaction.eventSiteContentVersion.findFirst({
          where: { eventId, status: EventSiteContentStatus.DRAFT },
          include: contentInclude,
        });

        if (!draft) {
          throw new BadRequestException(
            'Save a homepage draft before publishing.',
          );
        }
        if (!this.hasPublishableContent(draft)) {
          throw new BadRequestException(
            'Add About, visit, highlight or FAQ content before publishing.',
          );
        }

        await transaction.eventSiteContentVersion.updateMany({
          where: { eventId, status: EventSiteContentStatus.PUBLISHED },
          data: { status: EventSiteContentStatus.ARCHIVED },
        });

        return transaction.eventSiteContentVersion.update({
          where: { id: draft.id },
          data: {
            status: EventSiteContentStatus.PUBLISHED,
            publishedAt: new Date(),
          },
          include: contentInclude,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private async requireEvent(eventId: string, organizationId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, organizationId },
      select: { id: true },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  private normalise(data: EventSiteContentDto) {
    return {
      aboutTitle: this.optionalText(data.aboutTitle),
      aboutBody: this.optionalText(data.aboutBody),
      arrivalInfo: this.optionalText(data.arrivalInfo),
      transportParkingInfo: this.optionalText(data.transportParkingInfo),
      accessibilityInfo: this.optionalText(data.accessibilityInfo),
      foodDrinkInfo: this.optionalText(data.foodDrinkInfo),
      whatToBringInfo: this.optionalText(data.whatToBringInfo),
      highlights: data.highlights.map((item) => ({
        title: item.title.trim(),
        description: item.description.trim(),
      })),
      faqs: data.faqs.map((item) => ({
        question: item.question.trim(),
        answer: item.answer.trim(),
      })),
    };
  }

  private versionData(content: ReturnType<EventSiteContentService['normalise']>) {
    return {
      aboutTitle: content.aboutTitle,
      aboutBody: content.aboutBody,
      arrivalInfo: content.arrivalInfo,
      transportParkingInfo: content.transportParkingInfo,
      accessibilityInfo: content.accessibilityInfo,
      foodDrinkInfo: content.foodDrinkInfo,
      whatToBringInfo: content.whatToBringInfo,
      highlights: {
        create: content.highlights.map((item, sortOrder) => ({
          ...item,
          sortOrder,
        })),
      },
      faqs: {
        create: content.faqs.map((item, sortOrder) => ({ ...item, sortOrder })),
      },
    };
  }

  private optionalText(value?: string) {
    return value?.trim() || null;
  }

  private hasPublishableContent(content: {
    aboutBody: string | null;
    arrivalInfo: string | null;
    transportParkingInfo: string | null;
    accessibilityInfo: string | null;
    foodDrinkInfo: string | null;
    whatToBringInfo: string | null;
    highlights: unknown[];
    faqs: unknown[];
  }) {
    return Boolean(
      content.aboutBody ||
        content.arrivalInfo ||
        content.transportParkingInfo ||
        content.accessibilityInfo ||
        content.foodDrinkInfo ||
        content.whatToBringInfo ||
        content.highlights.length ||
        content.faqs.length,
    );
  }
}
