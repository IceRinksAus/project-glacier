import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../decorators/roles.decorator';
import type { OrganizationRole } from './organization-role';

interface AuthenticatedRequest {
  user?: {
    role?: OrganizationRole;
  };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user?.role) return false;

    // Older operator read routes predate explicit role metadata. They remain
    // available to OWNER/MANAGER/STAFF, but SCANNER requires an explicit opt-in.
    if (!requiredRoles) return user.role !== 'SCANNER';

    return requiredRoles.includes(user.role);
  }
}
