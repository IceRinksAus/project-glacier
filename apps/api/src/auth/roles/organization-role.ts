export const ORGANIZATION_ROLES = [
  'OWNER',
  'MANAGER',
  'STAFF',
  'SCANNER',
] as const;

export type OrganizationRole = (typeof ORGANIZATION_ROLES)[number];

export const OPERATOR_ROLES = [
  'OWNER',
  'MANAGER',
  'STAFF',
] as const satisfies readonly OrganizationRole[];

export const MANAGEMENT_ROLES = [
  'OWNER',
  'MANAGER',
] as const satisfies readonly OrganizationRole[];

export const SCANNER_ROLES = [
  'OWNER',
  'MANAGER',
  'STAFF',
  'SCANNER',
] as const satisfies readonly OrganizationRole[];

export const ORGANIZATION_ACCESS_SCOPES = [
  'ALL_EVENTS',
  'ASSIGNED_EVENTS',
] as const;

export type OrganizationAccessScope =
  (typeof ORGANIZATION_ACCESS_SCOPES)[number];

export function defaultAccessScopeForRole(
  role: OrganizationRole,
): OrganizationAccessScope {
  return role === 'SCANNER' ? 'ASSIGNED_EVENTS' : 'ALL_EVENTS';
}
