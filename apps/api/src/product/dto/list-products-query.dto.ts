import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ListProductsQueryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  eventId?: string;
}
