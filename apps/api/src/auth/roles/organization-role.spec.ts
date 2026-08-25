import { validate } from 'class-validator';

import { AddOrganizationUserDto } from '../../organization/dto/add-organization-user.dto';
import { CreateUserDto } from '../../user/dto/create-user.dto';
import {
  OPERATOR_ROLES,
  MANAGEMENT_ROLES,
  ORGANIZATION_ROLES,
  SCANNER_ROLES,
  defaultAccessScopeForRole,
} from './organization-role';

describe('organization role policy', () => {
  it('keeps SCANNER outside ordinary operator roles', () => {
    expect(ORGANIZATION_ROLES).toEqual([
      'OWNER',
      'MANAGER',
      'STAFF',
      'SCANNER',
    ]);
    expect(OPERATOR_ROLES).toEqual(['OWNER', 'MANAGER', 'STAFF']);
    expect(MANAGEMENT_ROLES).toEqual(['OWNER', 'MANAGER']);
    expect(SCANNER_ROLES).toEqual(['OWNER', 'MANAGER', 'STAFF', 'SCANNER']);
  });

  it('does not accept the migrated legacy MEMBER role', async () => {
    const dto = Object.assign(new AddOrganizationUserDto(), {
      userId: 'user-1',
      role: 'MEMBER',
    });

    await expect(validate(dto)).resolves.toHaveLength(1);
  });

  it('defaults dedicated scanner accounts to assigned Event scope', () => {
    expect(defaultAccessScopeForRole('SCANNER')).toBe('ASSIGNED_EVENTS');
    expect(defaultAccessScopeForRole('STAFF')).toBe('ALL_EVENTS');
    expect(defaultAccessScopeForRole('MANAGER')).toBe('ALL_EVENTS');
    expect(defaultAccessScopeForRole('OWNER')).toBe('ALL_EVENTS');
  });

  it('allows creation of a narrowly scoped SCANNER user', async () => {
    const dto = Object.assign(new CreateUserDto(), {
      email: 'scanner@example.com',
      name: 'Gate Scanner',
      password: 'secure-password',
      role: 'SCANNER',
    });

    await expect(validate(dto)).resolves.toEqual([]);
  });

  it('allows an existing user to receive SCANNER membership', async () => {
    const dto = Object.assign(new AddOrganizationUserDto(), {
      userId: 'user-1',
      role: 'SCANNER',
    });

    await expect(validate(dto)).resolves.toEqual([]);
  });

  it('rejects unknown organization roles', async () => {
    const dto = Object.assign(new AddOrganizationUserDto(), {
      userId: 'user-1',
      role: 'ADMIN',
    });

    await expect(validate(dto)).resolves.toHaveLength(1);
  });
});
