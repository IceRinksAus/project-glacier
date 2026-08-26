import {
  FlexibleTicketFeeRefundability,
  FlexibleTicketFeeType,
  FlexibleTicketPriceDecreaseTreatment,
  FlexibleTicketPriceIncreaseTreatment,
} from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateFlexibleTicketPolicyDto {
  @IsBoolean()
  available: boolean;

  @IsEnum(FlexibleTicketFeeType)
  feeType: FlexibleTicketFeeType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(100000)
  feeValue: number;

  @IsBoolean()
  allowsSessionChange: boolean;

  @IsBoolean()
  allowsRefundRequest: boolean;

  @IsInt()
  @Min(0)
  @Max(525600)
  cutoffMinutesBeforeSession: number;

  @IsInt()
  @Min(1)
  @Max(100)
  permittedUseLimit: number;

  @IsEnum(FlexibleTicketPriceIncreaseTreatment)
  priceIncreaseTreatment: FlexibleTicketPriceIncreaseTreatment;

  @IsEnum(FlexibleTicketPriceDecreaseTreatment)
  priceDecreaseTreatment: FlexibleTicketPriceDecreaseTreatment;

  @IsEnum(FlexibleTicketFeeRefundability)
  feeRefundability: FlexibleTicketFeeRefundability;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  customerSummary: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  materialTerms: string;
}
