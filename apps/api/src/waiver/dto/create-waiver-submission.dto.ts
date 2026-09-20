import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  Equals,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateWaiverMinorDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Matches(/\S/)
  fullName: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateOfBirth: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  bookingParticipantId?: string;
}

export class CreateWaiverSubmissionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Matches(/\S/)
  signatoryFullName: string;

  @Equals(true)
  accepted: true;

  @IsString()
  @MinLength(1)
  @MaxLength(200_000)
  @Matches(/\S/)
  signatureData: string;

  @IsBoolean()
  signatoryParticipating: boolean;

  @IsOptional()
  @IsBoolean()
  mediaConsent?: boolean;

  @IsOptional()
  @IsBoolean()
  marketingConsent?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  bookingId?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-f0-9]{64}$/)
  publicAccessToken?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  signatoryParticipantId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CreateWaiverMinorDto)
  minors?: CreateWaiverMinorDto[];
}

export class WaiverBookingContextDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  bookingId: string;

  @IsString()
  @Matches(/^[a-f0-9]{64}$/)
  publicAccessToken: string;
}
