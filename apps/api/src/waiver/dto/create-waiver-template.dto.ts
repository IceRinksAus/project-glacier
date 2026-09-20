import { AustralianJurisdiction, EventActivityType } from '@prisma/client';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateWaiverTemplateDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  name: string;

  @IsEnum(EventActivityType)
  activityType: EventActivityType;

  @IsEnum(AustralianJurisdiction)
  jurisdiction: AustralianJurisdiction;

  @IsString()
  @MinLength(20)
  @MaxLength(100000)
  contentTemplate: string;

  @IsString()
  @MinLength(5)
  @MaxLength(10000)
  acceptanceStatement: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  legislationReferences?: string[];
}
