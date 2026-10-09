import { IsString, Matches } from 'class-validator';

export class ProductCollectionPassReferenceDto {
  @IsString()
  @Matches(/^(?:PRD-[A-Z0-9-]{3,80}|gp1_[a-f0-9]{32}_[A-Za-z0-9_-]{43})$/i)
  reference: string;
}
