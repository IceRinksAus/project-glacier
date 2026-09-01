import { BadRequestException } from '@nestjs/common';
import { FileAssetPurpose } from '@prisma/client';

import { BrandingImageUpload } from './file-asset.types';

const limits = {
  EVENT_LOGO: {
    maxBytes: 2 * 1024 * 1024,
    minWidth: 64,
    minHeight: 64,
    maxDimension: 4000,
  },
  EVENT_HERO: {
    maxBytes: 5 * 1024 * 1024,
    minWidth: 600,
    minHeight: 300,
    maxDimension: 6000,
  },
};

function pngDimensions(buffer: Buffer) {
  if (
    buffer.length < 24 ||
    !buffer
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
    buffer.readUInt32BE(8) !== 13 ||
    buffer.subarray(12, 16).toString('ascii') !== 'IHDR'
  ) return null;

  let offset = 8;
  let dimensions: { width: number; height: number } | null = null;
  let hasImageData = false;
  let hasEnd = false;

  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii');
    const nextOffset = offset + 12 + length;
    if (nextOffset > buffer.length) return null;

    if (offset === 8 && (type !== 'IHDR' || length !== 13)) return null;
    if (type === 'IHDR') {
      if (dimensions) return null;
      dimensions = {
        width: buffer.readUInt32BE(offset + 8),
        height: buffer.readUInt32BE(offset + 12),
      };
    } else if (type === 'IDAT') {
      hasImageData = true;
    } else if (type === 'IEND') {
      if (length !== 0 || nextOffset !== buffer.length) return null;
      hasEnd = true;
    }

    offset = nextOffset;
    if (hasEnd) break;
  }

  return dimensions && hasImageData && hasEnd ? dimensions : null;
}

function jpegDimensions(buffer: Buffer) {
  if (
    buffer.length < 4 ||
    buffer[0] !== 0xff ||
    buffer[1] !== 0xd8 ||
    buffer[buffer.length - 2] !== 0xff ||
    buffer[buffer.length - 1] !== 0xd9
  )
    return null;
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }
    const length = buffer.readUInt16BE(offset + 2);
    if (length < 2 || offset + length + 2 > buffer.length) return null;
    if (
      [
        0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce,
        0xcf,
      ].includes(marker)
    ) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    offset += length + 2;
  }
  return null;
}

export function validateBrandingImage(
  file: BrandingImageUpload | undefined,
  purpose: FileAssetPurpose,
) {
  if (!file?.buffer?.length)
    throw new BadRequestException('Choose an image to upload.');
  const limit = limits[purpose];
  if (!limit) {
    throw new BadRequestException('Unsupported branding image purpose.');
  }
  if (file.size !== file.buffer.length) {
    throw new BadRequestException('Image size metadata is invalid.');
  }
  if (file.buffer.length > limit.maxBytes) {
    throw new BadRequestException(
      `Image exceeds the ${limit.maxBytes / 1024 / 1024} MB limit.`,
    );
  }
  const png = pngDimensions(file.buffer);
  const jpeg = png ? null : jpegDimensions(file.buffer);
  const dimensions = png ?? jpeg;
  const detectedMime = png ? 'image/png' : jpeg ? 'image/jpeg' : null;
  if (!dimensions || !detectedMime) {
    throw new BadRequestException(
      'Only valid PNG and JPEG images are supported.',
    );
  }
  if (file.mimetype !== detectedMime) {
    throw new BadRequestException(
      'The image content does not match its declared file type.',
    );
  }
  if (
    dimensions.width < limit.minWidth ||
    dimensions.height < limit.minHeight ||
    dimensions.width > limit.maxDimension ||
    dimensions.height > limit.maxDimension
  ) {
    throw new BadRequestException(
      `${purpose === 'EVENT_LOGO' ? 'Logo' : 'Hero'} dimensions must be between ${limit.minWidth} × ${limit.minHeight} and ${limit.maxDimension} × ${limit.maxDimension} pixels.`,
    );
  }
  return { mimeType: detectedMime, ...dimensions };
}
