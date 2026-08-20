import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  Equals,
  IsArray,
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

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CreateWaiverMinorDto)
  minors?: CreateWaiverMinorDto[];
}
