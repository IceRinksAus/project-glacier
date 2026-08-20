import { validate } from 'class-validator';

import { AddOrganizationUserDto } from '../../organization/dto/add-organization-user.dto';
import { CreateUserDto } from '../../user/dto/create-user.dto';
import {
  OPERATOR_ROLES,
  ORGANIZATION_ROLES,
  SCANNER_ROLES,
} from './organization-role';

describe('organization role policy', () => {
  it('keeps SCANNER outside ordinary operator roles', () => {
    expect(ORGANIZATION_ROLES).toEqual(['OWNER', 'MEMBER', 'SCANNER']);
    expect(OPERATOR_ROLES).toEqual(['OWNER', 'MEMBER']);
    expect(SCANNER_ROLES).toEqual(['OWNER', 'MEMBER', 'SCANNER']);
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
