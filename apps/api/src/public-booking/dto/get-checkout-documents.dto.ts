import { IsString, Matches } from 'class-validator';

export class GetCheckoutDocumentsDto {
  @IsString()
  @Matches(/^[a-f0-9]{64}$/)
  publicAccessToken!: string;
}
