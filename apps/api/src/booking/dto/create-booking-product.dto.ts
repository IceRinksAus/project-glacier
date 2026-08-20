import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBookingProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  productId: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  productVariantId?: string;

  @IsInt()
  @Min(1)
  quantity: number;
}
