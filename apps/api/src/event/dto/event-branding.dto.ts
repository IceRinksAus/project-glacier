import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

import { EVENT_BRANDING_FONTS } from '../event-branding.constants';

const normalizeHexColor = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.toUpperCase() : value;

export class EventBrandingDto {
  @Transform(normalizeHexColor)
  @Matches(/^#[0-9A-F]{6}$/)
  primaryColor: string;

  @Transform(normalizeHexColor)
  @Matches(/^#[0-9A-F]{6}$/)
  secondaryColor: string;

  @Transform(normalizeHexColor)
  @Matches(/^#[0-9A-F]{6}$/)
  accentColor: string;

  @Transform(normalizeHexColor)
  @Matches(/^#[0-9A-F]{6}$/)
  backgroundColor: string;

  @Transform(normalizeHexColor)
  @Matches(/^#[0-9A-F]{6}$/)
  surfaceColor: string;

  @Transform(normalizeHexColor)
  @Matches(/^#[0-9A-F]{6}$/)
  textColor: string;

  @IsString()
  @IsIn(EVENT_BRANDING_FONTS)
  headingFont: string;

  @IsString()
  @IsIn(EVENT_BRANDING_FONTS)
  bodyFont: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  heroHeadline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  heroDescription?: string;
}
