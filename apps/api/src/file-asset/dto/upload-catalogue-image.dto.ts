import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadCatalogueImageDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  displayName?: string;
}
