import { TicketScanMode } from '@prisma/client';
import { IsEnum, IsString, Matches } from 'class-validator';

export class ScannerTicketDto {
  @IsString()
  @Matches(/^(?:[a-f0-9]{64}|gt1_[a-f0-9]{32}_[A-Za-z0-9_-]{43})$/)
  token: string;

  @IsEnum(TicketScanMode)
  mode: TicketScanMode;
}
