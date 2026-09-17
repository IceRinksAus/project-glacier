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
