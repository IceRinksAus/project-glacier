import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateSessionProductDto {
  @IsString()
  sessionId: string;

  @IsString()
  productId: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean = true;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priceOverride?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  capacityOverride?: number;

  @IsOptional()
  @IsInt()
  sortOrder?: number = 0;
}
