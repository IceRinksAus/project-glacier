import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { ORGANIZATION_ROLES } from '../../auth/roles/organization-role';
import type { OrganizationRole } from '../../auth/roles/organization-role';

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

  @IsIn(ORGANIZATION_ROLES)
  role: OrganizationRole;
}
