# Authentication and Permissions

## Login

`POST /auth/login` normalises email, verifies a bcrypt password hash, checks active status, loads Organisation membership and issues an eight-hour JWT.

The request passes through Glacier's global strict validation boundary. Email is a valid, bounded address and password is a non-empty bounded string; unknown fields are rejected before authentication work. Successful responses and JWT claims do not contain passwords or password hashes.

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
- MEMBER: read-only for protected catalogue and event-management endpoints, plus Ticket validation and scan
- SCANNER: dedicated active-Event scanner context, read-only Ticket lookup and admission only

SCANNER is intentionally denied ordinary Event administration, Booking, Customer, catalogue, Ticket detail and QR-generation routes unless a controller explicitly opts into that role. OWNER and MEMBER retain scanner capability during the transition. Event-specific staff assignment remains future work.

## Tenant authority

Operator Organisation context comes from the validated JWT, never a request body or caller-controlled Organisation identifier. Services scope owned resources through their authoritative relationships, for example Ticket → Booking → Event → Organisation.

Cross-tenant identifiers receive a privacy-safe not-found or forbidden response and must not reveal another Organisation's records.

## Public and external boundaries

- Customer Booking and Waiver routes use dedicated `/public/...` APIs with strict DTOs and minimised responses.
- Public Ticket presentation relies on a high-entropy possession token and returns presentation-only data.
- Dedicated Staff Scanner validation and admission require JWT authentication and explicit OWNER, MEMBER or SCANNER authority.
- Stripe webhooks use Stripe signature verification and raw request-body access rather than Glacier JWT authentication.

## Abuse controls

Production login limiting is a deployment-edge requirement. Glacier deliberately does not use a per-process in-memory counter because it would reset on deployment and would not coordinate across instances. The pilot gate and required evidence are recorded in `docs/security/AUTHENTICATION_ABUSE_CONTROLS.md`.

## Known future improvement

The login service currently selects the first organisation membership. A formal active-organisation selection flow is required for users in multiple organisations.

Production readiness also requires password reset/recovery, revocation where required, MFA for privileged roles, monitoring and the verified edge login limit.
