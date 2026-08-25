import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

import { TEAM_ASSIGNABLE_ROLES } from '../../auth/roles/organization-role';
import type { TeamAssignableRole } from '../../auth/roles/organization-role';

export class AddOrganizationUserDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  userId: string;

  @IsIn(TEAM_ASSIGNABLE_ROLES)
  role: TeamAssignableRole;
}
