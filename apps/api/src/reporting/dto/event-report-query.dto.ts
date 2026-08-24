import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class EventReportQueryDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  sessionId?: string;
}
