import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() };
  const guard = new RolesGuard(reflector as unknown as Reflector);

  function context(role?: string) {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => jest.clearAllMocks());

  it('allows OWNER, MANAGER and STAFF on legacy operator reads', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(context('OWNER'))).toBe(true);
    expect(guard.canActivate(context('MANAGER'))).toBe(true);
    expect(guard.canActivate(context('STAFF'))).toBe(true);
  });

  it('denies SCANNER unless the route explicitly opts in', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(context('SCANNER'))).toBe(false);
  });

  it('allows SCANNER on the explicit scanner role policy', () => {
    reflector.getAllAndOverride.mockReturnValue([
      'OWNER',
      'MANAGER',
      'STAFF',
      'SCANNER',
    ]);
    expect(guard.canActivate(context('SCANNER'))).toBe(true);
  });

  it('denies missing users and roles outside the declared policy', () => {
    reflector.getAllAndOverride.mockReturnValue(['OWNER']);
    expect(guard.canActivate(context())).toBe(false);
    expect(guard.canActivate(context('STAFF'))).toBe(false);
  });
});
