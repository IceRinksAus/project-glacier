# Sprint 43 — Coherent Organisation Reporting

**Status:** Implementation and local verification complete; organiser walkthrough pending

## Objective

Turn Glacier's existing authoritative operational calculations into a coherent
organisation-level workflow with separate report discovery, setup and result
states, trustworthy multi-Event scope and matching exports.

## Slice 1 — Metric contract and reporting scope

- Recorded the six available report definitions, source records, refund
  treatment, time semantics, privacy limits and excluded claims in the
  reporting architecture.
- Confirmed that the existing server authority supports Sales Summary, Ticket
  Type, Session/capacity, Event-date, Product/Add-on and Booking Pace reports.
- Retained accounting, settlement, forecasting, marketing and customer-detail
  reports as explicit future scope.
- Corrected saved Event Group portfolio scope to fail closed when any Group
  Event falls outside the signed-in manager's Event assignments. Explicit
  checklist selection already used this all-or-nothing boundary.
- Added focused regression coverage for partial unauthorised Groups and the
  1–100 explicit Event-selection bound.

No reporting totals, commerce records or Event assignments are mutated by this
slice.

## Slice 2 — Three-state Reports navigation

- Reports home now contains the Organisation headline, grouped report library
  and Event Group administration without also rendering an active result.
- Selecting an available report opens a dedicated setup state with report,
  Event checklist, Group shortcuts and date control.
- Generating the report replaces setup with a focused result state, applied
  scope summary, print action and **Change report settings** return action.
- Returning to setup retains the selected report, Events and date in the
  current workspace.
- An active report no longer leaves the home catalogue, Event snapshot selector
  or Event Group administration underneath it.
- Added a clear **Back to all reports** action at the organisation level.

Focused web coverage proves the home/setup separation, multi-Event result
generation and settings return path. URL persistence of the complete selection
and date-range controls remains Slice 3 scope.

## Slice 3 — Durable scope and Event-local date ranges

- Replaced the single-day portfolio control with an optional inclusive
  **From / To** range evaluated independently in each Event's timezone.
- Date ranges fail closed when incomplete, reversed or longer than 366 days;
  exact-day and range filters cannot be mixed at the API boundary.
- Added Event-name search without changing the selected checklist, plus a
  visible selected-Event count and the existing authorised Group shortcuts.
- Report, selected Event IDs, date range and setup/result state are now kept in
  the URL. Refreshing or revisiting a result therefore retains its intended
  scope rather than silently returning to all Events.
- Event and Group access boundaries remain unchanged. Explicit Event lists are
  still checked all-or-nothing against the signed-in user's assignments.

Focused API and web coverage proves bounded ranges, Event search, URL state and
restoration of an explicit multi-Event selection.

## Slice 4 — Report-specific results

- Sales Summary now leads with gross collection, refunds, net collection,
  confirmed Bookings and average Booking value.
- Ticket Type results lead with units, gross Ticket sales, allocated refunds,
  net Ticket sales and admissions, with the unallocated-refund limitation
  stated beneath the evidence.
- Session results use capacity-weighted utilisation and show Ticket units, net
  collection, remaining places and admissions.
- Product results show units, gross Product sales, Bookings with Products,
  portfolio attach rate and the distinction between tracked inventory and
  inventory that is not tracked.
- Event Date results retain Event-local calendar semantics and summarise
  operating dates, Sessions, Ticket units, collection and weighted capacity.
- Booking Pace shows confirmed historical demand and explicitly avoids a
  forecast or conversion-funnel claim.
- Every result now includes AUD, generation time, Event scope, timezone/range
  semantics, an accessible exact-value table and a short metric definition.
- Detailed reports with no matching rows show a purposeful no-data state rather
  than an empty table.

Focused web tests and TypeScript checking cover the result transition, Sales
Summary headline traceability, generated evidence and retained setup controls.

## Slice 5 — Matching portfolio CSV and print evidence

- Added server-generated CSV exports for all six available organisation
  reports using the same authenticated portfolio query as the visible result.
- CSV requests preserve the exact selected Event IDs and Event-local date range;
  crafted or unauthorised Event IDs continue to fail through the shared report
  authority before any file is produced.
- Exports include generated time, applied scope, Event, Event timezone, range
  and report-specific exact values. Empty exports retain their evidence context.
- Existing formula-safe UTF-8 CSV encoding and safe filename handling now also
  protect organisation portfolio exports.
- The result screen exposes **Download CSV** alongside the existing focused
  **Print / Save PDF** action.

Focused API coverage proves trusted access-context delegation, private/no-store
download headers, filter metadata and spreadsheet-formula protection. Focused
web coverage proves that the downloaded file uses the visible selection and
range rather than rebuilding scope in the browser.

## Slice 6 — Closeout preparation

- Added a non-technical organiser walkthrough covering the three-state flow,
  one/multiple Events, Group shortcut, date validation, all six reports, empty
  data, matching CSV/print evidence and assigned-manager boundaries.
- Kept new accounting, settlement, marketing, customer-detail and forecasting
  ideas outside this Sprint's operational reporting authority.
- Managed production monitoring, deployed-device/performance evidence and an
  independent privacy, accessibility and security review remain future
  evidence; local verification cannot substitute for them.

## Local verification evidence

Completed 21 September 2026:

- API: 93 suites / 698 tests passed;
- web: 47 files / 145 tests passed;
- API and web production builds passed;
- configured database: 54 migrations found and current;
- disposable database: all 54 committed migrations replayed successfully;
- tenant, role and Event-assignment isolation: 5/5 checks passed;
- tracked-secret scan: 708 files / 6 rules passed; and
- isolated PostgreSQL backup/restore: 20 critical tables matched, 0.40 MiB
  archive, 0.66-second backup and 1.14-second restore.

The application test/build portion initially passed before PostgreSQL became
unreachable from the restricted Codex process. PostgreSQL's own log showed a
healthy server; after local-network permission was granted, readiness,
migration, isolation and restore checks passed. This was an execution
environment access issue, not a migration or data-integrity failure.

Final Sprint acceptance now requires the organiser walkthrough in
`docs/operations/SPRINT_43_REPORTING_ACCEPTANCE.md`. Nothing has been pushed.
