# Sprint 22 Plan — Operational Dashboard and Core Event Reporting

## Planning Status

Approved on 24 August 2026. This document is the locked Sprint 22 delivery contract.

## Recommendation

Sprint 22 should deliver Glacier's first trustworthy organiser reporting surface and turn the Dashboard and Events destinations into day-to-day operating tools.

This is the next required pilot capability after Sprint 21. Glacier can now create and configure Events, sell and fulfil Bookings, admit customers, investigate Payments and organise Add-ons. Organisers still cannot see the commercial and operational position of an Event without inspecting individual records.

The Sprint has three ordered slices:

1. **Tenant-safe reporting read model**
2. **Organisation Dashboard and Event tracking**
3. **Event Reports workspace**

The read model comes first so every displayed total has one documented server-authoritative definition.

## Objective

Give authorised organisers a clear, current view of Event activity, sales, attendance, Session utilisation, refunds and Payment exceptions without database access.

The Sprint must preserve the Booking, Payment, Refund, Ticket, Session capacity, Product inventory, Rule, Waiver and tenant boundaries established through Sprints 14–21.

## Evidence Behind This Sprint

The strategic pilot-readiness matrix marks basic Event reporting as required before pilot. Minimum needs include Event sales, revenue, Tickets, attendance, Session utilisation, refunds and Payment/reconciliation state.

Current implementation evidence shows:

- the Organisation Dashboard is a static welcome placeholder with hard-coded date/name text;
- the Events destination lists Event identity and dates but does not support operational tracking;
- the Event Workspace exposes a Reports tab without a reporting implementation;
- Bookings and Payment investigation now have safe tenant-scoped foundations; and
- the local system has enough representative Booking, Payment, Refund, Ticket and scan data for meaningful browser acceptance.

This Sprint also implements the approved product direction that routine Event tracking belongs on the Events page, while Event creation remains isolated in the dedicated Create Event workflow.

## Existing Foundations to Preserve

- Organisation-scoped authenticated Event access;
- OWNER and MEMBER operator roles;
- dedicated `/events/new` creation workflow;
- Event Workspace and tab routing;
- Event-timezone-aware Session presentation;
- server-authoritative Booking totals;
- Payment and PaymentRefund as financial truth;
- CONFIRMED/PAID Ticket-issuance boundary;
- Ticket admission status and scan-attempt audit history;
- shared Session capacity across Ticket Types;
- Payment reconciliation history and masked provider references;
- public/customer data minimisation; and
- additive migrations and non-destructive repository practice.

The permanent 45-suite / 236-test API regression floor remains in force. Sprint 21 closed at 65 API suites / 424 tests and 17 web suites / 54 tests; Sprint 22 must not silently reduce either verified baseline.

## Reporting Definitions

All metrics must be calculated on the server from controlled Glacier states. The browser must not derive financial or operational totals from downloaded record lists.

### Commercial metrics

- **Confirmed Bookings:** Bookings in `CONFIRMED` state.
- **Gross collected:** successful Payment amounts for the selected Event and reporting window.
- **Refunded:** successful PaymentRefund amounts for those Payments.
- **Net collected:** gross collected less successful refunds.
- **Average Booking value:** confirmed Booking total divided by confirmed Booking count; zero when no confirmed Bookings exist.
- **Payment exceptions:** unresolved locally pending Payments and failed reconciliation attempts requiring investigation.

These are operational payment figures, not accounting settlement, payout, tax or general-ledger reports.

### Ticket and attendance metrics

- **Tickets issued:** Tickets attached to eligible confirmed Bookings.
- **Admissions:** Tickets successfully processed as entered.
- **Attendance rate:** admissions divided by issued Tickets; zero-safe and clearly labelled.

### Session utilisation

- **Reserved attendance:** active reserved plus confirmed admission quantities that currently consume Session capacity.
- **Confirmed attendance:** confirmed Ticket/Booking quantities for the Session.
- **Utilisation:** capacity-consuming quantity divided by Session capacity.
- **Remaining capacity:** authoritative Session capacity less current capacity-consuming quantity, never below zero.

Product inventory and Product capacity must not be combined with rink admission capacity.

### Time boundaries

- Event reports default to the full Event date range.
- Optional Session and date filtering must use the Event timezone.
- A date filter selects Bookings through Sessions starting on that Event-local date; it does not exclude an advance Payment merely because the Payment occurred on an earlier calendar date.
- Payments and refunds attached to the selected Bookings remain included regardless of their own transaction timestamp, so a later refund corrects the selected Event/Session net position.
- Timestamp boundaries are calculated on the server and expressed unambiguously.

## Slice 1 — Tenant-safe Reporting Read Model

### Event report endpoint

Add a bounded authenticated report endpoint for an Event owned by the current Organisation.

The minimum response should include:

- Event identity, lifecycle and timezone;
- commercial summary;
- Booking and Payment-state summary;
- Ticket and attendance summary;
- refund summary;
- Session utilisation rows;
- recent reconciliation exceptions; and
- the effective report/filter window.

### Organisation summary endpoint

Add a bounded Organisation dashboard summary covering current and upcoming Events. It should return only the operational fields needed by the Dashboard and must not expose customer or participant details.

### Query and performance boundaries

- validate Event, date, Session and range inputs through strict DTOs;
- cap date ranges and row counts;
- use aggregate/select queries rather than loading complete Booking graphs;
- use stable deterministic ordering;
- avoid per-row query patterns for Session summaries;
- return zeros and empty collections safely for new Events; and
- document every metric definition in code tests and architecture notes.

### Security boundaries

- OWNER and MEMBER may read tenant-owned operational reports;
- SCANNER has no reporting access;
- cross-tenant and unknown Event IDs return the same safe not-found response;
- report responses contain no possession tokens, client secrets or full provider references;
- no arbitrary field/group-by query language is exposed; and
- all filter values are server validated.

## Slice 2 — Organisation Dashboard and Event Tracking

### Organisation Dashboard

Replace the placeholder with a live operational overview:

- current date and authenticated organiser identity;
- active and upcoming Event count;
- today's Sessions;
- confirmed Bookings;
- Tickets issued and admissions;
- net collected and successful refunds;
- unresolved Payment/reconciliation exceptions; and
- direct links into the affected Event, Booking or Reports workspace.

Metrics should use concise cards and operational lists. Charts should be added only where they materially improve comprehension.

### Events destination

The Events page becomes an Event-tracking destination rather than an Event-construction surface.

Each Event card/row should show:

- status and dates;
- upcoming/today/completed context;
- Session count and next Session;
- confirmed Booking/Ticket indicators;
- attendance/utilisation indicator where relevant;
- Payment exception indicator; and
- direct operational links.

The only creation affordance is a clear link to `/events/new`. No creation form or setup wizard is embedded in the routine Events page.

### States and accessibility

- explicit loading, empty, error and no-activity states;
- responsive desktop/tablet/mobile layouts;
- text labels alongside colour/status treatments;
- keyboard-reachable links and filters; and
- no horizontal page overflow at the accepted mobile width.

## Slice 3 — Event Reports Workspace

Implement the existing Event Workspace `Reports` tab as an operational report rather than a generic BI builder.

### Summary

- gross collected;
- successful refunds;
- net collected;
- confirmed Bookings;
- average Booking value;
- Tickets issued;
- admissions and attendance rate; and
- Payment/reconciliation exceptions.

### Session table

For every Session in the selected window:

- local Event date/time;
- Session name/status;
- capacity;
- reserved and confirmed attendance;
- remaining capacity;
- utilisation percentage;
- Tickets admitted; and
- direct link to the Session or filtered Bookings where supported.

### Operational drill-down

Report exception counts link to the existing Booking search/investigation tools. Sprint 22 must reuse those tools rather than creating a second payment operations workflow.

### Filtering

Minimum filtering:

- full Event;
- exact Event-local date; and
- specific Session.

Filters must preserve deterministic totals and make the effective window visible.

## Data Integrity and Financial Boundaries

- No new mutable revenue total is stored as a convenience cache.
- Reporting reads existing authoritative Booking, Payment, PaymentRefund, Ticket and Session records.
- Refunds reduce net collected only when their persisted refund status is successful.
- Expired or cancelled Bookings are not counted as confirmed sales.
- A successful late Payment and its successful compensating refund remain visible in gross and refunded totals, producing the correct net effect.
- Ticket admission is not inferred from Booking confirmation.
- Report reads cannot mutate Booking, Payment, Refund, Ticket, Session or inventory state.
- Any future materialised summary design requires a separate consistency and rebuild strategy.

## Documentation Deliverables

Sprint 22 must update:

- Sprint 22 closeout notes;
- reporting metric definitions and architecture;
- API endpoint register;
- Product roadmap and strategic capability status;
- local acceptance instructions;
- production monitoring/checklist implications; and
- changelog.

Documentation must distinguish operational payment reporting from Stripe settlement/accounting reporting.

## Verification Gates

Before Sprint closeout:

- focused aggregate/metric tests pass;
- empty Event, mixed Booking-state, refund and late-success cases are covered;
- Event timezone/date-window boundaries are covered;
- tenant-isolation and SCANNER-denial tests pass;
- complete API suite passes at or above 65 suites / 424 tests;
- complete web suite passes at or above 17 suites / 54 tests;
- API and web production builds pass;
- changed-file lint and formatting checks pass;
- local database migrations remain current;
- authenticated browser acceptance verifies Dashboard, Events and Event Reports;
- desktop and mobile acceptance show no critical overflow or inaccessible controls; and
- displayed totals are reconciled against known local records.

Known repository-wide lint and inherited Prisma dependency advisories remain visible and must not be disguised as Sprint-created failures.

## Locked Non-goals

- no accounting general ledger, tax return or payout reconciliation;
- no arbitrary report builder or custom query language;
- no downloadable CSV/PDF report unless required to make the accepted operational report usable;
- no broad analytics warehouse or materialised reporting platform;
- no forecasting;
- no customer-level marketing analytics;
- no Booking rescheduling or exchange;
- no discretionary manual refund workflow;
- no chargeback/dispute management;
- no POS or walk-up sales workflow;
- no changes to Payment, Refund, Ticket or capacity authority;
- no Event creation redesign beyond keeping creation isolated in `/events/new`;
- no production deployment; and
- no broad visual redesign outside the Dashboard, Events and Reports surfaces required by this Sprint.

## Delivery Sequence

1. Approve and commit this locked Sprint 22 plan independently.
2. Define and test metric semantics against current schema states.
3. Implement tenant-safe Event and Organisation reporting reads.
4. Build the Organisation Dashboard and Event-tracking destination.
5. Build Event Reports summary, Session table and filters.
6. Link exceptions to existing Booking investigation tools.
7. Run full automated, database and responsive browser acceptance.
8. Complete detailed closeout documentation and commit sequence before push.

## Sprint Completion Definition

Sprint 22 is complete only when an authorised organiser can open Glacier and understand which Events need attention, how an Event is performing commercially and operationally, how Sessions are utilising capacity, and where Payment exceptions require investigation—without database access and without Glacier presenting operational totals as formal accounting statements.
