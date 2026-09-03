import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class MfaSecurityActionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;

  @IsString()
  @MaxLength(64)
  code!: string;
}

export class MfaResetDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  reason!: string;
}

export class MfaRotationConfirmDto {
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{43}$/)
  challengeToken!: string;

  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;
}
