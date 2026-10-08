import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class EventSiteHighlightDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(300)
  description!: string;
}

export class EventSiteFaqDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  question!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(800)
  answer!: string;
}

export class EventSiteContentDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  aboutTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  aboutBody?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  arrivalInfo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  transportParkingInfo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  accessibilityInfo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  foodDrinkInfo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  whatToBringInfo?: string;

  @IsArray()
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => EventSiteHighlightDto)
  highlights!: EventSiteHighlightDto[];

  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => EventSiteFaqDto)
  faqs!: EventSiteFaqDto[];
}
