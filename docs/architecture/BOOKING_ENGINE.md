# Booking Engine

## Purpose

The Glacier Booking Engine is the authoritative backend workflow for validating, pricing and reserving customer bookings.

Customers, bookings, booking items, participants, products, sessions, ticket types, tickets and rules form the core booking domain.

---

## Responsibilities

The Booking Engine is responsible for:

- Booking validation
- Customer validation
- Event validation
- Session validation
- Session / Event relationship validation
- Capacity reservation
- Product validation
- Inventory handling
- Pricing
- Rule evaluation
- Required-product enforcement
- Reservation creation
- Reservation expiry
- Payment preparation
- Booking confirmation
- Ticket issuance

The backend remains authoritative for all booking decisions.

---

## Public Booking Boundary

Customer-facing booking traffic uses a dedicated public API boundary rather than Glacier’s broad internal operator endpoints.

Current public routes include:

- `GET /public/events/:eventId`
- `GET /public/events/:eventId/sessions`
- `GET /public/events/:eventId/ticket-types`
- `GET /public/sessions/:sessionId/products`
- `POST /public/events/:eventId/evaluate-rules`
- `POST /public/customers`
- `POST /public/bookings`
- `POST /public/bookings/:bookingId/payments`
- `POST /public/bookings/:bookingId/status`

Public endpoints return narrow customer-safe data only.

The status operation is a credential-protected read expressed as `POST` so the Booking access token remains in the request body rather than appearing in URLs, browser history or access logs. Responses use `Cache-Control: no-store`. Unknown Booking IDs and incorrect credentials share the same not-found behavior.

The public frontend uses a separate public API client and does not depend on operator authentication behaviour.

---

## Booking Flow

Current reservation flow:

Public Booking UI

↓

Public Booking API

↓

BookingValidationService

↓

Rule Engine

↓

BookingService

↓

Reservation Created

↓

BookingReservationService

The public Rule Evaluation endpoint may preview rules before reservation creation, but final validation is always repeated by BookingService.

Frontend rule evaluation never replaces backend enforcement.

---

## Participant Rule Context

Rules are evaluated against individual participants.

Participant context includes:

- `customerAge`
- `participantAge`
- `participantFirstName`
- `participantLastName`
- `ticketTypeId`
- `sessionId`
- `eventId`
- `flexibleBooking`
- `participantCount`
- `bookingTicketTypeIds`

`bookingTicketTypeIds` gives participant rules visibility of the complete booking and enables cross-participant requirements.

---

## Rule Operators

The Rule Engine supports:

- `EQUALS`
- `NOT_EQUALS`
- `GREATER_THAN`
- `GREATER_THAN_OR_EQUAL`
- `LESS_THAN`
- `LESS_THAN_OR_EQUAL`
- `IN`
- `NOT_IN`
- `CONTAINS`
- `NOT_CONTAINS`
- `EXISTS`
- `NOT_EXISTS`

`CONTAINS` and `NOT_CONTAINS` allow rules to inspect array-valued booking context such as `bookingTicketTypeIds`.

---

## Rule Actions

Current Rule Engine actions include:

- `REQUIRE_PRODUCT`
- `BLOCK_BOOKING`
- `WARNING`

Required products are consolidated across matching participants.

If two participants independently require the same product, the required quantity is aggregated.

---

## Ticket Eligibility

Ticket eligibility is backend-enforced.

Current ice-skating Ticket Types include:

### Adult

Valid for ages 15+.

### Child

Valid for ages 6–14.

### Young Child (3–5)

Valid for ages 3–5.

Invalid Ticket Type / age combinations are blocked by the Rule Engine.

---

## Kanga Skating Aid

Kanga requirements are driven by Ticket Type rather than participant age alone.

Each Young Child (3–5) Ticket requires:

`1 × Kanga Skating Aid`

Required Kanga quantities are treated as minimum quantities.

Examples:

- 1 Young Child → minimum 1 Kanga
- 2 Young Children → minimum 2 Kangas
- Customers may voluntarily add further Kangas for other participants
- Required quantities cannot be removed below the calculated minimum

The backend validates the required product again when the reservation is submitted.

Kanga availability is a Product capacity pool for the selected Session; it is not part of rink admission capacity. Active `SessionProduct` assignment makes the Kanga available, and `capacityOverride` may replace the Product's default capacity for a particular Session. RESERVED and CONFIRMED BookingProduct quantities hold that Session pool. Expired or cancelled bookings do not occupy it.

Reservation creation rechecks Session admission capacity and Product availability in a serializable transaction. This prevents simultaneous booking requests from overselling either the rink or a capacity-controlled Product. A required Kanga that has no remaining capacity blocks the affected reservation rather than bypassing the rule.

Finite merchandise inventory is a separate global stock model. Size or other merchandise options use Product Variants and must not be represented as Session capacity.

`BookingProduct.productVariantId` is nullable for backward compatibility and for Products that do not use Variants. When supplied, the Variant must belong to the selected Product and be active/online. Its price override becomes the BookingProduct unit-price snapshot; otherwise the Product base price applies. Variant inventory is held globally by RESERVED and CONFIRMED bookings inside the same serializable reservation transaction. Each Variant therefore has an independent stock pool.

---

## Adult Accompaniment

A booking containing a Young Child Ticket must also contain at least one Adult Ticket.

Examples:

- Young Child only → blocked
- Child + Young Child → blocked
- Adult + Young Child → valid
- Adult + multiple Young Children → valid

This is implemented as a configurable Rule Engine rule using booking-level Ticket Type context.

---

## Ice-Skating Rules

Current or planned rules include:

- Under 3 not permitted
- Young Child Ticket valid for ages 3–5
- Child Ticket valid for ages 6–14
- Adult Ticket valid for ages 15+
- Young Child Tickets require a Kanga Skating Aid
- Young Child Tickets require an Adult Ticket in the same booking
- Under 10 must wear a helmet
- Session capacity cannot be exceeded

These rules must remain backend-enforced and configurable.

---

## Add-ons

Public Add-ons are Session Products that are:

- active
- available online
- assigned to the selected Session
- non-Admission products

Admission products must not appear as customer Add-ons.

Rule-driven Add-ons establish a required minimum quantity while still allowing optional additional quantities where permitted.

---

## Reservation Lifecycle

Successful public bookings create normal Glacier Booking records.

Initial reservation state:

- Booking status: `RESERVED`
- Payment status: `UNPAID`

Reservations receive an expiry time.

Expired reservations do not continue consuming active Session capacity.

The customer booking UI displays the reservation expiry using a live countdown.

---

## Payment Lifecycle

Payment is a separate persistent domain from the Booking summary state.

For a valid `RESERVED` Booking:

1. Glacier validates that the Booking is eligible for payment.
2. Glacier derives the amount from authoritative `Booking.total`.
3. Glacier creates a provider PaymentIntent using an idempotency key.
4. Glacier persists the Payment attempt.
5. The public client completes tokenised payment through Stripe.
6. Stripe sends a signed webhook.
7. Glacier records provider success.
8. Glacier atomically confirms the Booking only if it is still eligible.
9. Tickets are issued only after successful Booking confirmation.
10. The customer browser polls the protected Booking status and renders Confirmation only when both Booking and payment state are authoritative.

Provider success is necessary but not sufficient for fulfilment.

A successful provider payment cannot resurrect an expired Booking.

### Payment States

Current provider-facing Payment states include:

- `PENDING`
- `SUCCEEDED`
- `FAILED`
- `CANCELLED`

The Booking summary continues to track its own payment state separately.

### Reservation Expiry Cleanup

`BookingReservationService` expires overdue reservations and then looks for expired Bookings with unresolved `PENDING` Payments.

Before cancellation, Glacier retrieves the payment's current provider state through the `PaymentProvider` boundary.

- A provider-pending payment proceeds to idempotent cancellation.
- A provider-cancelled or failed payment is closed locally through `PaymentService`.
- A missed provider success is processed through the same completion path as a verified webhook. Because an expired Booking cannot be fulfilled, that path records the successful charge and creates the existing idempotent late-success refund without issuing Tickets.

Provider retrieval, cancellation or refund failures remain retryable on a later scheduler run. One failure does not stop cleanup of other expired Bookings. Terminally reconciled Payments leave the scheduler's pending query, preventing an impossible cancellation from being retried indefinitely.

The normal path remains signed webhook delivery. Scheduled reconciliation is a recovery control for missed or divergent provider/local state, not a replacement source of payment truth.

### Organiser Investigation and Manual Reconciliation

An OWNER may inspect a tenant-scoped Booking payment timeline containing Booking lifecycle, masked Payment attempts, refunds, Ticket issuance and attributable reconciliation history. Cross-tenant and unknown Booking identifiers share the same not-found boundary.

The sole recovery action is **Reconcile payment**. It retrieves provider truth through `PaymentService` and then applies the same terminal-state rules used by scheduled reconciliation and verified webhook completion. It never accepts a browser or organiser assertion that a Booking is paid. A provider-pending result causes no local state mutation. Every attempt is append-only and attributable to the acting User.

### Late Provider Success

If the provider succeeds after the Booking can no longer be fulfilled:

- the Payment remains correctly recorded as `SUCCEEDED`
- the Booking remains `EXPIRED`
- no Tickets are issued
- Glacier creates an idempotent refund
- the refund is persisted as a `PaymentRefund`

This compensating transaction preserves the historical truth of both the charge and refund.

### Public Payment Access

Public payment initiation requires the Booking's high-entropy `publicAccessToken`.

The token is customer-scoped and is separate from operator JWT authentication.

The raw token is returned once at reservation creation and only its SHA-256 hash is persisted. The routed browser journey retains the credential in memory and does not put it in route parameters or general-purpose persistent browser storage.

### Customer Confirmation and Tickets

Client-side Stripe submission moves the browser to a truthful processing state; it does not confirm the Booking. `POST /public/bookings/:bookingId/status` with the Booking credential may return status, payment state, reservation expiry and privacy-minimised Event information. Ticket numbers and Ticket possession credentials are withheld unless the Booking is simultaneously `CONFIRMED` and `PAID`.

Each issued Ticket uses a separate high-entropy possession credential:

- `GET /ticket/token/:token` returns presentation-only Ticket, participant, Event and Session information;
- `GET /ticket/token/:token/qr` returns the corresponding PNG with `Cache-Control: private, no-store`.

These public presentation operations do not check a Ticket in. Admission remains an authenticated Staff Scanner action.

### Idempotency

Glacier uses provider idempotency keys for:

- PaymentIntent creation
- PaymentIntent cancellation
- refunds

Idempotency prevents repeated customer requests, retries or webhook delivery from creating duplicate financial operations.

---

## Architectural Principles

The backend is authoritative for:

- Organisation scope
- Event availability
- Session availability
- Ticket eligibility
- Booking rules
- Add-on requirements
- Pricing
- Capacity
- Inventory
- Reservation state
- Payments

Business rules should be configurable rather than hard-coded into frontend components.

The frontend may preview backend rules to improve customer experience, but reservation submission must always be independently validated by the Booking Engine.
