import { FileAssetPurpose } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { FileAssetService } from './file-asset.service';
import { LocalStorageProvider } from './local-storage.provider';

function logoFile() {
  const buffer = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(buffer);
  buffer.writeUInt32BE(13, 8);
  buffer.write('IHDR', 12, 'ascii');
  buffer.writeUInt32BE(512, 16);
  buffer.writeUInt32BE(512, 20);
  return {
    originalname: 'brand.png',
    mimetype: 'image/png',
    size: buffer.length,
    buffer,
  };
}

describe('FileAssetService', () => {
  let service: FileAssetService;
  const transaction = {
    eventBranding: { findUnique: jest.fn(), upsert: jest.fn() },
    fileAsset: { create: jest.fn(), update: jest.fn() },
  };
  const prisma = {
    event: { findFirst: jest.fn() },
    fileAsset: { findFirst: jest.fn() },
    $transaction: jest.fn((callback: (client: typeof transaction) => unknown) =>
      callback(transaction),
    ),
  };
  const storage = {
    name: 'TEST',
    put: jest.fn(),
    get: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileAssetService,
        { provide: PrismaService, useValue: prisma },
        { provide: LocalStorageProvider, useValue: storage },
      ],
    }).compile();
    service = module.get(FileAssetService);
  });

  it('stores a tenant-owned asset and connects it to Event branding', async () => {
    prisma.event.findFirst.mockResolvedValue({ id: 'event-1' });
    transaction.eventBranding.findUnique.mockResolvedValue(null);
    transaction.fileAsset.create.mockResolvedValue({ id: 'asset-1' });

    await service.createBrandingAsset({
      eventId: 'event-1',
      organizationId: 'organization-1',
      userId: 'user-1',
      purpose: FileAssetPurpose.EVENT_LOGO,
      file: logoFile(),
    });

    expect(prisma.event.findFirst).toHaveBeenCalledWith({
      where: { id: 'event-1', organizationId: 'organization-1' },
      select: { id: true },
    });
    expect(storage.put).toHaveBeenCalledTimes(1);
    expect(transaction.fileAsset.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: 'organization-1',
        eventId: 'event-1',
        createdByUserId: 'user-1',
        purpose: FileAssetPurpose.EVENT_LOGO,
        mimeType: 'image/png',
        width: 512,
        height: 512,
      }),
    });
    expect(transaction.eventBranding.upsert).toHaveBeenCalledWith({
      where: { eventId: 'event-1' },
      create: { eventId: 'event-1', logoAssetId: 'asset-1' },
      update: { logoAssetId: 'asset-1' },
    });
  });

  it('does not reveal or store against another tenant Event', async () => {
    prisma.event.findFirst.mockResolvedValue(null);

    await expect(
      service.createBrandingAsset({
        eventId: 'event-1',
        organizationId: 'organization-2',
        userId: 'user-2',
        purpose: FileAssetPurpose.EVENT_LOGO,
        file: logoFile(),
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('removes the stored object when metadata persistence fails', async () => {
    prisma.event.findFirst.mockResolvedValue({ id: 'event-1' });
    prisma.$transaction.mockRejectedValueOnce(
      new Error('database unavailable'),
    );

    await expect(
      service.createBrandingAsset({
        eventId: 'event-1',
        organizationId: 'organization-1',
        userId: 'user-1',
        purpose: FileAssetPurpose.EVENT_LOGO,
        file: logoFile(),
      }),
    ).rejects.toThrow('database unavailable');
    expect(storage.remove).toHaveBeenCalledTimes(1);
  });

  it('tenant-scopes authorised asset delivery', async () => {
    prisma.fileAsset.findFirst.mockResolvedValue({
      storageKey: 'event-branding/org/event/asset.png',
      mimeType: 'image/png',
      displayName: 'Logo',
      checksum: 'checksum',
    });
    storage.get.mockResolvedValue(Buffer.from('image'));

    await expect(
      service.getBrandingAsset('event-1', 'asset-1', 'organization-1'),
    ).resolves.toEqual(
      expect.objectContaining({ content: Buffer.from('image') }),
    );
    expect(prisma.fileAsset.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'asset-1',
          eventId: 'event-1',
          organizationId: 'organization-1',
          status: 'READY',
        }),
      }),
    );
  });
});
