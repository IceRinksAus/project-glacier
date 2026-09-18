# Sprint 40 — Reporting Hub and Core Reports

## Outcome

Sprint 40 turns Reports into a useful management destination. Organisers now
see an authoritative headline position first, select an authorised Event and
open a clearly grouped report catalogue. Existing Event Groups remain available
for season, tour and campaign comparison, but no longer dominate the landing
experience.

The design deliberately combines the useful top-line visibility identified in
the legacy-system review with the cleaner report-card discovery supplied as a
second visual reference. Glacier retains its own accessible presentation and
protected reporting architecture.

## Reports hub

The `/reports` destination now shows:

- gross collected, successful refunds and net collected;
- Tickets issued and admissions;
- confirmed Bookings and Event lifecycle context;
- weighted shared Session-capacity utilisation;
- today's Session count and Payment exceptions;
- a selected-Event snapshot with capacity, net collection, Tickets and
  admissions; and
- an Event selector containing only Events returned through the authenticated
  Event authority.

The headline figures reuse `GET /reporting/organization`. The browser does not
calculate an alternative revenue source or claim that the Organisation totals
have a date filter they do not possess.

## Report catalogue and direct navigation

Reports are grouped into Sales and revenue, Tickets and operations, and
Financial and reconciliation. Available cards open the selected Event's
existing Reports tab directly at the relevant view:

- Event overview / Sales Summary;
- Sales by Ticket Type;
- Sales by Session and Session Performance;
- Sales by Event-local date;
- Booking Pace;
- Product and Add-on Performance;
- Capacity Utilisation;
- Attendance and Check-in;
- Refund Summary and Payment Exceptions; and
- Event Group comparison.

The report query parameter is validated against a closed set and defaults to
the Event overview. Direct navigation cannot select an unknown report or alter
the underlying Event access authority. Existing exact Event-local date and
Session filters, CSV export and browser Print / Save PDF remain intact.

## Payment-method reporting

The Event overview now provides a payment-method table for successful
Payments. It separates:

- online card;
- POS Cash; and
- standalone POS EFTPOS.

Each method reports the successful Payment count, gross collected, successful
refunds and net collected. The split comes from the persisted `Payment.method`
field; it is not inferred from a screen, Booking source or operator action.

These figures support Event operations and till investigation. They are not
processor settlement, bank reconciliation, payout, fees, profit, tax or
accounting records. Ticket Type and Product reports retain their explicit
refund-allocation limitations.

## Event Group configuration

OWNER can still create Event Groups, select and order Events, archive/restore a
Group, view its comparison scorecard and export comparison CSV. This capability
now appears below the report library under `Report configuration`. Non-OWNER
operators retain the existing read-only behavior and only see Events allowed by
their authenticated access context.

## Verification

- Focused API reporting: 2 suites / 24 tests passed.
- Focused web reporting: 2 files / 12 tests passed.
- API: 92 suites / 666 tests passed; production build passed.
- Web: 37 files / 115 tests passed; production build passed.
- All 50 Prisma migrations remained current and replayed from empty state.
- Disposable authenticated tenant/role/Event/MFA isolation passed 5 of 5
  checks.
- The tracked-secret scan passed across 665 files and 6 rules.
- Isolated PostgreSQL backup/restore matched all 16 critical tables; the 0.29
  MiB archive completed in 0.54 seconds and restored in 1.33 seconds.
- The complete local release gate passed.
- Fictional-data browser acceptance confirmed the populated Reports hub,
  narrow responsive card layout and direct navigation to Sales by Ticket Type
  with its filters, table and export controls.

## Protected foundations

No schema migration or dependency change was required. Organisation, role and
Event-assignment checks remain server-authoritative; SCANNER remains excluded
from management reports. Ticket credentials/admission, Booking, Rule, capacity,
Product inventory, Payment/refund, rescheduling, Flexible Ticket, POS and
Scanner foundations were not weakened.

Only fictional local data was used. No domain, hosting, email, cloud service,
hardware or other paid infrastructure was purchased or provisioned.

## Deferred evidence and scope

- Forecasting, customer demographics and marketing attribution.
- Abandoned-checkout reporting until an authoritative abandonment model exists.
- Scheduled or emailed reports.
- Server-generated XLSX/PDF unless operator evidence demonstrates a need beyond
  current CSV and browser PDF.
- Item-level refund allocation where Glacier lacks authoritative attribution.
- Cross-currency, settlement, payout, fee, profit, tax and accounting reports.
- Managed production secrets, deployed reporting monitoring and cap alerts.
- Real device/browser fleet validation and independent accessibility,
  accounting, privacy and security review.

## Approved organisational reporting refinement

Following organiser review, detailed reports now remain inside the
Organisation Reports destination instead of redirecting into an individual
Event page. Operators can switch report type while retaining an explicit All
Events, Event Group or individual Event scope. Multi-Event rows always identify
the source Event and preserve that Event's timezone and Event-local date
semantics.

The new bounded portfolio read supports overview, Ticket Type, Session,
Product, Event-local date and sales-pace reports. All Events is resolved through
the authenticated Event authority, Event Group scope requires access to the
selected tenant-owned Group, and individual Event scope uses the existing
not-found access boundary. The Event Reports tab now directs operators into the
same organisational workspace with that Event preselected, removing the second
competing report interface.

Post-refinement verification passed:

- Focused API reporting: 2 suites / 26 tests.
- Focused web reporting: 3 files / 14 tests.
- API: 92 suites / 668 tests; production build passed.
- Web: 38 files / 117 tests; production build passed.
- All 50 migrations remained current and replayed from empty state.
- Disposable authenticated tenant/role/Event/MFA isolation passed 5 of 5.
- Tracked-secret scanning passed across 668 files and 6 rules.
- Isolated PostgreSQL backup/restore matched all 16 critical tables; the 0.29
  MiB archive completed in 0.74 seconds and restored in 1.40 seconds.
- The complete local release gate passed.
- Fictional browser acceptance confirmed six authorised local Events in the
  All Events view, report switching without leaving `/reports`, explicit Event
  identity/timezone rows and authorised Group/Event scope choices.

### Multi-Event checklist refinement

Organiser review replaced the single Reporting Scope dropdown with an explicit
Event checklist. An operator can now include any one or more authorised Events,
select all, clear the list or use an accessible Event Group as a quick
selection. Applying a custom selection keeps the operator in the same report
and recomputes the table and headline totals across only those Events.

The API accepts a bounded explicit selection of 1–100 Event ids. It checks the
entire selection through the authenticated Event authority and fails closed if
any requested Event is outside that authority. Focused verification passed 2
API suites / 27 tests and 1 web file / 3 tests. The complete local release gate
then passed 92 API suites / 669 tests, 38 web files / 118 tests, both production
builds, all 50 migrations and 5/5 isolation checks. The tracked-secret scan
passed 668 files / 6 rules and isolated restore matched 16 critical tables.
Fictional browser acceptance confirmed a six-Event selection could be reduced
to five and applied without leaving the organisational report.
