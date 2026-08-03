# Authentication and Permissions

## Login
`POST /auth/login` normalises email, verifies bcrypt password hash, checks active status, loads organisation membership and issues a JWT.

## Current JWT claims
- `sub`
- `email`
- `role`
- `organizationId`

## Guards
- `JwtAuthGuard` authenticates.
- `RolesGuard` enforces `@Roles(...)`.
- `@CurrentUser()` exposes request user context.

## Roles verified
- OWNER: read and write
- MEMBER: read-only for protected catalogue and event-management endpoints

## Known future improvement
The login service currently selects the first organisation membership. A formal active-organisation selection flow is required for users in multiple organisations.
