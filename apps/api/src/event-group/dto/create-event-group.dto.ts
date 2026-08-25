import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export const eventGroupTypes = [
  'SEASON',
  'TOUR',
  'PROMOTER',
  'CAMPAIGN',
  'CUSTOM',
] as const;

export class CreateEventGroupDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsIn(eventGroupTypes)
  type: (typeof eventGroupTypes)[number];
}
