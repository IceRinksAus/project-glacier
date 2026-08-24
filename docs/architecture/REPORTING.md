# Operational Reporting Architecture

## Purpose

Glacier reporting is a read-only operational projection over authoritative Event, Session, Booking, Payment, PaymentRefund and Ticket records. It helps organisers operate Events; it is not an accounting ledger, Stripe settlement report, payout statement or tax record.

## Authority and Definitions

- Confirmed Bookings are persisted Bookings in `CONFIRMED` state.
- Gross collected is the sum of persisted `SUCCEEDED` Payments attached to selected Bookings.
- Refunded is the sum of persisted `SUCCEEDED` PaymentRefunds attached to those successful Payments.
- Net collected is gross collected less successful refunds.
- Tickets issued includes Tickets attached to confirmed Bookings only.
- Admissions are issued Tickets with a successful scanned/checked-in state.
- Session capacity consumption is the Booking Item quantity on `RESERVED` and `CONFIRMED` Bookings.
- Product inventory and reusable Product capacity remain separate from admission capacity.
- Payment exceptions are Bookings with a locally pending Payment or a failed latest reconciliation attempt.

No mutable revenue or attendance cache is stored. The reporting read model cannot change commerce, admission or inventory state.

## Time Semantics

An Event report defaults to the full Event range. An exact-date filter converts Event-local midnight boundaries to UTC on the server and selects Sessions by their start time. Attached Payments and refunds remain included regardless of transaction timestamp, so advance Payments and later refunds retain the correct selected Booking net position.

## Access and Privacy

`GET /reporting/organization` and `GET /reporting/events/:eventId` require an authenticated OWNER or MEMBER. Tenant scope comes only from the authenticated Organisation. A foreign Event and an unknown Event produce the same not-found boundary.

Reporting responses exclude customer and participant details, contact information, possession tokens, client secrets, raw provider payloads and full provider references. SCANNER has no reporting role.

## Bounds and Scale

The Organisation summary is capped at 100 Events, 5,000 Sessions and 50,000 minimal Booking projections. An Event report is capped at 500 Sessions and 25 exception links. These are explicit pilot protections, not claims of large-scale analytics capacity. Future materialisation requires a documented consistency, correction and rebuild strategy.

## Monitoring

Production operations should monitor report latency, errors, cap utilisation and disagreement between report figures and authoritative investigation records. Approaching a cap must trigger engineering review rather than silently presenting the result as complete. Payment-provider settlement reconciliation remains a separate production control.

## Planned Detailed Reports and Exports

Future reporting may group sales and operations by Ticket Type, Session, Event-local date, Product, Product Variant and admission state, with CSV, XLSX, PDF and print-friendly output. Export endpoints must reuse the same tenant scope, metric definitions and bounded filtering as the browser report.

Category-level gross sales can use authoritative Booking Item or Booking Product prices. Category-level net sales requires an explicit refund-allocation design because PaymentRefund currently records an amount against a Payment, not against an individual Ticket Type or Product. Until that attribution exists, detailed exports must either report gross category sales with Event-level refunds separately or clearly disclose a reviewed allocation policy.
