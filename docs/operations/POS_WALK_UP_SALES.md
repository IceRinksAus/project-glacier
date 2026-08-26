# POS Walk-Up Sales

## Purpose

Glacier's Point of Sale provides the minimum staff-operated walk-up Ticket workflow required for the pilot. It uses the same Event, Session, Ticket Type, Rule, Product, pricing, capacity, inventory, Booking and Ticket foundations as public online booking.

It is not a separate catalogue and is not a general retail till.

## Access

The POS route is `/pos`.

- OWNER may use POS for every Event in the Organisation.
- MANAGER may use POS for Events within their current access scope.
- STAFF may use POS for Events within their current access scope.
- SCANNER cannot open or call POS operations.

Current Organisation membership and Event assignment are checked by the API on every operation. The Event selector is a convenience, not the security boundary.

## Selling Session

Every Ticket sale requires a clearly selected Session.

The POS may recommend the nearest relevant Session, but Sprint 25 does not apply it automatically. Staff must select **Use recommendation** or choose another Session deliberately.

Once selected, the Event-local date, time and Session name remain prominent. The POS never silently changes an active basket to another Session. A future Session may be selected deliberately before building the basket.

## Ticket and Product Rules

Ticket Types come from the active Event catalogue. Products come from active Session assignments with POS availability enabled.

The server remains authoritative for:

- Ticket Type validity and price;
- shared rink/Session admission capacity across all Ticket Types;
- Event Rule evaluation;
- required Products such as a Kanga;
- Product and Variant price;
- reusable per-Session Product capacity;
- finite Product and Variant inventory;
- minimum and maximum quantity; and
- sales windows and active status.

The browser evaluates Rules before reservation and adds the required Product quantity once. The Booking engine evaluates the Rules again. A browser omission or modification therefore cannot bypass the requirement.

## Customer and Participant Details

POS does not request a separate purchaser name, email address or phone number.

Participant details remain because they may be required for:

- Ticket identity and presentation;
- age-based Ticket and Product Rules;
- Waiver handoff; and
- staff lookup and customer assistance.

The first participant name is reused as the internal Booking lookup identity. No invented email address or additional purchaser identity is required. Online booking continues to collect and validate purchaser details under its existing contract.

## Reservation

Selecting **Review payment** performs the following sequence:

1. re-evaluate Event Rules;
2. add any missing required Product quantity;
3. create the minimal walk-up customer/lookup record;
4. submit the participants and selected Products to the shared Booking engine;
5. recheck prices, Rules, capacity and inventory inside the API; and
6. create a time-bounded `WALK_UP` reservation.

The displayed payment amount on the next screen is the persisted server-authoritative Booking total, not the browser estimate.

If payment is not completed before expiry, the existing reservation-expiry process releases the held admission/Product availability.

## Payment Methods

Sprint 25 supports:

- `CASH`; and
- `STANDALONE_EFTPOS`.

Online card payment remains `ONLINE_CARD` and continues through Stripe. Booking source and Payment method are separate persisted facts.

### Standalone EFTPOS

The card is processed independently on a suitable EFTPOS terminal. Staff must confirm the Glacier sale only after the terminal displays an approved result for the exact amount.

An optional terminal receipt/reference may be entered. Glacier never receives or stores card number, expiry, CVV or PIN. A standalone EFTPOS Payment is never represented as Stripe.

### Cash

Staff must receive the exact authoritative amount before confirming. Cash tender/change calculation, drawers, floats, shifts and till balancing are outside Sprint 25.

## Completion Safety

The completion command requires:

- an unexpired unpaid `WALK_UP` reservation;
- current Event access for the operator;
- Cash or Standalone EFTPOS as the method;
- the exact authoritative Booking amount; and
- a unique client idempotency key.

Glacier records:

- Booking and Event;
- method and provider label;
- amount and AUD currency;
- optional standalone reference;
- successful status and timestamp;
- receiving operator identity; and
- idempotency key.

Booking confirmation and Payment creation occur in one serializable database transaction. Tickets are then issued through the existing duplicate-safe Ticket service. Retrying the same successful command does not create another Payment or another Ticket for a participant.

## Completion Result

A successful sale presents:

- Booking number;
- confirmed payment state;
- Ticket count; and
- one presentation link per issued Ticket.

The Booking appears in organiser Booking search with source **Walk-up**. Payment investigation displays Cash, Standalone EFTPOS or Online card separately and shows the confirming operator when applicable.

## Corrections and Refunds

Sprint 25 does not implement payment correction, cancellation or refund mutation.

If staff confirm an incorrect payment:

1. stop and retain the terminal/cash evidence;
2. record the Booking number and operator;
3. escalate to the Manager/Owner under the pilot incident process; and
4. do not create a second compensating sale without an approved procedure.

The later refund/cancellation Sprint will provide controlled Manager/Owner actions, partial entitlement handling and append-only reason/audit evidence.

## Explicit Current Boundaries

- no merchandise-only sale;
- no Stripe Terminal, Linkly or Square integration;
- no automatic Session advancement;
- no split tender;
- no discounts, vouchers or gift cards;
- no cash-drawer or shift balancing;
- no offline payment synchronisation;
- no exchanges or merchandise return-to-stock; and
- no refund/cancellation/reschedule mutation.

Merchandise-only POS requires its own honest sale/order ledger and must not create a false Session, participant or Ticket.

## Pilot Checklist

Before opening the ticket window:

- confirm the operator has the correct Event assignment;
- confirm the Event and selling Session shown in POS;
- confirm Ticket Types and POS Products are active;
- confirm Kanga and other Rule-driven Product behaviour;
- confirm standalone terminals are online and reconciled to the chosen Event process;
- confirm staff understand that Glacier confirmation follows terminal approval; and
- confirm the Manager/Owner escalation contact.

At close:

- compare walk-up Booking totals by Payment method;
- investigate any reported terminal/Glacier mismatch;
- confirm no reservations remain unexpectedly pending;
- reconcile Ticket issuance/admission and Product availability; and
- preserve incident evidence for any correction required.
