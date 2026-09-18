import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class PortfolioReportQueryDto {
  @IsIn(['ALL', 'GROUP', 'EVENT'])
  scope: 'ALL' | 'GROUP' | 'EVENT' = 'ALL';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  scopeId?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;
}
