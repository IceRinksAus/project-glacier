import { FlexibleTicketDecisionReason } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';

export const FLEXIBLE_TICKET_DECISIONS = ['APPROVE', 'DECLINE'] as const;
export type FlexibleTicketDecision = (typeof FLEXIBLE_TICKET_DECISIONS)[number];

export class PreviewFlexibleTicketDecisionDto {
  @IsIn(FLEXIBLE_TICKET_DECISIONS)
  decision: FlexibleTicketDecision;

  @IsEnum(FlexibleTicketDecisionReason)
  reason: FlexibleTicketDecisionReason;

  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  note: string;
}

export class ExecuteFlexibleTicketDecisionDto extends PreviewFlexibleTicketDecisionDto {
  @IsString()
  @Length(64, 64)
  previewHash: string;

  @IsOptional()
  @IsBoolean()
  manualRefundConfirmed?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  standaloneReference?: string;
}
