import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

import { PreviewTicketAdjustmentDto } from './preview-ticket-adjustment.dto';

export class ExecuteTicketAdjustmentDto extends PreviewTicketAdjustmentDto {
  @IsString()
  @MaxLength(64)
  previewHash: string;

  @IsString()
  @MaxLength(200)
  idempotencyKey: string;

  @IsOptional()
  @IsBoolean()
  manualRefundConfirmed?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  standaloneReference?: string;
}
