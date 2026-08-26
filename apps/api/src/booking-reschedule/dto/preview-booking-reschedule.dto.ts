import { BookingRescheduleReason } from '@prisma/client';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

export class PreviewBookingRescheduleDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  destinationSessionId: string;

  @IsEnum(BookingRescheduleReason)
  reason: BookingRescheduleReason;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  note: string;
}
