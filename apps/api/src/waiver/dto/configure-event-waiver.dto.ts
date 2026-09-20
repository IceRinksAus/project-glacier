import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ConfigureEventWaiverDto {
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  promoter: string;

  @IsString()
  @MinLength(1)
  @MaxLength(300)
  eventLocation: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  siteAddress: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  eventStartDate: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  eventEndDate: string;

  @IsString()
  @MaxLength(2000)
  additionalInformation: string;
}
