# Sprint 42 — End-to-End Pilot Rehearsal and Workflow Hardening

**Status:** In progress from 20 September 2026

## Objective

Prove a representative fictional Event can be configured, activated, sold,
operated, supported and reconciled without developer shortcuts. Findings are
captured during the organiser walkthrough before bounded corrections are
implemented and verified.

## Rehearsal event

The organiser is creating **Glacier Harbour Lights 2026**, a fictional
Victorian Event, using the profile and expected transaction totals in
[`PILOT_REHEARSAL.md`](../operations/PILOT_REHEARSAL.md).

## Readiness slice

- Added a non-sensitive local readiness check for PostgreSQL, API, public web,
  organiser web, Stripe webhook forwarding and local webhook-secret presence.
- Added the complete fictional Event profile, catalogue, Rules, transaction
  evidence sheet and walkthrough order.
- First readiness run confirmed PostgreSQL, API and organiser dashboard were
  available. Public port 3001 and Stripe forwarding remain to be started before
  the public/payment stages.

## Walkthrough findings

### S42-F01 — Waiver appears too early in setup

- **Severity:** High
- **Where:** Event setup progress/order.
- **Expected:** Identity and dates, Sessions, Ticket Types, Products, Rules and
  Event-specific details should be configured before Waiver generation.
- **Observed:** Waiver is presented before the operational catalogue is ready.
- **Impact:** The organiser is prompted to create controlled legal evidence
  while Event configuration is still changing.
- **Correction direction:** Present Waiver as a late setup step, immediately
  before final readiness review and Event activation. Preserve direct access
  for later version management.

### S42-F02 — Waiver preview displayed another Event's details

- **Severity:** Blocker
- **Where:** Victorian Waiver Version 1 preview for the rehearsal Event.
- **Expected:** Every immutable draft contains only the selected Event's name,
  promoter, location, address and dates.
- **Observed:** The preview appeared to contain details from a different Event.
- **Impact:** A legal document could be reviewed or published with incorrect
  Event evidence.
- **Correction direction:** Reproduce with the rehearsal Event, verify the
  selected version is reset on Event navigation, prove tenant/Event scoping at
  API and UI layers, and add a regression test. Do not publish or use the
  affected preview.

### S42-F03 — Edited Event-specific Waiver fields did not reach preview

- **Severity:** Blocker
- **Where:** Event-specific details and generated Waiver preview.
- **Expected:** Generating an updated preview should create a new immutable
  draft containing the current promoter, location, address, dates and approved
  additional information.
- **Observed:** Edited fields did not appear in the displayed preview.
- **Impact:** The organiser cannot safely validate the exact document intended
  for publication.
- **Correction direction:** Distinguish unsaved form state from immutable
  generated versions, show which configuration produced each version, select
  the newly generated version reliably, and test all supported variables.

### S42-F04 — Waiver publication and Event activation sequence is unclear

- **Severity:** High
- **Where:** Waiver setup and Event readiness.
- **Expected:** Glacier should explain the safe sequence: configure Event,
  generate Waiver preview, publish the approved Event-specific version, then
  activate the Event.
- **Observed:** The early Waiver prompt and draft Event state made publication
  appear impossible until activation, while activation itself requires Waiver
  readiness.
- **Impact:** Organisers may perceive a circular dependency and be unable to
  complete setup.
- **Correction direction:** Reorder the flow and provide an explicit staged
  status. Waiver publication must remain possible for a draft Event; its public
  URL/QR remains unavailable until Event activation.

### S42-F05 — Session capacity input preserves a leading zero

- **Severity:** Medium
- **Where:** Session timetable creation, capacity default of 200.
- **Expected:** Clearing the field should permit entry of `100`.
- **Observed:** The controlled numeric field retains `0`, resulting in `0100`.
- **Impact:** Minor friction and uncertainty during repeated Session setup.
- **Correction direction:** Permit a temporary empty input state and validate a
  positive integer on continue/blur across every schedule mode.

### S42-F06 — Event identity and dates cannot be edited from Overview

- **Severity:** High
- **Where:** Event Overview identity/date panel.
- **Expected:** An authorised organiser can open the first Overview tile and
  edit suitable Event details, including dates, with clear downstream impact.
- **Observed:** The Overview is read-only and no Event edit path is exposed.
- **Impact:** A setup error requires abandoning or recreating the Event.
- **Correction direction:** Add an authorised Event-details editor. Protect
  invariants when Sessions, Bookings, published Waivers or public sales already
  exist; do not silently move operational records or rewrite accepted evidence.

### S42-F07 — Valid Event-local schedule rejected at date boundary

- **Severity:** Blocker
- **Where:** Daily schedule review and generation.
- **Expected:** A schedule from 2–5 October, matching the Event's displayed
  local dates, should generate four 10:00 Sessions.
- **Observed:** Glacier returned “Operational schedule must remain within the
  event dates.”
- **Impact:** No Sessions can be created, so Event readiness and the remainder
  of the pilot chain are blocked.
- **Cause:** The API compared date-only schedule values at UTC midnight against
  timezone-aware Event instants. A valid Melbourne calendar date could
  therefore appear earlier or later than its Event boundary.
- **Correction:** Compare schedule and Event boundaries as calendar dates in
  the Event timezone, and derive the web builder's limits in that same timezone.
  Retain the existing timezone-aware Session generation.

### S42-F08 — Disabled schedule review gives no reason

- **Severity:** High
- **Where:** Daily timetable builder.
- **Expected:** If review is unavailable, the screen should identify the exact
  incomplete activity field.
- **Observed:** **Next: Review schedule** was greyed out without an explanation.
- **Impact:** The organiser cannot tell whether name, start time, duration or
  bookable capacity is preventing progress.
- **Correction:** Display an inline checklist of every incomplete field and
  keep the button state tied to the same validation result.

## Immediate safety decision

Continue the organiser walkthrough, but do not publish or rely on the incorrect
Waiver preview recorded in S42-F02/S42-F03. Other configuration can continue so
additional usability findings are captured. The Waiver blockers must be fixed
and retested before Event activation or public Waiver acceptance.
