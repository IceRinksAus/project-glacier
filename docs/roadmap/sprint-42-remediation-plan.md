# Sprint 42 Remediation Plan — Pilot Workflow Corrections

**Status:** Approved for implementation on 20 September 2026

## Outcome

Convert the completed organiser walkthrough into a safe, coherent pilot
workflow. Preserve Glacier's existing tenant, role, Event, Payment, Ticket,
capacity, inventory, Waiver and audit authorities while correcting the Blocker
and High findings that prevented or confused the operating chain.

This plan does not add paid infrastructure or treat local evidence as
production evidence.

## Finding disposition

### Corrected and focused-tested during the walkthrough

- S42-F07 — Event-local schedule boundary comparison;
- S42-F08 — explanation for disabled schedule review;
- S42-F09 — explicit draft/active choice during schedule generation;
- S42-F11 — secure return action after Waiver completion; and
- S42-F14 — discoverable explanation requirement for changes/refunds.

These corrections remain subject to the complete Sprint exit gate.

### Remediation work remaining

1. S42-F02/F03 — Waiver Event/version integrity and preview freshness;
2. S42-F13 — Session-linked Product-only POS sales;
3. S42-F01/F04/F06/F10/F12 — connected Event setup and safe Event editing;
4. public booking Date calendar from the approved Sprint 42 plan; and
5. S42-F15 — coherent Organisation Reports experience.

S42-F05, the Session-capacity leading-zero issue, is a bounded usability fix
and should be completed alongside the Event setup work.

## Slice 1 — Waiver integrity blocker

- Reproduce the cross-Event/stale-preview behaviour with fictional Events.
- Prove every Event Waiver query and mutation is scoped to the authenticated
  Organisation and selected Event.
- Reset Event/version selection when navigation changes context.
- Make unsaved Event-specific fields visibly distinct from an immutable
  generated version.
- After generation, select and display the newly created version and identify
  the configuration/version it contains.
- Cover every supported substitution: promoter, Event name, site address,
  location, dates and approved additional information.
- Preserve immutable published/accepted wording and private signature evidence.
- Permit publication while the Event is draft, but keep the public Waiver URL
  unavailable until Event activation.

**Acceptance:** Two fictional Events can generate different Waiver versions
without data crossing between them; changed fields appear only in a newly
generated immutable draft; the exact previewed version is the version
published and later accepted.

## Slice 2 — Session-linked Product-only POS

- Add an optional Session association to the authoritative retail-sale model.
- Require a selected active Session when any chosen Product requires a Session.
- Continue allowing general merchandise without a Session.
- Calculate availability using the same Session Product-capacity authority as
  booking-backed sales, including reserved and completed retail quantities.
- Do not create a Ticket or consume admission capacity for a Product-only sale.
- Show the selected Session in the catalogue, order review, receipt and lookup.
- Preserve Cash/EFTPOS evidence, idempotency, inventory and Event boundaries.

**Acceptance:** POS-3 sells one fictional Kanga against a selected Session,
reduces Kanga availability by one, leaves admission capacity unchanged, creates
no Ticket and is retrievable with its Session and Payment evidence.

## Slice 3 — Connected Event setup and editing

- Introduce a resumable setup path in this order: identity, Sessions, Ticket
  Types, Products, Rules, Waiver, Website, operational settings/staff, review.
- Provide Back and Save-and-continue actions while keeping specialist Event
  tabs available for later maintenance.
- Explain unmet dependencies and link directly to the incomplete step.
- Place Waiver preparation late in setup and explain draft publication versus
  public availability.
- Surface the existing Flexible Ticket authority in operational settings;
  never create a duplicate setting or silently enable it.
- Add an authorised Event identity/date editor with impact checks for Sessions,
  Bookings, published Waivers and accepted evidence.
- Permit a temporarily empty capacity input and validate a positive integer at
  the appropriate boundary.

**Acceptance:** An organiser can create a fresh Event in the intended order,
resume after leaving, understand every blocked next action, deliberately choose
Flexible Ticket policy, review readiness and activate without hidden knowledge.

## Slice 4 — Public booking calendar

- Replace the Date list with an accessible, touch-friendly calendar.
- Use Event-local dates and authoritative active Sessions only.
- Disable unavailable and past dates and distinguish states without colour
  alone.
- Select today when bookable for a live Event, otherwise the next bookable date.
- Preserve the chosen date across the existing booking steps and browser
  recovery.

**Acceptance:** Desktop and representative mobile customers can identify and
select a valid booking date without scanning a long list, and cannot select a
date with no active bookable Session.

## Slice 5 — Organisation Reports redesign

Reporting will remain at `/reports` and use three clear states:

1. **Reports home:** grouped/searchable catalogue, plain descriptions and
   truthful Available/Coming soon labels;
2. **Report setup:** selected report, Event checkboxes and optional Event-group
   shortcut, date range and only relevant filters; and
3. **Report result:** stable title and filter summary, small KPI row, primary
   chart/table and clear export/print actions.

- Do not route organisation report selection into an Event workspace.
- Retain selected report, Events and filters in navigable state.
- Provide an obvious return to the catalogue.
- Preserve current authoritative calculations until each metric's accounting
  boundary is explicitly reviewed.
- Initially prioritise Sales Summary, Sales by Ticket Type, Payment Method/Cash,
  Capacity Utilisation, Attendance/Check-in and Tickets & Bookings Detail.
- Reports without an implemented authoritative result remain Coming soon and
  cannot masquerade as complete.

**Acceptance:** An organiser can choose a report, select any permitted
combination of Events, apply relevant dates/filters, understand the scope of
the result and return to the catalogue without losing context or being moved
into an individual Event.

## Verification and evidence

Each slice receives focused API/web tests and a local commit before the next
high-risk slice. Closeout requires:

- organiser retest of the corrected Waiver, POS and Event-setup journeys;
- expected-versus-actual rehearsal reconciliation;
- complete API and web tests plus production builds;
- migration replay from an empty database;
- disposable tenant/role/Event/MFA isolation;
- isolated PostgreSQL backup/restore comparison;
- tracked-secret scan; and
- the complete local release gate.

Managed production secrets, deployed HTTPS/origin/webhook evidence, physical
POS/Scanner devices, managed backups/monitoring, real provider settlement and
independent legal, privacy, accessibility and security review remain future
evidence.

Verified work may be committed locally. Nothing is pushed without explicit
organiser approval.
