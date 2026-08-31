# ADR-007 — No-Material-Spend Development Gate

## Status

Accepted by the organiser on 1 September 2026.

## Decision

Continue building and validating Glacier without entering any material new paid commitment for the platform or a separate Glacier business until the organiser is satisfied that the product can perform the required operational role.

This means no paid:

- company, trust, business-name or trademark establishment;
- domain registration;
- cloud hosting, managed database, storage or monitoring service;
- new production email, Stripe, banking or merchant arrangement;
- external legal, accounting, insurance, security or penetration-testing engagement;
- production hardware purchase or rental; or
- subscription entered specifically for Glacier,

unless the organiser separately and explicitly approves that item after reviewing its purpose, exact price, renewal/exit terms and ownership.

Small, reversible protective or testing expenses—such as an ordinary-price domain—may be proposed individually. This is not blanket spending authority: no purchase is made without explicit approval, and any item costing hundreds or thousands of dollars remains blocked until the Product Comfort Gate unless a genuine blocker is separately considered.

Existing development tools, local hardware, local PostgreSQL, existing Ice Rinks Australia resources and already-authorised subscriptions may continue to be used. Their actual cost should still be recorded so the eventual viability model is honest.

Cost control means **defer material external expenditure, not lower engineering standards**. Required controls remain in the design, code, tests and readiness register. Any control that cannot be truthfully evidenced locally remains an explicit funded pre-live dependency rather than being removed or marked complete.

## Operating pathway

Ice Rinks Australia is the provisional incubation path for development and a possible initial testing season. This is a commercial planning assumption, not legal/accounting confirmation that the arrangement is appropriate.

Before any real customer, live Payment or production personal data is processed:

- the accountant must confirm the operating/entity treatment;
- the contracting and merchant entity must be identified;
- insurance coverage must be confirmed;
- required legal/privacy/customer terms must be approved;
- production infrastructure and security gates must be funded and passed; and
- ownership of domains, code, accounts and data responsibilities must be documented.

## Development implications

Work may continue on:

- product functionality and user experience;
- automated tests, security controls and tenant isolation;
- local browser acceptance;
- reproducible container/build/deployment definitions;
- environment and secret contracts using placeholders;
- local migration, backup and isolated restore exercises;
- logging, health, alert-event and incident-runbook foundations;
- provider comparisons and dated cost models; and
- documentation required for later professional review.

Work must not claim that local simulation proves managed-cloud backup, external alert delivery, HTTPS edge controls, real-device reliability or production recovery.

## Product comfort gate

The no-material-spend gate may be reconsidered only after the organiser has:

1. completed an end-to-end browser review of the organiser, customer, POS, Ticket, Scanner, Payment, refund/reschedule, Flexible Ticket, Waiver and reporting journeys;
2. reviewed a clear list of remaining product limitations and deferred functions;
3. accepted representative Event setup and operating workflows without developer shortcuts;
4. reviewed passing automated/build/security evidence;
5. reviewed the deployment, operating and recovery plan;
6. reviewed low/expected/national-scale cost and viability scenarios; and
7. explicitly approved a capped next funding gate.

Passing this gate does not automatically authorise production. It permits a separate decision on the minimum paid staging, professional advice and assurance work justified by the proposed pilot.

## Rationale

At approximately 25,000 annual Tickets, Glacier's direct avoided provider fee is about $25,000 and does not comfortably justify independent-company and full production overhead. A future national Winter Festival could materially improve the economics, but that volume is not guaranteed. Continuing locally preserves the substantial product work already completed while limiting irreversible cash commitments until operational usefulness and commercial scale are better evidenced.

## Reconsideration triggers

- organiser completion of the Product Comfort Gate;
- credible national Winter Festival planning approaching 100,000 or more annual Tickets;
- serious external-client demand or contracted volume;
- a technical requirement that cannot be validated responsibly without a paid service; or
- a security/legal requirement that must be resolved before further meaningful testing.
