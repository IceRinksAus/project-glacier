import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import {
  ORGANIZATION_ACCESS_SCOPES,
  TEAM_ASSIGNABLE_ROLES,
} from '../../auth/roles/organization-role';
import type {
  OrganizationAccessScope,
  TeamAssignableRole,
} from '../../auth/roles/organization-role';

export class UpdateTeamAccessDto {
  @IsOptional()
  @IsIn(TEAM_ASSIGNABLE_ROLES)
  role?: TeamAssignableRole;

  @IsOptional()
  @IsIn(ORGANIZATION_ACCESS_SCOPES)
  accessScope?: OrganizationAccessScope;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(250)
  @ArrayUnique()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(100, { each: true })
  eventIds?: string[];
}
