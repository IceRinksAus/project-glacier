import { IsString, Matches } from 'class-validator';

export class CreatePublicPaymentDto {
  @IsString()
  @Matches(/^[a-f0-9]{64}$/)
  publicAccessToken: string;
}
