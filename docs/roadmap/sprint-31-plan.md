# Sprint 31 Plan — Production Architecture, Security and Entity-Control Foundations

## Planning status

Draft for organiser review. Not yet scope-confirmed or committed.

## Recommendation

Sprint 31 should be a decision-and-foundation Sprint for Phase 3. Glacier's operational chain is now broad enough that infrastructure choices affect security, recovery, privacy, cost and ownership. The Sprint should select and document a deployable architecture, close the highest-risk application configuration gaps and create reproducible staging foundations without representing Glacier as production ready.

Entity and asset ownership must run concurrently through `docs/business/GLACIER_ENTITY_AND_ASSET_OWNERSHIP_PLAN.md`. Technical work may use placeholder hostnames and non-production accounts while the new Glacier entity is formed. Live merchant, customer-data and production ownership must not be guessed.

## Objective

Produce a controlled staging-ready architecture and security baseline that can be deployed, observed, backed up and recovered, while preserving Glacier's existing tenant, commerce, capacity, inventory, Ticket, Waiver and Flexible Ticket authorities.

## User outcome

The organiser has a clear infrastructure choice, realistic recurring-cost view, domain/ownership path and evidence-based checklist for moving Glacier beyond localhost. Developers can deploy the same reviewed build through automated gates without manually copying secrets or making undocumented database changes.

## Workstream A — Entity, domain and account control

- identify temporary and intended legal holders for domains, IP and infrastructure accounts;
- shortlist primary `.com` and defensive Australian domain candidates;
- record `.com.au` eligibility and formal transfer requirements;
- establish an asset/account register and two-person recovery principle;
- keep registrar purchase/payment as a user-controlled action;
- define placeholder production hostnames until the domain is acquired; and
- prepare accountant/lawyer decision questions without selecting a legal/tax structure in code documentation.

## Workstream B — Architecture decision

Compare a small number of credible managed deployment shapes against:

- Australian-region availability and data-location requirements;
- support for the NestJS API and Next.js application;
- managed PostgreSQL, backups and point-in-time recovery;
- managed object storage for branding/waiver assets;
- private networking and least-privilege service access;
- TLS, custom domains, edge controls and explicit origins;
- secret management and rotation;
- logs, metrics, error tracking and alert delivery;
- migration/rollback ergonomics;
- expected pilot cost and operational complexity; and
- portability/exit risk.

The resulting Architecture Decision Record must name the chosen pilot architecture, rejected alternatives, cost assumptions, security boundaries and migration path. No provider is selected merely because an account already exists.

## Workstream C — Environment contract

Define local, staging and production configuration explicitly:

- environment names and resource isolation;
- required variables with safe startup validation;
- distinct databases, object storage, Stripe modes, webhooks and secrets;
- canonical dashboard, public and API origins;
- strict credentialed CORS allowlists;
- no production fallback to localhost, wildcard origins or test credentials;
- safe log redaction and privacy rules;
- build/release identity and version evidence; and
- documented credential rotation and emergency revocation.

## Workstream D — Deployment and migration safety

- create automated API/web build and complete-test gates;
- verify deterministic dependency installation;
- run Prisma migration status/check before deployment;
- use a single controlled migration executor;
- prohibit development migrations and seed scripts in production;
- define forward-fix and rollback decisions for code and schema;
- record deployed commit/migration set;
- define staging smoke tests and production go/no-go checks; and
- ensure failed deployment cannot leave an apparently healthy partial release.

## Workstream E — Observability and incident evidence

- structured application logs with request correlation and sensitive-field controls;
- error tracking for API and web failures;
- uptime/health checks that distinguish process health from dependency readiness;
- Payment/webhook/refund/reconciliation failure alerts;
- authentication abuse and public-endpoint rate-limit alerts;
- database saturation/storage and backup-failure alerts;
- named alert destinations and acknowledgement ownership; and
- initial severity, escalation and incident-record procedure.

## Workstream F — Backup, restore and storage

- managed database backups with retention and encryption evidence;
- point-in-time recovery decision;
- object-storage versioning/retention decision;
- restore into an isolated environment;
- measured recovery time and recovery-point evidence;
- integrity checks for Organisations, Events, Bookings, Payments, Tickets, inventory and Waiver records;
- documented destructive-action controls; and
- no claim of recoverability until a restore drill passes.

## Workstream G — Security hardening

- dependency and secret scanning with recorded disposition;
- production-like tenant and Event-assignment isolation tests;
- edge/login/public Booking/Payment/Ticket/Waiver abuse limits;
- privileged-user MFA/recovery/session-revocation decision;
- file-upload and object-access review;
- cookie/token/HTTPS and security-header review;
- production database/network least privilege;
- privacy data-flow, retention and deletion register update;
- Security and Privacy Gate with severity/owner/due-date fields; and
- no unresolved critical finding at closeout.

## Protected foundations

Sprint 31 must not redesign or weaken:

- tenant identity from authenticated server context;
- OWNER/MANAGER/STAFF/SCANNER and Event-assignment boundaries;
- server-authoritative pricing and Payment state;
- shared Session admission capacity;
- Product/Variant inventory and reusable capacity;
- Ticket/scan credential security;
- Waiver evidence independence;
- append-only adjustment, refund, reschedule and Flexible Ticket evidence; or
- the existing local development workflow.

## Required decisions before implementation lock

1. Hosting/provider shortlist and decision criteria.
2. Whether Sprint 31 deploys staging or only creates deployment-ready foundations.
3. Expected monthly pilot budget range.
4. Australian data-region requirement for database, objects, logs and backups.
5. Temporary account owner while the Glacier entity is formed.
6. Domain timing: wait, or secure an important candidate through a documented eligible temporary holder.
7. Alert recipients and operational owner.
8. Acceptable recovery objectives for the pilot.
9. Scope of external legal, privacy and security review.

## Required evidence

- committed architecture ADR and cost comparison;
- entity/domain/account ownership decision register;
- environment variable and secret inventory without secret values;
- automated full test/build/migration gates;
- staging or reproducible deployment evidence as scope-confirmed;
- explicit CORS/TLS/rate-limit verification;
- tenant/role production-like regression evidence;
- working logs/error/uptime/Payment alerts;
- successful isolated backup restore with measured results;
- dependency/security/privacy findings register;
- deployment, rollback/forward-fix and incident runbooks; and
- updated pilot roadmap and Sprint closeout note.

## Browser and operational acceptance

If staging deployment is included, acceptance must prove through its real HTTPS origins:

- dashboard authentication and tenant-scoped Event access;
- public Event and routed booking reads;
- Stripe test-mode Payment/webhook/reconciliation path;
- Ticket and Waiver presentation without mixed-content/CORS failure;
- representative OWNER/MANAGER/STAFF/SCANNER denials;
- safe error presentation with correlated server evidence; and
- no production or unrelated-tenant credential/data exposure.

Backup restore, alert delivery and migration failure/recovery require operator evidence beyond browser screenshots.

## Explicit exclusions

- live customer launch or live Stripe processing;
- final legal/tax/entity advice;
- automatic purchase of domains or cloud subscriptions;
- full visual redesign;
- broad new product features;
- individual-attendee rescheduling or deferred commerce expansion;
- penetration-test certification unless separately commissioned;
- physical event-day rehearsal; and
- claims of production readiness before Phase 3 exit evidence passes.

## Exit gate

Sprint 31 closes only when the organiser has approved the architecture and ownership path, the confirmed technical scope is implemented, automated baselines remain green, deployment and migration controls are reproducible, observability is actionable, restore evidence exists where included, critical security/privacy findings are resolved, documentation is current and any remaining entity/domain dependencies are explicit owners rather than hidden assumptions.

## Strategic result

Sprint 31 moves Glacier from a strong localhost operating system toward a controlled service. It should make the next infrastructure actions deliberate and reversible while the independent Glacier enterprise is formed, rather than allowing domain, IP, merchant and customer-data ownership to be inherited accidentally from Ice Rinks Australia.
