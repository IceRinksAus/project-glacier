import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @MaxLength(320)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password: string;

  @IsIn(['OWNER', 'MEMBER'])
  role: 'OWNER' | 'MEMBER';
}
