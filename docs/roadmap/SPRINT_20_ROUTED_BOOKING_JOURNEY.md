# Sprint 20 Routed Booking Journey

## Purpose

This note records the routed customer-booking implementation added during Sprint 20. It complements the approved Sprint contract and preserves the architectural and operational decisions needed for later review.

## Customer Route Contract

The branded public Event site enters the booking journey at:

`/book/:eventId/date`

The journey is separated into dedicated pages:

1. `/date` — choose an eligible local Event date.
2. `/session` — choose one shared-capacity Session on that date.
3. `/tickets` — choose Ticket Type quantities and see the Ticket subtotal.
4. `/participants` — collect a first name and age for every Ticket and evaluate Event Rules.
5. `/addons` — apply Rule-required Products and allow eligible optional Products or Variants.
6. `/details` — collect the booking contact.
7. `/review` — display Session, Ticket, Product, contact and total information before creating a reservation.
8. `/payment` — display the live reservation hold, hand payment to Stripe and poll protected status.
9. `/confirmation` — display confirmed Tickets and the configured Waiver continuation.

Each issued Ticket has its own private presentation route at `/tickets/:secureToken` with a scannable QR. This Ticket possession credential is distinct from the Booking access credential.

The previous single-page implementation remains available temporarily as a compatibility reference at `/book/:eventId`, but the public Event CTA uses the routed journey.

## Event Branding Continuity

The booking layout resolves the public Event by its opaque Event ID and then loads the same published Event-site identity used by `/event/:eventSlug`. This happens once at the shared journey-provider boundary, so every routed step receives one consistent theme without duplicating requests or branding rules across pages.

The routed journey applies the configured:

- Event name or published logo;
- primary, secondary and accent colours;
- background and surface colours;
- text colour;
- heading and body font choices; and
- active and inactive progress treatment.

The public Event page and booking journey share the same default-branding and font mappings. If an Event has no custom branding, or the optional branding request fails, booking remains usable with Glacier’s safe default theme. Branding failure does not weaken or bypass any booking, capacity, Rule, inventory, payment or authentication control.

Brand asset URLs continue to use the restricted public Event-site asset endpoint, which exposes only assets explicitly published for that Event.

## State and Navigation

`BookingJourneyProvider` owns in-memory state below the Event route layout. This preserves selections across client-side Back and Continue navigation without placing personal information, participant ages, customer details or the public booking credential in the URL.

The provider retains:

- selected Event date;
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

Date keys are calculated from Session start times in the Event's configured timezone, not the browser timezone. Only dates with publicly eligible Sessions are shown. Changing Date clears Session, Ticket, participant, Rule, Product and reservation state because those selections are no longer compatible. Changing Session clears Ticket and downstream selections. Changing Ticket or participant data invalidates the Rule preview and requires the authoritative Event Rules to be evaluated again.

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

- branded Event CTA opens the Date route;
- Event-timezone dates show their available Session count before time selection;
- Session choices are limited to the selected date;
- selecting a Session enables Ticket progression;
- one Adult plus one Child produces a $42 Ticket subtotal;
- Back and Continue preserve Session and Ticket choices;
- direct Tickets navigation without state returns to Date;
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
- the published Event identity continues from the public Event page through every routed booking step;
- custom logo, colour and font selections are resolved once by the shared booking layout;
- missing or unavailable custom branding falls back safely without blocking booking.

Desktop and responsive acceptance after the branding checkpoint additionally verified:

- the live `tenant-security-test` Event carries its name and Glacier fallback theme into the shared booking header;
- the configured theme variables control the booking background, surface, text and active progress state;
- all nine progress steps remain present on desktop and mobile;
- at a 390 × 844 viewport, the page itself has no horizontal overflow;
- the progress list owns its intentional horizontal scrolling on narrow screens;
- Session selection, Continue and Ticket quantity controls remain visible and operable at the mobile viewport; and
- no browser warnings or errors were recorded during Event, Session and Ticket navigation.

Date-first browser acceptance against the rebuilt production preview verified:

- the Event CTA opens `/date`;
- the fictional Event exposes one Event-timezone date with two eligible Sessions;
- selecting that Date enables progression and the Session page shows exactly those two times;
- Back returns from Session to Date;
- Date and Session correctly report Steps 1 and 2 of the nine-step journey;
- the Date page has no page-level overflow at 390 × 844 while progress owns intentional horizontal scrolling; and
- no browser warnings or errors were recorded during Date and filtered-Session navigation.

The browser-created unpaid acceptance reservation is expected to expire through the normal reservation-expiry mechanism.

## Verification Baseline

At this checkpoint:

- 15 web suites pass;
- 49 web tests pass;
- the Next.js webpack production build passes;
- all routed booking pages are present in the production route manifest;
- `git diff --check` passes;
- the unrelated user-owned pilot-readiness roadmap edit remains excluded.

Route-focused coverage proves that:

- direct Tickets navigation without a selected Date or Session returns to Date;
- Sessions are grouped into Event-timezone dates before Session selection;
- changing Date clears the incompatible Session and every downstream commerce selection while retaining non-dependent customer details;
- an authoritative Event Rule rejection remains on Participants and displays the returned reason;
- an authoritative reservation failure remains on Review and does not advance to Payment; and
- client-side payment submission remains described as pending until the protected status endpoint reports both `CONFIRMED` and `PAID`.

Focused operational verification additionally runs the signed-webhook, Payment, reservation-expiry and inventory suites together. The current checkpoint passes 6 suites and 88 tests covering invalid webhook signatures, missing secrets, processing/failure/cancellation/success transitions, idempotent duplicate success, Ticket issuance only after eligible authoritative success, late-success refund, expiry cleanup and retry, shared Session capacity, reusable Product capacity and independent Product Variant inventory.

A real Stripe test-mode browser payment was not claimed during this checkpoint because local authoritative completion requires a genuine Stripe-signed delivery through the configured CLI/webhook secret. That remains an environment acceptance step whenever local Stripe forwarding is available; automated evidence does not impersonate an external signature.

## Remaining Sprint 20 Work

- run a real Stripe test-mode payment/webhook acceptance when configured local forwarding is available;
