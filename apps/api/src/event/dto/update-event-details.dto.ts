import { AustralianJurisdiction, EventActivityType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

import { AUSTRALIAN_EVENT_TIMEZONES } from '../event.constants';

export class UpdateEventDetailsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

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

  @IsEnum(AustralianJurisdiction)
  jurisdiction: AustralianJurisdiction;

  @IsEnum(EventActivityType)
  activityType: EventActivityType;
}
