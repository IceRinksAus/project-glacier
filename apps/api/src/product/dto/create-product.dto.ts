import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  eventId: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  productType?: string = 'ADMISSION';

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  gstRate?: number = 10;

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
  @IsBoolean()
  inventoryTracked?: boolean = false;

  @IsOptional()
  @IsInt()
  @Min(0)
  inventoryQuantity?: number;

  @IsOptional()
  @IsBoolean()
  capacityControlled?: boolean = false;

  @IsOptional()
  @IsInt()
  @Min(0)
  capacity?: number;

  @IsOptional()
  @IsBoolean()
  requiresSession?: boolean = false;

  @IsOptional()
  @IsBoolean()
  availableOnline?: boolean = true;

  @IsOptional()
  @IsBoolean()
  availablePos?: boolean = true;

  @IsOptional()
  @IsInt()
  @Min(0)
  minQuantity?: number = 0;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxQuantity?: number;

  @IsOptional()
  @IsInt()
  sortOrder?: number = 0;
}
