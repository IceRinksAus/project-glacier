# Sprint 20 Routed Booking Journey

## Purpose

This note records the routed customer-booking implementation added during Sprint 20. It complements the approved Sprint contract and preserves the architectural and operational decisions needed for later review.

## Customer Route Contract

The branded public Event site enters the booking journey at:

`/book/:eventId/session`

The journey is separated into dedicated pages:

1. `/session` — choose the shared-capacity Session.
2. `/tickets` — choose Ticket Type quantities and see the Ticket subtotal.
3. `/participants` — collect a first name and age for every Ticket and evaluate Event Rules.
4. `/addons` — apply Rule-required Products and allow eligible optional Products or Variants.
5. `/details` — collect the booking contact.
6. `/review` — display Session, Ticket, Product, contact and total information before creating a reservation.
7. `/payment` — display the live reservation hold, hand payment to Stripe and poll protected status.
8. `/confirmation` — display confirmed Tickets and the configured Waiver continuation.

Each issued Ticket has its own private presentation route at `/tickets/:secureToken` with a scannable QR. This Ticket possession credential is distinct from the Booking access credential.

The previous single-page implementation remains available temporarily as a compatibility reference at `/book/:eventId`, but the public Event CTA uses the routed journey.

## State and Navigation

`BookingJourneyProvider` owns in-memory state below the Event route layout. This preserves selections across client-side Back and Continue navigation without placing personal information, participant ages, customer details or the public booking credential in the URL.

The provider retains:

- selected Session;
- Ticket Type quantities;
- participant details;
- Rule preview;
- selected Products and Product Variants;
- Product subtotal;
- customer contact details;
- the created reservation and one-time public access credential;
- whether Stripe submission has begun.
- the latest credential-protected Booking status.

Changing Session clears Ticket, participant, Rule, Product and reservation state because those selections are no longer valid. Changing Ticket or participant data invalidates the Rule preview and requires the authoritative Event Rules to be evaluated again.

Direct navigation to a later step is guarded. A customer missing a prerequisite is returned to the earliest safe step.

## Preserved Domain Authority

The routed UI does not redefine Glacier’s existing commerce rules:

- Session capacity remains the shared admission capacity across Adult, Child and other Ticket Types.
- Ticket Type capacity is not presented as a separate rink-capacity pool.
- Rule evaluation remains server-authoritative.
- A Young Child-only test booking is blocked by the existing accompanying-Adult Rule.
- An allowed Adult plus Young Child booking receives one mandatory Kanga Product.
- Required Product minimums cannot be reduced in the Add-ons UI.
- Session Product and Product Variant remaining quantities continue to limit optional purchases.
- Ticket, Product and combined reservation totals remain separately understandable.
- reservation creation remains the point at which inventory is temporarily held.

## Payment Truthfulness

The browser never marks a Booking paid or confirmed after client-side Stripe submission alone. The Payment page states that payment is awaiting secure confirmation. Glacier’s verified Stripe webhook remains the only authority allowed to confirm payment and trigger ticket issuance.

After Stripe submission, the Payment page polls `POST /public/bookings/:bookingId/status`. POST is deliberately used for this read so the public Booking token remains in the request body rather than leaking into URLs or access logs. Responses use `Cache-Control: no-store`.

The status service hashes the supplied token before lookup and returns the same not-found response for an unknown Booking and a wrong token. Ticket numbers and Ticket possession tokens are withheld unless the Booking is simultaneously `CONFIRMED` and `PAID`.

The reservation’s public access token is held only in the in-memory journey state and is passed to the existing protected payment endpoint. It is not placed in route parameters.

## Browser Acceptance Evidence

The canonical public preview at `http://localhost:3001` was exercised against the fictional ACTIVE Event `tenant-security-test`.

Verified behavior:

- branded Event CTA opens the Session route;
- selecting a Session enables Ticket progression;
- one Adult plus one Child produces a $42 Ticket subtotal;
- Back and Continue preserve Session and Ticket choices;
- direct Tickets navigation without state returns to Session;
- Young Child-only participation is rejected by the accompanying-Adult Rule;
- Adult plus Young Child participation succeeds;
- exactly one mandatory Kanga is applied at $10;
- optional hoodie and safety Product Variants expose independent finite remaining inventory;
- Adult-only Review displays a $24 total;
- reservation creation produces a 15-minute inventory hold;
- Payment displays the authoritative reservation number and amount due;
- Stripe submission is not described as confirmed payment.
- Confirmation is unreachable without a webhook-confirmed status result;
- confirmed status can expose issued Tickets and the optional Waiver continuation;
- each confirmed Ticket can be presented through its private token route and QR endpoint.

The browser-created unpaid acceptance reservation is expected to expire through the normal reservation-expiry mechanism.

## Verification Baseline

At this checkpoint:

- 12 web suites pass;
- 43 web tests pass;
- the Next.js webpack production build passes;
- all routed booking pages are present in the production route manifest;
- `git diff --check` passes;
- the unrelated user-owned pilot-readiness roadmap edit remains excluded.

## Remaining Sprint 20 Work

- apply Event branding consistently across every booking step;
- add route-focused automated tests for guards, Rule failures, reservation errors and payment-pending copy;
- run payment-webhook, inventory-release, responsive and console-error browser acceptance;
- complete endpoint, authentication, storage, payment and closeout documentation;
- run full API/web regression, lint and dependency audits before closeout.
