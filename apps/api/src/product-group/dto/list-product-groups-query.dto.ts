import { IsString, MaxLength, MinLength } from 'class-validator';

export class ListProductGroupsQueryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  eventId: string;
}
