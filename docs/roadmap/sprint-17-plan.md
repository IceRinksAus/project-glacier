# Sprint 17 Plan — API Boundary & Security Hardening

## Planning Status

Approved on 20 August 2026.

The user has delegated the detailed technical-security decisions in this Sprint to the implementation process, subject to this locked scope, evidence-based testing and explicit documentation of residual risk.

## Security Standard

Sprint 17 aims to make Glacier materially safer against the concrete authentication, authorisation, tenant-isolation, validation and boundary risks identified in the repository.

Security is not an absolute finish state. Completion means the in-scope boundaries are consistently classified, protected and tested, while remaining risks and later pre-pilot controls are documented without implying that the platform has become invulnerable or production-certified.

## Recommended Objective

Establish consistently authenticated, authorised, tenant-scoped and validated API boundaries for Glacier's existing Operator, Staff and Public capabilities before adding more privileged operational UI.

Sprint 17 should fix concrete boundary defects already visible in the repository. It must remain a targeted hardening Sprint, not become an unlimited security programme or a rewrite of stable Booking, Payment, Rule Engine or Ticket business logic.

## Why This Should Be Next

Sprint 16 added legally significant Waiver evidence and expanded the authenticated Event Workspace. The next planned product milestone is Staff Scanner and Gate Operations, which will introduce another privileged interface.

The current API has two generations of controller design:

- newer modules use JWT authentication, roles, trusted Organisation context and tenant-scoped services;
- older modules expose broad operator-style routes without guards and sometimes without validated DTOs.

Building more privileged UI on the older boundary would increase risk and rework. Sprint 17 should create a consistent platform boundary first.

## Audit Findings That Drive Scope

### Protected newer patterns

The following areas already demonstrate the intended direction:

- Event
- Session
- Operational Schedule
- Product
- Product Variant
- Session Product
- Event Waiver administration

They use combinations of:

- `JwtAuthGuard`
- `RolesGuard`
- `@Roles(...)`
- `@CurrentUser()`
- Organisation context from the authenticated JWT
- relationship-based Prisma tenant scope

### Legacy operator routes currently lacking guards

- Organisation listing, creation and membership mutation
- User listing and creation
- Booking listing, detail and creation
- Customer listing, detail and creation
- Category create/list/detail/delete
- Ticket Type list/create
- Rule create/list/detail/update/delete
- Ticket detail and QR retrieval
- Ticket scan mutation
- legacy Payment creation

These routes should not all be treated as intentionally public merely because they currently lack authentication.

### Intentionally public or externally authenticated routes

- `POST /auth/login`
- Stripe webhook, authenticated through Stripe signature verification
- dedicated `/public/...` Booking routes
- dedicated `/public/waivers/...` routes
- Ticket token presentation/validation routes where possession of the high-entropy token is the intended credential

Each public route still requires explicit response minimisation, validation and abuse-control review.

### Validation inconsistency

- The application currently has no global `ValidationPipe`.
- Decorated DTOs therefore do not automatically provide authoritative runtime validation unless a controller installs a pipe.
- The new public Waiver controller installs a strict local pipe.
- Several legacy controllers use inline TypeScript body shapes, which provide no runtime validation.
- `CreateCategoryDto` is currently empty while the controller uses an inline body type.

### Other boundary concerns

- CORS is hard-coded to `http://localhost:3001` rather than configured per environment.
- User login selects the first Organisation membership; active Organisation selection remains future work.
- Current role vocabulary is broad (`OWNER` and `MEMBER`) and is not yet a complete Staff permission model.
- Rate limiting and broader abuse monitoring are not yet present.

## Proposed In-Scope Work

### 1. Endpoint classification and policy

Create and maintain an explicit endpoint register containing:

- route and method
- Operator, Staff, Public, webhook or internal classification
- required authentication mechanism
- allowed role(s)
- tenant ownership path
- request DTO/validation status
- response minimisation requirement
- test coverage

No route should remain accidentally public.

### 2. Protect legacy Operator APIs

Apply the established JWT/role pattern to the existing operator routes for:

- Organisation
- Users/membership
- Bookings
- Customers
- Categories
- Ticket Types
- Rules
- Ticket detail/QR
- legacy Payment initiation

Read operations should allow the minimum existing authenticated role required by the current product. Mutations should require `OWNER` unless a narrower existing rule is already established and tested.

### 3. Enforce tenant isolation in services

Refactor affected service methods to accept trusted `organizationId` and scope through ownership relationships.

Examples:

- Booking → Event → Organisation
- Customer → Organisation relationship, or the current authoritative ownership model after schema inspection
- Category → Event → Organisation
- Ticket Type → Event → Organisation
- Rule → Event → Organisation
- Ticket → Booking → Event → Organisation
- Payment → Booking → Event → Organisation
- User membership → Organisation

Cross-tenant identifiers must return a privacy-safe not-found/forbidden outcome and must never disclose the existence or data of another Organisation's resource.

If the existing Customer model cannot express safe Organisation ownership, Sprint 17 must document and implement the smallest additive correction required. It must not silently redesign the entire Customer domain.

### 4. Establish authoritative request validation

Recommended sequence:

1. Replace inline request-body types in the targeted controllers with explicit DTOs.
2. Add bounded strings, enums, numeric limits, nested validation and date validation appropriate to each route.
3. Add focused controller/service tests for rejected unknown or malformed input.
4. Introduce a global strict `ValidationPipe` only after all in-scope controllers are compatible.
5. Keep Stripe webhook raw-body handling intact.

Target global policy:

- `transform: true`
- `whitelist: true`
- `forbidNonWhitelisted: true`

If enabling the global pipe would force unrelated application rewrites, Sprint 17 may retain explicit strict pipes at audited boundaries, but the exception and remaining routes must be documented.

### 5. Separate Ticket presentation from Staff mutation

- Keep high-entropy Ticket token presentation/validation available only to the extent required by the customer journey.
- Minimise public Ticket responses.
- Require authenticated Staff/Operator context for the check-in mutation.
- Tenant-scope Ticket detail and QR-by-ID retrieval.
- Preserve atomic duplicate-scan protection and existing Ticket state authority.

Sprint 17 should secure the boundary but should not build the Staff Scanner UI; that remains the next product milestone.

### 6. Retire or protect duplicate Payment entry points

The dedicated public payment endpoint with the Booking public-access token remains the customer payment boundary.

The legacy `POST /payment/:bookingId` route must be classified and either:

- protected as an authenticated operator action with tenant scope; or
- removed if repository usage proves it obsolete.

The decision must preserve Stripe webhook, idempotency, cancellation, refund and Ticket-issuance behaviour.

### 7. Environment-safe CORS

- Replace the hard-coded local origin with explicit environment configuration.
- Continue supporting the local web origin.
- Require an explicit production origin allowlist.
- Do not use a permissive wildcard with credentials.

### 8. Security regression tests

Add table-driven or otherwise systematic tests covering:

- unauthenticated rejection
- MEMBER read authority where allowed
- MEMBER mutation denial
- OWNER authority
- trusted Organisation context
- cross-tenant read denial
- cross-tenant mutation denial
- malformed and unknown request fields
- deliberately public routes remaining public
- public response minimisation
- Stripe webhook signature boundary remaining functional
- Ticket scan atomicity remaining intact
- Payment and Ticket authority remaining unchanged

## Explicitly Out of Scope

- full granular RBAC/permission matrix
- MFA implementation
- password reset/account recovery
- active-Organisation switching UX
- OAuth/social login
- Customer Portal
- Staff Scanner UI
- complete Admin application
- broad audit-log platform
- infrastructure WAF configuration
- penetration testing
- SOC 2/ISO certification work
- production deployment
- broad Booking, Payment, Ticket or Rule Engine redesign
- Customer data-model redesign beyond the minimum needed for tenant safety
- Waiver feature expansion
- reminder, email or SMS workflows

## Approved Decisions

### Decision 1 — Existing role meaning

Approved for Sprint 17:

- `OWNER`: all audited reads and mutations
- `MEMBER`: audited reads plus Ticket scan mutation only

This is a temporary two-role policy until the Staff application defines a more granular permission model.

### Decision 2 — Organisation and User creation

Approved:

- protect Organisation listing and membership mutation immediately;
- treat public self-service Organisation/User creation as out of scope;
- restrict existing creation routes to OWNER where an Organisation context exists;
- document that true first-Organisation bootstrap/onboarding needs a separate controlled flow.

### Decision 3 — Global validation

Approved:

- aim for a global strict pipe;
- enable it only after an endpoint-by-endpoint compatibility audit;
- do not accept a large untested behaviour change merely to claim global coverage.

### Decision 4 — Rate limiting

Approved:

- document route-specific limits and add the architectural hook in Sprint 17;
- implement production-grade distributed limiting when the deployment topology is selected;
- consider a narrow local limiter for login and high-risk public mutations only if it can be tested without introducing false production confidence.

## Acceptance Scenarios

### A. Unauthenticated operator access

1. Call each audited operator endpoint without a JWT.
2. Request is rejected.
3. No resource existence or tenant data is disclosed.

### B. Cross-tenant identifier attack

1. Authenticate as Organisation A.
2. Supply Organisation B's Booking, Customer, Category, Ticket Type, Rule, Ticket or Payment-related identifier.
3. Read and mutation are denied without data leakage.

### C. Role enforcement

1. Authenticate as MEMBER.
2. Allowed reads succeed.
3. OWNER-only catalogue/configuration mutations fail.
4. Authorised Ticket scan succeeds under the agreed temporary policy.

### D. Public customer journey regression

1. Public Event/Session/Ticket discovery remains available.
2. Booking creation and payment use the dedicated public token boundary.
3. Stripe confirmation still issues Tickets only under existing rules.
4. Published Event Waiver remains independently accessible.

### E. Validation boundary

1. Submit malformed, oversized and unknown fields to each audited mutation.
2. Request is rejected before business persistence.
3. Valid existing payloads continue to work.

### F. Stripe webhook

1. Missing/invalid signature is rejected.
2. Valid signed payload retains raw-body access.
3. Payment idempotency and late-success refund behaviour remain unchanged.

## Test and Build Control

Sprint 17 begins from:

- 51 API test suites passing
- 280 API tests passing
- API production build passing
- web production build passing
- clean `main` at `72ee94d`

Completion requires:

- all 51 existing suites and 280 existing tests remain green
- new endpoint-policy, auth, role, tenant and validation tests pass
- API production build passes
- web production build passes if authentication/error behaviour changes affect the client
- focused browser smoke test covers login, Event Workspace, public Booking and public Waiver
- endpoint register and architecture/security documentation are updated
- no secrets or local tokens enter version control
- clean implementation and documentation commits

## Proposed Implementation Sequence

1. Commit the approved Sprint 17 contract.
2. Create the endpoint classification register.
3. Add controller-level auth/role tests before changing guards.
4. Harden Organisation and User boundaries.
5. Harden Category, Ticket Type and Rule boundaries.
6. Harden Booking and Customer operator boundaries.
7. Separate Ticket public presentation from authenticated scan/detail operations.
8. classify and protect/remove the legacy Payment route.
9. Add/complete DTOs and validation for each audited mutation.
10. Decide and test global versus explicit strict validation pipes.
11. Configure environment-safe CORS.
12. Run full regression/build and browser smoke verification.
13. Update architecture, security, endpoint register, changelog and Sprint closeout.

## Definition of Done

Sprint 17 is complete when:

1. Every API route is explicitly classified.
2. No operator route remains accidentally unauthenticated.
3. Audited operator reads and mutations are tenant-scoped using trusted JWT context.
4. OWNER/MEMBER behaviour is documented and enforced consistently for the Sprint scope.
5. Ticket scan is an authenticated operational mutation.
6. Public Ticket responses are minimised and possession-token boundaries are explicit.
7. The legacy Payment route is removed or safely protected.
8. Targeted mutations use authoritative runtime validation.
9. Stripe raw-body webhook verification remains intact.
10. CORS uses explicit environment configuration.
11. Existing Booking, Payment, Ticket, Rule Engine and Waiver behaviour remains green.
12. Security tests prove unauthenticated, role and cross-tenant failure cases.
13. Documentation describes both completed protections and remaining pre-pilot security work.

## Planning Decision

This plan is the authoritative Sprint 17 contract. It is the narrowest high-value step that reduces current platform risk and prepares Glacier for authenticated Staff Scanner and Gate Operations without combining those two substantial concerns into one Sprint.
