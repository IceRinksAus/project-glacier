import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProductOrderGroupDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  groupId?: string | null;

  @IsArray()
  @ArrayMaxSize(500)
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  productIds: string[];
}

export class ReorderProductsDto {
  @IsString()
  @MaxLength(120)
  eventId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(101)
  @ValidateNested({ each: true })
  @Type(() => ProductOrderGroupDto)
  groups: ProductOrderGroupDto[];
}
