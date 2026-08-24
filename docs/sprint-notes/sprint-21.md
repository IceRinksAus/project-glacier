# Sprint 21 — Payment Operations, Recovery and Add-on Organisation

## Status

In progress from 24 August 2026. Scope is controlled by `docs/roadmap/sprint-21-plan.md`.

## Slice 1 — Automatic Payment Reconciliation

The initial implementation closes the provider/local divergence found during Sprint 20 acceptance.

Previously, the reservation scheduler found every expired Booking with a locally PENDING Payment and immediately attempted cancellation. If Stripe had already succeeded but Glacier missed the webhook, Stripe correctly rejected cancellation and the same impossible operation retried every minute.

Glacier now retrieves authoritative provider state before cancellation:

- PENDING proceeds to the existing idempotent provider cancellation;
- CANCELLED is recorded locally through `PaymentService`;
- FAILED is recorded locally with bounded provider failure context; and
- SUCCEEDED enters the existing payment completion path.

An expired Booking cannot be confirmed by reconciliation. Provider success is retained as financial truth, the Booking remains expired, no Ticket is issued and the existing idempotent late-success refund is used.

The normal successful path remains Stripe's verified signed webhook. Reconciliation is a recovery control for missed delivery or state divergence.

## Reliability Boundaries

- Provider reads use the shared `PaymentProvider` interface rather than Stripe-specific logic in the scheduler.
- Refund creation retains its stable idempotency key and duplicate-refund protection.
- Provider retrieval or cancellation failures leave the Payment pending for retry.
- Failure on one expired Booking does not block cleanup of the remainder.
- Reconciled terminal Payments leave the scheduler's PENDING query.
- Logs identify reconciliation outcomes without logging secrets or customer details.

## Verification to Date

- Focused Payment/provider/reservation tests: 6 suites and 61 tests passed.
- Focused Booking/payment operations tests: 6 suites and 76 tests passed.
- Complete API suite: 62 suites and 413 tests passed.
- API production build: passed.
- Tests cover provider retrieval, pending cancellation, missed success/refund, no Ticket issuance, FAILED and CANCELLED closure, and retry after provider outage.
- No database migration, browser payment or real Stripe mutation was required for this slice.

## Slice 2 — Organiser Payment Investigation Foundation

The backend now defines two OWNER-only, tenant-scoped operations:

- `GET /booking/:id/payment-investigation`; and
- `POST /booking/:id/payment-reconciliation`.

The investigation response supplies the Booking lifecycle, customer and Event context, Session, Ticket issuance, Payment attempts, refunds and reconciliation history needed for customer-service investigation. Full provider references are never returned; the response exposes only a masked suffix.

The manual action is deliberately **Reconcile payment**, not **Mark paid**. It re-reads provider truth through `PaymentService`. A still-pending provider Payment is reported without cancellation or local status mutation. Terminal provider state uses the same completion, Ticket and late-refund rules as the automated path.

Every manual attempt records Organisation, Event, Booking, optional Payment, acting User, trigger, outcome, provider status, success state, bounded error detail and timestamp. Cross-tenant Booking IDs receive the same not-found result as unknown IDs.

The schema migration and generated client validate, the API production build passes and the complete API suite now passes 62 suites / 413 tests.

## Organiser Dashboard Presentation

The platform Bookings destination now opens a real tenant-scoped register rather than an empty navigation destination. It shows Booking number, customer, Event, lifecycle state, payment summary, total and creation time, with a path into the operational investigation.

The dedicated Booking investigation page presents:

- Booking, payment and Ticket summary cards;
- customer, Event, Session and lifecycle timestamps;
- masked Payment attempts and bounded failure information;
- refunds;
- issued Tickets;
- attributable reconciliation history; and
- the single `Reconcile payment` control when a locally pending Payment exists.

The UI never offers `Mark paid`. When Stripe still reports PENDING, the page explicitly states that no local state was changed.

Web verification now passes 16 suites / 51 tests, targeted lint for every new Bookings file and the webpack production build with `/bookings` plus `/bookings/[bookingId]` routes.

## Remaining Sprint 21 Work

- local migration application and browser operational acceptance;
- Event-owned Product grouping and deterministic ordering;
- accessible dashboard ordering controls;
- grouped public Add-ons presentation; and
- full closeout, browser and approved Stripe acceptance.
