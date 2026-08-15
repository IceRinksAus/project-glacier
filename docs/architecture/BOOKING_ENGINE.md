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

Public endpoints return narrow customer-safe data only.

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

BookingExpiryService

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