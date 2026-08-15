# Sprint 14

## Objective

Build the first customer-facing booking journey on top of Glacier’s existing Booking Engine.

Sprint 14 establishes the public booking foundation without introducing payments, waivers, customer accounts or ticket issuance UI.

---

## Features Completed

### Public Booking API Boundary

Sprint 14 introduced a dedicated public customer API surface rather than exposing Glacier’s broad internal operator APIs directly.

Public routes now include:

- `GET /public/events/:eventId`
- `GET /public/events/:eventId/sessions`
- `GET /public/events/:eventId/ticket-types`
- `GET /public/sessions/:sessionId/products`
- `POST /public/events/:eventId/evaluate-rules`
- `POST /public/customers`
- `POST /public/bookings`

Public responses expose only the fields required by the customer booking journey.

A separate public web API client is used so public booking behaviour does not inherit operator-login redirect behaviour.

---

## Customer Booking Journey

The customer booking flow now supports:

1. Choose Session
2. Choose Tickets
3. Participant Details
4. Add-ons
5. Customer Details
6. Review & Reserve

The public booking route is:

`/book/[eventId]`

The customer journey includes:

- Event display
- Session selection
- Ticket-type selection
- Participant capture
- Participant age validation
- Add-on selection
- Rule-driven required add-ons
- Customer contact capture
- Booking review
- Reservation creation
- Reservation confirmation
- Reservation countdown / expiry display

---

## Ticket Types

The Sprint 14 test Event now supports:

- Adult
- Child
- Young Child (3–5)

Current test pricing:

- Adult: $24
- Child: $18
- Young Child (3–5): $0

Ticket eligibility is enforced by backend rules.

---

## Ticket Age Validation

The Rule Engine now validates participant age against the selected Ticket Type.

Current rules:

### Adult

Adult tickets are valid for participants aged 15 or older.

Invalid Adult-ticket ages are blocked.

### Child

Child tickets are valid for participants aged 6–14.

Participants younger than 6 or older than 14 are blocked.

### Young Child

Young Child tickets are valid for participants aged 3–5.

Participants outside this range are blocked.

---

## Kanga Skating Aid Rules

The Kanga requirement is now driven by Ticket Type rather than participant age alone.

A Young Child (3–5) Ticket requires:

`1 × Kanga Skating Aid`

per matching participant.

The Rule Engine returns the required quantity and the public booking UI automatically applies that quantity.

Required quantities operate as minimum quantities.

Customers may voluntarily add additional Kangas for other skaters.

Example:

- 1 Young Child → minimum 1 Kanga
- 2 Young Children → minimum 2 Kangas
- Customer may increase above the required minimum
- Customer cannot reduce below the required minimum

---

## Adult Accompaniment Rule

A booking containing a Young Child Ticket must also contain at least one Adult Ticket.

Examples:

- Young Child only → blocked
- Child + Young Child → blocked
- Adult + Young Child → valid
- Adult + multiple Young Children → valid

The rule is enforced in both:

- public rule preview
- final BookingService reservation validation

---

## Rule Engine Enhancements

Sprint 14 added booking-level Ticket Type context to rule evaluation.

Rule context now includes:

`bookingTicketTypeIds`

This allows rules to reason about the complete booking rather than only the current participant.

The Rule Engine also supports:

- `CONTAINS`
- `NOT_CONTAINS`

These operators allow configurable cross-participant booking rules without hard-coding specific Ticket Types into BookingService.

The backend remains authoritative for all booking rules.

---

## Public Rule Preview

The customer flow can evaluate rules before reservation creation through:

`POST /public/events/:eventId/evaluate-rules`

The preview:

- validates the public Event
- validates the selected active Session
- evaluates rules for every participant
- consolidates required products
- consolidates rule errors and warnings
- calculates required product quantities across multiple participants

The preview improves customer experience but does not replace final backend validation.

BookingService independently evaluates and enforces the same rules when the reservation is created.

---

## Add-ons

Session products are exposed through the public booking API only when they are:

- active
- available online
- assigned to the selected Session
- not Admission products

This prevents Ticket Types / Admission products from incorrectly appearing as Add-ons.

Kanga Skating Aid is configured as an Add-on.

Required product rules establish the minimum quantity while customers remain able to add additional optional quantities.

---

## Reservation Behaviour

Successful public bookings create normal Glacier reservations through the existing Booking Engine.

Reservations include:

- Booking Number
- RESERVED status
- UNPAID payment status
- Ticket Items
- Participants
- Booking Products
- authoritative backend pricing
- reservation expiry
- reservation countdown

Sprint 14 does not collect payment.

---

## Persistence Verification

End-to-end database verification confirmed that Add-ons are persisted as real BookingProduct records.

A verified test booking contained:

- Adult Ticket: $24
- Kanga Skating Aid: $10
- Booking Total: $34

The Kanga was persisted with:

- Product Type: ADD_ON
- Quantity: 1
- Unit Price: $10

A later mixed-ticket browser booking successfully produced:

- Adult: $24
- Child: $18
- Young Child: $0
- Kanga: $10
- Total: $52

---

## Frontend Decisions

The customer booking journey was reordered so participant information is captured before Add-ons.

This allows Glacier to evaluate participant-dependent rules before presenting optional and mandatory extras.

Current flow:

Session
→ Tickets
→ Participants
→ Add-ons
→ Customer Details
→ Review & Reserve

The current UI remains a functional booking foundation rather than the final production customer experience.

A future customer UX pass should focus on:

- progressive disclosure
- clearer visual hierarchy
- one primary decision per step
- plain-language rule messages
- mobile-first interaction
- reducing visible system-state information
- clear Continue actions
- simplified customer guidance

---

## Automated Testing

Sprint 14 public-booking test suite:

29 passed, 29 total.

Coverage includes:

- public Event discovery
- public Session discovery
- public Ticket Type discovery
- public Session Product discovery
- public Customer creation
- public Booking creation
- narrow customer-safe responses
- public rule preview
- required-product consolidation
- multi-participant required quantities
- inactive Event protection
- inactive Session protection

BookingService regression suite:

36 passed, 36 total.

---

## Regression Verification

API production build:

Passed.

Web production build:

Passed.

`git diff --check`:

Passed.

Browser verification confirmed:

- Event display
- Session selection
- Adult Ticket
- Child Ticket
- Young Child Ticket
- participant capture
- ticket age validation
- Young Child Kanga requirement
- additional optional Kangas
- Young Child Adult-accompaniment rule
- mixed Ticket Types
- rule error recovery
- Add-on pricing
- Review & Reserve
- reservation creation
- correct booking totals
- reservation countdown
- no stale rule-error state after reservation

---

## Deliberately Out of Scope

Sprint 14 does not include:

- payment collection
- waiver completion
- QR Ticket customer UI
- customer accounts
- customer login
- booking modification
- refunds
- gift cards
- memberships
- POS
- staff scanner
- theme builder
- multi-event cart

---

## Known Technical Debt

Historical Nest scaffold tests remain incomplete in parts of the wider repository because some legacy tests do not configure required providers and mocks.

These failures are separate from the verified Sprint 14 suites.

Product status management currently lacks a complete operator-facing lifecycle workflow and should be addressed in a future administration/product-management Sprint.

The customer booking UI is intentionally functional rather than final and requires a dedicated production UX pass before launch.

---

## Architectural Decisions

The public customer booking surface is separated from internal operator APIs.

The backend remains authoritative for:

- Ticket eligibility
- Booking rules
- required products
- pricing
- capacity
- reservation state

Frontend rule evaluation improves customer experience but never replaces final backend enforcement.

Required Add-ons represent minimum quantities rather than fixed quantities.

Cross-participant rules should use generic booking context rather than hard-coded application logic.

---

## Product Decisions

Young Child (3–5) is a distinct Ticket Type.

Young Child tickets require a Kanga Skating Aid.

At least one Adult Ticket must accompany a Young Child Ticket in the same booking.

Additional Kangas may be purchased voluntarily for other skaters.

Participant details are collected before Add-ons so Glacier can establish mandatory requirements before the customer selects optional extras.

---

## Sprint Outcome

Sprint 14 delivers Glacier’s first complete customer-facing reservation journey.

A customer can now:

- open an Event
- select a Session
- select multiple Ticket Types
- enter participant information
- receive live booking-rule validation
- receive automatically applied mandatory Add-ons
- purchase optional additional Add-ons
- enter booking contact information
- review pricing
- create a reservation
- see confirmation and reservation expiry

The journey remains backed by Glacier’s existing Booking Engine and Rule Engine rather than duplicating business logic in the frontend.

Sprint 14 closes the gap between Glacier’s backend booking capabilities and its first functional public customer booking experience.

---

## Next Sprint

Sprint 15

Scope to be confirmed during Sprint planning.