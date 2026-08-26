# Sprint 26 Plan — Merchandise-Only POS Commerce and Investigation

## Planning Status

Approved direction and locked planning scope on 26 August 2026. Implementation must not begin until this plan is committed and the repository is confirmed clean.

## Recommendation

Sprint 26 should complete Glacier's second POS commerce path: a customer can purchase eligible merchandise at the ticket window without an admission Ticket.

This requires a separate merchandise Sale ledger. A merchandise-only purchase must not create a fake Booking, Session, Customer, participant or Ticket. It must still reuse the same Event Product/Variant catalogue, price authority, finite inventory and staff-confirmed Cash/standalone EFTPOS evidence already used by Glacier.

The Sprint is a domain-foundation and operational workflow Sprint. It is not a broad retail, warehouse, accounting or visual POS programme.

## Objective

Allow an authorised OWNER, MANAGER or STAFF operator to select an accessible Event, sell eligible non-Session merchandise for Cash or standalone EFTPOS, consume shared finite Product/Variant inventory safely, and retrieve an authoritative Sale and Payment record without affecting admission capacity or issuing Tickets.

## User Outcome

At the POS, staff can:

1. choose **Ticket sale** or **Merchandise sale**;
2. retain an accessible Event for the merchandise transaction;
3. browse POS-available merchandise grouped and ordered from the Event catalogue;
4. select Product Variants and quantities;
5. review a server-authoritative total;
6. hold the selected stock for a short bounded review period;
7. confirm Cash or standalone EFTPOS receipt exactly once;
8. see a merchandise Sale number and line-item receipt view; and
9. find the completed Sale later by Sale number, Event, date, operator or payment method.

No purchaser name, email, phone, participant or Session is required for the pilot merchandise-only counter flow.

## Evidence Inspected

- `Product` and `ProductVariant` already own price, GST rate, SKU/barcode, POS availability, status, grouping, ordering and finite inventory configuration.
- `Product.availablePos` and `ProductVariant.availablePos` provide the correct channel boundary.
- `requiresSession` and `capacityControlled` distinguish Session-bound operational Products such as Kangas from static merchandise.
- completed/reserved `BookingProduct` records currently contribute to inventory commitment; retail Sale items must join the same authoritative availability calculation.
- `Booking` requires admission-oriented relationships and is therefore not an honest merchandise-only ledger.
- `Payment` currently requires `bookingId`; it must support exactly one controlled commerce parent without weakening existing Booking Payment behaviour.
- Sprint 25 provides Cash/standalone EFTPOS method semantics, bounded terminal reference, receiving operator, timestamp and idempotency patterns.
- OWNER, MANAGER and STAFF are authorised POS operators within Event assignment; SCANNER is excluded.
- the current `/pos` browser route can be extended with an explicit mode while retaining the Ticket workflow unchanged.

## Locked Design Direction

### Separate retail Sale authority

Introduce a dedicated `RetailSale` aggregate with immutable `RetailSaleItem` snapshots. It is the authoritative record for merchandise-only POS commerce.

`RetailSale` must retain at least:

- unique human-readable Sale number;
- Event and Organisation ownership through the Event relationship;
- status and payment status;
- authoritative total and currency;
- creating and completing operator evidence;
- bounded reservation expiry;
- completion/expiry timestamps; and
- related Payments.

`RetailSaleItem` must retain at least:

- Product and optional Product Variant references;
- Product/Variant display-name snapshots;
- bounded SKU/barcode snapshots where present;
- quantity;
- unit-price snapshot;
- GST-rate snapshot; and
- line-total snapshot.

Snapshots protect historical receipts and reporting when the live catalogue later changes. No Ticket, participant, Session or admission capacity relationship belongs on this aggregate.

### Payment belongs to exactly one commerce parent

Generalise `Payment` so it belongs to exactly one of:

- an admission `Booking`; or
- a merchandise `RetailSale`.

Existing Payments must backfill unchanged to their current Booking. A forward migration must make `bookingId` nullable, add `retailSaleId`, add the required indexes and enforce an exclusive-parent constraint at the database boundary. Application validation alone is insufficient.

Existing Stripe, webhook, refund, cancellation, reconciliation and Booking investigation paths must continue to reject or handle missing Booking relationships explicitly rather than relying on unsafe non-null assumptions.

### Shared finite inventory authority

Static inventory remains one pool regardless of whether the item is sold:

- as an eligible Product attached to an online or walk-up admission Booking; or
- through a merchandise-only Retail Sale.

Available inventory must subtract eligible committed quantities from both commerce aggregates. The implementation should extract one shared inventory-availability boundary rather than duplicating query rules in Booking and POS services.

For Sprint 26:

- `inventoryQuantity` remains configured stock-on-hand authority; sales create immutable commitments rather than destructively rewriting the configured quantity;
- active, unexpired Retail Sale reservations temporarily commit stock;
- completed Retail Sales permanently contribute to committed/sold quantity;
- expired or deliberately abandoned unpaid Sales release their hold;
- cancelled, refunded, returned and restocked quantities are not inferred because those workflows are outside this Sprint; and
- serializable completion/revalidation must prevent concurrent Booking and Retail Sale oversell.

### Eligible merchandise catalogue

Merchandise-only mode may show a Product only when all relevant conditions hold:

- the Event is active and accessible to the current operator;
- Product status is `ACTIVE`;
- `availablePos` is true;
- `productType` is not `ADMISSION`;
- `requiresSession` is false;
- `capacityControlled` is false;
- the current time is within any configured Product sales window;
- a selected Variant is active and POS-available; and
- configured quantity bounds and finite inventory permit selection.

Session Products and reusable Products such as Kangas are excluded. Products may be untracked/unlimited or finite; tracked Products/Variants must have valid configured inventory.

### Server-authoritative reservation and completion

The browser may display an estimate, but the API re-resolves every identifier, price, Variant, sales window, limit and availability.

Review creates a short-lived Retail Sale reservation with authoritative line snapshots and total. Completion:

- accepts only `CASH` or `STANDALONE_EFTPOS`;
- requires a client idempotency key;
- optionally accepts a bounded standalone terminal reference;
- rechecks operator scope, reservation state, expiry and shared stock;
- requires the confirmed amount to equal the authoritative total;
- creates one successful Payment and completes the Sale transactionally;
- records completing operator and time; and
- returns the existing completion for an exact retry while rejecting mismatched key reuse.

A completed Retail Sale never invokes Ticket issuance.

### No anonymous-customer fiction

Merchandise-only POS does not create a placeholder Customer. Customer identity, receipt delivery, loyalty, online merchandise ordering and fulfilment/shipping are later capabilities that require their own evidence and privacy decisions.

## Permission Policy

| Capability | OWNER | MANAGER | STAFF | SCANNER |
|---|---:|---:|---:|---:|
| Open merchandise POS | Yes | Assigned Events | Assigned Events | No |
| View eligible merchandise/availability | Yes | Assigned Events | Assigned Events | No |
| Reserve merchandise stock | Yes | Assigned Events | Assigned Events | No |
| Confirm Cash/standalone EFTPOS receipt | Yes | Assigned Events | Assigned Events | No |
| Complete and inspect a Sale | Yes | Assigned Events | Assigned Events | No |
| Void, return, restock or refund | Not in Sprint 26 | Not in Sprint 26 | No | No |

Every Event, Product, Variant, Retail Sale and Payment identifier must be revalidated in the service against current membership and Event assignment. Navigation visibility is not an authorisation boundary.

## Slice 1 — Persistence and Commerce-Parent Contract

- add controlled Retail Sale status and payment-status values;
- add `RetailSale` and `RetailSaleItem` with required evidence and price/tax snapshots;
- add Event, status, Sale-number, operator and time indexes for investigation/reporting;
- add optional `Payment.retailSaleId` and make `Payment.bookingId` optional;
- add a database constraint requiring exactly one Payment commerce parent;
- preserve all existing Payment and PaymentRefund identifiers and relationships;
- update Prisma relations on Event, User, Product and ProductVariant;
- use a forward-only deterministic migration with no destructive commerce rewrite; and
- document why Retail Sale is separate from admission Booking.

Before applying the migration, audit every Payment query/include for an assumed non-null Booking and add explicit regression coverage.

## Slice 2 — Shared Inventory Availability

- extract or introduce one internal inventory-commitment service used by Booking and Retail Sale paths;
- count eligible reserved/confirmed Booking Products using the existing lifecycle rules;
- count active unexpired/completed Retail Sale Items;
- calculate Product-level and Variant-level availability consistently;
- validate Product/Variant ownership, selection and quantity limits;
- recheck inventory inside a serializable transaction immediately before reservation creation and completion;
- ensure concurrent Booking versus Retail Sale and Retail Sale versus Retail Sale attempts cannot oversell; and
- expose presentation-safe remaining availability without leaking another tenant's records.

The extraction must preserve reusable Session Product capacity and admission capacity unchanged; neither applies to merchandise-only Sales.

## Slice 3 — Merchandise Sale API

Add Event-scoped operator endpoints to:

- load the eligible merchandise catalogue with grouping, ordering, Variant prices and availability;
- create an authoritative short-lived Retail Sale reservation;
- retrieve a scoped reserved or completed Sale;
- complete Cash/standalone EFTPOS payment idempotently; and
- search recent Retail Sales by Sale number, Event, status, payment method, operator and bounded date range.

No client-supplied Organisation, price, total, GST calculation, availability result, status or operator identity is authoritative.

The list/search endpoint must be paginated, indexed and safely bounded. Direct foreign or unassigned identifiers return the same non-disclosing not-found behaviour used elsewhere.

## Slice 4 — POS Merchandise Mode

Extend `/pos` with an explicit, persistent but clearly visible mode selector:

- **Ticket sale** retains the accepted Sprint 25 workflow unchanged;
- **Merchandise sale** removes Session, Ticket and participant controls;
- changing mode clears any active basket/reservation after a deliberate warning where necessary;
- Event selection remains visible and role-scoped;
- Product groups/order reuse the organiser-configured customer-facing organisation;
- Variant and quantity selection are keyboard- and touch-operable;
- remaining finite stock is clear without implying untracked Products are unavailable;
- the basket shows line quantities, unit prices and authoritative total;
- review visibly reserves stock and shows expiry;
- Cash/EFTPOS confirmation uses the established safe wording and retry protection;
- success shows Sale number, method, total, operator evidence and line items; and
- “Start next sale” retains Event and mode but clears transaction state.

The UI must not request purchaser details, show a Session recommendation, run Ticket Rules or offer Session-capacity Products in merchandise mode.

## Slice 5 — Investigation, Reporting and Documentation

- add a discoverable recent merchandise Sales/investigation view without inserting Retail Sales into the Booking list;
- display Sale number, Event, status, total, lines, method, reference, operator and timestamps;
- add merchandise-only totals to Product/Variant and payment-method reporting through explicitly named metrics;
- preserve the distinction between admission Booking value, merchandise Sale value, collected amount and refunds;
- update reporting definitions before changing any existing headline total;
- document Cash/standalone EFTPOS procedure, expiry, stock behaviour and correction escalation;
- document that post-completion void/refund/return/restock is unavailable and requires Manager/Owner escalation;
- update API, architecture, operational and endpoint registers; and
- record exact automated and browser evidence in Sprint notes.

The future operational dashboard may consume these authoritative metrics, but dashboard implementation is outside Sprint 26.

## Required Browser Acceptance

Using fictional local fixtures and no real payment or production data:

1. OWNER opens POS, switches explicitly between Ticket and Merchandise modes, and sees the selected mode clearly.
2. Merchandise mode requires an accessible Event but no Session, purchaser, participant or Ticket.
3. Only active POS-available, non-Session, non-capacity-controlled merchandise appears.
4. Group/order and Variant prices match the configured Event catalogue.
5. A finite Variant can be reserved and completed for Cash, producing one Retail Sale and one Payment but no Booking or Ticket.
6. A standalone EFTPOS merchandise Sale records method, optional reference and receiving operator without being labelled Stripe.
7. Exact completion retry returns the same Sale; conflicting key reuse is rejected.
8. Concurrent or stale baskets cannot oversell stock shared with admission Booking Products.
9. An expired Sale releases its temporary stock commitment and cannot be completed.
10. Untracked merchandise can be sold without presenting false finite availability.
11. The completed Sale is searchable and its detail reconciles lines, total, Payment and operator evidence.
12. STAFF can transact only against assigned Events; direct foreign access is denied; SCANNER cannot access merchandise POS APIs or route.
13. Ticket mode remains operational and its selected Session/basket behaviour is unchanged.
14. Existing online booking, Stripe, Ticket, Waiver, scanner, reporting and Sprint 25 walk-up flows remain green.
15. Desktop and tablet POS views avoid page-level horizontal overflow and preserve usable touch/keyboard targets.

## Security, Privacy and Financial Controls

- resolve current membership and Event assignment on every protected operation;
- collect no customer data for anonymous counter merchandise sales;
- accept, persist and log no raw card data;
- distinguish Cash, standalone EFTPOS and online card methods consistently;
- capture actor, amount, method, time and bounded reference for staff-confirmed payments;
- enforce idempotency with database uniqueness and parameter matching;
- enforce exclusive Payment parentage at the database boundary;
- validate totals, GST snapshots, quantities and inventory only on the server;
- keep reservation and completion logs free of access tokens and unnecessary data;
- prevent completed Payment without a completed Sale and completed Sale without its successful Payment;
- use serializable transactions/retry handling for stock-sensitive writes; and
- expose no refund, void, return or restock mutation until its authority and audit model is delivered.

## Automated Verification Requirements

Minimum evidence:

- Prisma formatting/generation, migration validation and local application;
- deterministic migration/backfill and exclusive Payment-parent constraint tests;
- existing Booking Payment, Stripe webhook, refund, reconciliation and deletion regressions with nullable `bookingId`;
- Retail Sale model, line snapshot and total tests;
- merchandise catalogue status/channel/Session-exclusion tests;
- Product and Variant quantity/price/ownership validation tests;
- shared Booking/Retail Sale inventory availability tests;
- concurrent reservation/completion oversell tests;
- expiry/release tests;
- Cash and standalone EFTPOS completion tests;
- idempotent retry and mismatched-key tests;
- tenant, Event assignment and SCANNER denial tests;
- search pagination/filter/index-oriented service tests;
- Product/Variant and payment-method reporting reconciliation tests;
- focused POS mode/interface tests;
- full API and web suites;
- API and web production builds;
- changed-file lint and Git whitespace validation; and
- authenticated browser acceptance for OWNER, MANAGER, STAFF and SCANNER boundaries.

The Sprint must record the new baseline without weakening Sprint 25's 73 API suites / 487 tests and 24 web test files / 72 tests.

## Explicitly Out of Scope

- customer identity, emailed receipts or receipt-printer integration;
- online merchandise-only ordering, delivery, collection or shipping;
- integrated Stripe Terminal, Linkly, Square or bank-terminal adapters;
- split tender, discounts, promotions, coupons, Gift Cards or loyalty;
- cash drawer, float, shift and till balancing;
- offline capture or synchronisation;
- post-payment void, correction, refund, return, exchange or restock;
- stock receiving, transfers, purchase orders, suppliers or warehouse locations;
- barcode scanning and arbitrary POS layout builders;
- Session Products or reusable capacity Products in merchandise mode;
- Ticket sale redesign or automatic Session advancement;
- customer-service refund/cancellation or Ticket-change workflows;
- operational portfolio dashboard implementation;
- production hardware certification; and
- broad public-booking, Event setup or navigation redesign.

## Protected Foundations

Sprint 26 must not change:

- the routed public date → Session → Ticket → participant → add-on → checkout journey;
- Booking as the authority for admission commerce;
- shared Session admission capacity across Ticket Types;
- reusable Session Product capacity semantics;
- online Stripe PaymentIntent, webhook, late-success and refund behaviour;
- Sprint 25 walk-up Ticket Sale, participant, Rule and Ticket issuance behaviour;
- Ticket scanning, Gate Entry/Lookup and entry windows;
- Waiver versioning, acceptance or verification evidence;
- Event Group and existing report metric definitions without an explicit documented revision;
- Product/Variant grouping and ordering authority;
- OWNER-only Event configuration; or
- Sprint 24 role and Event-assignment enforcement.

## Completion Gate

Sprint 26 is complete only when:

- authorised staff can complete representative Cash and standalone EFTPOS merchandise-only Sales in the browser without developer intervention;
- no merchandise-only Sale creates a Booking, Customer, participant, Session relationship or Ticket;
- one shared inventory authority prevents oversell across Booking Products and Retail Sales;
- Payment parentage, method, amount, operator and completion evidence are durable and unambiguous;
- exact retry, expiry, denial and insufficient-stock paths are proven;
- completed Sales can be searched and reconciled;
- existing admission, Stripe and operational workflows remain green;
- documentation and exact verification evidence are committed; and
- Ice Rinks Australia accepts the browser workflow.

## Follow-On Sequence

After Sprint 26 acceptance:

1. partial Ticket cancellation/refund and discretionary Manager/Owner workflows;
2. Session change, Ticket replacement and Flexible Ticket entitlement;
3. cross-channel financial and till reconciliation productisation;
4. operational portfolio dashboard using the stable commerce/reporting sources;
5. production/security hardening and full device-based rehearsal; and
6. evidence-led UX productisation.

This order prioritises correctness and long-term maintainability while retaining the May 2027 target as a quality runway rather than a deadline-driven reason to accept temporary architecture.
