# Sprint 36 — Calendar-led Session Operations

## Outcome

Sprint 36 replaces the organiser's long all-dates Session timeline with an
Event-timezone-aware calendar and selected-day operational agenda. Dates with
Sessions are marked, navigation is bounded to the Event period and the initial
date is selected deterministically: today when Sessions operate today, then the
next Session date, then the latest past Session date.

The selected day shows Session, active, draft, cancelled and schedule-exception
counts plus the operating span. Sessions remain chronologically ordered and
continue to open the existing detail/edit panel. Existing schedule-pattern
creation, overlap validation, Event-date validation, capacity protection and
dedicated cancellation behavior remain unchanged.

Each Session now exposes authoritative capacity commitment at a glance. The UI
uses the existing Event reporting values for reserved attendance, remaining
capacity and utilisation rather than deriving sales from Booking count:

- below 50%: green, `Lots available`;
- 50–79%: amber with the exact percentage reserved;
- 80–99%: orange, `Limited availability` with remaining places; and
- 100%: red, `Sold out`.

Every state also includes exact `reserved of capacity` text and an accessible
progress value, so colour is never the only signal. Availability refreshes
manually, after Session mutations and every 30 seconds while the page is
visible. The wording deliberately says reserved rather than sold because the
capacity authority includes RESERVED and CONFIRMED Bookings, not only settled
sales.

## Browser acceptance

Fictional Australian Ice Festival data was used. The calendar selected Saturday
26 June 2027, marked its one Session, showed one active Session, zero draft,
cancelled and exception Sessions, and displayed the 10:00–11:00 operating span.
The agenda showed `Lots available`, `4 of 175 reserved` and a progress value of
4 from the authoritative reporting response.

At 1024 × 768 and 390 × 844, the calendar, daily agenda, status text and mobile
navigation remained available with no horizontal overflow. The development log
retained one transient module-not-found message from the instant the old
timeline source was replaced during hot reload. The completed page loaded
normally afterward, and the isolated production build compiled successfully;
the transition message is not release evidence.

## Verification

- API: 91 suites / 644 tests passed; production build passed.
- Web: 34 files / 103 tests passed; production build passed.
- Focused calendar/capacity tests: 2 files / 7 tests passed.
- All 48 migrations remained current and replayed from empty state.
- Disposable authenticated tenant/role/MFA isolation passed 5 of 5 checks.
- The complete local release gate passed.
- Tracked-secret scanning passed across 639 files and 6 rules.
- Isolated PostgreSQL restore matched all 16 critical tables; the 0.29 MiB
  archive completed in 1.20 seconds and restored in 3.35 seconds.

## Protected foundations

No tenant, role, Event-assignment, Session mutation, Ticket, Payment, refund,
capacity-reservation, inventory, Flexible Ticket, Scanner, POS or public-booking
authority changed. No schema, migration or dependency change was required. No
real customer data, real Payment, domain, paid service or deployed device was
used.

## Remaining boundary

The organiser calendar is local application/database/browser evidence only.
Customer booking calendars, deployed concurrency and refresh behavior, real
POS/Scanner devices, managed production secrets, monitoring, accessibility
review and independent security review remain future evidence.
