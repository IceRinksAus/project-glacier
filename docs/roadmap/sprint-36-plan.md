# Sprint 36 Plan — Calendar-led Session Operations

**Status:** Approved 17 September 2026

## Outcome

Replace the organiser's all-dates Session timeline with a calendar-led,
Event-timezone-aware workspace. An organiser can choose an operational date,
scan that day's Sessions and understand committed capacity at a glance without
changing schedule, booking or capacity authority.

## Slice 1 — Date and capacity presentation contracts

- Add tested Event-timezone date-key, default-date and calendar-range helpers.
- Default to today when the Event has Sessions today, otherwise the next
  Session date, then the latest past Session date.
- Keep dates bounded to the Event and expose an explicit no-Sessions state.
- Define accessible capacity states from authoritative reserved attendance:
  - 0–49%: green, `Lots available`;
  - 50–79%: amber, exact percentage reserved;
  - 80–99%: orange, `Limited availability` plus remaining places;
  - 100%: red, `Sold out`.
- Always show exact reserved/capacity values and a labelled progress bar; colour
  must never be the only status evidence.

## Slice 2 — Calendar and daily agenda

- Add a keyboard-accessible month calendar with Session counts on relevant
  dates and bounded month navigation.
- Display only the selected date's Sessions, ordered chronologically.
- Retain Session time, name, status, capacity and schedule-exception evidence.
- Continue opening the existing Session detail/edit panel.
- Add selected-day summaries for total, active, draft, cancelled and exception
  counts plus the earliest/latest operational time.

## Slice 3 — Operational freshness and responsive acceptance

- Use the existing authorised Event reporting contract for
  `reservedAttendance`, `remainingCapacity` and `utilisationPercent`.
- Do not derive sold quantity from Booking count or redefine reserved capacity
  as settled sales.
- Refresh after Session mutation, expose a manual refresh action and refresh at
  a bounded interval while the page is visible.
- Apply the Glacier navy/blue, compact white-surface direction at desktop,
  tablet and mobile widths.

## Protected boundaries and exclusions

No change to tenant, role or Event-assignment authority; Session overlap,
Event-date or cancellation validation; Ticket issuance; Payment/refund;
capacity reservation; inventory; Flexible Tickets; Scanner; POS; or public
booking behavior.

Customer booking calendars, Products redesign, kiosk POS, scanner-connected
POS, native device applications and broad reporting redesign remain separate
future scopes.

## Verification and exit

- Focused tests cover timezone boundaries, default dates, calendar bounds,
  sorting, empty states, refresh and every capacity-status threshold.
- Existing Session create/edit/cancel and reporting tests remain passing.
- Fictional local browser acceptance covers dense Session dates at desktop,
  tablet and mobile widths.
- Complete API/web suites, production builds, migrations, disposable isolation,
  restore and tracked-secret gates pass.
- Verified slices are committed locally; no GitHub push without approval.

## Evidence boundary

This Sprint can prove local application/database/browser behavior only.
Deployed concurrency, production refresh behavior, real POS/Scanner devices,
managed secrets, monitoring, accessibility review and independent security
review remain future evidence.
