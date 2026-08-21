import { FileAssetPurpose } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadBrandingAssetDto {
  @IsEnum(FileAssetPurpose)
  purpose: FileAssetPurpose;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  displayName?: string;
}
