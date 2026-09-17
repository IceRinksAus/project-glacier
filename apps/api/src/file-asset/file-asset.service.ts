import { createHash, randomUUID } from 'node:crypto';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FileAssetPurpose } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { validateBrandingImage } from './branding-image.validator';
import {
  CatalogueAssetTarget,
  CreateBrandingAssetInput,
  CreateCatalogueAssetInput,
} from './file-asset.types';
import { LocalStorageProvider } from './local-storage.provider';

@Injectable()
export class FileAssetService {
  private readonly logger = new Logger(FileAssetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: LocalStorageProvider,
  ) {}

  async createBrandingAsset(input: CreateBrandingAssetInput) {
    const event = await this.prisma.event.findFirst({
      where: { id: input.eventId, organizationId: input.organizationId },
      select: { id: true },
    });
    if (!event) throw new NotFoundException('Event not found');

    const image = validateBrandingImage(input.file, input.purpose);
    const extension = image.mimeType === 'image/png' ? 'png' : 'jpg';
    const storageKey = `event-branding/${input.organizationId}/${event.id}/${randomUUID()}.${extension}`;
    const checksum = createHash('sha256')
      .update(input.file.buffer)
      .digest('hex');
    await this.storage.put(storageKey, input.file.buffer);

    try {
      const result = await this.prisma.$transaction(async (transaction) => {
        const existingBranding = await transaction.eventBranding.findUnique({
          where: { eventId: event.id },
          select: {
            logoAssetId: true,
            logoAsset: { select: { storageKey: true } },
            heroAssetId: true,
            heroAsset: { select: { storageKey: true } },
          },
        });
        const originalFilename = this.safeAssetName(
          input.file.originalname,
          'branding-image',
          255,
        );
        const asset = await transaction.fileAsset.create({
          data: {
            organizationId: input.organizationId,
            eventId: event.id,
            createdByUserId: input.userId,
            purpose: input.purpose,
            storageProvider: this.storage.name,
            storageKey,
            originalFilename,
            displayName: this.safeAssetName(
              input.displayName?.trim() || originalFilename,
              'Branding image',
              200,
            ),
            mimeType: image.mimeType,
            fileSize: input.file.size,
            checksum,
            width: image.width,
            height: image.height,
          },
        });
        const assetField =
          input.purpose === FileAssetPurpose.EVENT_LOGO
            ? 'logoAssetId'
            : 'heroAssetId';
        await transaction.eventBranding.upsert({
          where: { eventId: event.id },
          create: { eventId: event.id, [assetField]: asset.id },
          update: { [assetField]: asset.id },
        });
        const replacedAssetId =
          input.purpose === FileAssetPurpose.EVENT_LOGO
            ? existingBranding?.logoAssetId
            : existingBranding?.heroAssetId;
        if (replacedAssetId && replacedAssetId !== asset.id) {
          await transaction.fileAsset.update({
            where: { id: replacedAssetId },
            data: { status: 'REPLACED' },
          });
        }
        const replacedStorageKey =
          input.purpose === FileAssetPurpose.EVENT_LOGO
            ? existingBranding?.logoAsset?.storageKey
            : existingBranding?.heroAsset?.storageKey;
        return { asset, replacedStorageKey };
      });

      if (result.replacedStorageKey) {
        await this.storage.remove(result.replacedStorageKey).catch(() => {
          this.logger.warn(
            JSON.stringify({
              event: 'file_asset.replaced_object_cleanup_failed',
            }),
          );
        });
      }

      return result.asset;
    } catch (error) {
      await this.storage.remove(storageKey);
      throw error;
    }
  }

  async createCatalogueAsset(input: CreateCatalogueAssetInput) {
    const target = await this.findCatalogueTarget(
      input.target,
      input.targetId,
      input.organizationId,
    );
    if (!target) throw new NotFoundException('Catalogue item not found');

    const purpose =
      input.target === 'PRODUCT'
        ? FileAssetPurpose.PRODUCT_IMAGE
        : FileAssetPurpose.TICKET_TYPE_IMAGE;
    const image = validateBrandingImage(input.file, purpose);
    const extension = image.mimeType === 'image/png' ? 'png' : 'jpg';
    const storageKey = `catalogue-images/${input.organizationId}/${target.eventId}/${randomUUID()}.${extension}`;
    const checksum = createHash('sha256')
      .update(input.file.buffer)
      .digest('hex');
    await this.storage.put(storageKey, input.file.buffer);

    try {
      const result = await this.prisma.$transaction(async (transaction) => {
        const current =
          input.target === 'PRODUCT'
            ? await transaction.product.findUnique({
                where: { id: target.id },
                select: {
                  imageAssetId: true,
                  imageAsset: { select: { storageKey: true } },
                },
              })
            : await transaction.ticketType.findUnique({
                where: { id: target.id },
                select: {
                  imageAssetId: true,
                  imageAsset: { select: { storageKey: true } },
                },
              });
        const originalFilename = this.safeAssetName(
          input.file.originalname,
          'catalogue-image',
          255,
        );
        const asset = await transaction.fileAsset.create({
          data: {
            organizationId: input.organizationId,
            eventId: target.eventId,
            createdByUserId: input.userId,
            purpose,
            storageProvider: this.storage.name,
            storageKey,
            originalFilename,
            displayName: this.safeAssetName(
              input.displayName?.trim() || originalFilename,
              'Catalogue image',
              200,
            ),
            mimeType: image.mimeType,
            fileSize: input.file.size,
            checksum,
            width: image.width,
            height: image.height,
          },
        });
        if (input.target === 'PRODUCT') {
          await transaction.product.update({
            where: { id: target.id },
            data: { imageAssetId: asset.id },
          });
        } else {
          await transaction.ticketType.update({
            where: { id: target.id },
            data: { imageAssetId: asset.id },
          });
        }
        if (current?.imageAssetId) {
          await transaction.fileAsset.update({
            where: { id: current.imageAssetId },
            data: { status: 'REPLACED' },
          });
        }
        return {
          asset,
          replacedStorageKey: current?.imageAsset?.storageKey,
        };
      });
      if (result.replacedStorageKey) {
        await this.storage.remove(result.replacedStorageKey).catch(() => {
          this.logger.warn(
            JSON.stringify({
              event: 'file_asset.replaced_object_cleanup_failed',
            }),
          );
        });
      }
      return result.asset;
    } catch (error) {
      await this.storage.remove(storageKey);
      throw error;
    }
  }

  private findCatalogueTarget(
    target: CatalogueAssetTarget,
    targetId: string,
    organizationId: string,
  ) {
    const query = {
      where: { id: targetId, event: { organizationId } },
      select: { id: true, eventId: true },
    };
    return target === 'PRODUCT'
      ? this.prisma.product.findFirst(query)
      : this.prisma.ticketType.findFirst(query);
  }

  async getCatalogueAsset(
    target: CatalogueAssetTarget,
    targetId: string,
    assetId: string,
    organizationId: string,
  ) {
    const relation =
      target === 'PRODUCT'
        ? { usedAsProduct: { id: targetId } }
        : { usedAsTicketType: { id: targetId } };
    const asset = await this.prisma.fileAsset.findFirst({
      where: {
        id: assetId,
        organizationId,
        status: 'READY',
        purpose: target === 'PRODUCT' ? 'PRODUCT_IMAGE' : 'TICKET_TYPE_IMAGE',
        ...relation,
      },
      select: {
        storageKey: true,
        mimeType: true,
        displayName: true,
        checksum: true,
      },
    });
    if (!asset) throw new NotFoundException('Catalogue image not found');
    return { ...asset, content: await this.storage.get(asset.storageKey) };
  }

  async removeCatalogueAsset(
    target: CatalogueAssetTarget,
    targetId: string,
    organizationId: string,
  ) {
    const query = {
      where: { id: targetId, event: { organizationId } },
      select: {
        id: true,
        imageAssetId: true,
        imageAsset: { select: { storageKey: true } },
      },
    };
    const item =
      target === 'PRODUCT'
        ? await this.prisma.product.findFirst(query)
        : await this.prisma.ticketType.findFirst(query);
    if (!item) throw new NotFoundException('Catalogue item not found');
    if (!item.imageAssetId) return;

    await this.prisma.$transaction(async (transaction) => {
      if (target === 'PRODUCT') {
        await transaction.product.update({
          where: { id: item.id },
          data: { imageAssetId: null },
        });
      } else {
        await transaction.ticketType.update({
          where: { id: item.id },
          data: { imageAssetId: null },
        });
      }
      await transaction.fileAsset.update({
        where: { id: item.imageAssetId! },
        data: { status: 'REPLACED' },
      });
    });
    if (item.imageAsset?.storageKey) {
      await this.storage.remove(item.imageAsset.storageKey).catch(() => {
        this.logger.warn(
          JSON.stringify({ event: 'file_asset.removed_object_cleanup_failed' }),
        );
      });
    }
  }

  private safeAssetName(value: string, fallback: string, maximum: number) {
    const safe = value
      .replace(/[\u0000-\u001f\u007f]/g, '')
      .replace(/[\\/]/g, '-')
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, maximum);
    return safe || fallback;
  }

  async getBrandingAsset(
    eventId: string,
    assetId: string,
    organizationId: string,
  ) {
    const asset = await this.prisma.fileAsset.findFirst({
      where: {
        id: assetId,
        eventId,
        organizationId,
        status: 'READY',
        purpose: { in: ['EVENT_LOGO', 'EVENT_HERO'] },
      },
      select: {
        storageKey: true,
        mimeType: true,
        displayName: true,
        checksum: true,
      },
    });
    if (!asset) throw new NotFoundException('Branding asset not found');
    return { ...asset, content: await this.storage.get(asset.storageKey) };
  }

  async getPublicBrandingAsset(eventSlug: string, assetId: string) {
    const event = await this.prisma.event.findFirst({
      where: {
        slug: eventSlug,
        status: 'ACTIVE',
        branding: {
          OR: [{ logoAssetId: assetId }, { heroAssetId: assetId }],
        },
      },
      select: {
        branding: {
          select: {
            logoAsset: {
              select: {
                id: true,
                storageKey: true,
                mimeType: true,
                displayName: true,
                checksum: true,
                status: true,
              },
            },
            heroAsset: {
              select: {
                id: true,
                storageKey: true,
                mimeType: true,
                displayName: true,
                checksum: true,
                status: true,
              },
            },
          },
        },
      },
    });
    const candidates = [event?.branding?.logoAsset, event?.branding?.heroAsset];
    const asset = candidates.find(
      (candidate) => candidate?.id === assetId && candidate.status === 'READY',
    );
    if (!asset) throw new NotFoundException('Branding asset not found');
    return { ...asset, content: await this.storage.get(asset.storageKey) };
  }
}
