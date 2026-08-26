import { FlexibleTicketEventMode } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateFlexibleTicketEventModeDto {
  @IsEnum(FlexibleTicketEventMode)
  mode: FlexibleTicketEventMode;
}
