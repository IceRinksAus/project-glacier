import { IsString, Length, MaxLength, MinLength } from 'class-validator';

import { PreviewBookingRescheduleDto } from './preview-booking-reschedule.dto';

export class ExecuteBookingRescheduleDto extends PreviewBookingRescheduleDto {
  @IsString()
  @Length(64, 64)
  previewHash: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  idempotencyKey: string;
}
