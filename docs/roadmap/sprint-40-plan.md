# Sprint 40 Plan — Reporting Hub and Core Reports

**Status:** Approved 18 September 2026

## Outcome

Make Glacier reporting easy to discover and useful at a glance. Combine a
headline operational summary with a clean catalogue of focused reports, while
reusing the existing authoritative reporting calculations, filters, exports
and Event Group comparisons.

The Reports landing page should answer the first management questions quickly,
then provide obvious routes into supporting detail. It must not become an
accounting, tax, settlement or unrestricted customer-data surface.

## Product decisions

- The Reports landing page is a reporting hub, not primarily an Event Group
  administration page.
- Headline outcomes appear first; report discovery second; detailed tables
  appear only inside the selected report.
- The visual direction combines the legacy system's useful top-line summary
  with a cleaner, grouped report-card catalogue.
- Filter context should be consistent and intelligible across the hub and
  detailed reports.
- Existing Glacier calculations and access authorities remain the source of
  truth. Presentation must not introduce competing metrics.
- Reports without authoritative data remain clearly planned rather than
  appearing live.

## Slice 1 — Reports hub and catalogue

- Replace the Event Group administration-first landing experience with:
  - headline cards for gross collected, refunds, net collected, Tickets issued,
    admissions and capacity utilisation;
  - an Organisation/Event performance summary using the existing reporting
    authority;
  - grouped report cards with a concise description and availability state;
  - clear navigation into Event reports and Event Group comparisons.
- Keep Event Group creation and membership available to authorised OWNER users,
  but place it below the reporting experience as report configuration.
- Use Glacier's standard shell, full-height navigation and responsive card
  layout.
- Cover loading, empty, error and partially configured states.

## Slice 2 — Persistent reporting context

- Provide consistent context controls for Event Group, Event and date range
  where the selected report can honour them safely.
- Preserve Event-local timezone semantics.
- Carry the selected Event into its detailed report workspace.
- Do not imply that an Organisation-wide total is date-filtered unless the
  server calculation actually applies that filter.
- Keep assigned-Event restrictions authoritative for MANAGER and STAFF users.

## Slice 3 — Core detailed reports

Present the existing authoritative reports through clear focused choices:

1. Sales Summary;
2. Sales by Ticket Type;
3. Sales by Session;
4. Sales by Event-local date;
5. Product and Add-on Performance;
6. Capacity Utilisation;
7. Attendance and Check-in;
8. Booking Pace; and
9. Event Comparison.

Each available report should include, where applicable:

- its purpose and metric definitions;
- Event, Session and exact Event-local date filters;
- headline totals;
- an appropriate compact visual summary;
- a readable detail table;
- CSV export; and
- browser Print / Save PDF.

The implementation may reuse the existing Event report workspace rather than
create duplicate calculation or export paths.

## Slice 4 — Sales channel and financial visibility

- Add a bounded Payment-method/channel summary only where persisted Glacier
  data can distinguish online card, POS Cash and POS EFTPOS reliably.
- Present gross collected, successful refunds and net collected separately.
- Surface Payment exceptions using the existing investigation authority.
- Do not claim processor settlement, payout, fees, profit, tax or bank
  reconciliation.
- Category-level figures remain gross where refunds cannot be attributed to a
  Ticket Type or Product. The limitation must remain visible.

## Slice 5 — Report usability and visual acceptance

- Use clear category headings, report icons, concise descriptions and
  consistent availability labels.
- Avoid dense pivot tables as the default presentation.
- Ensure keyboard navigation, visible focus, semantic headings and non-colour
  status cues.
- Verify the hub and core reports at desktop and tablet widths using fictional
  local data.
- Preserve direct URLs, browser back navigation and safe print presentation.

## Initial report catalogue

### Sales and revenue

- Sales Summary
- Sales by Ticket Type
- Sales by Session
- Sales by Event Date
- Sales by Channel
- Booking Pace

### Tickets and operations

- Session Performance
- Capacity Utilisation
- Attendance and Check-in
- Event Comparison
- Product and Add-on Performance

### Financial and reconciliation

- Payment Method Summary
- Cash Sales
- EFTPOS Sales
- Online Card Sales
- Refund Summary
- Payment Exceptions

### Exports

- Ticket Type, Session, Event Date, Product/Variant and Booking Pace CSV
- Event Group comparison CSV
- Browser Print / Save PDF

Only reports backed by reliable current data will be marked available.

## Authority, privacy and compatibility boundaries

- Preserve Organisation, role and Event-assignment checks on every reporting
  endpoint and UI route. Navigation is not the security boundary.
- SCANNER remains excluded from management reporting.
- Preserve Ticket credential/admission, Booking, Rule, capacity, Product
  inventory, Payment/refund, rescheduling, Flexible Ticket, POS and Scanner
  foundations.
- General reports must not expose customer or participant identity, Ticket
  credentials, recovery codes, provider secrets or raw payment payloads.
- Capacity remains shared at Session level across Ticket Types.
- Product inventory and reusable per-Session Product capacity remain distinct.
- Use fictional local/test data only.
- Do not purchase or provision infrastructure or introduce unrelated dependency,
  schema or formatting changes.

## Focused verification

- Reports hub tests cover authoritative totals, grouped discovery, role-aware
  Event access, Event navigation and loading/error/empty states.
- Detailed report tests cover shared filters, metric definitions, tables,
  exports and print behavior.
- API tests cover any new channel/payment aggregation, tenant scope, assigned
  Event scope, bounded reads and refund treatment.
- Existing dashboard, Event reporting, Event Group, Payment, POS, Scanner and
  admission suites remain green.
- Browser acceptance uses fictional data at desktop and tablet widths.

## Exit gate

- Focused tests pass after each small slice.
- API and web suites and production builds pass.
- Migration status and disposable migration replay pass.
- Disposable tenant/role/Event/MFA isolation passes 5 of 5 checks.
- Isolated PostgreSQL backup/restore matches every critical table.
- Tracked-secret scan and complete local release gate pass.
- Documentation records delivered reports, definitions, acceptance evidence
  and limitations.
- Verified slices are committed locally. Nothing is pushed without explicit
  organiser approval.

## Explicitly deferred

- Revenue forecasting and speculative projections.
- Customer demographics, marketing profiling and email campaign reporting.
- Abandoned-checkout analytics until Glacier has an authoritative abandonment
  model.
- Scheduled or emailed reports.
- Accounting, tax, processor settlement, payout and profit claims.
- Refund allocation guesses at Ticket Type or Product level.
- Cross-currency reporting.
- Server-generated XLSX or PDF unless operator evidence shows CSV and browser
  PDF are insufficient.
- Managed production monitoring, deployed infrastructure, real-device evidence
  and independent accounting, accessibility, privacy and security review.
