# Sprint 31 — Production Architecture, Security and Entity-Control Foundations

## Status

Implemented and locally verified on 2 September 2026 under the confirmed scope
in `docs/roadmap/sprint-31-plan.md` and the no-material-spend gate in
`docs/decisions/ADR-007-NO-SPEND-DEVELOPMENT-GATE.md`.

Sprint 31 is a local production-foundation milestone. It is not a deployment,
penetration-test result, legal/privacy approval or authority to use real
customer data.

## Delivered

### Production environment contract

- Production startup now requires explicit canonical API/public/dashboard
  origins, strict credentialed CORS and non-development secrets.
- Unsafe localhost, wildcard-origin and test-credential production fallbacks
  fail closed.
- Liveness and dependency-readiness probes distinguish a running process from a
  usable database-backed service.
- A proposed Google Cloud Australian-region pilot architecture, environment
  contract, deployment/migration runbook and production checklist are
  documented without provisioning paid services.

### Reproducible build and recovery foundations

- Portable API and web container definitions build the reviewed application
  without changing the local developer workflow.
- `npm run verify:release` runs the complete API/web tests, both production
  builds, migration status and disposable tenant/role isolation check.
- `npm run verify:restore` creates a real local PostgreSQL backup, restores it
  into an isolated database, compares 12 critical tables and removes the
  temporary target.
- Migration execution, rollback/forward-fix, smoke checks and destructive-action
  boundaries are recorded in the operations runbooks.

### Observability and HTTP hardening

- API requests receive correlation identity and privacy-safe structured
  completion/failure evidence without request bodies, query strings or raw
  possession credentials.
- Baseline API and web response headers now cover content sniffing, framing,
  referrer leakage and browser feature restrictions. HSTS and final CSP remain
  real-HTTPS-edge decisions.
- Locally testable abuse protection covers operator login and selected
  high-risk public endpoints with generic `429` responses and safe alert-event
  evidence.
- Production requires an explicit trusted-proxy hop count; coordinated edge
  enforcement and alert delivery remain pre-exposure controls.

### Security verification

- `npm run verify:secrets` scans the tracked tree for six high-confidence
  credential classes without printing matched values.
- The dependency audit records zero web findings and one open High API advisory
  inherited through Prisma tooling, with no compatible upstream fix currently
  available and no unsafe forced override.
- `npm run verify:isolation` creates a fresh migrated database and authenticates
  synthetic OWNER, restricted STAFF and SCANNER users against the real Nest
  stack. It proves cross-Organisation denial, Event-assignment filtering and
  scanner denial on ordinary administration.
- The formal findings register contains no currently known unresolved Critical
  issue, while open and unassessed controls remain explicit.

### File and possession boundaries

- Event branding keeps its tenant/private and ACTIVE-Event public selection
  rules while adding actual buffer-size, bounded image-structure, safe-name and
  constrained storage-key checks.
- Replaced local development objects are cleaned up after metadata commit and
  filenames are not reflected in download headers.
- Managed private object storage, isolated re-encoding, malware scanning and
  deployed lifecycle/access evidence remain pre-live requirements.
- The privacy review identified the raw-at-rest Ticket possession token as a
  Medium design risk requiring a rotation/hash-compatible design before live
  Ticket use.

### Authentication lifecycle

- Every new eight-hour operator JWT is bound to a persisted
  `AuthenticationSession` using a random UUID session identifier.
- Protected requests reject missing, expired, revoked, mismatched or no-longer
  authorised sessions.
- Current-session and all-session logout revoke server authority before the
  dashboard/scanner clears local authentication state.
- The password-recovery and privileged-MFA contract is documented. Secure email
  recovery and mandatory OWNER/MANAGER MFA remain High pre-live blockers.

### Privacy lifecycle

- The data-flow register maps operator access, public Events, online Booking,
  Payment/refund, POS, Tickets/scans, Waivers, Flexible Tickets, files,
  reporting, observability and recovery to the actual database/API boundaries.
- Current deletion constraints, denormalised identity snapshots, children and
  Waiver data, logs, exports, files and backups are explicitly classified.
- A controlled access/correction/export, transactional pseudonymisation,
  legal-hold and backup-ageing design is recorded.
- No statutory retention period was invented. Approved periods, notices,
  subprocessors, legal holds and tested customer-rights workflows remain a High
  gate before representative staging data or live operation.

### Entity, ownership and spending control

- Ice Rinks Australia is recorded as the provisional incubation path, subject
  to accountant/legal confirmation before real operation.
- Domain, IP, cloud, merchant and customer-data account ownership questions are
  preserved in the asset/ownership register and professional-advice brief.
- No domain, cloud service or professional engagement was purchased or
  provisioned.
- Material spend remains blocked until the Product Comfort Gate. Small
  reversible expenditure requires separate approval.

## Final verification

The final application and database evidence passed across the closeout run:

- API: 87 suites / 599 tests;
- web: 30 test files / 88 tests;
- API and web production builds;
- 44 committed Prisma migrations current;
- disposable tenant/role integration: 5 / 5 checks;
- tracked-secret scan: 604 files / 6 rules;
- isolated backup/restore: 12 critical tables matched;
- backup archive: 0.27 MiB;
- measured backup: 0.59 seconds;
- measured restore: 1.58 seconds; and
- clean Git working tree after the privacy-register commit.

These timings describe the small local development database and are not a
production recovery-time claim.

## Findings and remaining gates

There is no currently known unresolved Critical finding from the completed
local evidence. The following remain blocking or explicitly deferred:

- open High Prisma dependency advisory, to be rechecked before exposure;
- coordinated edge rate limits, trusted-proxy verification and alert delivery;
- mandatory privileged MFA and approved password-recovery delivery;
- legally approved privacy/retention/customer-rights and Waiver controls;
- private managed storage, image re-encoding, malware scanning and lifecycle
  evidence;
- central logs, uptime/error/Payment alerts and named incident ownership;
- managed PostgreSQL backup, point-in-time recovery and restore drill;
- reviewed Git-history/provider credential inventory and rotation;
- Ticket possession-token at-rest redesign;
- independent security/penetration testing;
- real HTTPS origin, device and event-day rehearsal; and
- final entity, merchant, legal, accounting, insurance and privacy approvals.

Open High findings prohibit internet/live exposure. Deferred expenditure is not
treated as a waiver.

## Protected foundations

Sprint 31 did not redesign pricing, Payment authority, shared Session capacity,
Product/Variant inventory, Rules, Ticket admission semantics, Waiver evidence,
refund/reschedule/Flexible Ticket ledgers or the local browser-development
workflow.

## Closeout result

Sprint 31 meets its cost-controlled local exit gate. Glacier now has a
reproducible and evidence-backed path from localhost toward a controlled pilot
environment, with the difference between local proof and production proof
clearly recorded. It remains an internal-pilot candidate, not a live service.

The next Sprint should continue the no-spend Phase 3 track by selecting the
highest-risk locally actionable security work from the findings register before
any broader product expansion. Paid infrastructure and professional approvals
should be activated only through the Product Comfort Gate.
