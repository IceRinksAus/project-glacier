import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { eventGroupTypes } from './create-event-group.dto';

export class UpdateEventGroupDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn(eventGroupTypes)
  type?: (typeof eventGroupTypes)[number];

  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE', 'ARCHIVED'])
  status?: 'ACTIVE' | 'ARCHIVED';
}
