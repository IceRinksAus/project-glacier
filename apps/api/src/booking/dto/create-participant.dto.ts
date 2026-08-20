import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateParticipantDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Matches(/\S/)
  firstName: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  lastName?: string;

  @IsInt()
  @Min(0)
  @Max(130)
  age: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  ticketTypeId: string;
}
