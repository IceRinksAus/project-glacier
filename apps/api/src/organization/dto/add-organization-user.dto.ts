import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

import { ORGANIZATION_ROLES } from '../../auth/roles/organization-role';
import type { OrganizationRole } from '../../auth/roles/organization-role';

export class AddOrganizationUserDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  userId: string;

  @IsIn(ORGANIZATION_ROLES)
  role: OrganizationRole;
}
