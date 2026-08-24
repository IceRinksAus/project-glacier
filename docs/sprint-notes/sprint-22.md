# Sprint 22 — Operational Dashboard and Core Event Reporting

## Status

Complete on 24 August 2026. Scope is controlled by `docs/roadmap/sprint-22-plan.md`.

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

## Slice 2 — Organisation Operations View

The second checkpoint adds `GET /reporting/organization` and replaces the dashboard placeholder and basic Event list with authenticated operational views.

The Organisation summary uses the authenticated Organisation ID and bounded, minimal selects across Events, Sessions and Bookings. It does not load or return customer names, participant details, contact details, Ticket credentials or Payment provider credentials. The summary provides:

- current and upcoming Event counts;
- Event-local Sessions occurring today and the next scheduled Session;
- confirmed Booking, issued Ticket and admission counts;
- gross collected, successful refunds and net collected;
- pending-Payment exception counts; and
- per-Event Session capacity utilisation using reserved plus confirmed Ticket quantities.

The Dashboard now provides an organisation-wide operational overview and links into Events requiring attention. The Events page now acts as a tracking workspace, showing lifecycle, operational volumes, capacity utilisation, next Session and Payment exceptions. OWNER-only Event creation remains available, while Event configuration continues within the existing Event workspace and creation wizard.

The read is capped at 100 Events, 5,000 Sessions and 50,000 minimal Booking rows. These explicit pilot bounds prevent unbounded API responses; pagination and stored aggregates remain later-scale work rather than hidden Sprint 22 scope.

## Slice 3 — Event Reports Workspace

The existing Event Workspace Reports tab now presents the authoritative Event report rather than a future-work placeholder. It includes commercial, Ticket and attendance summaries; Payment exceptions linked to the existing Booking investigation screen; and a deterministic Session utilisation table.

Organisers can filter by an exact Event-local date, a specific Session, or both. The interface displays the effective reporting window and Event timezone. Session rows distinguish shared admission capacity from Product inventory and show capacity, reserved attendance, confirmed attendance, remaining capacity, utilisation and actual admissions.

Payment exceptions now include both locally pending Payments and Bookings whose latest reconciliation attempt failed, including cases where the persisted Payment is no longer pending. This prevents a failed investigation signal from disappearing merely because another Payment state exists.

The workspace clearly labels its figures as operational Payment reporting rather than accounting, settlement, payout or tax records. It does not introduce a generic report builder, export workflow or second Payment operations system.

## Verification to Date

- Complete API suite: 67 suites / 435 tests passed.
- Complete web suite: 20 suites / 58 tests passed.
- API production build: passed.
- Focused tests cover empty Events, mixed Booking states, successful Payments/refunds, late-success net effect, pending exceptions, issued/admitted Tickets, Session utilisation, invalid dates, Melbourne-local day boundaries and cross-tenant denial.
- No schema migration or financial mutation was required.
- Organisation reporting focused checks: 10 tests passed; API production build passed.
- Dashboard and Events page focused checks: 2 tests passed; web lint has no errors and the webpack production build passed.
- Event Reports focused checks cover summary values, Session utilisation, exception drill-down and combined date/Session filters.

## Browser Acceptance

Authenticated acceptance on the canonical organiser preview verified the Dashboard, Events tracking page and Tenant Security Test Event Reports tab against existing local records. The Event report reconciled to AUD 290 gross, AUD 92 successful refunds and AUD 198 net; four confirmed Bookings; five issued Tickets; and the existing two Session capacity rows. Session filtering reduced the table deterministically.

A 390 × 844 responsive check showed no page-level horizontal overflow. The intentionally wide Session table scrolls within its bounded container. No Payment, refund, Booking, Ticket, admission or inventory mutation was performed during acceptance.

The local database reports all 30 Prisma migrations applied. Sprint 22 required no migration.

## Closeout

Sprint 22 meets its completion definition. An authorised organiser can identify operational Event attention from the Dashboard and Events page, inspect commercial and attendance performance, review shared Session utilisation, apply Event-local filters and open existing Booking investigation for Payment exceptions without database access.

No deployment was performed. Formal accounting, Stripe settlement/payout reconciliation, arbitrary analytics, exports and materialised aggregates remain outside this Sprint. The separate pilot-readiness strategic-roadmap edit remains outside the Sprint 22 commit sequence.

## Confirmed Next Reporting Requirements

The organiser has confirmed that Glacier's next reporting expansion should support detailed breakdowns and exports, including sales by Ticket Type and Session. Candidate reports also include sales by date, Product and Product Variant; admission and attendance; reusable Product utilisation; merchandise inventory movement; refunds and Payment state; and Waiver completion.

Required export directions are CSV, Excel-compatible XLSX, formatted PDF and print-friendly browser output. These are deliberately deferred from the locked Sprint 22 scope.

Before implementation, the next reporting plan must define allocation semantics. Ticket revenue comes from Booking Items and Product revenue remains separate. Whole-Payment and partial refunds cannot be attributed to a Ticket Type or Product without an explicit persisted allocation or documented proportional policy. Glacier must not imply precise category-level net revenue when the underlying refund record does not contain that attribution.
