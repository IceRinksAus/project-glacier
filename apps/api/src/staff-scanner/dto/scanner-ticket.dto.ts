import { TicketScanMode } from '@prisma/client';
import { IsEnum, IsString, Matches } from 'class-validator';

export class ScannerTicketDto {
  @IsString()
  @Matches(/^[a-f0-9]{64}$/)
  token: string;

  @IsEnum(TicketScanMode)
  mode: TicketScanMode;
}
