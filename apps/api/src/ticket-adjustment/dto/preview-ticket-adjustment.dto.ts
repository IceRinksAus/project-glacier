import { TicketAdjustmentAction, TicketAdjustmentReason } from '@prisma/client';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class PreviewTicketAdjustmentDto {
  @IsEnum(TicketAdjustmentAction)
  action: TicketAdjustmentAction;

  @IsEnum(TicketAdjustmentReason)
  reason: TicketAdjustmentReason;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  note: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsString({ each: true })
  ticketIds: string[];
}
