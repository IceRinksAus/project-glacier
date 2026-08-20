import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export class AddOrganizationUserDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  userId: string;

  @IsIn(['OWNER', 'MEMBER'])
  role: 'OWNER' | 'MEMBER';
}
