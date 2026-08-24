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
- Complete API suite: 61 suites and 405 tests passed.
- API production build: passed.
- Tests cover provider retrieval, pending cancellation, missed success/refund, no Ticket issuance, FAILED and CANCELLED closure, and retry after provider outage.
- No database migration, browser payment or real Stripe mutation was required for this slice.

## Remaining Sprint 21 Work

- reconciliation auditability and operational evidence;
- tenant-safe organiser Booking/payment investigation;
- the single safe organiser reconciliation action;
- Event-owned Product grouping and deterministic ordering;
- accessible dashboard ordering controls;
- grouped public Add-ons presentation; and
- full closeout, browser and approved Stripe acceptance.
