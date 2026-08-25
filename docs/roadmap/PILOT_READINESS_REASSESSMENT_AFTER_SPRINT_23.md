# Project Glacier — Pilot Readiness Reassessment After Sprint 23

**Prepared:** 25 August 2026

**Status:** Evidence-based roadmap decision record
**Relationship to strategic roadmap:** This reassessment supplements, but does not overwrite, `PILOT_READINESS_AND_STRATEGIC_ROADMAP.md`.

## Executive Conclusion

Glacier is no longer best described as only a v0.5 end-to-end booking foundation. Sprints 16–23 have added the principal organiser, customer, staff, security, payment-operations and reporting foundations required for an internal pilot.

The evidence supports describing the current position as:

> **Approximately v0.75 — functionally broad internal-pilot candidate, not yet operationally or production ready.**

Glacier should not begin a live customer pilot yet. The largest remaining risks are not missing analytical export formats. They are production infrastructure and controls, incomplete customer-service and walk-up operational workflows, physical-device/event-day validation, and formal security/privacy release evidence.

## Evidence Reviewed

- implemented Prisma schema and 31 current migrations;
- API route register and authenticated tenant boundaries;
- Sprint 16–23 delivery and verification records;
- current production checklist, security/privacy architecture and abuse-control decisions;
- 69 passing API suites / 456 tests;
- 21 passing web suites / 67 tests;
- passing API and webpack production builds; and
- local production-process startup and protected Reports sign-in boundary.

This is a repository and local-environment assessment. It is not production deployment evidence, a penetration test, legal approval or physical event-day sign-off.

## Updated Capability Position

| Capability | Evidence-based status after Sprint 23 | Remaining gate |
|---|---|---|
| Core Event, Session and schedule model | Implemented and locally verified | Production-scale and operator UAT |
| Ticket Types, Products, Variants and Rules | Implemented and locally verified | Operator UAT and production monitoring |
| Shared admission, reusable Product and finite Variant capacity | Implemented and protected | Operational scenario validation |
| Public Event site and routed booking | Implemented and browser-verified locally | Accessibility, resilience and real-customer UAT |
| Stripe payment and Ticket issuance | Implemented foundation | Live Stripe configuration, monitoring and production test plan |
| Event Waivers | Implemented foundation | Approved legal templates, privacy/legal sign-off and production storage controls |
| Event Setup Wizard and readiness | Implemented | Broader organiser UAT and UX refinement |
| Event branding and media | Implemented local-storage foundation | Managed Australian-region object storage and upload/security controls |
| Staff Scanner / check-in | Implemented foundation | Physical iPhone/Android/hardware tests, poor-network procedure and event-day sign-off |
| API and tenant hardening | Application boundary implemented | Production-like integration verification and formal security gate |
| Booking and Customer lookup | Implemented | Operational UAT and support runbook |
| Payment investigation/reconciliation | Implemented controlled foundation | Provider monitoring, escalation ownership and production Stripe evidence |
| Basic and decision-support reporting | Implemented and authenticated browser-verified beyond minimum pilot requirement | Production latency/cap monitoring |
| Event Groups and comparisons | Implemented | Organiser UAT with representative multi-city data |
| CSV and browser print/PDF | Implemented; detailed Event export action browser-verified | Representative export reconciliation and saved-Group acceptance |
| Booking change/reschedule operations | Not implemented as a controlled operator workflow | Confirm exact pilot policy and build minimum safe workflow |
| Operator refund/cancellation operations | Investigation exists; mutation workflow not complete | Confirm permissions, policy, audit and Stripe behaviour |
| Walk-up/on-site sales | Not implemented as a supported pilot workflow | Confirm Ice Rinks Australia requirement and build minimum viable flow |
| Production deployment | Not evidenced | Hosting, domains, HTTPS, environments and release process |
| Secrets, rate limiting and abuse controls | Decisions documented; deployment controls not evidenced | Configure and test at deployment edge |
| Logging, monitoring and incident response | Checklist/architecture only | Implement, assign ownership and test alerts/runbooks |
| Backup and restore | Not evidenced | Configure backup and complete restore test |
| Security & Privacy Gate | Not completed | Formal review, critical remediation and sign-off |

## Pilot-Critical Blockers

### 1. Production and operational hardening

Before internet exposure, Glacier requires a controlled hosting environment, HTTPS, managed secrets, explicit CORS, edge rate limits, central logs, error/uptime monitoring, backups with restore evidence, migration/release procedures and incident ownership. Reporting latency/cap monitoring and Stripe webhook/payment alerts must be included.

### 2. Customer-service workflow decision and delivery

Booking and Customer lookup are now present, but a real event needs an approved minimum policy for cancellation, rescheduling, Ticket consequences and refunds. The next plan must distinguish actions staff may perform, required OWNER approval, immutable audit evidence and failure/retry behaviour.

### 3. Walk-up sales decision

Ice Rinks Australia must confirm whether a supported Glacier walk-up flow is mandatory for the first pilot. If yes, it is a pilot blocker and should be intentionally narrow: Session, Ticket Types, required Products, payment method, participant details, Ticket issuance and optional Waiver handoff. It should not expand into a general retail POS programme.

### 4. Physical scanner and event-day sign-off

Complete the device matrix using physical iPhone Safari, Android Chrome and intended hand scanners. Test eligible, early, closed, cancelled, wrong-Event, duplicate and simultaneous scans; camera denial; weak/lost connectivity; Gate Entry versus Lookup; and the documented fallback/escalation procedure.

### 5. Security, privacy, legal and file-storage gates

Complete the formal Security & Privacy Gate, tenant isolation against a production-like database, dependency review, uploaded-file controls, retention/deletion policy, MFA/recovery decision, legal/privacy review and approved Waiver content. Critical findings block live public use.

### 6. Product and operational acceptance

Run representative organiser and customer scenarios without developer intervention: Event creation through activation, date/session/ticket/Product configuration, required Kanga behaviour, merchandise stock, Booking/payment/Ticket, waiver, scanner, lookup, reconciliation and reporting/export. Include mobile accessibility and error recovery.

## Recommended Next Roadmap Order

### Next milestone — Pilot Operations and Production Hardening

The next locked plan should prioritise:

1. confirm pilot operating policies for refunds, cancellation, rescheduling and walk-up sales;
2. close the minimum approved operator-service workflow gaps;
3. establish production hosting, secrets, HTTPS, CORS, edge abuse controls, logs, monitoring and backup/restore;
4. complete physical scanner/device and end-to-end operational acceptance;
5. execute the Security & Privacy Gate and production Stripe test plan; and
6. prepare pilot runbooks, ownership, rollback and support procedures.

This work may need more than one Sprint and should be divided only after the operating-policy decisions are made.

### Reporting productisation

Production XLSX workbooks and generated multi-page PDF remain valuable, but they are **not the next highest pilot priority**. Sprint 23 already provides authoritative CSV and browser Print / Save PDF. XLSX/PDF should follow once:

- pilot-critical operational gaps are scheduled or closed;
- representative exports are reconciled against authoritative records;
- production report volume and format needs are known; and
- organisers confirm that CSV/browser PDF is insufficient for an actual decision workflow.

Charts and further benchmarks should be added only when they materially improve decisions and preserve the current metric definitions.

## Explicitly Post-Pilot Unless Re-Promoted by Evidence

- generic report builder and broad BI;
- website conversion and marketing attribution before approved instrumentation;
- profit/margin before cost, tax and allocation models;
- general retail POS beyond the pilot walk-up requirement;
- customer CRM campaigns, memberships and Gift Cards;
- workforce, sponsorship and advanced asset/venue modules;
- Glacier B2B marketing site and SaaS self-service billing; and
- unsupported customer profiling or cross-Event identity analytics.

## Internal-Pilot Exit Criteria

Glacier reaches v0.8 only when Ice Rinks Australia staff can complete the normal operating chain without developer shortcuts:

Event setup → activation → public booking → payment → Ticket/optional Waiver → walk-up handling if required → scanner admission → Booking/customer support → reconciliation → reporting/export.

In addition, the environment must have tested security, monitoring, backup/restore and incident controls. Passing application tests alone is necessary but not sufficient.

## Immediate Acceptance Follow-Up

Authenticated detailed Event-report acceptance is complete, including Product/Variant and reusable-capacity wording, CSV action, authoritative baseline reconciliation and mobile horizontal-containment checks.

The remaining reporting acceptance item is to populate a representative saved Event Group intentionally, then verify its live comparison totals and print preview. CSV filename/content and print-control behaviour are already covered automatically; representative export reconciliation against operational records remains a production/pilot procedure.
