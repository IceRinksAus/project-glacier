# Sprint 26 — Merchandise-Only POS Commerce

## Status

Sprint 26 was implemented and accepted on 26 August 2026 under the locked scope in `docs/roadmap/sprint-26-plan.md`.

## Delivered foundation

Glacier now has a separate `RetailSale` aggregate for anonymous counter merchandise commerce. Immutable `RetailSaleItem` snapshots retain Product/Variant names, SKU/barcode, unit price, GST and line total. A Sale records Event scope, status, payment state, reservation expiry, creating/completing operator and timestamps.

`Payment` now belongs to exactly one commerce parent: a Booking or a Retail Sale. The database enforces this exclusive relationship. Existing Stripe and admission paths retain Booking ownership and explicitly reject a missing Booking relationship.

## Shared inventory

One inventory-commitment service is used by Booking and Retail Sale paths. Finite stock subtracts eligible Booking Products plus completed or actively reserved Retail Sale Items. Expired retail reservations release their hold. Reservation and completion use serializable retry and server-side revalidation.

Admission capacity and reusable Session Product capacity were not changed. Merchandise mode excludes admission, Session-required and capacity-controlled Products.

## API and interface

Event-scoped APIs now load eligible merchandise, reserve a server-priced Sale, complete Cash or standalone EFTPOS idempotently, retrieve a Sale and search recent Sales. OWNER, MANAGER and STAFF remain restricted by current Event access; SCANNER is excluded.

The POS has explicit **Ticket Sale** and **Merchandise Sale** modes. Merchandise mode requires an Event but no Session, purchaser or participant. It supports Product/Variant quantities, finite-stock presentation, authoritative review, safe payment wording and a success result that states no Booking or Ticket was created. A separate `/pos/sales` investigation view keeps retail commerce out of the Booking list.

## Local migration

`20260826150000_add_retail_sale_commerce` was applied successfully. It creates the retail Sale tables and indexes, adds `Payment.retailSaleId`, makes `Payment.bookingId` nullable and adds the database exclusive-parent constraint.

## Automated verification

Before final documentation, the following passed:

- Prisma formatting and client generation;
- all 37 local migrations, including the Sprint 26 migration;
- focused API verification: 8 suites / 91 tests;
- full API suite: 75 suites / 491 tests;
- full dashboard suite: 24 files / 73 tests;
- dashboard TypeScript validation through the production build;
- API production build;
- dashboard webpack production build, including `/pos/sales`.

The full suites and builds were rerun after the final investigation-route changes during close-out; exact final results are recorded in the close-out commit evidence.

The API production build passed. The broader test-inclusive `tsc --noEmit` command continues to report five pre-existing spec-only typing errors in Booking payment operations, Booking search, File Asset, Public Booking and User controller tests. Jest compiles and passes all 491 tests, and these unrelated test-typing issues were not changed or hidden in Sprint 26.

## Authenticated browser evidence

Using fictional local data, the Ice Rinks Australia OWNER:

- switched between Ticket and Merchandise modes;
- saw the existing Ticket mode retain its Session selector;
- saw merchandise mode omit Session, purchaser and participant controls;
- saw only the eligible `Sprint 26 Counter Beanie`, priced at `$15.00`, with shared remaining inventory;
- reviewed and explicitly authorised one fictional Cash payment;
- completed Sale `RS-1787728937836-B50695` for one beanie at `$15.00`; and
- received a success result naming Jamie Stoller and stating that no Booking or Ticket was created.

Direct persistence verification confirmed the Sale is `COMPLETED` and `PAID`, contains one immutable item, and has exactly one `$15.00` Cash Payment. That Payment has `bookingId: null`, the Retail Sale parent ID and the receiving operator ID.

An earlier review reservation created during browser reconnection remained unpaid and will expire normally, releasing its temporary stock hold.

## Operational boundary

Post-payment voids, refunds, returns, exchanges and restocking are intentionally unavailable. Customer identity, receipt delivery, integrated terminals, split tender, discounts, till balancing, barcode scanning and warehouse functions remain later work. Operators must escalate corrections to a Manager or Owner and must not create fictional admission records.

## Protected foundations

Sprint 26 did not redesign the public booking journey, change shared admission capacity, alter Ticket Rules or reusable Product capacity, weaken Stripe/webhook handling, change Ticket scanning or Waiver evidence, or mix merchandise Sales into Bookings.
