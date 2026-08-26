# Operational Reporting Architecture

## Purpose

Glacier reporting is a read-only operational projection over authoritative Event, Session, Booking, Payment, PaymentRefund and Ticket records. It helps organisers operate Events; it is not an accounting ledger, Stripe settlement report, payout statement or tax record.

## Authority and Definitions

- Confirmed Bookings are persisted Bookings in `CONFIRMED` state.
- Gross collected is the sum of persisted `SUCCEEDED` Payments attached to selected Bookings.
- Refunded is the sum of persisted `SUCCEEDED` PaymentRefunds attached to those successful Payments.
- Net collected is gross collected less successful refunds.
- Tickets issued includes Tickets attached to confirmed Bookings, excluding an original credential superseded by an immutable Session-change mapping. The replacement is counted once; ordinary cancellation history remains visible under its existing definitions.
- Admissions are issued Tickets with a successful scanned/checked-in state.
- Session capacity consumption is the Booking Item quantity on `RESERVED` and `CONFIRMED` Bookings.
- Product inventory and reusable Product capacity remain separate from admission capacity.
- Payment exceptions are Bookings with a locally pending Payment or a failed latest reconciliation attempt.
- Completed Session changes are counted from the immutable reschedule ledger and grouped by controlled reason without customer or participant identity.

No mutable revenue or attendance cache is stored. The reporting read model cannot change commerce, admission or inventory state.

## Time Semantics

An Event report defaults to the full Event range. An exact-date filter converts Event-local midnight boundaries to UTC on the server and selects Sessions by their start time. Attached Payments and refunds remain included regardless of transaction timestamp, so advance Payments and later refunds retain the correct selected Booking net position.

## Access and Privacy

All `/reporting` routes require an authenticated OWNER or MEMBER. Tenant scope comes only from the authenticated Organisation. A foreign Event and an unknown Event produce the same not-found boundary.

Reporting responses exclude customer and participant details, contact information, possession tokens, client secrets, raw provider payloads and full provider references. SCANNER has no reporting role.

## Bounds and Scale

The Organisation summary is capped at 100 Events, 5,000 Sessions and 50,000 minimal Booking projections. An Event report is capped at 500 Sessions and 25 exception links. These are explicit pilot protections, not claims of large-scale analytics capacity. Future materialisation requires a documented consistency, correction and rebuild strategy.

## Monitoring

Production operations should monitor report latency, errors, cap utilisation and disagreement between report figures and authoritative investigation records. Approaching a cap must trigger engineering review rather than silently presenting the result as complete. Payment-provider settlement reconciliation remains a separate production control.

## Detailed Category Reports and Exports

Detailed reads currently group sales and operations by Ticket Type, Session, Event-local Session date, Product and Product Variant. Event-local date and Session filters reuse the same scope contract as the Event overview. Product reporting distinguishes confirmed units/gross item sales from current Event-wide inventory commitments and per-Session reusable capacity. Active `REQUIRE_PRODUCT` Rules identify required products separately from discretionary Add-ons.

Booking pace uses Booking `createdAt` in the Event timezone for Bookings that are currently `CONFIRMED`, aligned to each selected Session's local calendar date. It does not use `confirmedAt` for bucket assignment and is not a website conversion, abandonment or marketing-attribution report.

Saved Event Group comparison aggregates only Events attached to a tenant-owned Group. The current commerce foundation is AUD-only, so Group totals are explicitly labelled AUD. Each Event retains its own timezone and Event-local duration. Absolute totals are paired with normalised context including revenue per Session, revenue per capacity place, attendance rate, capacity utilisation, Product attach rate and contribution to Group net collection. These measures are not presented as a universal Event ranking.

CSV exports for Ticket Type, Session, Event-local date, Product/Variant, sales-pace and saved Event Group comparison reports invoke the same server report methods and filters as the browser views. Files are UTF-8 with a byte-order mark, stable columns, human-readable filenames, ISO timestamps where relevant and repeated Event timezone/filter context. Every cell is quoted and values beginning with spreadsheet formula-control characters are prefixed safely. Responses are private/no-store and contain aggregate operational data only.

Browser print mode reuses the already loaded authoritative report, adds scope and generation context, and removes navigation, filter and editing controls. It supports browser print and Save as PDF; production-quality generated PDF and XLSX remain explicitly deferred to Sprint 24.

Admission-state and further benchmark reporting remain planned, together with production XLSX and generated PDF. Future export formats must reuse the same tenant scope, metric definitions and bounded filtering as the browser report.

Category-level gross sales can use authoritative Booking Item or Booking Product prices. Category-level net sales requires an explicit refund-allocation design because PaymentRefund currently records an amount against a Payment, not against an individual Ticket Type or Product. Until that attribution exists, detailed exports must either report gross category sales with Event-level refunds separately or clearly disclose a reviewed allocation policy.

Whole-Booking Session changes do not create commerce. Current Booking demand, Ticket presentation and reusable capacity are attributed to the destination Session after completion. Superseded Ticket credentials are excluded from issued/admission totals so a replacement does not double-count attendance. Event, Ticket Type and Product gross sales remain based on the unchanged Booking lines and Payment records.
