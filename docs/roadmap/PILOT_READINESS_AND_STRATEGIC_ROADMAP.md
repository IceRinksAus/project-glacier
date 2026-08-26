# Project Glacier — Pilot Readiness and Strategic Roadmap

**Updated:** 26 August 2026

**Status:** Current strategic control document after Sprint 25 and the legacy-system capability review

**Purpose:** Record Glacier's current evidence-based position, define the controlled phases to a live pilot, and prevent delivery priorities from depending on chat history.

**Supporting evidence:** `PILOT_READINESS_REASSESSMENT_AFTER_SPRINT_23.md`, `LEGACY_SYSTEM_CAPABILITY_REVIEW.md`, Sprint plans and Sprint notes.

---

# 1. Executive Position

Project Glacier is a multi-tenant event operating platform. Its first implementation is being shaped around session-based attractions and Ice Rinks Australia, but the product direction is broader than ticket selling.

After Sprint 25, Glacier is best described as:

> **Approximately v0.75 — a functionally broad internal-pilot candidate, but not yet operationally or production ready.**

The software now supports most of the intended end-to-end journey locally. The remaining route to pilot is primarily about controlled operations, production infrastructure, real-device validation, security/privacy evidence and rehearsed support—not simply adding more product breadth.

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

# 3. Delivered Foundation Through Sprint 25

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
- shared-commerce walk-up Ticket sales with Cash and standalone EFTPOS evidence.

Current verified baseline at Sprint 25 closeout:

- 36 current Prisma migrations;
- 73 API suites / 487 passing tests;
- 24 web test files / 72 passing tests;
- passing API and web production builds; and
- authenticated browser acceptance of detailed Event reports, access controls and a fictional walk-up Cash sale with operator evidence and exactly one Ticket per participant.

This proves the local application baseline. It does not prove production readiness, legal approval, penetration resistance or event-day reliability.

---

# 4. Current Pilot Gaps

## 4.1 Operating-policy decisions

Ice Rinks Australia must confirm:

- cancellation and refund eligibility;
- rescheduling and Session-change policy;
- Ticket invalidation, replacement and audit consequences;
- OWNER, MANAGER and STAFF authority plus Event/site scope;
- treatment of Payment/refund failures and retries;
- walk-up payment methods and selling-Session operation; and
- event-day escalation and fallback ownership.

These decisions must precede implementation so Glacier does not encode an accidental operating policy.

## 4.2 Controlled customer-service actions

Lookup and investigation exist, but the pilot needs the minimum approved mutation workflows for refunds, cancellation and rescheduling. Every sensitive action requires tenant scope, explicit permissions, durable audit evidence, deterministic Ticket consequences and safe failure handling.

Partial attendee cancellation/refund is required: one Ticket within a multi-Ticket Booking can be cancelled and refunded while all other Tickets remain valid. Refund calculation must use the persisted original entitlement value and release only the capacity/inventory actually cancelled.

Tickets are non-refundable by default, with that position clearly disclosed before purchase. MANAGER/OWNER discretionary exceptions remain available with reason/audit evidence. Customers may also purchase a Flexible Ticket entitlement giving covered Tickets defined change/refund rights for an additional fee. Coverage, fee, rights, deadline, price-difference treatment and accepted policy version must be snapshotted at purchase rather than inferred from later settings.

Through secure Booking access, customers may request change/refund for covered Tickets. Straightforward eligible Session changes may complete automatically after authoritative Rule, Product, inventory, capacity, cut-off and price checks. Customer refund requests require MANAGER/OWNER confirmation during the pilot. Staff can perform the equivalent dashboard workflows; discretionary exceptions always require MANAGER/OWNER approval.

Flexible Ticket terms use Organisation defaults with deliberate Event overrides. The effective fee, rights, limits and policy version are snapshotted at purchase, so later configuration changes affect only future purchases.

Sprint 24 established OWNER, MANAGER, STAFF and SCANNER access/assignment foundations. MANAGER is the trusted site/operational role intended for approved refunds, cancellations and rescheduling within assigned scope; STAFF handles POS, lookup and preparation without high-risk financial authority; SCANNER remains constrained to scanning duties; and OWNER retains Organisation governance. Each future sensitive mutation must enforce both role and Event assignment in its controller and service boundaries.

## 4.3 Walk-up sales and remaining POS work

Walk-up Ticket sales are confirmed as mandatory and historically represent approximately 50% of sales. Sprint 25 delivered the operational staff flow using the same Ticket Types, Products, Rules, pricing, capacity and inventory as online booking.

The POS prominently shows and retains a selling Session, supports a deliberate time-based recommendation and permits future-Session sales. Optional configurable automatic advancement may be added later, but it must never switch an in-progress sale. Full till-style productisation remains a bounded UX concern.

Walk-up sales accept Cash and provider-neutral standalone EFTPOS confirmation. Payment methods are separately persisted, standalone terminal payments are not represented as Stripe, the receiving operator is retained and raw card data does not enter Glacier. A stable adapter boundary can support optional provider integrations later.

Potential future integrations remain Stripe Terminal, Linkly-connected bank terminals and Square. Selection is deferred until a current Australian capability, hardware, cost, compliance and operational comparison is completed; none should become a core-platform dependency.

The remaining POS commerce gap is merchandise-only sales from the same Event Product/Variant catalogue. These sales must enforce finite inventory and reconcile by payment method, but must not consume admission capacity, require participant details or issue Tickets. Session-capacity Products remain Session-bound.

## 4.4 Production environment and reliability

No live environment is yet evidenced. Readiness requires controlled hosting, domains, HTTPS, managed secrets, explicit CORS, edge rate limiting, central logs, monitoring, backups, restore evidence, deployment/migration procedures, rollback and incident ownership.

## 4.5 Physical device and event-day operations

The scanner and customer experience require physical iPhone Safari, Android Chrome and intended hand-scanner testing. Scenarios must include camera denial, weak/lost connectivity, duplicate/simultaneous scans, wrong Event, early/late arrival, cancelled Tickets and fallback procedures.

## 4.6 Security, privacy, legal and storage

The formal Security and Privacy Gate remains open. Production-like tenant isolation, dependency review, access recovery/MFA policy, upload controls, Australian-region managed storage, retention/deletion policy, Waiver/legal approval and privacy review require evidence and sign-off.

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

| Capability | Current position | Required next evidence | Phase |
|---|---|---|---|
| Core Event, Session and schedule | Implemented | Representative operator UAT | 4 |
| Ticket Types, Products, Variants and Rules | Implemented | Capacity/inventory acceptance | 4 |
| Public routed booking | Implemented locally | Accessibility, resilience, customer UAT | 4 |
| Stripe Payment and Tickets | Implemented foundation | Production alerts and reconciliation | 3–4 |
| Event Waivers | Implemented foundation | Legal/privacy and storage approval | 3–4 |
| Event setup and branding | Implemented foundation | Clean setup UAT, managed media | 3–4 |
| Staff Scanner | Implemented foundation | Device, concurrency, network sign-off | 4 |
| Booking and Customer lookup | Implemented | Support runbook and UAT | 2–4 |
| Refund/cancellation | Default non-refundable, discretionary and partial entitlement paths confirmed | Manager-authorised workflow and approved terms | 1–2 |
| Flexible Tickets | Entitlement and customer/staff workflow confirmed; implementation/terms gap | Purchase-time rights, secure requests, automatic eligible changes and approved refunds | 1–2 |
| Access levels | OWNER, MANAGER, STAFF and SCANNER foundations implemented | Representative assignment/denial UAT and audit review | 4 |
| Rescheduling | Policy/mutation gap | Approved controlled workflow | 1–2 |
| Walk-up sales | Shared-catalogue Cash/standalone EFTPOS Ticket flow implemented and browser accepted | Physical till/device UAT and reconciliation | 4 |
| Merchandise-only POS | Not implemented | Inventory-safe Sale/Order persistence and payment reconciliation without admission Booking/Tickets | 2 |
| Reporting and Event Groups | Implemented beyond minimum | Group/export reconciliation | 4 |
| Operational portfolio dashboard | Introductory landing page plus authoritative reporting foundations | Bounded decision-support dashboard after critical transaction sources stabilise | 2–4 |
| Production deployment | Not evidenced | Controlled deployed environment | 3 |
| Logs, monitoring and alerts | Design/checklist only | Working alerts and ownership | 3 |
| Backup and restore | Not evidenced | Successful restore drill | 3 |
| Security and Privacy Gate | Open | Review, remediation, sign-off | 3 |
| Event-day operations | Not formally rehearsed | Complete timed simulation | 4 |

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

The immediate planning work remains governed by **Phase 1 — Pilot Policy and Operational Scope Lock**, while completed Sprint 24–25 foundations move their remaining evidence into rehearsal.

It should begin with a short decision workshop and produce a written operating-policy record before another implementation Sprint is locked. The highest-impact questions are:

1. Which EFTPOS hardware/provider will be selected for physical pilot testing after the provider-neutral baseline exists?
2. Should the pilot use manual selling-Session control, optional automatic advancement, or automatic advancement by default?
3. How should existing MEMBER users migrate to STAFF or MANAGER, and how should Manager site/Event assignment work?
4. What pilot Event, devices, staff roles, expected volume and fallback procedures will be used?
5. Which named people own operations, Payments, technical incidents and privacy/security escalation?

Before another Sprint is locked, the remaining transaction priorities—merchandise-only POS, controlled refunds/cancellations, Ticket changes and reconciliation—must be ordered against production/security work. The approved operational-dashboard direction in `LEGACY_SYSTEM_CAPABILITY_REVIEW.md` follows stable authoritative transaction sources and must not displace a pilot-critical gate.

After approval, Phase 2 and Phase 3 can proceed in parallel where dependencies allow: operational workflows on one track and production/security foundations on the other. Phase 4 recombines them in one complete rehearsal.

---

# 13. Current Strategic Conclusion

Glacier has delivered substantially more breadth than the original v0.5 roadmap recorded. The correct next move is not another broad feature Sprint.

The route to a credible pilot is:

> **decide operating policy → close minimum workflow gaps → harden production → rehearse end to end → run a controlled pilot → convert evidence into v1.0.**

This sequence protects the foundations already built, keeps the first pilot bounded, and makes readiness depend on observable evidence rather than optimism.
