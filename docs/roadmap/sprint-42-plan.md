# Sprint 42 Plan — End-to-End Pilot Rehearsal and Workflow Hardening

**Status:** Proposed 20 September 2026; awaiting organiser scope confirmation

## Outcome

Prove that a representative Glacier Event can be configured, activated, sold,
operated, supported and reconciled without developer shortcuts. Sprint 42 is a
guided organiser/customer/staff rehearsal followed by bounded corrections to
the highest-value usability and integration gaps discovered during that
rehearsal.

This is primarily a workflow-hardening Sprint, not a broad feature Sprint. The
test is whether an organiser can understand what to do next and complete the
pilot operating chain using Glacier's existing authorities.

## Confirmed acceptance findings entering the Sprint

- The public Date step still presents dates as a list. It should use a compact,
  touch-friendly calendar with unavailable dates disabled, today selected for
  a live Event when available, otherwise the next available Event date.
- Local Stripe card payments require webhook forwarding. The Bathurst test
  Payment succeeded at Stripe but remained locally pending until manual
  reconciliation because no forwarding process was running.
- Event and Session activation must be obvious. Sprint 41 exposed individual
  and bulk Session activation plus clear Event activation requirements; Sprint
  42 must verify the complete readiness sequence from a fresh Event.
- Public Waivers now inherit Event branding and accepted evidence can be
  printed/saved as PDF. The rehearsal must verify the customer, operator and
  claim-evidence views together.

## Protected foundations

The following remain authoritative and must not be replaced by walkthrough
shortcuts:

- Organisation, role and Event-assignment enforcement;
- server-authoritative Rule, price, capacity and inventory evaluation;
- Stripe PaymentIntent/webhook/reconciliation authority and idempotency;
- Cash and standalone EFTPOS evidence separation;
- signed Ticket credentials, controlled reissue and atomic admission;
- Payment/refund, Ticket adjustment, rescheduling and Flexible Ticket ledgers;
- versioned Waiver templates, immutable accepted versions and private signature
  evidence; and
- reporting calculations and Event-local timezone semantics.

Only fictional local/test identities, payments and Event data may be used.

## Slice 1 — Rehearsal readiness and evidence sheet

- Define one representative fictional Event and expected operating profile:
  dates, Sessions, capacities, Ticket Types, Products, required-Product Rules,
  branding, Waiver, payment channels and staff roles.
- Record expected totals before transactions begin so Dashboard/Report results
  can be reconciled rather than judged visually.
- Add a plain-language local startup checklist covering PostgreSQL, API, web
  app and Stripe webhook forwarding.
- Add a safe webhook readiness check that identifies missing forwarding before
  a test purchase. Do not log or expose signing secrets.
- Preserve manual Payment reconciliation as recovery, not the normal payment
  completion path.

## Slice 2 — Fresh Event setup and activation walkthrough

The organiser will create and configure an Event without direct database
changes. Review:

1. Event identity, state/jurisdiction, venue, dates and timezone;
2. Event branding and authenticated draft Website preview;
3. schedule generation and individual/bulk Session activation;
4. Ticket Types, age ranges and presentation colours/images;
5. Products, Variants, inventory/reusable capacity and images;
6. required Product and Ticket-combination Rules;
7. approved compatible Waiver template, Event-specific substitutions, preview
   and publication;
8. Event settings and staff assignment; and
9. readiness explanation and Event activation.

Corrections should favour clear next actions, contextual explanations and
safe defaults. They must not weaken activation readiness or silently publish
draft configuration.

## Slice 3 — Public customer journey and calendar

- Replace the public Date list with an accessible calendar using the Event
  timezone and only authoritative active Sessions.
- Clearly distinguish selectable, unavailable, selected and past dates without
  relying on colour alone.
- Default to today's available date while an Event is live; otherwise use the
  next available Event date. Do not select a date with no bookable Session.
- Preserve routed navigation and browser recovery across Date, Session, Ticket,
  participant, add-on, details, review, payment and confirmation steps.
- Rehearse adult, child and young-child purchases, Rule explanations, required
  Kanga visibility, optional Products and Flexible Ticket presentation.
- Confirm the branded public Event, booking, Ticket and Waiver experiences feel
  like one customer website on desktop and representative mobile widths.
- Verify dependant Waiver completion and retained proof.

## Slice 4 — Payment and confirmation reliability

- Complete at least one Stripe test-card purchase with webhook forwarding
  running and prove automatic PAID/CONFIRMED transition plus Ticket issuance.
- Exercise a deliberately interrupted or missing-webhook scenario and prove
  the existing reconciliation action recovers provider truth without a second
  charge or duplicate Tickets.
- Verify reservation expiry, late success, idempotency and customer messaging
  remain accurate.
- Do not add real Payment credentials, production endpoints or a new provider.

## Slice 5 — POS and event-day operations

- Complete Cash and standalone EFTPOS walk-up Ticket sales.
- Complete merchandise-only sale and finite inventory checks.
- Verify touch-first catalogue/order-rail speed and required Product visibility.
- Look up a Ticket and a Booking containing multiple Tickets.
- Confirm deliberate admission, duplicate handling, wrong Event and early/late
  entry behavior.
- Confirm Waiver status is visible during lookup without exposing signature or
  dependant private data.
- Retain manager Rule override as a future controlled design unless rehearsal
  proves a safe, auditable scope. Do not use Product-only sales as hidden Ticket
  or capacity overrides.

## Slice 6 — Customer service and evidence retrieval

- Search and open recent Bookings and Customers.
- Exercise authorised rescheduling, per-Ticket cancellation/refund and Flexible
  Ticket request handling using fictional records.
- Confirm role and Event-assignment denials remain understandable.
- Open an accepted Waiver submission, retrieve the exact version and signature,
  and save the insurer-ready PDF evidence.
- Record manual email attachment as the interim process. Automated customer or
  insurer email remains deferred until an approved delivery provider, sender
  identity, privacy wording and delivery audit exist.

## Slice 7 — Reconciliation and management view

- Reconcile online card, Cash and standalone EFTPOS Payments to Bookings,
  Tickets, Products, refunds and admissions.
- Compare expected rehearsal totals with Dashboard, Event Reports and
  Organisation Reports.
- Validate Session utilisation, Ticket Type quantities, Product/Variant sales,
  booking pace, Payment-method totals and Waiver submission counts.
- Treat mismatches as defects or documented metric limitations; never alter
  data solely to make a report agree.

## Slice 8 — Prioritised corrections and operator runbook

Each walkthrough finding will be classified:

- **Blocker:** prevents or misstates payment, Ticket, admission, legal evidence,
  tenant/role scope or recovery;
- **High:** likely to cause queues, duplicate work or operator mistakes;
- **Medium:** material usability/accessibility issue with a safe workaround; or
- **Later:** enhancement not required for the pilot chain.

Implement approved Blocker and High findings in small verified slices. Record
Medium/Later findings without allowing them to displace pilot-critical work.
Produce a plain-language rehearsal/startup/runbook covering normal operation,
Payment recovery and escalation.

## Organiser walkthrough method

The organiser should send feedback as it occurs using this short structure:

1. **Where:** page and task being attempted;
2. **Expected:** what seemed like it should happen;
3. **Observed:** what actually happened;
4. **Impact:** blocked, slowed down, confusing or cosmetic; and
5. **Evidence:** Booking/Ticket reference or screenshot, using fictional data
   and excluding credentials.

The walkthrough may pause after any Blocker so it can be diagnosed before
later steps create misleading evidence.

## Security, privacy and production boundaries

- No raw Stripe, Booking-access, Ticket, Waiver-proof or session credential may
  be copied into documentation, logs or screenshots.
- Rehearsal conveniences remain unavailable in production unless separately
  designed and approved.
- No domain, hosting, cloud service, email provider, Wallet provider, device or
  other paid infrastructure will be purchased or provisioned in this Sprint.
- Managed production secrets, deployed HTTPS/origin/webhook testing, physical
  POS/Scanner devices, managed monitoring/backups and independent legal,
  accessibility, privacy and security review remain future evidence.

## Verification and exit gate

- Focused tests pass after each approved correction.
- Complete API and web suites and production builds pass.
- All migrations are current and replay successfully from empty state.
- Disposable tenant/role/Event/MFA isolation passes all checks.
- Isolated PostgreSQL backup/restore matches every critical table.
- Tracked-secret scanning and the complete local release gate pass.
- A written reconciliation compares expected and actual rehearsal outcomes.
- The organiser completes the representative chain or every remaining blocker
  is explicitly documented with owner and next action.
- Verified slices are committed locally; nothing is pushed without explicit
  approval.

## Scope confirmation required

Implementation begins only after the organiser confirms this Sprint 42 scope.
Walkthrough feedback may refine priorities inside the approved pilot chain but
must not silently expand the Sprint into unrelated platform breadth.
