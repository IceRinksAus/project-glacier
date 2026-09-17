import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateTicketTypeAgePolicyDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(130)
  minimumAge?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(130)
  maximumAge?: number | null;
}
