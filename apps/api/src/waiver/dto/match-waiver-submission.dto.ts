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

class WaiverMinorMatchDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  minorId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  bookingParticipantId: string;
}

export class MatchWaiverSubmissionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  bookingId: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  signatoryParticipantId?: string;

  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => WaiverMinorMatchDto)
  minorMatches: WaiverMinorMatchDto[];
}
