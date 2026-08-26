import { IsOptional, IsString, MaxLength } from 'class-validator';

export class PosCatalogueQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sessionId?: string;
}
