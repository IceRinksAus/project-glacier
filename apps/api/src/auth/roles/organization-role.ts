export const ORGANIZATION_ROLES = ['OWNER', 'MEMBER', 'SCANNER'] as const;

export type OrganizationRole = (typeof ORGANIZATION_ROLES)[number];

export const OPERATOR_ROLES = [
  'OWNER',
  'MEMBER',
] as const satisfies readonly OrganizationRole[];

export const SCANNER_ROLES = [
  'OWNER',
  'MEMBER',
  'SCANNER',
] as const satisfies readonly OrganizationRole[];
