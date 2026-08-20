import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateTicketTypeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Matches(/\S/)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsInt()
  @Min(0)
  capacity: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsDateString()
  saleStart?: string;

  @IsOptional()
  @IsDateString()
  saleEnd?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  eventId: string;
}
