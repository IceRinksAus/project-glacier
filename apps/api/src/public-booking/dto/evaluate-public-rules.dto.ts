import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class EvaluatePublicRulesParticipantDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Matches(/\S/)
  firstName: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  lastName?: string;

  @IsInt()
  @Min(0)
  @Max(130)
  age: number;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  ticketTypeId: string;
}

export class EvaluatePublicRulesDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  sessionId: string;

  @IsOptional()
  @IsBoolean()
  flexibleBooking?: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => EvaluatePublicRulesParticipantDto)
  participants: EvaluatePublicRulesParticipantDto[];
}
