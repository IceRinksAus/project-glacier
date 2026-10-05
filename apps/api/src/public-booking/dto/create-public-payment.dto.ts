import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';

export class CreatePublicPaymentDto {
  @IsString()
  @Matches(/^[a-f0-9]{64}$/)
  publicAccessToken: string;

  @IsBoolean()
  termsAccepted!: boolean;

  @IsString()
  termsDocumentId!: string;

  @IsString()
  privacyDocumentId!: string;

  @IsOptional()
  @IsString()
  marketingDisclosureDocumentId?: string;

  @IsOptional()
  @IsBoolean()
  marketingAccepted?: boolean;
}
