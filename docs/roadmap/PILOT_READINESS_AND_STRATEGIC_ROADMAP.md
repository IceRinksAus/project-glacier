# Project Glacier — Pilot Readiness and Strategic Roadmap

**Updated:** 3 September 2026

**Status:** Current strategic control document after Sprint 32; local Phase 3
production/security foundations are evidenced under the no-material-spend gate,
while deployed infrastructure, external controls and professional approvals
remain open

**Purpose:** Record Glacier's current evidence-based position, define the controlled phases to a live pilot, and prevent delivery priorities from depending on chat history.

**Supporting evidence:** `PILOT_READINESS_REASSESSMENT_AFTER_SPRINT_23.md`, `LEGACY_SYSTEM_CAPABILITY_REVIEW.md`, Sprint plans and Sprint notes.

---

# 1. Executive Position

Project Glacier is a multi-tenant event operating platform. Its first implementation is being shaped around session-based attractions and Ice Rinks Australia, but the product direction is broader than ticket selling.

After Sprint 32, Glacier is best described as:

> **Approximately v0.75 — a functionally broad internal-pilot candidate, but not yet operationally or production ready.**

The software now supports most of the intended end-to-end journey locally and
has reproducible release, isolation, restore, session-revocation and privacy
control foundations. The remaining route to pilot is primarily about completing
locally actionable security work, controlled infrastructure, real-device
validation, external security/privacy evidence and rehearsed support—not simply
adding more product breadth.

Glacier must not begin a live customer pilot until the release gates in this document have passed.

---

# 2. Product Surfaces

## 2.1 Organiser Platform

The authenticated Organisation-facing system used to create, configure, monitor and operate Events. Current foundations include Event creation and readiness, Sessions, schedules, Ticket Types, Products, Rules, branding, Bookings, Customers, Payment investigation, Event reports, Event Groups and exports.

## 2.2 Customer Event Websites

Public Event websites powered by Glacier, including Event branding, date and Session selection, tickets, participants, add-ons, booking, Stripe payment, confirmation, Tickets and Waiver journeys.

## 2.3 Staff and Event Operations

The on-site staff interface for automatic Gate Entry and Ticket Lookup followed by deliberate processing. It includes configurable entry windows and Ticket detail presentation.

## 2.4 Future Glacier Commercial Website

A future public B2B website will explain and sell Glacier to other operators. It is not part of pilot readiness and should describe demonstrated capabilities rather than future promises.

---

# 3. Delivered Foundation Through Sprint 32

The following are implemented foundations and should not be reopened without evidence of a defect, security risk or confirmed operational requirement:

- multi-tenant Organisations, Users, memberships and authenticated roles;
- Events, Sessions, schedules and Session exceptions;
- Ticket Types with shared Session admission capacity;
- Products, Variants, grouping, ordering, inventory and reusable per-Session capacity;
- backend-authoritative Rules and required Product behaviour;
- reservations, server-authoritative pricing and booking state;
- Stripe PaymentIntents, webhooks, persisted Payments/refunds, idempotency and late-success protection;
- Ticket issuance, public Ticket presentation and validation;
- Event Waiver persistence and digital acceptance foundation;
- staff Gate Entry and Ticket Lookup foundations;
- Event setup wizard, readiness checks, branding and media foundation;
- routed public journey beginning with Event date, then Session;
- tenant-safe Booking and Customer lookup;
- controlled Payment investigation and reconciliation foundation;
- Event reporting by overview, Ticket Type, Session, Event date, Product/Variant and booking pace;
- Event Groups and multi-Event comparison scorecards; and
- formula-safe CSV plus browser Print / Save PDF presentation;
- OWNER, MANAGER, STAFF and SCANNER role/assignment foundations; and
- shared-commerce walk-up Ticket sales with Cash and standalone EFTPOS evidence;
- merchandise-only POS commerce with finite inventory and Payment evidence;
- controlled per-Ticket cancellation/refund with immutable adjustment history; and
- controlled same-price whole-Booking Session rescheduling with replacement Tickets; and
- versioned Organisation/Event Flexible Ticket governance, selective per-Ticket purchase, Payment activation and immutable entitlement evidence; and
- possession-scoped Flexible Ticket requests, authorised review/decision, controlled refund or whole-Booking Session-change execution and exact post-completion use allocation.
- fail-closed production environment and origin contracts with health/readiness probes;
- portable container, complete release/migration and disposable tenant-isolation foundations;
- privacy-safe request evidence, HTTP hardening, local abuse protection and tracked-secret scanning;
- verified isolated local backup/restore across 12 critical tables;
- hardened branding-file handling and server-revocable operator sessions; and
- an actual-data privacy/retention/deletion register with unresolved controls retained as production blockers.
- signed Ticket possession credentials with no usable raw credential stored in PostgreSQL, one-way legacy compatibility and audited OWNER/assigned-MANAGER reissue.

Current verified baseline at Sprint 32 closeout:

- 47 current Prisma migrations;
- 89 API suites / 622 passing tests;
- 30 web test files / 88 passing tests;
- passing API and web production builds; and
- 5 / 5 authenticated disposable-database tenant/role checks, a tracked-secret
  scan across 613 files and an isolated restore matching 12 critical tables;
- authenticated/public browser acceptance of the previously delivered Flexible
  Ticket, reporting, access-control, walk-up, merchandise, partial-refund and
  rescheduling foundations.
- browser acceptance of current, migrated-legacy and rotated Ticket presentation, including immediate safe rejection of both former credentials.

This proves the local application baseline. It does not prove production readiness, legal approval, penetration resistance or event-day reliability.

---

# 4. Current Pilot Gaps

## 4.1 Remaining operating-policy decisions

The minimum cancellation/refund, rescheduling, Ticket replacement, role/assignment, Payment retry and walk-up foundations are now recorded and implemented. Ice Rinks Australia must still confirm before rehearsal:

- final Flexible Ticket fee, rights, cut-off, use limit and price-difference treatment;
- legally reviewed default non-refundable, flexibility and refund wording;
- whether fulfilled merchandise return/restock and post-start exceptional cancellation enter the pilot;
- pilot EFTPOS hardware/provider and selling-Session default;
- the representative pilot Event, volume, devices and staff roster; and
- named operational, Payment, technical, privacy/security and fallback owners.

Sprint 29 delivered configurable, disabled-by-default entitlement authority without pretending these commercial/legal values are approved. A live offer must not be enabled for a production Event until its material terms are deliberately published and commercially/legally approved.

## 4.2 Controlled customer-service actions

Sprints 27–28 delivered the minimum operator-controlled per-Ticket cancellation/refund and whole-Booking same-price rescheduling foundations. Every sensitive action remains tenant- and assignment-scoped, permission-controlled, append-only, idempotent and explicit about Ticket/capacity/Payment consequences.

Glacier now creates immutable purchased Flexible Ticket rights and provides a bounded possession-scoped customer workflow for requesting their use. Requests are non-mutating case records. OWNER or assigned MANAGER separately reviews and approves/declines, and approval delegates to the existing adjustment/refund or whole-Booking reschedule ledger. Uses are allocated only after successful completion; decline, withdrawal and failure consume none. Current settings and the legacy Booking Boolean are never historical authority.

Tickets are non-refundable by default, with that position clearly disclosed before purchase. MANAGER/OWNER discretionary exceptions remain available with reason/audit evidence. Customers may also purchase a Flexible Ticket entitlement giving covered Tickets defined change/refund rights for an additional fee. Coverage, fee, rights, deadline, price-difference treatment and accepted policy version must be snapshotted at purchase rather than inferred from later settings.

Through secure Booking access, customers may request refund for an individually covered Ticket or a Session change when every active Ticket in the unchanged Booking is covered. Both actions require OWNER/assigned-MANAGER confirmation during the pilot and are revalidated against current Ticket, capacity, cut-off and mutation facts. Individual-attendee moves, price-difference settlement and automatic decisions remain deferred. Staff can perform the equivalent dashboard workflows; discretionary exceptions always require MANAGER/OWNER approval.

Flexible Ticket terms use Organisation defaults with deliberate Event overrides. The effective fee, rights, limits and policy version are snapshotted at purchase, so later configuration changes affect only future purchases.

Sprint 24 established OWNER, MANAGER, STAFF and SCANNER access/assignment foundations. Sprints 27–28 now apply that authority to controlled partial Ticket cancellation/refund and whole-Booking Session rescheduling. MANAGER is the trusted site/operational role for those approved actions within assigned scope; STAFF handles POS and lookup without high-risk financial or rescheduling authority; SCANNER remains constrained to scanning duties; and OWNER retains Organisation governance. Each future sensitive mutation must continue to enforce both role and Event assignment in its controller and service boundaries.

## 4.3 Walk-up sales and remaining POS work

Walk-up Ticket sales are confirmed as mandatory and historically represent approximately 50% of sales. Sprint 25 delivered the operational staff flow using the same Ticket Types, Products, Rules, pricing, capacity and inventory as online booking.

The POS prominently shows and retains a selling Session, supports a deliberate time-based recommendation and permits future-Session sales. Optional configurable automatic advancement may be added later, but it must never switch an in-progress sale. Full till-style productisation remains a bounded UX concern.

Walk-up sales accept Cash and provider-neutral standalone EFTPOS confirmation. Payment methods are separately persisted, standalone terminal payments are not represented as Stripe, the receiving operator is retained and raw card data does not enter Glacier. A stable adapter boundary can support optional provider integrations later.

Potential future integrations remain Stripe Terminal, Linkly-connected bank terminals and Square. Selection is deferred until a current Australian capability, hardware, cost, compliance and operational comparison is completed; none should become a core-platform dependency.

Merchandise-only sales now use the Event Product/Variant catalogue, enforce finite inventory, reconcile by payment method and remain separate from admission Bookings/Tickets. Physical till/device UAT and broader reconciliation remain Phase 4 evidence.

## 4.4 Production environment and reliability

No live environment is yet evidenced. Local environment, container,
release/migration, observability-shape and restore foundations now pass.
Readiness still requires controlled hosting, domains, HTTPS, managed secrets,
real-origin CORS verification, coordinated edge limiting, central logs,
monitoring/alerts, managed backup/point-in-time restore, rollback execution and
incident ownership.

## 4.5 Physical device and event-day operations

The scanner and customer experience require physical iPhone Safari, Android Chrome and intended hand-scanner testing. Scenarios must include camera denial, weak/lost connectivity, duplicate/simultaneous scans, wrong Event, early/late arrival, cancelled Tickets and fallback procedures.

## 4.6 Security, privacy, legal and storage

The formal Security and Privacy Gate remains open. Local tenant isolation,
dependency disposition, session revocation, upload hardening and the privacy
data-flow register now have evidence. Privileged MFA/recovery delivery,
coordinated edge controls, Australian-region managed storage, approved
retention/deletion and legal holds, Waiver/legal approval, central monitoring,
Ticket credential redesign is locally implemented. Managed key custody and
independent review still require implementation or sign-off.

## 4.7 Representative operational acceptance

Ice Rinks Australia staff must complete the normal operating chain without developer intervention using representative data, devices and failure scenarios.

---

# 5. Phased Roadmap to Pilot

These phases are outcome-based. A phase may span more than one Sprint. Sprint scopes should only be locked after preceding decisions and dependencies are known.

## Phase 1 — Pilot Policy and Operational Scope Lock

**Objective:** Remove ambiguity about what the first pilot must operationally support.

### Scope

- approve default non-refundable, discretionary exception and Flexible Ticket policies, including cancellation, rescheduling and Ticket consequences;
- define OWNER, MANAGER and STAFF authority plus Event/site assignment scope;
- select pilot EFTPOS hardware/provider and lock selling-Session mode/configuration;
- define Payment exception and failed-refund escalation;
- nominate operational, technical, privacy and incident owners;
- select the pilot Event profile, devices, payment mode and expected scale;
- define support hours and fallback/manual procedures; and
- convert decisions into acceptance criteria.

### Deliverables

- Pilot Operating Policy;
- permission/action matrix;
- pilot scenario and volume profile;
- walk-up operating-scope decision record;
- support/escalation ownership matrix; and
- locked scopes for implementation Sprints.

### Exit gate

No unresolved policy question can materially change customer-service, POS, Ticket or Payment behaviour.

## Phase 2 — Minimum Pilot Operations

**Objective:** Close the smallest confirmed workflow gaps needed by real staff.

### Scope

- controlled default-policy, discretionary and Flexible Ticket refund/cancellation workflows;
- secure customer request plus controlled staff Booking/Ticket reschedule workflows;
- deterministic Ticket invalidation/reissue;
- append-only audit evidence and reason capture;
- OWNER/MANAGER/STAFF enforcement, assignment scope and tenant-safe service boundaries;
- Payment-provider failure, retry and idempotency handling;
- merchandise-only POS commerce and walk-up reconciliation follow-through; and
- focused organiser UX changes supported by UAT evidence.

### Excluded

Broad POS, CRM, generic workflow engines and speculative customer-portal work.

### Exit gate

Automated and browser tests prove every approved action, denial path, audit record, Ticket consequence and Payment failure path. Ice Rinks Australia accepts representative workflows.

## Phase 3 — Production Platform and Security Hardening

**Objective:** Create a controlled, observable and recoverable pilot environment.

### Scope

- separate production configuration and managed Australian-region hosting;
- HTTPS, domains and explicit allowed origins;
- managed secrets and credential rotation;
- production PostgreSQL and managed object storage;
- edge rate limiting and abuse protection;
- central structured logs with sensitive-field controls;
- application error, uptime, Payment/webhook and operational alerts;
- database/file backups and retention policy;
- completed restore drill with measured recovery time;
- automated build, test, migration and deployment checks;
- rollback and forward-fix procedures;
- production-like tenant-isolation verification; and
- formal Security and Privacy Gate remediation/sign-off.

### Exit gate

The environment can be deployed, monitored, backed up, restored and rolled back using documented procedures. No unresolved critical security/privacy finding remains.

## Phase 4 — End-to-End Rehearsal and Operational Readiness

**Objective:** Prove the complete system and operating team before real customers use it.

### Scope

- create a representative Event from a clean Organisation without developer shortcuts;
- configure Sessions, shared capacity, Ticket Types, Products, Variants and Rules;
- verify required Kanga behaviour and merchandise inventory exhaustion;
- complete public mobile booking, Stripe test payment, Ticket and Waiver journeys;
- exercise approved service and walk-up flows;
- test Gate Entry and Lookup on intended physical devices;
- test early, late, duplicate, simultaneous, cancelled and wrong-Event scans;
- test camera denial, poor connectivity and recovery;
- reconcile Bookings, Payments, refunds, Tickets, admissions, inventory and reports;
- validate a representative Event Group and exports;
- complete accessibility, privacy-content and runbook review; and
- conduct a timed event-day simulation with named roles.

### Exit gate

All critical scenarios pass without developer intervention. Accepted non-critical issues have an owner, workaround and due date. A formal go/no-go review authorises only the bounded pilot.

## Phase 5 — Controlled Live Pilot

**Objective:** Operate one deliberately bounded real Event and collect evidence for v1.0.

### Scope and controls

- restricted Event, Organisation, staff and customer population;
- production monitoring and named on-call ownership;
- daily Payment, refund, capacity, inventory and admission reconciliation;
- incident log and severity/escalation procedure;
- customer and organiser feedback capture;
- privacy/security observation and access review;
- agreed performance/reliability measures;
- no uncontrolled feature expansion during the live window;
- no unrecorded manual production-data repair; and
- agreed pause/rollback triggers for critical defects.

### Exit gate

A written pilot report reconciles commerce and operations, records incidents and feedback, and recommends remediation/rehearsal, a second controlled pilot, or progression toward v1.0.

## Phase 6 — v1.0 Production Release Preparation

**Objective:** Convert pilot learning into a repeatable production service.

### Scope

- remediate pilot findings and repeat affected gates;
- refine onboarding, support and release procedures;
- define service ownership and support expectations;
- confirm legal/commercial terms and privacy materials;
- establish repeatable Organisation onboarding; and
- approve the v1.0 capability/reliability baseline.

### Exit gate

Glacier can onboard and support another approved operator or Event without undocumented development-team knowledge.

---

# 6. Milestone Definitions

## v0.8 — Internal Pilot Ready

Reached after Phases 1–3 when approved operating workflows exist and a secure, observable, recoverable pilot environment is available. This does not authorise real customers.

## v0.85 — Rehearsal Passed

Reached after Phase 4 when the complete operating chain succeeds on real devices without developer intervention and the go/no-go group authorises a bounded pilot.

## v0.9 — Live Pilot Completed

Reached after Phase 5 when the controlled Event has operated and its technical, commercial and operational evidence has been reconciled.

## v1.0 — Production Release

Reached only after pilot findings are resolved and Glacier has repeatable deployment, support, onboarding, security, privacy and recovery controls.

---

# 7. Capability and Gate Matrix

| Capability                                 | Current position                                                                                           | Required next evidence                                                          | Phase |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----- |
| Core Event, Session and schedule           | Implemented                                                                                                | Representative operator UAT                                                     | 4     |
| Ticket Types, Products, Variants and Rules | Implemented                                                                                                | Capacity/inventory acceptance                                                   | 4     |
| Public routed booking                      | Implemented locally                                                                                        | Accessibility, resilience, customer UAT                                         | 4     |
| Stripe Payment and Tickets                 | Implemented foundation                                                                                     | Production alerts and reconciliation                                            | 3–4   |
| Event Waivers                              | Implemented foundation                                                                                     | Legal/privacy and storage approval                                              | 3–4   |
| Event setup and branding                   | Implemented foundation                                                                                     | Clean setup UAT, managed media                                                  | 3–4   |
| Staff Scanner                              | Implemented foundation                                                                                     | Device, concurrency, network sign-off                                           | 4     |
| Booking and Customer lookup                | Implemented                                                                                                | Support runbook and UAT                                                         | 2–4   |
| Refund/cancellation                        | Controlled per-Ticket cancellation/refund implemented                                                      | Approved terms plus representative operator/provider UAT                        | 1–4   |
| Flexible Tickets                           | Versioned policy, selective purchase, immutable entitlement, secure request and supervised use implemented | Commercial/legal approval plus representative operator/provider UAT             | 1–4   |
| Access levels                              | OWNER, MANAGER, STAFF and SCANNER foundations implemented                                                  | Representative assignment/denial UAT and audit review                           | 4     |
| Rescheduling                               | Controlled same-price whole-Booking workflow implemented                                                   | Representative OWNER/MANAGER operational UAT                                    | 4     |
| Walk-up sales                              | Shared-catalogue Cash/standalone EFTPOS Ticket flow implemented and browser accepted                       | Physical till/device UAT and reconciliation                                     | 4     |
| Merchandise-only POS                       | Implemented foundation                                                                                     | Physical till/device UAT and reconciliation                                     | 4     |
| Reporting and Event Groups                 | Implemented beyond minimum                                                                                 | Group/export reconciliation                                                     | 4     |
| Operational portfolio dashboard            | Introductory landing page plus authoritative reporting foundations                                         | Bounded decision-support dashboard after critical transaction sources stabilise | 2–4   |
| Production deployment                      | Reproducible local environment/container/release foundations                                               | Controlled deployed environment                                                 | 3     |
| Logs, monitoring and alerts                | Privacy-safe local evidence shape                                                                          | Central delivery, working alerts and ownership                                  | 3     |
| Backup and restore                         | Isolated local restore passed across 12 critical tables                                                    | Managed backup/PITR and deployed restore drill                                  | 3     |
| Security and Privacy Gate                  | Local isolation, sessions, files, abuse and privacy-register evidence; gate remains open                   | Remaining remediation, external review and sign-off                             | 3     |
| Event-day operations                       | Not formally rehearsed                                                                                     | Complete timed simulation                                                       | 4     |

---

# 8. Pilot Acceptance Chain

Glacier is only ready when Ice Rinks Australia staff can complete this chain without developer shortcuts:

Event setup → readiness/activation → date and Session → Ticket Types and Products → participants → payment → confirmation → Ticket/optional Waiver → approved service or walk-up action → Gate Entry/Lookup → reconciliation → reporting/export.

Mandatory cross-cutting evidence includes tenant/role isolation, capacity/inventory concurrency, Payment idempotency, backups, security/privacy approval, accessible mobile booking, physical scanner sign-off, production monitoring and named incident ownership.

---

# 9. Deferred Scope

Unless new operational evidence promotes them, the following must not displace pilot-critical work:

- generated XLSX and advanced multi-page PDF reports;
- generic report builder, broad BI and speculative benchmarks;
- marketing attribution before approved instrumentation;
- profit/margin reporting before reliable cost models;
- general retail POS beyond confirmed pilot walk-up needs;
- broad customer portal, CRM, memberships and Gift Cards;
- workforce, sponsorship, advanced venue and asset management;
- Glacier B2B marketing site; and
- SaaS self-service billing.

CSV and browser Print / Save PDF satisfy the present base reporting requirement.

---

# 10. Decision and Scope-Control Rules

Before promoting an item, ask:

1. Is it required for the approved pilot operating chain?
2. Does it close a security, privacy, Payment, data-integrity or event-day risk?
3. Is it supported by operator/customer evidence?
4. Can it be delivered without destabilising a protected foundation?
5. Does it have testable evidence and a named operational owner?

Each Sprint must record its phase outcome, scope boundaries, decisions/dependencies, required evidence, security/data-mutation implications, documentation changes and exact exit gate.

---

# 11. Strategic Direction After Pilot

Ticketing remains a major Glacier module, not the whole product. After pilot evidence proves the core service, expansion can move deliberately into event operations, richer venue management, workforce, assets, customer/CRM capabilities, commercial tools and evidence-supported decision intelligence.

Commercialisation—including the B2B website and SaaS billing—should follow a repeatable product and support model.

---

# 12. Immediate Next Action

Sprints 24–30 established role/assignment authority, walk-up and merchandise
commerce, controlled per-Ticket adjustment/refund, whole-Booking Session
rescheduling and the complete supervised Flexible Ticket chain. Sprint 31 added
the cost-controlled local production/security foundation and converted unknown
deployment/privacy assumptions into explicit evidence and gates.

Sprint 32 closed the locally actionable raw Ticket-credential-at-rest finding.
Ticket links now use selector/HMAC authority held outside PostgreSQL, legacy
local links use one-way hashes, and controlled reissue immediately invalidates
former authority with append-only non-secret audit evidence.

The immediate next action is to plan the next no-spend Phase 3 Sprint around
privileged MFA enrolment, challenge and recovery-code authority for OWNER and
MANAGER, without starting paid infrastructure or broad product expansion.
Deployment-edge, managed-storage, monitoring,
professional-review and real-device work remains queued behind the Product
Comfort Gate and explicit expenditure approval.

The remaining Phase 1 choices—exact commercial/legal values and wording,
EFTPOS hardware, pilot Event/devices/volume and named operational owners—must
still be closed before production rehearsal. They do not justify weakening the
implemented entitlement, Payment, Ticket or access-control authorities.

Phase 3 production/security work remains the primary track. Sprint 31 completed
the local deployable-environment and security-hardening foundation; subsequent
Sprints should close locally actionable findings, then activate deployed
controls only after their ownership and expenditure are approved. The
operational dashboard remains approved but must not displace production
readiness.

---

# 13. Current Strategic Conclusion

Glacier has delivered substantially more breadth than the original v0.5 roadmap recorded. The correct next move is not another broad feature Sprint.

The route to a credible pilot is:

> **decide operating policy → close minimum workflow gaps → harden production → rehearse end to end → run a controlled pilot → convert evidence into v1.0.**

This sequence protects the foundations already built, keeps the first pilot bounded, and makes readiness depend on observable evidence rather than optimism.
