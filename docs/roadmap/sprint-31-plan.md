# Sprint 31 Plan — Production Architecture, Security and Entity-Control Foundations

## Planning status

Scope confirmed. Updated 1 September 2026 to operate under the no-material-spend development gate in `docs/decisions/ADR-007-NO-SPEND-DEVELOPMENT-GATE.md`.

## Recommendation

Sprint 31 is a decision-and-foundation Sprint for Phase 3. Glacier's operational chain is now broad enough that infrastructure choices affect security, recovery, privacy, cost and ownership. The Sprint will select and document a deployable architecture, close the highest-risk application configuration gaps and create reproducible staging foundations locally without representing Glacier as production ready or provisioning paid services.

Entity and asset ownership runs concurrently through `docs/business/GLACIER_ENTITY_AND_ASSET_OWNERSHIP_PLAN.md`. Ice Rinks Australia is the provisional incubation path, subject to professional confirmation before real operation. Technical work will use local services and placeholder hostnames. Live merchant, customer-data and production ownership must not be guessed.

## Objective

Produce a controlled deployment-ready architecture and security baseline that can later be provisioned, observed, backed up and recovered, while locally testing every control that can be evidenced without paid infrastructure and preserving Glacier's existing tenant, commerce, capacity, inventory, Ticket, Waiver and Flexible Ticket authorities.

## User outcome

The organiser has a clear infrastructure choice, realistic recurring-cost view, domain/ownership path and evidence-based checklist for moving Glacier beyond localhost. Developers can deploy the same reviewed build through automated gates without manually copying secrets or making undocumented database changes.

## Workstream A — Entity, domain and account control

- record provisional Ice Rinks Australia incubation and intended future ownership questions for domains, IP and infrastructure accounts;
- shortlist primary `.com` and defensive Australian domain candidates;
- record `.com.au` eligibility and formal transfer requirements;
- establish an asset/account register and two-person recovery principle;
- defer registrar purchase unless an ordinary-price domain is separately approved after the intended registrant is confirmed;
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

- define future managed database backup, retention and encryption requirements;
- retain the point-in-time recovery decision for funded infrastructure;
- define future object-storage versioning/retention requirements;
- perform a repeatable local backup and restore into an isolated local database;
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

## Decision register

1. **Hosting:** Google Cloud is the preferred future direction; no provisioning authorised.
2. **Sprint deployment scope:** reproducible local deployment foundations only; paid staging deferred.
3. **Current external-spend authority:** no material new commitment until Product Comfort Gate review; small reversible items require individual approval.
4. **Future monthly infrastructure allowance:** $250–$600 remains a planning estimate, not approved expenditure.
5. **Data region:** Australian regions remain proposed; final confirmation occurs before provisioning.
6. **Interim operating/account holder:** Ice Rinks Australia is provisional incubation path, subject to accountant advice.
7. **Domain timing:** purchase deferred.
8. **Alert recipients/operational owner:** pending before funded staging.
9. **Recovery objectives:** proposed RPO 15 minutes/RTO four supported-hours; pending before funded staging.
10. **External legal/privacy/security review:** deferred under the current gate, explicitly not waived before live operation.

## Required evidence

- committed architecture ADR and cost comparison;
- entity/domain/account ownership decision register;
- environment variable and secret inventory without secret values;
- automated full test/build/migration gates;
- staging or reproducible deployment evidence as scope-confirmed;
- explicit CORS/TLS/rate-limit verification;
- tenant/role production-like regression evidence;
- locally verifiable structured logs and alert-event foundations, with external delivery deferred;
- successful isolated local database backup/restore with measured results where safe and reproducible;
- dependency/security/privacy findings register;
- deployment, rollback/forward-fix and incident runbooks; and
- updated pilot roadmap and Sprint closeout note.

## Browser and operational acceptance

Paid staging deployment is not included under the current gate. A future staging acceptance must prove through its real HTTPS origins:

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
- any new paid product, business or professional-service commitment;
- full visual redesign;
- broad new product features;
- individual-attendee rescheduling or deferred commerce expansion;
- penetration-test certification unless separately commissioned;
- physical event-day rehearsal; and
- claims of production readiness before Phase 3 exit evidence passes.

## Exit gate

Sprint 31 closes only when the organiser has approved the architecture and provisional incubation path, the confirmed cost-controlled technical scope is implemented, automated baselines remain green, deployment and migration controls are reproducible locally, observability foundations are testable, local restore evidence exists where included, critical code/configuration security findings are resolved, documentation is current and every material paid production/security/entity dependency is explicitly deferred rather than represented as complete.

## Implementation evidence — 1 September 2026

The local release gate now includes a production-like tenant and role boundary
check. It creates a fresh local PostgreSQL database, applies all 43 committed
migrations, starts the real Nest application stack and authenticates synthetic
OWNER, restricted STAFF and SCANNER users. It proves cross-Organisation
not-found behaviour, assigned-Event filtering and scanner denial on ordinary
Event administration, then removes the temporary database.

After adding application abuse-protection evidence, the complete gate passed
with 86 API suites / 582 unit tests, 29 web test files / 85 tests, API and web
production builds, current migration status and 4 / 4 isolated integration
checks. The real HTTP-stack check proves a generic `429` after the configured
login threshold. The coordinated deployment-edge rule, forwarded-address
topology and external alert delivery remain unproven pre-live controls. This is
representative local evidence, not an independent penetration-test result or
approval for Internet exposure.

The file-upload and asset-access review then hardened Event branding without
expanding accepted formats or changing the organiser workflow. Glacier now
checks actual buffer size and bounded image structure, removes unsafe stored-name
characters, uses constrained server-generated local keys, avoids reflecting
filenames in response headers, and cleans up replaced local objects after the
metadata transaction commits. Private reads remain tenant-scoped and public
reads remain limited to the selected `READY` asset of an `ACTIVE` Event.

After this work, the complete gate passed with 87 API suites / 594 tests, 29 web
test files / 85 tests, both production builds, all 43 migrations current and
4 / 4 disposable-database integration checks. Managed private storage,
isolated image re-encoding, malware scanning, lifecycle evidence and deployed
object-access testing remain explicit pre-live requirements.

Persisted authentication sessions now bind every new eight-hour JWT to a
server-authoritative User and Organisation session record. Protected requests
reject missing, expired, revoked or mismatched sessions while continuing to
reload live membership authority. Current-session and all-session logout retain
revocation evidence, and dashboard/scanner sign-out calls server revocation
before clearing the device. Password recovery and mandatory OWNER/MANAGER MFA
are specified but remain blocking pre-live controls rather than simulated local
features without an approved delivery channel.

The complete gate passed with 87 API suites / 599 tests, 30 web test files / 88
tests, both production builds, all 44 migrations current and 5 / 5 disposable
database integration checks including immediate post-revocation denial.

The privacy data-flow review now maps operator access, public Event discovery,
online Booking, Payment/refund, POS, Ticket scanning, Waivers, Flexible Ticket
support, files, reporting, observability and recovery to the actual stored data
and access boundaries. It records current deletion constraints and supplies a
controlled access/correction/export, pseudonymisation, legal-hold and backup
ageing design. No statutory period has been invented: customer, participant,
financial, Ticket, Waiver, log, file and backup periods remain explicit
legal/accounting/insurance/privacy decisions before representative staging data
or live operation. The absence of implemented lifecycle controls is retained as
an open High finding rather than described as complete compliance.

## Strategic result

Sprint 31 moves Glacier from a strong localhost operating system toward a deployment-ready controlled service without forcing premature expenditure. It makes later infrastructure actions deliberate and reversible while Glacier is provisionally incubated inside Ice Rinks Australia, rather than allowing domain, IP, merchant and customer-data ownership to be inherited accidentally or paid for before the product comfort gate passes.
