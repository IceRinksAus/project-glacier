import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateTicketTypePresentationDto {
  @IsOptional()
  @IsString()
  @MaxLength(24)
  tileLabel?: string;

  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  tileColor: string;
}
