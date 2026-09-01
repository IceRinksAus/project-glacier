import { FileAssetPurpose } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { FileAssetService } from './file-asset.service';
import { LocalStorageProvider } from './local-storage.provider';

function logoFile() {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const chunk = (type: string, data = Buffer.alloc(0)) => {
    const value = Buffer.alloc(12 + data.length);
    value.writeUInt32BE(data.length, 0);
    value.write(type, 4, 'ascii');
    data.copy(value, 8);
    return value;
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(512, 0);
  header.writeUInt32BE(512, 4);
  const buffer = Buffer.concat([
    signature,
    chunk('IHDR', header),
    chunk('IDAT', Buffer.from([0])),
    chunk('IEND'),
  ]);
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
    remove: jest.fn().mockResolvedValue(undefined),
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

  it('removes unsafe control and path characters from stored names', async () => {
    prisma.event.findFirst.mockResolvedValue({ id: 'event-1' });
    transaction.eventBranding.findUnique.mockResolvedValue(null);
    transaction.fileAsset.create.mockResolvedValue({ id: 'asset-1' });
    const file = logoFile();
    file.originalname = '../brand\r\n.png';

    await service.createBrandingAsset({
      eventId: 'event-1',
      organizationId: 'organization-1',
      userId: 'user-1',
      purpose: FileAssetPurpose.EVENT_LOGO,
      displayName: '  Winter\r\n/Logo  ',
      file,
    });

    expect(transaction.fileAsset.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        originalFilename: '..-brand.png',
        displayName: 'Winter-Logo',
      }),
    });
  });

  it('marks and removes the previous object after replacement commits', async () => {
    prisma.event.findFirst.mockResolvedValue({ id: 'event-1' });
    transaction.eventBranding.findUnique.mockResolvedValue({
      logoAssetId: 'old-asset',
      logoAsset: { storageKey: 'old-storage-key' },
      heroAssetId: null,
      heroAsset: null,
    });
    transaction.fileAsset.create.mockResolvedValue({ id: 'new-asset' });

    await service.createBrandingAsset({
      eventId: 'event-1',
      organizationId: 'organization-1',
      userId: 'user-1',
      purpose: FileAssetPurpose.EVENT_LOGO,
      file: logoFile(),
    });

    expect(transaction.fileAsset.update).toHaveBeenCalledWith({
      where: { id: 'old-asset' },
      data: { status: 'REPLACED' },
    });
    expect(storage.remove).toHaveBeenCalledWith('old-storage-key');
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

  it('serves only the selected ready asset of an active public Event', async () => {
    prisma.event.findFirst.mockResolvedValue({
      branding: {
        logoAsset: {
          id: 'asset-1',
          storageKey: 'event-branding/org/event/asset.png',
          mimeType: 'image/png',
          displayName: 'Logo',
          checksum: 'checksum',
          status: 'READY',
        },
        heroAsset: null,
      },
    });
    storage.get.mockResolvedValue(Buffer.from('image'));

    await expect(
      service.getPublicBrandingAsset('active-event', 'asset-1'),
    ).resolves.toEqual(expect.objectContaining({ content: Buffer.from('image') }));
    expect(prisma.event.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          slug: 'active-event',
          status: 'ACTIVE',
          branding: {
            OR: [{ logoAssetId: 'asset-1' }, { heroAssetId: 'asset-1' }],
          },
        }),
      }),
    );
  });

  it('does not serve an unselected, replaced or inactive public asset', async () => {
    prisma.event.findFirst.mockResolvedValue(null);

    await expect(
      service.getPublicBrandingAsset('inactive-event', 'old-asset'),
    ).rejects.toThrow('Branding asset not found');
    expect(storage.get).not.toHaveBeenCalled();
  });
});
