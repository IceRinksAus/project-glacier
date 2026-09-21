# Sprint 43 — Coherent Organisation Reporting

**Status:** Approved and implementation started 21 September 2026

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
