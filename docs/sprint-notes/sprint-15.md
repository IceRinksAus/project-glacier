# Sprint 15

## Objective

Introduce Glacier's first production-oriented payment architecture using Stripe while preserving the Booking Engine as the authoritative source of booking state, pricing, reservation expiry and Ticket issuance.

Sprint 15 extends the Sprint 14 public reservation journey into a real payment flow and hardens the financial edge cases that occur when payment provider state and reservation state change asynchronously.

---

## Features Completed

### Stripe Payment Provider

Glacier now has a provider abstraction for payments and a real Stripe implementation.

The Stripe provider supports:

- PaymentIntent creation
- provider idempotency keys
- integer minor-unit amount conversion
- Stripe status mapping
- PaymentIntent cancellation
- refund creation
- customer receipt email
- Glacier Booking metadata
- automatic payment methods with redirect-based methods disabled for the initial flow

The API uses the Stripe server SDK.

The public web application uses Stripe.js and React Stripe.js.

---

## Payment Domain

Sprint 15 introduced a persistent Payment domain.

Payment records preserve provider attempts independently of the Booking summary state.

Key Payment data includes:

- Booking relationship
- provider
- provider reference
- idempotency key
- amount
- currency
- payment status
- success timestamp
- failure timestamp
- cancellation timestamp

Booking totals remain authoritative.

The browser never supplies the amount sent to Stripe.

---

## Payment Refund Domain

Sprint 15 introduced `PaymentRefund`.

Refund records preserve:

- Payment relationship
- provider
- provider refund reference
- stable refund idempotency key
- refund amount
- currency
- refund status
- reason
- failure information
- success / failure / cancellation timestamps

A provider Payment may remain correctly recorded as `SUCCEEDED` even when the associated Booking cannot be fulfilled and Glacier subsequently refunds the charge.

---

## Public Payment Boundary

Public payment initiation is exposed through the dedicated public booking boundary.

A public Booking receives a high-entropy `publicAccessToken`.

The customer must present the correct token when initiating payment for that Booking.

This avoids exposing payment initiation as an unauthenticated booking-ID-only operation.

The token is intended as a customer-scoped capability for the current public booking journey and is separate from operator JWT authentication.

---

## Stripe PaymentIntent Lifecycle

For an eligible Booking:

1. Glacier loads the Booking from the database.
2. Glacier verifies that it remains `RESERVED`.
3. Glacier verifies that it is not already paid or confirmed.
4. Glacier verifies that the reservation has not expired.
5. Glacier checks the latest Payment attempt.
6. Glacier prevents duplicate unresolved payments.
7. Glacier derives the authoritative amount from `Booking.total`.
8. Glacier creates a Stripe PaymentIntent using a Glacier idempotency key.
9. Glacier persists the Payment attempt.
10. The browser receives only the Stripe client secret required to complete payment.

The first Payment attempt uses a stable Booking-level idempotency key.

A later retry after a failed or cancelled attempt receives a unique retry suffix so historical Payment attempts remain independently persisted.

---

## Stripe Payment Element

The public booking flow now includes a Stripe Payment Element.

The customer can:

- reserve the Booking
- continue to payment
- enter payment details through Stripe's tokenised UI
- complete a Stripe test payment
- receive payment-state feedback

Raw card numbers and CVC values are not sent to or stored by Glacier.

The current payment UI remains a functional foundation and is not the final production customer checkout design.

---

## Stripe Webhooks

Stripe webhook handling is implemented through:

`POST /payment/stripe/webhook`

Webhook signatures are verified against the raw request body using the configured Stripe webhook signing secret.

Supported PaymentIntent lifecycle events include:

- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.canceled`
- `payment_intent.processing`

Unsupported Stripe events are safely acknowledged without mutating Glacier payment state.

Authoritative fulfilment is driven by provider events rather than browser success alone.

---

## Booking Confirmation

A successful provider event does not automatically mean a Booking may be fulfilled.

Glacier confirms a Booking only when it is still eligible.

Successful fulfilment requires:

- authoritative provider success
- Booking status still `RESERVED`
- reservation not expired
- successful atomic Booking confirmation

When eligible, Glacier updates the Booking to:

- Booking status: `CONFIRMED`
- Payment status: `PAID`
- provider payment reference persisted
- `paidAt` populated
- `confirmedAt` populated

Tickets are issued only after successful Booking confirmation.

---

## Ticket Issuance Safety

Ticket issuance remains downstream of authoritative payment success.

Tickets are not issued when:

- payment is still pending
- payment failed
- payment was cancelled
- the Booking expired
- a late successful payment must be refunded
- Booking confirmation loses a race with reservation expiry

Ticket issuance is also idempotent for participants that already have Tickets.

---

## Reservation Expiry and Payment Cancellation

The active reservation scheduler is `BookingReservationService`.

Each minute it:

1. expires overdue `RESERVED` Bookings
2. identifies expired Bookings that still have `PENDING` Payments
3. requests provider cancellation for unresolved payments
4. leaves provider failures discoverable for retry on a later scheduler run

Booking expiry remains authoritative even when Stripe is temporarily unavailable.

A provider cleanup failure does not prevent other expired reservations from being processed.

The obsolete duplicate `booking-expiry` implementation was removed.

---

## Late Payment Success and Automatic Refund

Sprint 15 explicitly handles the financial race where Stripe succeeds after the Booking has already expired.

In this case Glacier:

1. records the provider Payment as `SUCCEEDED`
2. does not restore or confirm the expired Booking
3. does not issue Tickets
4. creates an idempotent full refund
5. persists a `PaymentRefund` audit record

This is a compensating transaction.

The historical truth remains:

- Stripe successfully charged the customer
- the Booking could no longer be fulfilled
- Glacier refunded the charge

---

## Real Stripe Sandbox Verification

### Test A — Expired Reservation Cancels Pending Payment

Verified against the real Stripe sandbox:

- Booking became `EXPIRED`
- Booking remained `UNPAID`
- pending Stripe PaymentIntent was cancelled
- Glacier Payment became `CANCELLED`
- `cancelledAt` was populated
- zero Tickets were issued

### Test B — Late Successful Payment Is Automatically Refunded

Verified against the real Stripe sandbox using a A$24.00 Booking:

- Booking was already `EXPIRED`
- Stripe PaymentIntent succeeded
- Glacier Payment became `SUCCEEDED`
- Booking remained `EXPIRED`
- Booking remained `UNPAID`
- automatic Stripe refund was created
- `PaymentRefund` became `SUCCEEDED`
- refund amount was A$24.00
- zero Tickets were issued

Stripe webhook delivery independently confirmed the payment-success and refund lifecycle.

---

## Database Migrations

Sprint 15 added:

- `20260817072032_standardize_money_decimal`
- `20260817072924_add_payment_domain`
- `20260817082922_add_public_booking_access_token`
- `20260818065021_add_payment_refund_domain`

Money values are standardised using decimal database types rather than floating-point storage.

---

## Security Decisions

Sprint 15 established the following payment-security rules:

- Stripe secret keys remain server-side only.
- Stripe publishable keys may be used by the public web application.
- webhook signing secrets remain server-side only.
- real secrets are excluded from Git.
- raw card numbers are not stored by Glacier.
- CVC/CVV values are not stored by Glacier.
- Booking totals are authoritative server-side.
- payment success is verified through Stripe/provider state.
- webhook signatures are cryptographically verified.
- payment and refund operations use idempotency keys.
- public Booking payment initiation requires the Booking's public access token.

---

## Automated Testing

After Sprint 15 hardening and legacy scaffold-test cleanup:

- Test Suites: 45 passed, 45 total
- Tests: 236 passed, 236 total
- Snapshots: 0

Payment-specific coverage includes:

- PaymentService
- public payment initiation
- Stripe Payment provider
- Stripe webhook handling
- reservation payment cancellation
- late-success refunds
- Booking confirmation
- Ticket issuance protection
- idempotency
- expired reservation behaviour

---

## Regression Verification

API production build:

Passed.

Real Stripe sandbox:

Passed.

Secret-safety checks confirmed:

- `apps/api/.env` is ignored
- `apps/web/.env.local` is ignored
- no Stripe secret, publishable or webhook keys were present in the committed Sprint 15 diff

---

## Dependency Review

A non-breaking `npm audit fix` was applied during Sprint closeout.

This upgraded compatible dependencies including Prisma from 7.9.0 to 7.9.1 and removed the directly fixable audit findings.

Three high-severity audit findings remain through Prisma's transitive `deepmerge-ts` dependency.

The only remediation currently proposed by npm requires `npm audit fix --force` and a breaking Prisma downgrade to 6.12.0.

That forced downgrade was deliberately not applied.

The residual dependency finding should remain tracked and be revisited when a compatible upstream Prisma dependency resolution is available.

---

## Architectural Decisions

The Payment provider is abstracted behind Glacier's payment-provider interface.

Stripe is the first real provider implementation.

The Booking Engine remains authoritative for:

- amount
- Booking eligibility
- reservation state
- payment eligibility
- fulfilment
- Ticket issuance

Provider success is necessary but not sufficient for fulfilment.

Payment state and Booking state are intentionally persisted separately so Glacier can represent asynchronous and compensating financial outcomes accurately.

Late provider success against an unfulfillable Booking results in a refund rather than resurrection of the Booking.

---

## Known Technical Debt

The public payment UI remains functional rather than production-polished.

Before live public use Glacier still requires:

- production Stripe configuration
- production webhook registration
- webhook monitoring
- rate limiting / abuse protection
- broader payment observability
- operator-facing refund workflows
- customer-facing refund communication
- payment and refund audit-log integration
- production checkout UX refinement
- Security & Privacy Gate completion

Three high-severity audit findings remain in Prisma's transitive `deepmerge-ts` dependency pending a compatible upstream fix.

---

## Sprint Outcome

Sprint 15 moves Glacier from reservation-only customer bookings to a real provider-backed payment architecture.

Glacier can now:

- create a protected public reservation
- initiate a Stripe PaymentIntent
- collect tokenised card payment through Stripe
- receive signed provider webhooks
- confirm eligible paid Bookings
- issue Tickets only after authoritative success
- cancel unresolved payments after reservation expiry
- automatically refund late successful payments
- preserve Payment and PaymentRefund audit history
- protect payment initiation with a public Booking access token

The implementation has been verified with automated tests and real Stripe sandbox payment, cancellation and refund flows.

---

## Next Sprint

Sprint 16

Scope to be confirmed during Sprint planning.
