# Sprint 25 Plan — Operational Walk-Up Ticket Sales

## Planning Status

Approved direction and locked scope on 26 August 2026.

## Recommendation

Sprint 25 should deliver Glacier's first complete staff-operated walk-up Ticket sale through the browser. It should reuse the same Event catalogue, Ticket Types, Rules, shared Session admission capacity, Product availability, pricing, reservation protection and Ticket fulfilment used by online booking.

This is the first implementation Sprint after the Sprint 24 access-control foundation. It must remain a controlled Event-ticketing workflow rather than expand into a general retail POS programme.

The wider POS requirement should be delivered in two ordered stages:

1. **Sprint 25 — Operational walk-up Ticket sales:** Session-based Ticket and eligible Product sales, cash and standalone EFTPOS recording, Ticket issuance, audit evidence and reconciliation-ready data.
2. **Following POS Sprint — Merchandise-only sales and POS productisation:** an additive sale/order ledger for stock-only purchases, merchandise fulfilment and broader till-speed/visual refinements.

This boundary is deliberate. The current Booking model can represent a Session-based admission sale safely, but merchandise-only commerce must not create a false Session, participant or Ticket simply to fit that model.

## Objective

Allow an authorised OWNER, MANAGER or STAFF operator to complete a walk-up Ticket sale for an eligible Event and Session, collect cash or confirm a standalone EFTPOS payment, issue valid Tickets and leave an authoritative record that can be searched, reported and reconciled.

## User Outcome

At the ticket window, a staff member can:

1. open the POS and select an Event within their assigned access;
2. see and deliberately retain the selling Session;
3. choose Ticket Types and any required or optional eligible Products;
4. capture the minimum customer and participant details;
5. see server-authoritative availability and totals;
6. select cash or standalone EFTPOS;
7. deliberately confirm that the exact payment was received;
8. complete the sale once; and
9. immediately present the Booking confirmation and issued Tickets.

The resulting Booking behaves like an online Booking for capacity, Products, Tickets, Waivers, lookup and reporting, while retaining an explicit walk-up source and payment method.

## Evidence Inspected

- `Booking` already owns the authoritative Ticket Items, participants, Products, Session, total, reservation, Payment and Ticket relationships needed for a walk-up admission sale.
- the existing Booking creation path applies serializable capacity protection, Rule evaluation and Booking validation;
- the existing Payment completion path confirms a valid reservation idempotently and issues Tickets only after successful payment;
- `Payment.provider` currently identifies Stripe/provider behaviour but there is no separate controlled payment-method or commerce-channel field;
- `Booking` has no persisted online/walk-up source;
- `Product.availablePos` and `ProductVariant.availablePos` already establish a POS-specific catalogue boundary;
- Sprint 24 now provides current-membership checks and Event-scoped OWNER, MANAGER, STAFF and SCANNER authority;
- merchandise-only sales cannot be represented honestly by the current admission-oriented Booking model without further design; and
- reporting currently derives collection from successful Payment records, so cash and EFTPOS must use real, separately identified Payment records rather than flags or notes.

## Locked Design Direction

### One commerce authority

The POS must not calculate or enforce availability, Rules, required Kangas, prices, quantities, admission capacity or Product capacity independently in the browser. Existing backend-authoritative commerce services should be reused or extracted into a shared orchestration boundary.

Online and walk-up channels may have different presentation and allowed catalogue flags, but they must not maintain separate stock, capacity or price truth.

### Booking source and payment method are different facts

Persist controlled values for both:

- commerce source/channel, including at least `ONLINE` and `WALK_UP`; and
- payment method, including at least `ONLINE_CARD`, `CASH` and `STANDALONE_EFTPOS`.

`STANDALONE_EFTPOS` must never be labelled or stored as Stripe. A provider reference is optional for standalone operation; an operator-entered terminal receipt/reference may be recorded in a bounded field when available.

### Provider-neutral payment boundary

Sprint 25 implements the universal pilot baseline:

- the physical terminal processes the card independently;
- Glacier never receives raw card number, expiry, CVV or PIN;
- the operator explicitly confirms the exact approved amount;
- Glacier records method, amount, operator, time and optional bounded external reference; and
- completion consumes a normalised successful payment result.

The application contract must leave a stable seam for later Stripe Terminal, Linkly or Square adapters, but Sprint 25 must not integrate or select one of those providers.

### Selling Session

The pilot-safe default is **manual Session retention**:

- staff deliberately select a Session;
- the selected Event, date, Session name and local start time remain prominent throughout the basket;
- the selection is retained for the next empty sale on that device/browser until changed or no longer eligible;
- staff may deliberately choose a future Session; and
- Glacier never silently changes the Session while a basket contains items.

The interface may show a deterministic time-based **recommended Session** for convenience, but applying it remains a deliberate action in Sprint 25. Configurable automatic advancement is deferred until the operational rule and separate POS selling-window setting are accepted in browser testing.

### Walk-up identity and participant data

Ticket issuance, Rule evaluation and Waiver handoff still require the participant relationship expected by the existing domain. Sprint 25 should capture the minimum real details required by the configured Ticket Types and Event.

The operator must not invent an email address to satisfy the schema. Where email is genuinely optional for walk-up service, the persistence and response contract should model that explicitly and preserve searchability through Booking number and available customer identity. Any change to Customer email optionality requires focused regression coverage for the online flow, which continues to require email for payment and secure delivery.

### Completion and idempotency

The final action must be a single server-authoritative completion command protected by an idempotency key. A repeated click, browser retry or delayed response cannot:

- collect or record payment twice;
- confirm the Booking twice;
- issue duplicate Tickets;
- consume capacity twice; or
- decrement Product inventory twice.

No Ticket is issued and no successful Payment is recorded until the operator explicitly confirms receipt of the displayed amount.

## Permission Policy

| Capability | OWNER | MANAGER | STAFF | SCANNER |
|---|---:|---:|---:|---:|
| Open POS for an accessible Event | Yes | In scope | In scope | No |
| View POS catalogue and availability | Yes | In scope | In scope | No |
| Create a walk-up reservation | Yes | In scope | In scope | No |
| Confirm cash/standalone EFTPOS receipt | Yes | In scope | In scope | No |
| Complete walk-up sale and issue Tickets | Yes | In scope | In scope | No |
| Correct/refund a completed payment | Not in this Sprint | Not in this Sprint | No | No |

Every direct Event, Session, Ticket Type, Product, Variant and Booking identifier must be revalidated against the authenticated Organisation and current Event assignment. Filtered navigation is not an authorisation boundary.

## Slice 1 — Persistence and Shared Commerce Contract

- add controlled Booking source/channel persistence with a safe `ONLINE` backfill for existing records;
- add controlled payment-method persistence without changing the meaning of `Payment.provider`;
- add operator identity and received/confirmed timestamp for staff-confirmed payment records;
- add an optional bounded standalone terminal receipt/reference field that is not globally assumed unique;
- define explicit cash and standalone EFTPOS provider labels that cannot collide with Stripe semantics;
- add indexes needed for Event/channel/method reporting and investigation;
- preserve immutable Booking Item and Booking Product price snapshots;
- expose shared POS catalogue data using `availablePos`, active sales windows, variants, Rule eligibility and Session availability;
- reuse or safely extract the existing Rule, capacity, inventory, total and reservation authority; and
- use a forward-only migration with deterministic backfills and no destructive rewrite of existing commerce records.

The implementation must first verify whether Payment operator evidence belongs directly on `Payment` or in an append-only walk-up payment confirmation record. Whichever model is selected must preserve the historical actor even if the User is later deactivated.

## Slice 2 — Walk-Up Reservation API

Add an Event-scoped staff workflow that:

- lists accessible active Events and eligible Sessions in Event-local time;
- presents POS-available Ticket Types, Products and Variants only;
- marks required versus optional Rule Products clearly;
- validates Ticket Type quantities and participant counts;
- prevents duplicate Rule-driven Products such as two alternative Kanga products satisfying one requirement unless the configured Rule explicitly permits that outcome;
- respects shared Session admission capacity across all Ticket Types;
- respects reusable Session Product capacity separately from admission capacity;
- respects finite Product/Variant inventory;
- calculates totals only on the server from persisted prices;
- creates a standard time-bounded Booking reservation with source `WALK_UP`; and
- returns presentation-safe reservation, expiry, availability and total data.

No client-supplied total, price, Organisation identity, role, capacity result or required-Product decision is authoritative.

## Slice 3 — Staff-Confirmed Payment and Fulfilment

Add one controlled completion workflow for `CASH` and `STANDALONE_EFTPOS`:

- accept the selected method, a client idempotency key and optional bounded EFTPOS receipt/reference;
- re-read the reserved Booking and current authenticated operator scope;
- reject expired, already paid, already confirmed, foreign or unassigned Bookings safely;
- require the confirmed amount to equal the authoritative amount due;
- create a successful Payment with the correct method/provider semantics;
- record operator and completion evidence;
- confirm the Booking and issue Tickets through the shared fulfilment path;
- return the already-completed result for an exact idempotent retry;
- reject reuse of an idempotency key for different parameters; and
- leave an auditable, explicit exception state if persistence or fulfilment cannot complete atomically.

Cash tendered and change due may be calculated as a presentation convenience, but only the authoritative amount due is persisted as collected. Cash drawer, float and shift balancing are outside this Sprint.

## Slice 4 — Till-Style Browser Workflow

Add a dedicated staff POS route and navigation entry for authorised roles.

Minimum interface:

- accessible Event selector constrained by role assignment;
- prominent selected selling Session with date, local time and change action;
- optional recommended-Session prompt for an empty basket;
- large, legible Ticket Type controls;
- required Products automatically and visibly satisfied without hidden duplication;
- optional Products/Variants from the shared POS catalogue;
- compact participant/customer capture appropriate to a ticket window;
- persistent basket summary with quantities and authoritative total;
- explicit Cash and EFTPOS choices;
- confirmation screen showing amount received, method and Session before completion;
- disabled/retry-safe completion while the request is in flight;
- success view with Booking number and Ticket presentation links;
- clear sold-out, insufficient Product capacity/inventory, expired reservation and payment-not-confirmed outcomes; and
- practical keyboard, touch, tablet and hand-scanner-adjacent usability.

This interface should be operationally clear, but complete visual POS productisation, custom layouts and extensive speed shortcuts remain later work.

## Slice 5 — Lookup, Reporting and Documentation

- make walk-up Bookings visible in existing Booking search and detail views;
- label source and payment method without exposing raw/internal provider data;
- include online versus walk-up and cash versus standalone EFTPOS in authoritative reporting totals where the existing report scope supports it;
- preserve the distinction between confirmed order value, collected amount and refunds;
- document the standalone EFTPOS operating procedure and the risk of confirming before the terminal approves;
- document correction/escalation as a Manager/Owner support action pending the later refund/correction Sprint;
- update API, payment, Booking, POS and role/capability documentation; and
- record exact automated and browser acceptance evidence in Sprint notes.

## Required Browser Acceptance

Using fictional local fixtures and no real payment or production data:

1. OWNER opens POS and deliberately selects an active Event and Session.
2. A Young Child Ticket adds exactly the configured required Kanga outcome and never duplicates it because multiple eligible Product records exist.
3. Shared admission capacity is enforced across Adult/Child Ticket Type combinations.
4. Reusable Kanga capacity is enforced separately for the selected Session.
5. A finite merchandise Variant added to the Ticket sale reduces available inventory only after successful completion.
6. A cash walk-up sale completes, appears in Booking lookup and issues the expected Tickets.
7. A standalone EFTPOS walk-up sale completes with its method and optional reference correctly labelled, never as Stripe.
8. Retrying the completion action does not duplicate Payment, Tickets, capacity or inventory consumption.
9. STAFF can complete a sale only for an assigned Event and cannot access another Event directly.
10. SCANNER cannot open or call POS operations.
11. The selected Session does not change while a basket is active; a future Session can be selected deliberately.
12. Expired reservation, sold-out, unavailable Product and insufficient inventory outcomes are understandable and recoverable.
13. The core workflow remains usable at ticket-window desktop and tablet viewports without page-level horizontal overflow.
14. Existing online Stripe purchase, confirmation, Ticket, Waiver and scanner journeys still pass unchanged.

## Security, Privacy and Financial Controls

- current membership and Event assignment are resolved on every protected operation;
- no raw card data is accepted, persisted or logged;
- standalone EFTPOS and cash are never represented as Stripe/provider-confirmed payments;
- staff confirmation captures actor, time, amount, method and bounded reference where supplied;
- idempotency is enforced by a database uniqueness boundary and parameter matching;
- completion logs exclude secrets, access tokens and unnecessary customer data;
- server responses do not expose provider secrets or full sensitive references;
- customer/participant data collection is limited to operational need;
- capacity, inventory and fulfilment remain transactionally protected;
- expired or failed completion cannot leave a valid Ticket without a successful Payment record; and
- correction/refund authority remains denied until its separately audited workflow exists.

## Automated Verification Requirements

Minimum evidence:

- migration/schema validation, Prisma generation and migration application;
- Booking source/payment method backfill and constraint tests;
- POS catalogue and tenant/Event-scope service tests;
- Rule-required Product and duplicate-eligible-Product tests;
- shared admission, reusable Product capacity and finite inventory concurrency tests;
- cash and standalone EFTPOS completion tests;
- idempotent retry and mismatched-key tests;
- expired/already-paid/foreign/unassigned denial tests;
- Ticket issuance and no-payment/no-Ticket tests;
- reporting/source/method regression tests;
- focused POS interface tests;
- full API and web suites;
- API and web production builds;
- changed-file lint and Git whitespace validation; and
- authenticated browser acceptance for OWNER, MANAGER, STAFF and SCANNER boundaries.

The Sprint must record the new baseline without weakening Sprint 24's 71 API suites / 476 tests and 23 web files / 71 tests.

## Explicitly Out of Scope

- merchandise-only sale/order persistence and fulfilment;
- integrated Stripe Terminal, Linkly, Square or bank-terminal adapters;
- automatic selling-Session advancement;
- split tender;
- discounts, promotions or gift cards;
- cash-drawer, float, shift and till-balancing management;
- offline payment capture or synchronisation;
- payment correction, cancellation or refund mutation;
- partial Ticket refund/cancellation;
- Session rescheduling or Ticket reissue;
- Flexible Ticket purchase or customer request workflows;
- exchanges and merchandise returns;
- barcode stock receiving;
- arbitrary POS layout builders;
- production hardware certification; and
- broad dashboard or public-booking redesign.

## Protected Foundations

Sprint 25 must not change:

- the routed public date → Session → Ticket → participant → add-on → checkout journey;
- online Stripe PaymentIntent, webhook, reconciliation or late-success protection;
- shared Session admission capacity across Ticket Types;
- separate reusable Product capacity and finite Product/Variant inventory semantics;
- Ticket scan Gate Entry versus Lookup behaviour and Event entry windows;
- Waiver versioning, acceptance or verification evidence;
- Event reporting definitions and refund-allocation boundaries;
- Event Group comparison semantics;
- OWNER-only configuration authority; or
- Sprint 24 role and Event-assignment enforcement.

## Completion Gate

Sprint 25 is complete only when:

- an authorised staff member can complete representative cash and standalone EFTPOS Ticket sales in the browser without developer intervention;
- those sales use the same authoritative catalogue, Rule, capacity, inventory and Ticket fulfilment foundations as online booking;
- method, channel, operator and completion evidence are durable and correctly presented;
- retry, expiry, denial and insufficient-availability paths are proven;
- existing online and staff workflows remain green;
- documentation and verification evidence are committed; and
- Ice Rinks Australia accepts the browser workflow.

## Follow-On Sequence

After Sprint 25 acceptance, the recommended minimum-pilot sequence is:

1. merchandise-only POS sales and bounded till/reconciliation productisation;
2. partial Ticket cancellation/refund and discretionary Manager/Owner workflows;
3. rescheduling, deterministic Ticket replacement and Flexible Ticket entitlement;
4. production platform/security hardening; and
5. complete device-based pilot rehearsal.

This sequence keeps walk-up admission operational first while preserving the confirmed merchandise-only, refund and flexible-service requirements as explicit pilot gates rather than allowing them to disappear into future backlog.
