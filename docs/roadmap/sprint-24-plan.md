# Sprint 24 Plan — Access Levels and Scoped Authority

## Planning Status

Approved direction and locked scope on 25 August 2026.

## Objective

Replace Glacier's coarse OWNER/MEMBER operator boundary with a safe, testable access system that supports Organisation governance, Manager-authorised operations and day-to-day Staff work within explicit Event scope.

Sprint 24 is the permission foundation for later POS, partial refunds, cancellation, rescheduling and Flexible Ticket workflows. It must not implement those commerce mutations yet.

## User Outcome

An Organisation OWNER can manage team access through the browser, assign a person an appropriate role, restrict operational access to selected Events where required, and trust that API and interface behaviour enforce the same authority immediately.

The pilot role model is:

- **OWNER:** Organisation-wide governance and unrestricted authorised Event oversight;
- **MANAGER:** trusted operational administration, including future refund/cancellation/rescheduling authority within assigned scope;
- **STAFF:** POS, scanner, lookup and preparation workflows within assigned scope, without high-risk financial or Organisation-governance mutation; and
- **SCANNER:** retained as the narrowly restricted scanner-only role for dedicated gate accounts/devices.

## Evidence Inspected

- `UserOrganization.role` is currently a free-text String defaulting to `MEMBER`.
- application role constants currently allow `OWNER`, `MEMBER` and `SCANNER`.
- controller decorators explicitly repeat OWNER/MEMBER/SCANNER combinations.
- the Roles Guard trusts the role placed in the authenticated request.
- JWT login selects the first Organisation membership and embeds role/Organisation identity in the token.
- membership/role changes can therefore remain stale until token replacement unless current membership is revalidated.
- `EventUser` already exists as an Event/User relationship but is effectively unused by application services.
- Event records contain venue address fields, but Glacier does not yet have a durable Site/Venue ownership entity suitable for access-control scope.

## Locked Design Decisions

### Organisation roles

The supported Organisation roles become:

- `OWNER`
- `MANAGER`
- `STAFF`
- `SCANNER`

`MEMBER` is removed from the active application contract after migration. Existing `MEMBER` memberships migrate to `STAFF`, which avoids accidental elevation to Manager authority.

At least one active OWNER must remain for every active Organisation. The final OWNER cannot be demoted, removed or deactivated through ordinary team management.

### Role versus scope

Role answers **what** a person may do. Assignment answers **where** they may do it.

- OWNER is always Organisation-wide.
- MANAGER and STAFF may be Organisation-wide or restricted to assigned Events.
- SCANNER is restricted to explicitly assigned Events for normal operation.
- an empty assignment list under `ASSIGNED_EVENTS` means no Event access, never all Events.

Sprint 24 introduces an explicit access-scope value such as `ALL_EVENTS` or `ASSIGNED_EVENTS` on Organisation membership. OWNER is forced to `ALL_EVENTS`.

The existing `EventUser` relationship should be reused or safely evolved for Event assignments only if implementation inspection confirms its migrations and semantics are suitable. Its role field must not become a second conflicting authority source. Organisation membership remains the source of role; Event assignment remains the source of scope.

### No premature Site model

Managers are operationally associated with sites, but current Glacier Event venue fields do not form a stable Site entity. Sprint 24 scopes access to Events. A future Site/Venue domain can later provide reusable assignment groups without weakening the current tenant boundary.

### Current membership authority

Authenticated requests must not rely solely on a stale role claim stored at login. The server must resolve and validate the current active User/Organisation membership before protected role/scope decisions, or use an equivalently safe revocation/version mechanism.

Role demotion, removal, account deactivation and Event-assignment removal must take effect promptly without requiring an operator to wait for a long-lived token to expire.

### Deny by default

Every protected controller must declare or inherit an intentional permission boundary. Adding MANAGER/STAFF must not make legacy OWNER mutations available accidentally.

No client-supplied Organisation, role or assignment identity is authoritative.

## Permission Baseline for This Sprint

| Capability | OWNER | MANAGER | STAFF | SCANNER |
|---|---:|---:|---:|---:|
| View Organisation identity | Yes | Yes | Yes | Minimal/no |
| Manage membership, roles and ownership | Yes | No | No | No |
| View assigned Events | All | Assigned/all scope | Assigned/all scope | Assigned only |
| Create/archive Event | Yes | No | No | No |
| Change sensitive Event configuration | Yes | No initially | No | No |
| View Event operational workspace | All | Assigned/all scope | Assigned/all scope | No |
| View Bookings/Customers/Reports | All | Assigned/all scope | Assigned/all scope | No |
| Payment investigation | Yes | Assigned/all scope | Read-only only if explicitly approved later | No |
| Configure Tickets/Products/Rules | Yes | No initially | No | No |
| Use staff scanner | Yes | Assigned/all scope | Assigned/all scope | Assigned only |
| Future POS sale | Yes | Assigned/all scope | Assigned/all scope | No |
| Future refunds/cancellation/rescheduling | Yes | Assigned/all scope | Prepare only | No |

This table is intentionally conservative. Sprint 24 establishes reusable permission vocabulary so later Sprints can promote specific Manager actions deliberately rather than broadly treating Manager as OWNER.

## Slice 1 — Typed Role and Scope Foundation

### Persistence

- add controlled Prisma role and access-scope enums or equivalent database constraints;
- migrate every `MEMBER` membership to `STAFF` explicitly;
- preserve OWNER and SCANNER records;
- add access scope with a safe deterministic backfill;
- ensure OWNER memberships are Organisation-wide;
- establish Event assignment uniqueness and indexes;
- prevent cross-Organisation Event assignment;
- define deletion behaviour without deleting Users, Events or commerce records; and
- keep the migration forward-only and production-safe.

### Application contract

- update shared role types and role groups;
- introduce named capability constants/policies rather than scattering role arrays where practical;
- retain explicit scanner-only restrictions;
- remove active MEMBER assumptions from API/web behaviour and tests; and
- preserve clear 401 versus 403 semantics.

### Migration defaults

Existing MEMBER → STAFF with `ALL_EVENTS` is the proposed compatibility backfill because those users previously had Organisation-wide operator reads. This retains existing visibility while removing OWNER mutation and future Manager financial authority. Any existing Event assignments should be reconciled explicitly rather than silently narrowing users during migration.

## Slice 2 — Current-Membership and Event-Scope Enforcement

- load current User status and Organisation membership for protected requests;
- reject inactive/removed Users and memberships promptly;
- expose only validated role, Organisation and access scope to downstream services;
- create one reusable Event-access resolver using authenticated Organisation context;
- OWNER bypasses Event assignment only within their Organisation;
- `ALL_EVENTS` MANAGER/STAFF can access all tenant Events allowed by capability;
- `ASSIGNED_EVENTS` users can access only persisted assignments;
- SCANNER must be explicitly assigned;
- foreign Organisation/Event identifiers return the established privacy-safe denial behaviour;
- list endpoints return only permitted Events/records;
- direct-detail and nested routes recheck scope rather than relying on filtered navigation; and
- reporting, Booking, Customer, Ticket and scanner boundaries receive explicit regression coverage.

## Slice 3 — Team and Assignment Management API

OWNER-only protected operations:

- list Organisation team members with role, status and scope;
- change role among MANAGER, STAFF and SCANNER;
- change access scope;
- replace ordered/unordered Event assignments as appropriate;
- activate/deactivate or remove access using the existing User/membership lifecycle safely;
- reject foreign Users and Events before any mutation;
- prevent last-OWNER loss;
- prevent self-demotion/removal where it would leave no OWNER;
- preserve immutable audit evidence for membership, role and assignment changes; and
- return presentation-safe data without password hashes, tokens or unrelated personal data.

Creating/inviting entirely new user identities should reuse existing supported User creation/invitation behaviour if present. A new email-delivery invitation system is outside scope unless inspection proves team management cannot be safely browser-tested without a minimal local invitation/create flow.

## Slice 4 — Organiser Team Access Interface

Add a clear Settings → Team and Access workspace for OWNER:

- list current people, roles, status and access scope;
- explain OWNER, MANAGER, STAFF and SCANNER in operational language;
- change non-owner roles;
- choose all Events or selected Events;
- assign/remove Events with clear names/dates;
- show warnings before sensitive access reduction;
- block invalid last-OWNER actions visibly;
- show saved success/error states; and
- support keyboard and mobile/tablet use without drag-only interaction.

MANAGER and STAFF may see their own effective role/scope where useful but cannot mutate team access.

Navigation and server responses must remain authoritative; hiding a button is never the permission boundary.

## Slice 5 — Documentation and Browser Acceptance

### Documentation

- update authentication/security architecture;
- update role/capability matrix;
- add a Team Access operating guide;
- document migration from MEMBER;
- document OWNER recovery/last-owner protections;
- update API route/permission references; and
- record exact verification evidence in Sprint notes.

### Required browser acceptance

Using controlled local fixtures:

1. OWNER opens Team and Access.
2. OWNER changes a legacy-migrated STAFF user to MANAGER.
3. OWNER restricts that Manager to one Event.
4. Manager can open the assigned Event and permitted reads.
5. Manager cannot open a different tenant Event or unassigned same-tenant Event directly.
6. Manager cannot manage Organisation roles or OWNER-only Event configuration.
7. STAFF can use permitted operational reads/scanner/POS-ready navigation but cannot complete sensitive mutations.
8. SCANNER remains confined to assigned scanner operation.
9. Removing assignment or deactivating access takes effect without relying on interface logout.
10. Last-OWNER protection is visible and enforced server-side.
11. Relevant pages remain usable at a mobile/tablet viewport with no page-level horizontal overflow.

Acceptance must not alter production/external data and must not expose credentials in logs or screenshots.

## Security and Privacy Requirements

- authenticated Organisation context remains authoritative;
- all Event assignments are verified through the same Organisation before mutation;
- current membership is checked for protected operations;
- audit role/scope changes without secrets;
- rate-limit authentication and any new invitation endpoint;
- no account enumeration through team/invitation errors;
- inactive Users cannot retain operational access;
- no role escalation through request DTOs or client state;
- Prisma unique/foreign-key constraints backstop service checks; and
- controller and service tests cover cross-tenant and direct-object access.

## Test and Verification Requirements

Minimum required evidence:

- focused migration/schema validation and Prisma generation;
- role/scope utility and Roles Guard tests;
- authentication current-membership/revocation tests;
- team-access controller/service tests;
- cross-tenant and unassigned-Event denial tests;
- last-OWNER and invalid transition tests;
- representative reporting, Booking, Customer, Ticket and scanner regressions;
- focused Team interface tests;
- full API suite;
- full web suite;
- API production build;
- web production build;
- lint with no new errors; and
- authenticated browser acceptance for OWNER, MANAGER, STAFF and SCANNER scenarios.

The Sprint must record the new baseline without weakening the Sprint 23 baseline of 69 API suites / 456 tests and 21 web suites / 67 tests.

## Explicitly Out of Scope

- POS transaction implementation;
- EFTPOS/Square/Linkly/Stripe Terminal adapters;
- cash reconciliation implementation;
- refund, cancellation or reschedule mutation;
- Flexible Ticket purchase or customer request flow;
- general customer portal;
- a new Site/Venue management domain;
- arbitrary custom-role builder;
- field-level permissions;
- SSO/SAML/SCIM;
- MFA implementation unless separately promoted by the Security Gate;
- broad dashboard visual redesign; and
- production deployment work from Phase 3.

## Protected Foundations

Sprint 24 must not change:

- authoritative Booking totals or reservation behaviour;
- shared admission capacity semantics;
- finite/reusable Product inventory semantics;
- Stripe Payment/webhook/refund behaviour;
- Ticket credential or scanning outcomes except access enforcement;
- Waiver acceptance semantics;
- Event reporting definitions; or
- public routed booking behaviour.

## Completion Gate

Sprint 24 is complete only when:

- OWNER, MANAGER, STAFF and SCANNER are typed and migrated safely;
- role and Event scope are enforced server-side across representative sensitive surfaces;
- current access changes take effect promptly;
- OWNER can manage roles/scopes through the browser;
- last-OWNER and cross-tenant protections pass;
- existing Event/commerce behaviour retains its verified baseline;
- all required automated/build/lint/browser evidence passes; and
- operational/security documentation is current.

Passing UI tests alone is insufficient. Direct API access, stale-token behaviour and cross-tenant scope must be proven.

## Recommended Delivery Order

1. persistence and migration;
2. typed roles/capabilities;
3. current-membership request validation;
4. Event-scope resolver and protected-read retrofit;
5. team-access API and audit;
6. Team and Access interface;
7. full regression/security verification;
8. browser acceptance and documentation closeout.
