# Sprint 24 — Access Levels and Scoped Authority

## Status

Implementation and local verification completed on 26 August 2026 under the locked scope in `docs/roadmap/sprint-24-plan.md`.

Sprint 24 establishes the permission foundation required before POS, partial refunds, cancellation, rescheduling and Flexible Ticket work. It does not grant those future commerce mutations.

## Persistence and migration

`UserOrganization.role` is now the controlled `OrganizationRole` enum: OWNER, MANAGER, STAFF or SCANNER. `OrganizationAccessScope` separates all-Event from assigned-Event access. The forward-only migration maps every legacy MEMBER membership to STAFF/ALL_EVENTS, retains OWNER, narrows SCANNER to ASSIGNED_EVENTS and introduces `UserEventAccess` with unique Event/User assignment constraints.

The subsequent audit migration adds `OrganizationAccessAudit`. Successful Team membership and access changes record Organisation, actor, target, action, bounded before/after role, scope and Event identifiers, and server timestamp. Passwords, JWTs and unrelated personal or customer data are excluded.

All 34 local migrations are applied. Prisma formatting, generation and application validation passed.

## Current-membership authority

JWT claims identify the requested Organisation context but no longer remain authoritative for the lifetime of an eight-hour token. The JWT strategy reloads the current User and Organisation membership on each protected request, rejects inactive or removed access and exposes current role/scope downstream.

The Roles Guard consumes this validated current membership. Demotion, deactivation and assignment removal therefore take effect without waiting for token expiry. Unknown/removed membership remains an authentication failure; authenticated but insufficient role remains forbidden.

## Event scope enforcement

One access resolver implements the role/scope rules:

- OWNER is all-Event only inside the authenticated Organisation;
- MANAGER and STAFF may be all-Event or assigned-Event;
- SCANNER is assigned-Event only; and
- empty ASSIGNED_EVENTS means no Event access.

List and direct-object boundaries enforce scope independently. Representative coverage includes Event, Booking, Customer, Organisation/Event reporting, Event Group comparison/export, Ticket presentation/validation/scan and Staff Scanner context/admission. Foreign Organisation and unassigned same-tenant identifiers fail safely without relying on filtered navigation.

OWNER configuration mutations remain OWNER-only. MANAGER does not inherit OWNER authority merely by joining the management role group. STAFF receives permitted operational reads and scanner capability. SCANNER remains excluded from ordinary Organisation, Event, Booking, Customer, reporting, catalogue and Ticket-administration routes.

## Team management API and audit

OWNER-only routes provide presentation-safe Team listing and non-owner access updates. Ordinary Team management can assign MANAGER, STAFF or SCANNER but cannot grant OWNER. OWNER scope is forced to ALL_EVENTS and SCANNER scope to ASSIGNED_EVENTS.

Every submitted Event identifier is proven to belong to the authenticated Organisation before mutation. Assignments are replaced transactionally. Final-OWNER demotion is blocked inside a serializable transaction, preventing concurrent changes from racing an Organisation to zero owners.

The existing add-membership route now accepts only non-owner Team roles and writes matching audit evidence. Controlled ownership transfer/recovery remains deliberately separate from ordinary Team management.

## Team and Access interface

Settings → Team and Access provides:

- plain-language OWNER, MANAGER, STAFF and SCANNER descriptions;
- current name, email, status, role and scope;
- read-only OWNER authority;
- controlled Manager/Staff/Scanner selection;
- all-Event or selected-Event scope for Manager/Staff;
- forced selected-Event scope for Scanner;
- explicit empty-selection denial wording;
- keyboard-native selects and checkboxes; and
- visible loading, failure and saved states.

Non-owners can see their effective role explanation but receive no Team mutation controls. Server roles remain authoritative. The dashboard top bar now reads the authenticated operator rather than displaying a fixed Owner identity.

## Automated verification

Final verified baselines:

- API focused Team/role checks: 3 suites / 18 tests;
- API complete suite: 71 suites / 476 tests;
- API production build: passed;
- web focused Team/identity checks: 2 files / 4 tests;
- web complete suite: 23 files / 71 tests;
- changed-file web lint: passed;
- web webpack production build: passed; and
- Git whitespace validation: passed.

Coverage includes typed roles, legacy MEMBER rejection, SCANNER defaults, ordinary OWNER-grant rejection, current-membership revocation, scope resolution, cross-tenant/unassigned denial, final-OWNER protection, transactional assignment replacement, audit creation and Owner-interface interactions.

## Authenticated browser acceptance

Acceptance used only fictional local accounts and Events.

### OWNER

- Team and Access loaded current Team data.
- Jamie Stoller displayed as protected OWNER/All Events with no ordinary authority controls.
- Festival Staff transitioned through controlled roles and Event scope.
- Every successful save produced visible confirmation and durable audit evidence.

### MANAGER

- Festival Staff displayed accurately as Manager in the dashboard identity.
- Events listed only the assigned Role Test Event.
- Assigned Event workspace opened.
- Direct access to an unassigned same-Organisation Event returned Event not found.
- Team and Access exposed the current MANAGER role but no mutation controls.

### STAFF

- Events listed only the assigned Role Test Event.
- Team and Access exposed STAFF but no mutation controls.
- Staff Scanner loaded without performing a scan or admission.

### SCANNER

- Login routed directly to `/staff/scanner`.
- Ordinary `/events` returned forbidden.
- Team and Access exposed SCANNER but no mutation controls.
- The assigned Role Test Event remained absent from active scanner selection because it is DRAFT, preserving active-Event scanner policy.

### Responsive and final state

Team and Access produced no page-level horizontal overflow at 390 × 844 or 768 × 1024. Festival Staff was restored to its original STAFF/ALL_EVENTS state with no residual Event assignment. The temporary local acceptance password was replaced with an unknown high-entropy credential after testing.

The resulting audit sequence is:

1. STAFF/ALL_EVENTS → MANAGER/ASSIGNED_EVENTS (Role Test Event);
2. MANAGER/ASSIGNED_EVENTS → STAFF/ASSIGNED_EVENTS;
3. STAFF/ASSIGNED_EVENTS → SCANNER/ASSIGNED_EVENTS; and
4. SCANNER/ASSIGNED_EVENTS → STAFF/ALL_EVENTS with assignments cleared.

## Protected foundations

Sprint 24 did not change Booking totals/reservation behaviour, shared Session admission capacity, Product inventory/reusable capacity, Stripe/webhook/refund authority, Ticket outcomes, Waiver acceptance, reporting definitions or the routed public Booking journey.

No external account, production record, real Payment, refund, Ticket admission or inventory value was changed during acceptance.

## Follow-up boundaries

- Controlled ownership transfer/recovery requires a separately approved high-assurance workflow.
- A formal multi-Organisation selector remains required because login still chooses the first membership.
- Password recovery, privileged-role MFA, production edge rate limiting and security monitoring remain pilot security gates.
- A future Site/Venue domain may provide reusable scope groups; Sprint 24 intentionally uses Event assignments.
- Manager financial permissions remain denied until refund/cancellation/rescheduling workflows define their own explicit capability and audit policies.
