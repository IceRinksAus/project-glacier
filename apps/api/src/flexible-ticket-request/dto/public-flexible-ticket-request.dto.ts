import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  FlexibleTicketRequestReason,
  FlexibleTicketRequestType,
} from '@prisma/client';

export class PublicFlexibleTicketAccessDto {
  @IsString()
  @Matches(/^[a-f0-9]{64}$/)
  publicAccessToken: string;
}

export class CreatePublicFlexibleTicketRequestDto extends PublicFlexibleTicketAccessDto {
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{16,128}$/)
  idempotencyKey: string;

  @IsEnum(FlexibleTicketRequestType)
  type: FlexibleTicketRequestType;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  entitlementIds: string[];

  @IsOptional()
  @IsString()
  destinationSessionId?: string;

  @IsEnum(FlexibleTicketRequestReason)
  customerReason: FlexibleTicketRequestReason;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  customerNote?: string;
}
