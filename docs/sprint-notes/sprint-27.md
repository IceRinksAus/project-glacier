# Sprint 27 — Partial Ticket Cancellation and Discretionary Refunds

## Status

Sprint 27 was implemented and accepted on 26 August 2026 under the locked scope in `docs/roadmap/sprint-27-plan.md`.

## Delivered

Glacier now has an immutable Ticket-adjustment ledger with per-Ticket value allocations, actor evidence, controlled reasons, idempotency, capacity-release evidence and an optional PaymentRefund relationship. OWNER and Event-authorised MANAGER users can preview and execute cancel-only or exact cancel-and-refund actions from Booking investigation. STAFF and SCANNER remain unable to mutate Tickets or money.

The server resolves Ticket eligibility and value from persisted Booking records. ACTIVE Tickets in confirmed, paid Bookings are eligible; scanned, cancelled, foreign and unpaid records fail safely. One successful adjustment allocation per Ticket prevents duplicate cancellation under retries or concurrency.

Online card refunds use the payment-provider boundary and a durable idempotency identity. Cash requires explicit physical-return confirmation. Standalone EFTPOS requires external success confirmation and a bounded reference. Provider uncertainty remains visible and recoverable without holding a database transaction open during network I/O.

Cancelling a Ticket immediately invalidates it and releases exactly one place in the shared Session admission pool. The Booking, unaffected Tickets, original Booking Items, original Payment amount and all Products remain unchanged.

## Reporting

Ticket Type reporting now exposes gross Ticket sales, allocated successful Ticket refunds and net Ticket sales. Historical or automatic refunds without authoritative Ticket allocation remain separately disclosed as unallocated. Product reporting is not reduced by a Ticket adjustment.

## Persistence and migration

Sprint 27 added `TicketAdjustment`, `TicketAdjustmentAllocation`, controlled adjustment enums and Ticket cancellation time evidence. A follow-up migration added the external reference used for standalone terminal evidence. Both forward-only migrations were applied locally, bringing the local migration history to 39 migrations.

## Automated verification

Final implementation verification passed:

- focused API verification: 6 suites / 88 tests;
- full API suite: 76 suites / 496 tests;
- full dashboard suite: 24 files / 73 tests;
- API production TypeScript build;
- dashboard webpack production build; and
- formatting and whitespace checks before implementation commits.

## Authenticated browser acceptance

Using fictional local Cash Booking `PG-1787718485955-5863`, the Ice Rinks Australia OWNER selected only Adult Ticket `TKT-1787718542883-712383`, reviewed an exact `$24.00` refund, one released admission place and the explicit statement that one Kanga remained unchanged. After separate high-impact approval, Glacier completed adjustment `TA-1787732589345-795798`.

The Booking interface then showed the Adult Ticket as CANCELLED, the Young Child Ticket as ACTIVE and the adjustment refund as SUCCEEDED. Direct persistence verification confirmed:

- the Booking remains CONFIRMED and PAID;
- exactly one Ticket is CANCELLED and one remains ACTIVE;
- exactly one `$24.00` allocation and successful PaymentRefund exist;
- capacity-release evidence was recorded once; and
- the original one-unit Product record remains attached and unchanged.

## Operational boundary

Sprint 27 does not implement Product returns, merchandise refunds, exchanges, rescheduling, Flexible Ticket entitlements, arbitrary goodwill amounts, mixed-tender allocation, customer self-service or scanned-Ticket overrides. Those workflows must build on this ledger rather than rewriting its evidence.
