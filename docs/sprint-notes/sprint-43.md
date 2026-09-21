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
