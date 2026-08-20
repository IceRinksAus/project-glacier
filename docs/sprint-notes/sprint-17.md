# Sprint 17 — API Boundary & Security Hardening

## Status

Implementation complete and locally verified on 20 August 2026. No deployment was performed.

## Objective

Make Glacier's existing API boundaries consistently authenticated, authorised, tenant-scoped and validated before adding the Staff Scanner and Gate Operations interface.

This Sprint hardened the existing platform. It did not attempt to claim complete production security, redesign stable Booking/Payment/Ticket business logic or introduce the future granular Staff permission model.

## Delivered Controls

### Route classification

- Added `docs/security/API_ENDPOINT_REGISTER.md` as the authoritative route inventory.
- Classified every controller route as protected, deliberately public or externally authenticated.
- Recorded authentication, role, tenant path, validation and response policy.
- Reconciled the completed register against every controller decorator during closeout.
- No `HARDEN` or `REVIEW/REMOVE` route remains unresolved.

### Global input and environment boundary

- Enabled one global strict `ValidationPipe` with transformation, whitelisting and rejection of unknown fields.
- Converted audited inline/public request bodies to runtime DTOs.
- Added bounded nested collections, strings, identifiers, ages and possession tokens.
- Replaced hard-coded CORS with `CORS_ORIGINS`.
- Local development defaults to `http://localhost:3001`.
- Production startup fails closed when no explicit origin allowlist is configured.
- Preserved Stripe's raw-body webhook signature boundary.

### Organisation and User

- Protected listing and membership routes with JWT and role guards.
- Removed ordinary `POST /organization`; bootstrap/onboarding remains a future controlled flow.
- Derived Organisation context from the authenticated JWT.
- Restricted membership and User creation to OWNER.
- Added explicit DTO allowlists and tenant tests.

### Catalogue and Rules

- Protected Category, Ticket Type and Rule APIs.
- Scoped resources through Event → Organisation.
- Allowed MEMBER reads and OWNER mutations.
- Prevented Rule parent-Event reassignment by omitting `eventId` from update input.
- Removed the duplicate public Rule Evaluation controller; the internal service and dedicated public Booking route remain authoritative.

### Booking and Customer

- Retained only authenticated, tenant-scoped operator read routes.
- Removed duplicate ordinary Booking and Customer creation routes.
- Scoped Booking through Event → Organisation.
- Scoped Customer through its Bookings and filtered nested Booking results to the authenticated Organisation.
- Kept dedicated `/public/...` customer and Booking creation as the customer boundary.

### Ticket and gate operations

- Kept possession-token Ticket presentation public and reduced its response to status, participant name, Event and Session presentation data.
- Required JWT plus OWNER or MEMBER for Ticket validation, scan, detail and QR retrieval.
- Scoped those operations through Ticket → Booking → Event → Organisation.
- Preserved atomic scan/update behaviour and duplicate-scan protection.
- Rejected malformed possession tokens before database work.

### Payment

- Removed the duplicate unauthenticated `POST /payment/:bookingId` route.
- Kept `POST /public/bookings/:bookingId/payments` as the token-protected customer payment boundary.
- Preserved Stripe webhook signature verification, idempotency, cancellation, late-success refund and Ticket-issuance authority.

### Authentication

- Bounded login email to 254 characters and password input to 1–128 characters.
- Kept normalised email lookup and bcrypt verification.
- Replaced the `any` current-user contract with typed minimal JWT claims.
- Documented the deployment-edge login limit and required pilot evidence in `docs/security/AUTHENTICATION_ABUSE_CONTROLS.md`.
- Deliberately avoided an in-memory limiter that would provide false confidence across deployments or multiple instances.

## Temporary Role Policy

- OWNER: audited reads and configuration mutations.
- MEMBER: audited reads plus Ticket validation and scan.

This is a Sprint boundary, not the final Staff permission model.

## Commit Checkpoints

- `62eb636` — Sprint 17 security plan.
- `760ad02` — endpoint register, global validation/CORS, Organisation/User/Category/Ticket Type hardening.
- `4ddb595` — Rule, Booking and Customer hardening.
- `e41e4d4` — Ticket, Payment and public Booking hardening.
- `f227a6f` — authentication boundary and abuse-control decision.

## Verification Evidence

### Automated

- Full API regression: 52 of 52 suites passed.
- Full API regression: 326 of 326 tests passed.
- The pre-Sprint 45-suite / 236-test baseline remains included and green.
- API production build: passed.
- Web production build: passed.
- `git diff --check`: passed at each checkpoint.

Coverage added or retained for unauthenticated access, roles, trusted Organisation context, cross-tenant reads/mutations, strict DTO rejection, public response minimisation, Ticket scan atomicity and Stripe behaviour.

### Browser

Closeout used an isolated production web preview and API process so stale development chunks could not influence the result.

- Login page rendered.
- Unauthenticated `/events` access returned to `/login`.
- Public Booking loaded the active `Tenant Security Test` Event and its Session choices.
- Public Waiver `sprint16-preview` loaded the published version, acceptance statement, signature and minor controls.

An authenticated Event Workspace mutation was not repeated because closeout did not transmit stored credentials or inspect browser storage. The protected Event controller/service coverage, role tests and prior Sprint 16 authenticated browser verification remain green.

## Residual Risk and Pre-Pilot Gates

Sprint 17 materially reduces application-boundary risk but does not certify Glacier as production secure. Before an internet-exposed pilot:

1. Configure and test distributed deployment-edge limits for login and high-risk public mutations.
2. Add monitoring/alerting and record operational ownership for abuse events.
3. Complete production-like tenant-isolation integration tests and an independent penetration test.
4. Configure managed secrets, TLS, logs, backups and incident response.
5. Implement or explicitly gate MFA, password recovery and session revocation for privileged users.
6. Define the granular Staff permission model before Staff Scanner expands beyond the temporary MEMBER scan authority.
7. Review dependency findings and document remediation or acceptance.
8. Complete privacy/legal review, especially children's information and Waiver evidence retention.

The login service still selects the first Organisation membership. Active-Organisation switching remains deferred.

## Definition of Done Assessment

Every API route is classified; ordinary operator routes are authenticated; audited resources use trusted Organisation scope; OWNER/MEMBER behaviour is explicit; Ticket scan is protected and atomic; duplicate Payment and legacy creation routes are removed; audited mutations use authoritative validation; CORS is environment-safe; Stripe authority remains intact; regression/build/browser checks pass; and residual controls are documented without overstating readiness.

Sprint 17 is ready to close after this documentation checkpoint is committed and pushed.
