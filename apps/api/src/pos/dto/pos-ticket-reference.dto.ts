import { TicketScanMode } from '@prisma/client';
import { IsEnum, IsString, Matches } from 'class-validator';

export class PosTicketReferenceDto {
  @IsString()
  @Matches(
    /^(?:PG-[A-Z0-9-]{1,80}|TKT-[A-Z0-9-]{3,80}|[a-f0-9]{64}|gt1_[a-f0-9]{32}_[A-Za-z0-9_-]{43})$/i,
  )
  token: string;

  @IsEnum(TicketScanMode)
  mode: TicketScanMode;
}
