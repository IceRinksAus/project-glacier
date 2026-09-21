# Sprint 43 Plan — Coherent Organisation Reporting

**Status:** Proposed 21 September 2026; awaiting organiser scope confirmation

## Outcome

Turn Glacier's existing authoritative reporting calculations into one coherent
organisation-level reporting workflow. An authorised organiser should be able
to choose a report, select one or more permitted Events, set the relevant time
scope, read a clearly explained result and export the same evidence without
being moved into an individual Event workspace.

This is a reporting productisation Sprint, not a generic analytics or
accounting Sprint. It reorganises and extends trusted operational reports; it
does not invent unsupported figures to fill attractive cards.

## Evidence entering the Sprint

Glacier already has tenant- and Event-scoped server calculations for:

- Event commercial/ticket/payment/session overview;
- Ticket Type sales, allocated Ticket refunds and admissions;
- Session sales, collection, capacity and attendance;
- Product/Variant sales, attach rate, inventory and reusable capacity;
- Event-date performance;
- Booking/sales pace;
- multi-Event portfolio reads across up to 100 authorised Events;
- saved Event Group comparison; and
- formula-safe Event CSV plus browser print/PDF presentation.

The current weakness is the experience around these authorities. Reports home,
headline summary, report selection, scope controls, Event Groups, filters and
results compete on one long page. Some catalogue cards point to the same broad
result under different names, portfolio filtering supports only one Event-local
date, and portfolio exports are incomplete. Reports that are not built must
continue to say **Coming soon**.

## Protected foundations

- Organisation, role and Event-assignment access remains server-authoritative.
- SCANNER and other unauthorised roles gain no reporting access.
- Existing Booking, Payment, refund, Ticket, admission, capacity, inventory,
  rescheduling and Flexible Ticket ledgers remain the source of truth.
- Event-local timezone semantics remain explicit. Cross-Event output must not
  silently reinterpret local operating dates as one UTC date.
- Operational collection is not Stripe settlement, payout, profit, tax or a
  general ledger.
- Category-level net figures are shown only where refund allocation is
  authoritative. Unallocated refunds remain separately disclosed.
- Reports and exports contain no customer, participant, child, possession-token,
  signature or full provider-reference data unless a later explicitly approved
  detailed operational report requires and protects it.
- Existing Event → Reports remains Event-scoped; the main Reports destination
  remains organisation-level.

Only fictional local/test data may be used.

## In scope

### Available report set

Sprint 43 will productise the following existing authorities:

1. **Sales Summary** — confirmed Bookings, gross collected, refunds, net
   collected, Tickets and average Booking value;
2. **Sales by Ticket Type** — quantity, gross Ticket sales, allocated refunds,
   net Ticket sales and admissions;
3. **Session and Capacity Performance** — Tickets, net collection, reserved
   attendance, remaining capacity, utilisation and admissions;
4. **Sales by Event Date** — Sessions, Tickets, collection, utilisation and
   admissions grouped by each Event's local operating date;
5. **Product and Add-on Performance** — Product/Variant quantities, gross
   sales, attach rate, finite inventory and reusable per-Session capacity; and
6. **Booking Pace** — confirmed Bookings and Tickets by existing lead-time
   evidence, explicitly not a conversion funnel or forecast.

The organisation headline overview remains a dashboard-style entry point, not
a seventh configurable report.

### Explicitly deferred report set

The following remain visible as **Coming soon** and non-interactive until their
metric definitions and reconciliation boundaries receive a later approved
Sprint:

- Sales by channel;
- Payment Method, Cash and standalone EFTPOS summaries;
- refund investigation and Payment exceptions as dedicated reports;
- Tickets and Bookings detail containing personal information;
- customer demographics, repeat customers, email/marketing analytics and
  abandoned checkout;
- revenue forecasts and same-time Event comparisons;
- processor settlement, fees, payouts, invoices, tax, cost of goods and profit;
- scheduled/email reports, custom report builders and data warehouses.

Existing operational Payment/refund figures may still appear in Sales Summary
where their current definitions are already authoritative.

## Slice 1 — Metric contract and reconciliation baseline

- Record a compact metric dictionary for every available report: question,
  source records, included/excluded states, refund treatment, timezone,
  currency, privacy class and known limitation.
- Reconcile a fictional multi-Event fixture against expected Bookings,
  Payments, Tickets, Products, capacity and admissions before changing the UI.
- Add or strengthen API tests for selected-Event scope, assigned-manager scope,
  invalid/unauthorised IDs, caps and empty results.
- Preserve current calculations unless the reconciliation proves a defect. Any
  calculation correction must be documented separately from presentation.

**Acceptance:** Every available report has an agreed definition and automated
expected totals before its redesigned screen is accepted.

## Slice 2 — Three-state Reports navigation

Refactor `/reports` into three clear states while retaining URL-addressable
context:

1. **Reports home** — organisation headline, searchable/grouped report cards
   and honest availability labels;
2. **Report setup** — selected report description, permitted Event checkboxes,
   All/Clear actions, optional Event Group shortcut and relevant date controls;
3. **Report result** — stable report title, applied-scope summary, small KPI row,
   primary table/visual, definitions and export actions.

- Opening a report must not retain the entire home catalogue or Event Group
  administration beneath the result.
- Provide clear **Back to all reports** and **Change report settings** actions.
- Preserve report type, selected Event IDs and supported filters in navigable
  state so refresh/back does not unexpectedly reset the user's work.
- Keep Event Group administration as a separate supporting panel or route; it
  must not interrupt ordinary report reading.
- Ensure Coming-soon cards cannot masquerade as working reports.

**Acceptance:** The organiser can always tell whether they are choosing,
configuring or reading a report and can return without being routed into an
Event workspace.

## Slice 3 — Multi-Event scope and date-range contract

- Retain checkbox selection for any permitted combination of 1–100 Events.
- Event Group shortcuts populate the same checklist rather than establishing a
  hidden alternative scope.
- Add clear Event search when the authorised list is long.
- Add bounded `from` and `to` date controls where the report supports them.
- Interpret date bounds independently in each included Event's timezone and
  state that behaviour in the result.
- Validate `from <= to`, reject malformed values and apply a documented maximum
  range rather than running an unbounded query.
- Reports for which a date range is not meaningful expose only their relevant
  controls.
- Assigned managers can select only Events inside their assignment; a crafted
  Event ID fails closed.

**Acceptance:** An organiser can compare one, several or all authorised Events
over an intelligible range, and the URL/result summary reproduces that exact
selection.

## Slice 4 — Report-specific result presentation

- Give each available report its own purposeful KPI row and column set instead
  of reusing a generic table under several catalogue names.
- Lead with top-line figures similar in clarity—not visual duplication—to the
  organiser's legacy reference, followed by the detailed evidence.
- Use charts only where they improve interpretation; every chart must have an
  equivalent accessible table and must not hide precise values.
- Add clear empty, loading, stale/request-failure and partial/no-data states.
- Distinguish zero from unavailable/not tracked.
- Keep wide tables usable on desktop and horizontally contained on smaller
  screens without breaking the Glacier shell.
- Include generated time, scope, timezone/currency explanation and metric
  definitions in screen and print views.

**Acceptance:** Each report answers its named operational question at a glance
and a user can trace every headline to the detailed rows and definition.

## Slice 5 — Matching exports and print evidence

- Add portfolio CSV export for each available detailed report using the same
  authorised query, Event selection and date range as the visible result.
- Generate exports server-side from the same reporting authority; do not
  recalculate totals independently in the browser.
- Retain formula-safe UTF-8 cells, safe filenames, report/scope/generated
  metadata and privacy-minimal aggregate rows.
- Make browser Print / Save PDF show only the selected result, scope,
  definitions and generated time—not navigation, setup controls or the entire
  report catalogue.
- Test filenames, content disposition, filter parity and spreadsheet-formula
  protection.

**Acceptance:** Screen, CSV and print output agree for the same fictional
selection and cannot include an unauthorised Event.

## Slice 6 — Organiser acceptance and documentation

- Provide a short organiser walkthrough covering Reports home, one Event,
  multiple Events, an Event Group shortcut, date range, empty result, CSV and
  print/PDF.
- Reconcile the same fictional fixture across Sales Summary, Ticket Type,
  Session/Capacity, Event Date, Product and Booking Pace reports.
- Update reporting architecture, metric definitions, operational limitations,
  Sprint notes and the strategic roadmap.
- Record feedback outside the approved scope in a backlog rather than applying
  unrelated patches during closeout.

## Verification and exit gate

- Focused API and web tests pass after every slice.
- Complete API and web suites and production builds pass.
- All migrations are current and replay successfully from empty state.
- Disposable tenant/role/Event/MFA isolation passes all checks.
- Isolated PostgreSQL backup/restore matches every critical table.
- Tracked-secret scanning and the complete local release gate pass.
- Organiser acceptance confirms the three-state flow and representative
  report/export reconciliation.
- Verified slices are committed locally; nothing is pushed without explicit
  organiser approval.

## Outside Sprint 43

- Checkout Ticketing Terms/privacy/marketing implementation recorded as
  S42-F19;
- expanded public Event homepage content and content management;
- new accounting, settlement, forecasting or customer-marketing reports;
- generic BI/query builders, scheduled delivery or third-party analytics;
- production infrastructure, paid services or real customer data; and
- managed production monitoring, deployed performance evidence and independent
  privacy, legal, accessibility or security review.

## Scope confirmation required

Sprint 43 implementation begins only after the organiser approves this plan.
New report ideas discovered during review will be recorded for later triage
unless they expose a security, privacy or authoritative-calculation defect.
