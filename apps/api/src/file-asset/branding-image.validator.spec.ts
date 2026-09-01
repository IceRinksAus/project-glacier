import { BadRequestException } from '@nestjs/common';
import { FileAssetPurpose } from '@prisma/client';

import { validateBrandingImage } from './branding-image.validator';

function png(width: number, height: number) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const chunk = (type: string, data = Buffer.alloc(0)) => {
    const value = Buffer.alloc(12 + data.length);
    value.writeUInt32BE(data.length, 0);
    value.write(type, 4, 'ascii');
    data.copy(value, 8);
    return value;
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    signature,
    chunk('IHDR', header),
    chunk('IDAT', Buffer.from([0])),
    chunk('IEND'),
  ]);
}

describe('validateBrandingImage', () => {
  it('accepts a signature-verified PNG within logo bounds', () => {
    const buffer = png(512, 512);

    expect(
      validateBrandingImage(
        {
          originalname: 'logo.png',
          mimetype: 'image/png',
          size: buffer.length,
          buffer,
        },
        FileAssetPurpose.EVENT_LOGO,
      ),
    ).toEqual({ mimeType: 'image/png', width: 512, height: 512 });
  });

  it('rejects content whose signature does not match its declared type', () => {
    const buffer = png(1200, 600);

    expect(() =>
      validateBrandingImage(
        {
          originalname: 'hero.jpg',
          mimetype: 'image/jpeg',
          size: buffer.length,
          buffer,
        },
        FileAssetPurpose.EVENT_HERO,
      ),
    ).toThrow(BadRequestException);
  });

  it('applies purpose-specific dimension bounds', () => {
    const buffer = png(300, 200);

    expect(() =>
      validateBrandingImage(
        {
          originalname: 'hero.png',
          mimetype: 'image/png',
          size: buffer.length,
          buffer,
        },
        FileAssetPurpose.EVENT_HERO,
      ),
    ).toThrow('Hero dimensions must be between 600 × 300');
  });

  it('rejects a truncated PNG that contains only a plausible header', () => {
    const buffer = png(512, 512).subarray(0, 24);

    expect(() =>
      validateBrandingImage(
        {
          originalname: 'logo.png',
          mimetype: 'image/png',
          size: buffer.length,
          buffer,
        },
        FileAssetPurpose.EVENT_LOGO,
      ),
    ).toThrow('Only valid PNG and JPEG images are supported.');
  });

  it('rejects upload metadata that understates the actual buffer size', () => {
    const buffer = png(512, 512);

    expect(() =>
      validateBrandingImage(
        {
          originalname: 'logo.png',
          mimetype: 'image/png',
          size: buffer.length - 1,
          buffer,
        },
        FileAssetPurpose.EVENT_LOGO,
      ),
    ).toThrow('Image size metadata is invalid.');
  });

  it('rejects data appended after the PNG end marker', () => {
    const buffer = Buffer.concat([png(512, 512), Buffer.from('hidden-data')]);

    expect(() =>
      validateBrandingImage(
        {
          originalname: 'logo.png',
          mimetype: 'image/png',
          size: buffer.length,
          buffer,
        },
        FileAssetPurpose.EVENT_LOGO,
      ),
    ).toThrow('Only valid PNG and JPEG images are supported.');
  });
});
