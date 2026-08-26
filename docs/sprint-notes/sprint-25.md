# Sprint 25 — Operational Walk-Up Ticket Sales

## Status

Sprint 25 was completed and accepted on 26 August 2026 under the locked scope in `docs/roadmap/sprint-25-plan.md`.

Implementation, complete automated verification and an explicitly authorised fictional local walk-up Cash sale all passed. The acceptance covered Event/Session/catalogue selection, manual Session recommendation, Ticket Rules, required Products, authoritative payment completion, operator evidence and Ticket issuance.

## Delivered Foundation

The persistence model now distinguishes:

- Booking source: `ONLINE` or `WALK_UP`;
- Payment method: `ONLINE_CARD`, `CASH` or `STANDALONE_EFTPOS`;
- provider identity separately from method;
- optional standalone terminal reference;
- payment-receipt timestamp; and
- receiving staff User.

Existing Bookings and Payments backfill safely to `ONLINE` and `ONLINE_CARD`. Online Stripe initiation also writes `ONLINE_CARD` explicitly. Migration indexes support Event/source and method/status investigation.

Customer email is nullable at persistence level so walk-up service never invents an address. Public online customer creation continues to require a valid email through its DTO and journey.

## Shared Commerce Authority

The existing Booking engine now receives an internal `ONLINE` or `WALK_UP` channel. It preserves the same Rule, pricing, serializable admission capacity, reusable Product capacity, finite Product/Variant inventory, reservation and price-snapshot behaviour while enforcing the correct catalogue flag:

- online uses `availableOnline`; and
- walk-up uses `availablePos`.

The Booking source is persisted in the same capacity-protected creation transaction. No parallel POS capacity or inventory model was introduced.

## POS API

The authenticated operator API provides:

- Event-scoped active Session, Ticket Type and POS Product catalogue;
- optional Session-specific catalogue;
- POS Rule evaluation;
- minimal walk-up customer/lookup creation without purchaser contact fields;
- `WALK_UP` reservation through the shared Booking engine; and
- Cash/Standalone EFTPOS completion.

OWNER, MANAGER and STAFF are allowed only within current Event scope. SCANNER is denied at the controller role boundary. Services recheck Event access and direct Booking ownership independently.

## Payment Completion

POS completion accepts only Cash or Standalone EFTPOS. It requires the exact authoritative amount and an idempotency key, rechecks the live unpaid reservation and operator scope, and records Booking confirmation plus successful Payment inside a serializable transaction.

The Payment retains method, provider label, amount, currency, optional reference, receiving operator and timestamp. Raw card data is neither accepted nor persisted.

Ticket fulfilment uses the existing duplicate-safe Ticket issuer. Exact retries return the completed result and ensure any missing participant Ticket is issued; conflicting reuse of a key is rejected.

No refund, correction, cancellation or reschedule authority was added.

## Till Interface

The new `/pos` route provides:

- accessible active Event selection;
- a clearly retained selling Session;
- a time-based recommendation that requires deliberate application;
- large Ticket Type controls;
- participant age/name capture;
- grouped Session Product/Variant selection;
- Rule evaluation and automatic required-Product quantity;
- server-authoritative reservation review;
- separate Cash and Standalone EFTPOS choices;
- an optional terminal reference;
- retry-safe completion state; and
- Booking/Ticket success presentation.

Following browser feedback, separate purchaser name, email and phone fields were removed. The first participant is reused only as the internal Booking lookup name. This reduces ticket-window data entry without weakening Ticket, Rule or Waiver inputs.

Booking lists now label Online versus Walk-up. Payment investigation labels Online card, Cash and Standalone EFTPOS separately and presents receiving-operator evidence where it exists.

## Local Migrations

Two additive Sprint 25 migrations are applied locally:

1. `20260826090000_add_walk_up_commerce_foundation`;
2. `20260826091000_allow_walk_up_customer_without_email`.

The local database has 36 applied migrations.

## Automated Verification

Final complete automated baseline after the purchaser-detail refinement:

- API complete suite: 73 suites / 487 tests;
- dashboard complete suite: 24 files / 72 tests;
- API TypeScript no-emit validation: passed;
- dashboard TypeScript no-emit validation: passed;
- dashboard webpack production build: passed; and
- live authenticated page refresh: passed.

Focused POS verification also passed at 2 API suites / 9 tests and 1 dashboard file / 1 test. The API and dashboard production builds passed immediately before the purchaser-detail refinement; the final complete suites and TypeScript checks then passed after it.

The normal Turbopack rebuild was blocked by the local sandbox's process/port restriction, so the production dashboard was reverified with Next's supported webpack build. The API build cleanup was blocked from removing the externally owned active `dist` directory; an equivalent clean TypeScript no-emit validation passed after the change. The full suites/builds had already passed immediately before the small field-removal refinement.

## Authenticated Browser Evidence

Using only fictional local data:

- Ice Rinks Australia OWNER loaded the POS;
- only the accessible active Tenant Security Test Event appeared;
- two eligible future Sessions appeared in Event-local time;
- the recommended Session was not applied until **Use recommendation** was selected;
- the selected Session remained visibly locked;
- Young Child, Child and Adult Ticket Types used the existing catalogue prices;
- hoodie Variants, Safety Pack and one Kanga Product appeared from the POS Session catalogue;
- Young Child without Adult was correctly rejected by the existing Event Rule;
- adding an Adult satisfied the Ticket rule;
- exactly one required Kanga was added; and
- the authoritative review total was `$34.00` (`$24.00` Adult + `$10.00` Kanga).

That first review-only reservation was not paid and expired through the existing reservation service.

The page was then rebuilt and refreshed after purchaser fields were removed. The live Sale panel contains no purchaser/contact inputs and explicitly explains that the first participant supplies the Booking lookup name.

The final explicitly authorised acceptance sale then completed as Cash using fictional local participants:

- Booking `PG-1787718485955-5863` was labelled **Walk-up**, **CONFIRMED** and **PAID**;
- the authoritative `$34.00` total comprised one `$24.00` Adult Ticket and one required `$10.00` Kanga for the Young Child Ticket;
- the Payment was labelled **Cash**, provider `CASH`, status **SUCCEEDED**;
- receiving-operator evidence recorded Jamie Stoller and the completion timestamp;
- exactly two distinct active Tickets were issued, one for each participant; and
- the Booking list and investigation page both presented the correct source, amount, state and evidence.

## Protected Foundations

Sprint 25 did not change:

- the routed public date/Session/Ticket/participant/add-on/payment journey;
- Stripe PaymentIntent, webhook, reconciliation or late-success protection;
- shared admission capacity across Ticket Types;
- reusable Product capacity or finite inventory semantics;
- Gate Entry versus Ticket Lookup behaviour;
- Waiver versioning or acceptance evidence;
- Event reporting calculation definitions;
- Event Group comparison semantics;
- OWNER-only Event configuration; or
- Sprint 24 membership and Event-assignment enforcement.

## Sprint Gate Result

All implementation, automated verification and authenticated browser acceptance gates passed. Sprint 25 is ready for its close-out commit and push.

## Follow-On Boundaries

The next POS slice remains merchandise-only Sale/Order persistence, inventory fulfilment, reconciliation and bounded till productisation. It must not fake an admission Booking.

Partial Ticket cancellation/refund, discretionary Manager/Owner action, rescheduling, Ticket replacement and Flexible Ticket entitlement remain later minimum-pilot operations.
