import { IsString, Matches, MaxLength } from 'class-validator';

export class MfaChallengeDto {
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{43}$/)
  challengeToken!: string;

  @IsString()
  @MaxLength(64)
  code!: string;
}
