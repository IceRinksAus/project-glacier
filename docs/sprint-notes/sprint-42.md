# Sprint 42 — End-to-End Pilot Rehearsal and Workflow Hardening

**Status:** Walkthrough complete; remediation implementation in progress from
20 September 2026

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

Initial remediation now clears all Event-specific Waiver state before loading
a different Event, ignores stale responses from an earlier Event request,
marks edited fields as not yet included in the immutable preview and selects
the exact newly generated version after generation. Focused UI regression
coverage proves both Event switching and updated-preview selection. The
organiser retest remains required before F02/F03 are closed.

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

### S42-F09 — Schedule creation cannot activate reviewed Sessions

- **Severity:** High
- **Where:** Final schedule review.
- **Expected:** The organiser can explicitly choose whether the reviewed bulk
  Session set is created as draft or active.
- **Observed:** Every generated Session was forced into draft, requiring a
  separate bulk activation step.
- **Impact:** Avoidable setup work and a greater chance that an otherwise ready
  Event remains unavailable because Sessions were not activated.
- **Correction:** Add an explicit **Create Sessions as active** checkbox to the
  final review. Keep draft as the safe default and show the selected outcome in
  the primary action label. The server remains authoritative for the status.

### S42-F10 — Event creation feels like disconnected workspaces

- **Severity:** High; cross-cutting organiser experience.
- **Where:** Complete new-Event setup journey.
- **Expected:** One guided, resumable process should explain the order of work,
  preserve context and lead naturally from Event details to review and launch.
- **Observed:** Setup jumps between tabs. Some sections depend on configuration
  elsewhere, but those dependencies are discovered only after opening them.
- **Impact:** Organisers must understand Glacier's internal data model to know
  what to do next, increasing setup time and the chance of incomplete Events.
- **Correction direction:** Retain the specialist workspaces for later editing,
  but introduce a connected first-time setup journey with **Save and continue**,
  **Back**, persistent progress, dependency-aware explanations and a final
  review/activation step.

The proposed organiser sequence is:

1. Event identity, jurisdiction, venue, dates and timezone;
2. Sessions and whether generated Sessions are draft or active;
3. Ticket Types, age ranges and presentation;
4. Products and inventory/capacity model;
5. Ticket-combination and required-Product Rules;
6. Event-specific Waiver generation and publication;
7. Website branding and public preview;
8. operational settings and staff assignment; and
9. readiness review, issues to resolve and Event activation.

Each step should state why any dependency is required and link back to the
specific incomplete step. Later edits must remain available through Event tabs,
with impact warnings where Sessions, sales, published Waivers or accepted legal
evidence constrain changes.

### S42-F11 — Completed Waiver has no return action

- **Severity:** High
- **Where:** Public Waiver completion page reached from a confirmed Booking.
- **Expected:** After retaining or opening proof, the customer can return to the
  secure Booking/Ticket journey.
- **Observed:** The final page ended at completion proof with no route back.
- **Impact:** Customers become stranded outside the purchase journey and may
  repeat actions or close the site without finding their Tickets.
- **Correction:** For a booking-linked Waiver, return to secure Booking
  management using the existing fragment-held access credential. For a
  standalone QR Waiver, return to the public Event website. Keep completion
  proof as a separate secondary action.

### S42-F12 — Flexible Ticket choice is absent from Event setup

- **Severity:** High; included in S42-F10 guided-flow work.
- **Where:** First-time Event creation.
- **Expected:** The organiser deliberately chooses whether the Event inherits
  the Organisation policy, uses an Event override or does not offer Flexible
  Tickets before public preview/activation.
- **Observed:** The authoritative controls exist only under Event Settings and
  are not presented during creation.
- **Impact:** An Event can be launched without the organiser making or reviewing
  a commercial Flexible Ticket decision.
- **Correction direction:** Include the existing Event Flexible Ticket policy
  component in the guided operational-settings step. Do not create a second
  policy authority or silently enable coverage.

## Successful payment evidence

- With local Stripe webhook forwarding running, the organiser completed a
  fresh test-mode purchase end to end.
- Glacier automatically completed Payment/Booking state, issued Tickets and
  supported booking-linked Waiver completion without manual reconciliation.
- This is local integration evidence only; hosted webhook delivery and real
  settlement remain future production evidence.

### S42-F13 — Product-only POS cannot sell Session-linked Products

- **Severity:** Blocker for POS-3; High for event-day operations.
- **Where:** POS Product-only sale using a Kanga.
- **Expected:** Staff can sell a Kanga without creating a Ticket, but must select
  the Session whose finite Kanga availability will be consumed.
- **Observed:** Merchandise-only POS exposes only Products that require no
  Session and have no reusable Session capacity. The rehearsal Event therefore
  shows no eligible Products because Kanga and Skate Hire are Session-linked.
- **Impact:** A valid operational Product-only transaction cannot be completed.
  Simply exposing the Product would allow Session capacity to be oversold.
- **Clarified domain model:**
  - general merchandise is Event-scoped and uses global inventory only;
  - operational Products such as Kangas are Session-scoped and consume their
    Product capacity for the selected Session;
  - neither path creates a Ticket or consumes rink admission capacity; and
  - a Kanga-only sale must not be used to disguise a missing young-child
    admission, because that would still understate rink attendance.
- **Correction direction:** Add an optional authoritative Session association to
  retail Sales; require it for `requiresSession` Products; restrict the
  catalogue to active Product assignments for that Session; include reserved
  and completed retail quantities in Session-Product availability; preserve
  inventory, payment idempotency, Event access and reporting evidence; and show
  the selected Session on review, receipt and sale lookup.

POS-3 remains open until this is implemented, migrated, regression-tested and
reconciled against both Product capacity and admission capacity.

Implementation now adds an optional authoritative Session association to a
Retail Sale. The first interface placed Session-controlled Product sales in a
separate merchandise workflow; organiser testing correctly rejected that as
too slow for event-day queues. The primary POS now uses one Event and Session
context, presents Ticket and Product tiles together, and permits Tickets,
Products, or Products alone in the same order rail. A Product-only order is
recorded as a Retail Sale behind the scenes without exposing that accounting
distinction to staff.

Reservations and payment completion count both Booking Products and live or
completed Retail Sale items against the selected Session Product capacity.
The selected Session is retained automatically; a Product-only order creates
no Booking or Ticket and rink admission capacity is not changed.

Focused verification covers combined Session commitments, rejection without a
required Session, persistence of a valid Session association and a Kanga-only
checkout from the unified POS screen. The organiser then completed the
migrated local POS-3 journey successfully using the unified Event/Session
screen. S42-F13 is closed at the local application/database boundary; physical
POS hardware and deployed-environment evidence remain future work.

### S42-F14 — Change/refund explanation requirement is not discoverable

- **Severity:** Medium.
- **Where:** Booking Session change and Ticket cancellation/refund panels.
- **Expected:** The empty reason text box explains that an attributable
  explanation is required before the review action can continue.
- **Observed:** The action stayed disabled, but the text box contained no prompt
  explaining what was missing.
- **Impact:** Operators can mistake the disabled action for a system fault.
- **Correction:** Add contextual placeholder text to both required explanation
  fields while retaining the existing server validation and review-before-
  execute controls.

## Successful Booking-backed POS evidence

- All planned Booking-backed transactions completed successfully: the online
  Stripe cases plus Cash and standalone EFTPOS Ticket sales.
- Each resulting transaction was retrievable from the Bookings workspace.
- POS-3 remains excluded from this evidence pending S42-F13.

### S42-F15 — Reporting lacks a coherent information hierarchy

- **Severity:** High; cross-cutting management experience.
- **Where:** Organisation Reports workspace and individual report views.
- **Expected:** Reporting should make it obvious whether the organiser is
  choosing a report, filtering its scope or reading the result.
- **Observed:** The report catalogue, availability status, organisational
  scope, multi-Event selection, filters, top-line metrics and detailed output
  compete on the same surface. The experience feels fragmented and difficult
  to navigate.
- **Impact:** Organisers cannot confidently locate, configure or interpret the
  report they need even where the underlying figures exist.
- **Correction direction:** Treat reporting as a dedicated product review,
  preserving authoritative calculations while rebuilding the presentation
  around three clear states:
  1. **Reports home** — grouped searchable catalogue with plain-language
     descriptions and honest Available/Coming soon labels;
  2. **Report setup** — selected report, Event checkboxes/group shortcut, date
     range and only the filters relevant to that report; and
  3. **Report result** — one stable title/filter summary, a small top-line KPI
     row, the primary chart/table and clear export/print actions.
- **Navigation direction:** Keep Organisation reporting inside `/reports`;
  retain selected report, scope and filters during navigation; provide a clear
  **Back to all reports** action; do not jump into an Event workspace.
- **Design direction:** Use the clean report-card discovery pattern from the
  organiser references and the stronger top-line summary style from the legacy
  dashboard reference, without copying either system's clutter or unsupported
  metrics.

Detailed report definitions, accounting boundaries and export requirements
should be reviewed report-by-report after the Sprint 42 operational walkthrough
rather than changed piecemeal during it.

## Immediate safety decision

Continue the organiser walkthrough, but do not publish or rely on the incorrect
Waiver preview recorded in S42-F02/S42-F03. Other configuration can continue so
additional usability findings are captured. The Waiver blockers must be fixed
and retested before Event activation or public Waiver acceptance.
