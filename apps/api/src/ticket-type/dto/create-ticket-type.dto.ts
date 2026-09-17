import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Max,
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

  /**
   * Legacy compatibility field. Session capacity is the authoritative shared
   * admission limit; Ticket Type capacity is not enforced by Booking.
   */
  @IsOptional()
  @IsInt()
  @Min(0)
  capacity?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(24)
  @Matches(/\S/)
  tileLabel?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  tileColor?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(130)
  minimumAge?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(130)
  maximumAge?: number;

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
