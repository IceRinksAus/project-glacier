import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { AustralianJurisdiction, EventActivityType } from '@prisma/client';

import { AUSTRALIAN_EVENT_TIMEZONES } from '../event.constants';
import { EventBrandingDto } from './event-branding.dto';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(200)
  slug: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  description?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  @IsIn(AUSTRALIAN_EVENT_TIMEZONES)
  timezone: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  venueName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  addressLine1: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  addressLine2?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  suburb: string;

  @IsString()
  @Matches(/^\d{4}$/)
  postcode: string;

  @IsString()
  @IsIn(['AU'])
  country: string;

  @IsEnum(AustralianJurisdiction)
  jurisdiction: AustralianJurisdiction;

  @IsEnum(EventActivityType)
  activityType: EventActivityType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(240)
  entryOpensMinutesBeforeStart?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(240)
  entryClosesMinutesAfterEnd?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => EventBrandingDto)
  branding?: EventBrandingDto;
}
