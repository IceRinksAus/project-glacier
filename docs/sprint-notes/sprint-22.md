# Sprint 22 — Operational Dashboard and Core Event Reporting

## Status

In progress from 24 August 2026. Scope is controlled by `docs/roadmap/sprint-22-plan.md`.

## Slice 1 — Reporting Read Model

The first checkpoint adds an authenticated Event report boundary at `GET /reporting/events/:eventId`.

The response is calculated from authoritative Event, Session, Booking, Payment, PaymentRefund and Ticket records. It returns operational summaries and Session rows without customer or participant details, possession credentials, client secrets or full provider references.

Implemented definitions include:

- confirmed Booking count and average Booking value;
- gross successful Payment amount;
- successful refunds and net collected;
- Booking and Payment state counts;
- pending-Payment exception links into existing Booking investigation;
- Tickets issued from confirmed Bookings;
- actual admissions and attendance rate; and
- reserved/confirmed Session attendance, remaining capacity and utilisation.

Event-local date filtering selects Sessions by their start date in the Event timezone. Payments and refunds remain associated through the selected Bookings regardless of their own transaction date, preserving advance-payment and later-refund truth.

The endpoint is bounded to 500 deterministic Session rows and 25 exception links. It accepts only strict date and Session filters, requires OWNER or MEMBER, resolves Event ownership through the authenticated Organisation and gives the same not-found boundary for foreign and unknown Events.

## Verification to Date

- Complete API suite: 67 suites / 431 tests passed.
- API production build: passed.
- Focused tests cover empty Events, mixed Booking states, successful Payments/refunds, late-success net effect, pending exceptions, issued/admitted Tickets, Session utilisation, invalid dates, Melbourne-local day boundaries and cross-tenant denial.
- No schema migration or financial mutation was required.
