import { FileAssetPurpose } from '@prisma/client';

export interface BrandingImageUpload {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface StorageProvider {
  readonly name: string;
  put(storageKey: string, content: Buffer): Promise<void>;
  get(storageKey: string): Promise<Buffer>;
  remove(storageKey: string): Promise<void>;
}

export interface CreateBrandingAssetInput {
  eventId: string;
  organizationId: string;
  userId: string;
  purpose: FileAssetPurpose;
  displayName?: string;
  file: BrandingImageUpload;
}
