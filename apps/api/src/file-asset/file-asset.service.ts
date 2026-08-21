import { createHash, randomUUID } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { FileAssetPurpose } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { validateBrandingImage } from './branding-image.validator';
import { CreateBrandingAssetInput } from './file-asset.types';
import { LocalStorageProvider } from './local-storage.provider';

@Injectable()
export class FileAssetService {
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
      return await this.prisma.$transaction(async (transaction) => {
        const existingBranding = await transaction.eventBranding.findUnique({
          where: { eventId: event.id },
          select: { logoAssetId: true, heroAssetId: true },
        });
        const asset = await transaction.fileAsset.create({
          data: {
            organizationId: input.organizationId,
            eventId: event.id,
            createdByUserId: input.userId,
            purpose: input.purpose,
            storageProvider: this.storage.name,
            storageKey,
            originalFilename: input.file.originalname.slice(0, 255),
            displayName: (
              input.displayName?.trim() || input.file.originalname
            ).slice(0, 200),
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
        return asset;
      });
    } catch (error) {
      await this.storage.remove(storageKey);
      throw error;
    }
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
}
