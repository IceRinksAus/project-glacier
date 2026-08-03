import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class CreateProductVariantDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  productId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priceOverride?: number;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  status?: string = 'ACTIVE';

  @IsOptional()
  @IsBoolean()
  inventoryTracked?: boolean = false;

  @IsOptional()
  @IsInt()
  @Min(0)
  inventoryQuantity?: number;

  @IsOptional()
  @IsBoolean()
  availableOnline?: boolean = true;

  @IsOptional()
  @IsBoolean()
  availablePos?: boolean = true;

  @IsOptional()
  @IsInt()
  sortOrder?: number = 0;
}