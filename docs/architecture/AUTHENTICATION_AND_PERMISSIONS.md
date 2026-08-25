# Authentication and Permissions

## Login

`POST /auth/login` normalises email, verifies a bcrypt password hash, checks active status, loads Organisation membership and issues an eight-hour JWT.

The request passes through Glacier's global strict validation boundary. Email is a valid, bounded address and password is a non-empty bounded string; unknown fields are rejected before authentication work. Successful responses and JWT claims do not contain passwords or password hashes.

## JWT claims and current authority

- `sub`
- `email`
- `role`
- `organizationId`

JWT claims identify the requested membership context, but they are not the final authority for a protected request. The JWT strategy reloads the current User and `UserOrganization` membership, rejects inactive or removed access, and replaces the request role/scope with the current persisted values. Role demotion and Event-assignment removal therefore do not wait for an eight-hour token to expire.

## Guards

- `JwtAuthGuard` authenticates.
- `RolesGuard` enforces `@Roles(...)`.
- `@CurrentUser()` exposes request user context.

## Roles and Event scope

- OWNER: Organisation governance and explicitly authorised configuration mutations; always `ALL_EVENTS`.
- MANAGER: trusted operational reads within `ALL_EVENTS` or `ASSIGNED_EVENTS`; sensitive configuration and financial mutations remain denied until promoted deliberately by capability.
- STAFF: day-to-day operational reads and scanner workflows within `ALL_EVENTS` or `ASSIGNED_EVENTS`; no Organisation governance authority.
- SCANNER: dedicated Ticket lookup/admission only and always `ASSIGNED_EVENTS`.

`MEMBER` is no longer an active role. The Sprint 24 migration converts legacy MEMBER memberships to STAFF with `ALL_EVENTS`, retaining previous read visibility without granting Manager authority.

Role answers what a person may do. `UserOrganization.accessScope` plus `UserEventAccess` answers where they may do it. An empty `ASSIGNED_EVENTS` list means no Event access. OWNER bypasses assignment only inside the authenticated Organisation. SCANNER is intentionally denied ordinary Event administration, Booking, Customer, reporting, catalogue, Ticket detail and QR-generation routes unless a controller explicitly opts into scanner operation.

One reusable Event-access resolver is used for list and direct-object reads. Navigation filtering is convenience only; every direct service boundary remains authoritative.

## Team access governance

Only OWNER may list or mutate Team access. Ordinary Team management may assign MANAGER, STAFF or SCANNER; it cannot grant OWNER authority. Event IDs are validated against the authenticated Organisation before assignment replacement.

The final OWNER cannot be demoted. The check and update run in a serializable database transaction to prevent concurrent changes racing the Organisation to zero owners. Successful membership and access changes create append-only `OrganizationAccessAudit` evidence containing actor, target, Organisation, action and bounded before/after role, scope and Event identifiers. Passwords, tokens and unrelated personal data are never stored in this audit.

See `docs/operations/TEAM_ACCESS.md` for the operating procedure.

## Tenant authority

Operator Organisation context comes from the validated JWT, never a request body or caller-controlled Organisation identifier. Services scope owned resources through their authoritative relationships, for example Ticket → Booking → Event → Organisation.

Cross-tenant identifiers receive a privacy-safe not-found or forbidden response and must not reveal another Organisation's records.

## Public and external boundaries

- Customer Booking and Waiver routes use dedicated `/public/...` APIs with strict DTOs and minimised responses.
- Public Ticket presentation relies on a high-entropy possession token and returns presentation-only data.
- Dedicated Staff Scanner validation and admission require JWT authentication, an explicit scanner-capable role and current Event scope.
- Stripe webhooks use Stripe signature verification and raw request-body access rather than Glacier JWT authentication.

## Abuse controls

Production login limiting is a deployment-edge requirement. Glacier deliberately does not use a per-process in-memory counter because it would reset on deployment and would not coordinate across instances. The pilot gate and required evidence are recorded in `docs/security/AUTHENTICATION_ABUSE_CONTROLS.md`.

## Known future improvement

The login service currently selects the first organisation membership. A formal active-organisation selection flow is required for users in multiple organisations.

Production readiness also requires password reset/recovery, MFA for privileged roles, monitoring and the verified edge login limit. Controlled ownership transfer and recovery remain separate from ordinary Team management.
