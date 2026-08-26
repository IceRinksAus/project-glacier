# Sprint 28 — Controlled Whole-Booking Session Rescheduling

## Status

Implemented and accepted on 26 August 2026 under the locked scope in `docs/roadmap/sprint-28-plan.md`.

## Delivered

Glacier now supports one controlled whole-Booking Session change for an eligible confirmed, paid Booking. OWNER and Event-authorised MANAGER users can inspect valid same-Event destinations, preview exact admission/Product/Ticket consequences, record a controlled reason and mandatory note, and separately confirm the high-impact action. STAFF and SCANNER do not receive the mutation surface and remain denied by the guarded API.

The server independently revalidates access, Booking/Ticket state, time, same-Event destination, Ticket Type/Rule compatibility, shared admission capacity, reusable Product assignments/capacity and unchanged price/content at preview and execution. OWNER is not an override.

Execution uses a serializable transaction with bounded concurrency retry. It moves Session-bound Booking authority, transfers reusable Product commitments, invalidates every original Ticket, creates exactly one high-entropy replacement credential per participant and completes immutable `BookingReschedule`, Ticket mapping and Product allocation evidence. Finite Event-wide merchandise stock, Booking lines, total and Payments remain unchanged. The client preview hash and retained idempotency key make exact retry deterministic.

## Persistence

The forward-only Sprint 28 migration adds controlled reschedule status/reason enums, `BookingReschedule`, `BookingRescheduleTicket`, `BookingRescheduleProductAllocation`, Ticket replacement relations, idempotency/active-operation constraints and investigation indexes. Local history contains 40 migrations.

## Consumer and reporting behaviour

An original Ticket presentation now states that it was replaced after a Session change and withholds its QR. Authenticated validation and the staff scanner reject that credential and provide only the safe replacement Ticket number, never its possession token. Replacement credentials use the destination Session and normal entry-window rules.

Operational reporting excludes only superseded original credentials from issued/admission counts, preventing replacement double-counting while retaining ordinary Ticket cancellation history. Completed Session changes and controlled reasons are exposed as aggregate Event metrics without customer or participant identity. Booking/Session attribution follows the destination; gross Event, Ticket Type and Product commerce remains unchanged.

## Verification

Checkpoint verification before the consumer/reporting close-out passed:

- Booking reschedule service: 18 tests;
- Booking investigation interface: 4 focused tests;
- complete API baseline: 77 suites / 514 tests;
- complete dashboard baseline: 25 files / 75 tests;
- API production build; and
- dashboard webpack production build.

Consumer/reporting focused verification added 35 API tests across reporting, Ticket presentation and scanner services, plus 18 dashboard tests across Event Reports and scanner presentation.

Final verification passed:

- complete API suite: 77 suites / 517 tests;
- complete dashboard suite: 25 files / 75 tests;
- API production build; and
- dashboard webpack production build.

## Authenticated browser acceptance

Using fictional Booking `PG-1787007707147-3352`, the Ice Rinks Australia OWNER reviewed and approved a whole-Booking move from **Monday 1 September - 10:30am** to **Monday 1 September - 12:00pm**. The separate confirmation disclosed two Tickets, two shared admission places, one unchanged Kanga Skating Aid, unchanged `$52.00` total and no Payment/refund. Glacier completed `BR-1787739065117-68B382`.

The Booking remained `CONFIRMED` and `PAID` at `$52.00` and moved to 12:00pm. Two originals became `CANCELLED`, two replacements became `ACTIVE`, immutable history displayed the old/new Session and operator, and the Ticket-adjustment panel refreshed so originals were visibly unavailable. The acceptance pass also changed the summary label from **Tickets issued** to **Ticket records**, avoiding an implication that historical cancelled credentials remain current.

Direct persistence verification confirmed one completed ledger, two unique Ticket mappings, one Product allocation with zero reusable capacity transfer, two active replacements and two cancelled originals. Active admission availability was 171/175 at 10:30am and 148/150 at 12:00pm, proving the two-place transfer. The acceptance fixture assigned the existing finite Kanga Product to the destination Session; no inventory quantity was changed.

The old public Ticket presented **Replaced after Session change**, named only the safe replacement Ticket number and exposed no QR. Staff Ticket Lookup denied it as replaced. The replacement public Ticket displayed its 12:00pm QR; Ticket Lookup resolved it as `ACTIVE` for 12:00pm and correctly returned **Too early** because the configured entry window opens at 11:30am on 1 September 2027. Automated clock-based scanner evidence covers acceptance inside the entry window without weakening server-time policy.

The Event overview displayed one completed Session change under `CUSTOMER_REQUEST`, contained no customer/participant identity in that aggregate and attributed 2/150 operational attendance commitment to the destination. Exact idempotency replay, role/assignment denial, rollback and concurrency behaviour remain covered by automated service tests because browser submission protection removes the duplicate execution control after completion.

## Operational boundary

Sprint 28 does not implement individual attendee movement, partially adjusted Booking movement, customer self-service, Flexible Ticket entitlement, different-Event transfer, content/price changes, additional Payment/refund, scanned/post-start override, full cancellation or arbitrary Ticket replacement. Operators must follow `docs/operations/BOOKING_SESSION_RESCHEDULING.md`.
