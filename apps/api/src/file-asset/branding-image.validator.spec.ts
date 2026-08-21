import { BadRequestException } from '@nestjs/common';
import { FileAssetPurpose } from '@prisma/client';

import { validateBrandingImage } from './branding-image.validator';

function png(width: number, height: number) {
  const buffer = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(buffer);
  buffer.writeUInt32BE(13, 8);
  buffer.write('IHDR', 12, 'ascii');
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  return buffer;
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
});
