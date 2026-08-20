import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class UpdateEntryPolicyDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(240)
  entryOpensMinutesBeforeStart: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(240)
  entryClosesMinutesAfterEnd: number;
}
