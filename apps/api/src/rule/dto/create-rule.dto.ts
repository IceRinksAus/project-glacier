import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateRuleDto {
  @IsString()
  eventId: string;

  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  ruleType: string;

  @IsOptional()
  @IsString()
  scope?: string = 'BOOKING';

  @IsOptional()
  @IsString()
  status?: string = 'ACTIVE';

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number = 0;

  @IsObject()
  conditions: Record<string, unknown>;

  @IsObject()
  actions: Record<string, unknown>;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsBoolean()
  stopProcessing?: boolean = false;
}