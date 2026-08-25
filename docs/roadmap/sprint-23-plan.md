# Sprint 23 Plan — Decision-Support Reporting, Event Groups and Exports

## Planning Status

Approved and locked on 25 August 2026.

## Recommendation

Sprint 23 should extend Sprint 22's authoritative operational reporting into practical sales breakdowns, multi-Event comparison, decision-support insights and bounded exports. It should not become a generic business-intelligence builder or imply precision that Glacier does not persist.

The Sprint should have three ordered slices:

1. **Event Groups and detailed reporting definitions**
2. **Organiser decision-support catalogue and comparisons**
3. **CSV export and print-ready reporting**

## Delivery Sizing Recommendation

The complete vision below is larger than a typical recent Glacier Sprint. The recommended delivery is a two-Sprint reporting programme:

### Sprint 23 — Detailed Reports and Event Groups

- Event Group foundation and management;
- the primary single-Event reports;
- Group totals and Event comparison scorecard;
- sales pace, attendance, capacity and Product attach-rate insights;
- shared server-authoritative report contracts; and
- CSV export plus print-ready browser presentation.

### Proposed Sprint 24 — Export and Reporting Productisation

- production-quality XLSX workbooks;
- formatted multi-page PDF generation and visual verification;
- additional promoter/season benchmark views;
- refined charts only where they improve decisions;
- export monitoring, larger-volume handling and format reconciliation; and
- any approved instrumentation groundwork for later conversion/marketing reporting.

Production-quality XLSX and generated PDF remain a planned Sprint 24 continuation. This boundary protects the breadth and correctness of Sprint 23's Event Groups and decision-support reporting.

## Objective

Allow an authorised organiser to understand what is selling, when demand occurs, where capacity or inventory is constrained, how customers behave operationally, and how Events compare across cities or a season. The organiser should be able to export the same trusted result for offline review without database access.

## Existing Foundation to Preserve

- Sprint 22 Organisation and Event reporting endpoints;
- authenticated Organisation tenant context;
- OWNER/MEMBER reporting access and SCANNER denial;
- Event-timezone filtering;
- server-authoritative Booking, Payment, PaymentRefund and Ticket states;
- shared Session admission capacity across Ticket Types;
- separate reusable Product capacity and finite Variant inventory;
- immutable Booking Item and Booking Product price snapshots;
- bounded read models and deterministic ordering;
- existing Booking payment-investigation workflow; and
- explicit separation between operational reporting and accounting/settlement.

## Organiser Decision Questions

The reporting experience should be designed around decisions rather than database entities. It should help an organiser answer:

- Which Events, cities, dates and Session times should we repeat or expand?
- Which Sessions should gain capacity, be consolidated or change time?
- Which Ticket Types drive volume and revenue mix?
- How far in advance do customers book, and when should marketing intensify?
- Which Products attach to which Ticket Types and Sessions?
- Are reusable items such as Kangas constraining sales before rink capacity is reached?
- Which merchandise Variants are selling through, understocked or likely to remain?
- What proportion of confirmed customers attend, and where are no-shows concentrated?
- Which Events create unusually high refunds, Payment failures or support workload?
- How do comparable cities or Events perform after normalising for capacity, duration and number of Sessions?
- What is the season/tour total, and which Events contribute most strongly or weakly?

## Event Groups and Comparison Model

### Requirement

An Organisation must be able to create reusable Event Groups and attach Events to them. Examples include:

- `Winter Festival 2027 Season`;
- `East Coast Tour`;
- `Promoter A Portfolio`;
- `School Holiday Campaign`; and
- a three-city simultaneous festival.

An Event may reasonably belong to more than one group—for example a Season, a Promoter portfolio and a Campaign—so the preferred foundation is an Organisation-owned many-to-many `EventGroup` relationship rather than one group field on Event.

### Minimum management capability

- OWNER creates, renames, describes and archives an Event Group;
- OWNER adds/removes only Events owned by the same Organisation;
- OWNER/MEMBER can read grouped reports;
- group type is a controlled value such as `SEASON`, `TOUR`, `PROMOTER`, `CAMPAIGN` or `CUSTOM`;
- group membership and ordering are persisted;
- deleting or archiving a group never deletes an Event or its operational records; and
- tenant isolation is enforced through authenticated Organisation context.

### Comparison modes

Reports should support:

- one Event;
- one saved Event Group;
- an authorised ad hoc selection of multiple Events; and
- Organisation total where bounded and meaningful.

Comparison must include both absolute and normalised measures. A larger Event should not appear automatically “better” solely because it ran longer or had more capacity.

Recommended comparison measures include:

- gross collected, refunds and net collected;
- confirmed Booking and Ticket units;
- revenue per Session and per available capacity place;
- admissions and attendance rate;
- average Booking value and Tickets per Booking;
- capacity utilisation, sold-out/near-capacity Session count and unused capacity;
- Product attach rate and Product revenue per attendee;
- refund and Payment-exception rates;
- sales pace aligned by days before Event/Session rather than only calendar date; and
- contribution to the selected Group total.

Each Event retains its own timezone for operational-day grouping. Cross-Event reports must label currency and timezone semantics explicitly. The current AUD-only foundation can aggregate AUD Events; mixed-currency aggregation requires a separate exchange-rate policy and is outside this Sprint.

## Reporting Definitions

### Sales language

The interface and exports must distinguish these concepts:

- **Units sold:** quantity on `CONFIRMED` Booking Items or Booking Products.
- **Gross Ticket sales:** sum of persisted Booking Item `totalPrice` on confirmed Bookings.
- **Gross Product sales:** Booking Product quantity multiplied by its persisted `unitPrice` on confirmed Bookings.
- **Confirmed Booking value:** persisted Booking `total` for confirmed Bookings.
- **Gross collected:** persisted successful Payment amounts.
- **Successful refunds:** persisted successful PaymentRefund amounts.
- **Net collected:** gross collected less successful refunds.

“Sales” must never ambiguously mix item-order value and successful cash collection.

### Refund allocation boundary

A PaymentRefund belongs to a Payment, not to a Ticket Type, Product or Booking line. Sprint 23 must not fabricate line-level net revenue.

Therefore:

- Event and Session reports may show collected, refunded and net figures because Bookings and Payments can be attributed to an Event and Session.
- Ticket Type, Product and Product Variant reports show authoritative units and gross item sales.
- Event/Session refund totals appear alongside category reports as unallocated refunds with an explanatory label.
- “Net by Ticket Type/Product” is prohibited until Glacier persists an explicit allocation or a separately approved allocation policy.

### Time semantics

- Report windows use Session start dates in the Event timezone.
- Attached Payments and refunds remain associated with the selected Bookings regardless of transaction timestamp.
- Daily groupings use Event-local dates.
- All exports state the Event timezone and effective filter window.

## Slice 1 — Detailed Read Model

Add bounded authenticated Event report endpoints or controlled report-type parameters for:

### Sales by Ticket Type

- Ticket Type identity and status;
- confirmed units sold;
- gross Ticket sales;
- share of confirmed Ticket units;
- issued Tickets and admissions where the Ticket relationship supports it; and
- deterministic total row.

### Sales by Session

- Event-local Session date/time and status;
- confirmed Booking count and value;
- successful Payment collection;
- successful refunds and net collected;
- Ticket units, issued Tickets and admissions; and
- capacity, remaining capacity and utilisation.

### Product and Product Variant sales

- Product, group and Variant identity;
- confirmed units sold;
- gross Product sales;
- current inventory remaining where inventory is finite;
- reusable per-Session Product utilisation where capacity-controlled; and
- explicit separation from admission capacity.

### Sales by Event-local date

- Session-date grouping;
- confirmed Booking and Ticket quantities;
- gross Booking value;
- successful collected/refunded/net amounts;
- issued Tickets and admissions; and
- deterministic chronological ordering.

### Sales pace and booking lead time

- Bookings created by days/weeks before Session start;
- cumulative confirmed Ticket sales curve;
- comparison against another Event or Group median where meaningful;
- late-booking concentration; and
- clearly labelled use of Booking creation/confirmation time rather than website activity.

This report helps determine campaign timing using currently persisted Booking timestamps. It is not a conversion funnel.

### Ticket mix and customer basket

- Ticket Type share of confirmed units and gross Ticket sales;
- Tickets per confirmed Booking;
- Product units and revenue per confirmed Booking;
- Product attach rate: confirmed Bookings containing a Product divided by confirmed Bookings in scope;
- common Ticket Type/Product combinations using aggregate counts; and
- required-Rule Products identified separately from discretionary Add-ons where the Rule evidence supports it.

### Attendance and no-show

- issued versus admitted Tickets;
- attendance and no-show rates by Event, date, Session and Ticket Type;
- arrival distribution from successful scan timestamps where persisted;
- early/late/denied scan outcomes as operational context; and
- no inference that an unscanned Ticket definitely represents a customer who arrived but was refused.

### Capacity opportunity

- near-capacity and sold-out Sessions;
- unused admission capacity;
- demand concentration by day and Session time;
- reusable Product capacity constraints separate from rink capacity;
- Sessions where Product availability may constrain Add-on selection; and
- normalised utilisation comparisons across Events.

### Product and inventory decision support

- Product and Variant unit sales, gross sales and attach rate;
- finite stock remaining and sell-through percentage;
- reusable Product peak utilisation by Session;
- required versus discretionary Product demand;
- low-stock and apparent overstock indicators; and
- no inventory “movement history” claim beyond the evidence currently persisted.

### Operational quality

- refund count/rate and unallocated refund value;
- Payment exception and reconciliation outcome rate;
- Booking expiry/cancellation rate;
- Waiver completion coverage where a reliable denominator exists;
- gate admission/denial outcomes; and
- links into existing investigation surfaces rather than duplicate workflows.

### Optional reports if capacity permits

- Payment lifecycle and reconciliation outcomes;
- Event Group executive summary;
- promoter/season contribution report; and
- Event-to-Event benchmark scorecard.

Optional reports cannot displace the four primary reports.

## Slice 2 — Organiser Report Catalogue

Extend the existing Event Reports tab with a clear report selector rather than a generic drag-and-drop report builder.

Minimum catalogue:

- Event overview;
- Sales by Ticket Type;
- Sales by Session;
- Sales by date;
- Product and Variant sales; and
- Attendance and Session utilisation.

The multi-Event catalogue should add:

- Event Group overview;
- Event comparison scorecard;
- season/tour sales and attendance totals;
- sales-pace comparison; and
- city/date/Session-time performance comparison.

Each report should provide:

- exact Event-local date range and Session filters where relevant;
- search within returned category rows where useful;
- visible metric definitions/help text;
- sortable columns with deterministic server defaults;
- totals that reconcile to the Event overview;
- explicit empty/loading/error states;
- accessible table headings and keyboard controls; and
- responsive presentation without page-level horizontal overflow.

Decision-support presentation should use concise explanatory text such as “High utilisation with low attendance” or “Kanga capacity reached before rink capacity” only when the underlying calculation is deterministic and disclosed. Glacier should surface evidence, not generate unsupported business advice.

## Reports Requiring Future Data

Several valuable organiser reports cannot be made authoritative from today's persisted records. Sprint 23 must identify them in the interface/roadmap rather than simulate them:

- **Website conversion funnel:** requires privacy-reviewed page/session, checkout-step and abandonment instrumentation.
- **Marketing source/ROI:** requires campaign/referral attribution and advertising cost data.
- **Profit and margin:** requires Event costs, taxes, fees and an approved allocation model—not merely revenue.
- **Customer location/return rate:** requires a privacy-approved customer analytics model, deduplication rules and minimum cohort sizes.
- **Support workload:** requires structured support interaction records.
- **True stock movement:** requires inventory adjustment, receipt, damage and reconciliation history.

These capabilities should be designed separately with privacy, retention and data-quality requirements. Revenue must not be labelled profit.

## Slice 3 — CSV and Print Export System

Exports must be generated from the same authoritative query and filter contract as the visible report. The browser must not independently recalculate totals from a different record set.

### CSV

- UTF-8 with a stable documented column order;
- safe human-readable filenames containing Event, report type and generated date;
- formula-injection protection for cells beginning with spreadsheet control characters;
- machine-readable ISO timestamps plus Event timezone context; and
- no customer or participant personal information.

### Deferred XLSX contract

- planned for Sprint 24, not implemented in Sprint 23;
- one report worksheet plus a Definitions worksheet;
- typed numeric/currency/date cells;
- frozen headings, filters and sensible column widths;
- Event, timezone, effective window and generation timestamp metadata; and
- selected Event Group or Event comparison set where applicable; and
- the same rows and totals as CSV/browser output.

### Print-ready browser output

- formatted organiser summary suitable for printing or browser-provided Save as PDF;
- Event identity, filters, timezone, generation time and metric definitions;
- Group identity and included Event list for multi-Event reports;
- repeated table headings where browser print support permits;
- operational-not-accounting disclaimer;
- landscape treatment for wide Session/Product tables; and
- no claim that browser-produced PDF is Glacier's future production-generated PDF export.

### Deferred generated PDF contract

- planned for Sprint 24, not implemented in Sprint 23;
- controlled multi-page rendering with repeated headings, page numbering and visual verification;
- Event/Group identity, filters, timezone and generation metadata; and
- landscape treatment for wide Session/Product tables.

### Export safety and performance

- OWNER/MEMBER only; SCANNER denied;
- tenant scope exclusively from authentication;
- strict report-type and filter allowlists;
- maximum Event count for ad hoc comparisons and maximum group size for synchronous exports;
- bounded synchronous pilot exports with an explicit maximum row count;
- clear rejection when a request exceeds the bound rather than silent truncation;
- no persistent public export URLs;
- no possession credentials, provider secrets or raw provider payloads;
- safe `Content-Type` and `Content-Disposition` headers; and
- no temporary export retention beyond request processing unless separately designed.

## Reconciliation and Integrity Gates

Before UI acceptance, tests must prove:

- Ticket Type unit totals reconcile to confirmed Booking Item quantities;
- Product totals reconcile to confirmed Booking Product quantities/prices;
- Event Group totals reconcile to the sum of the included Event results without duplicate membership counting;
- ad hoc Event selection rejects foreign-Organisation IDs as safely as unknown IDs;
- normalised comparison measures use the documented denominators and remain zero-safe;
- sales-pace comparisons align by days-before-start and preserve each Event's timezone;
- Session totals reconcile to the Sprint 22 Event report;
- successful late Payments and compensating refunds retain correct Event/Session net effect;
- expired/cancelled Bookings do not become confirmed category sales;
- category reports never subtract unallocated refunds as if precisely attributed;
- CSV, print and browser totals agree for identical filters;
- empty Events produce safe zero/empty exports; and
- cross-tenant, unknown Event and SCANNER access fail safely.

## Documentation Deliverables

- detailed reporting architecture and metric dictionary;
- export format/column contracts;
- API endpoint register updates;
- local acceptance and reconciliation procedure;
- production monitoring and export-limit implications;
- Sprint 23 notes and changelog; and
- roadmap capability update.

## Verification Gates

- focused aggregate and export-equivalence tests pass;
- full API suite remains at or above 67 suites / 435 tests;
- full web suite remains at or above 20 suites / 58 tests;
- API and web production builds pass;
- changed-file lint and formatting checks pass;
- migration status remains current;
- authenticated browser acceptance verifies every primary report;
- exported CSV files are opened and structurally verified;
- print-preview styling is visually verified across representative data;
- desktop and 390 × 844 acceptance show no page-level overflow; and
- known local totals reconcile across overview, detailed reports and exports.

## Locked Non-goals

- no arbitrary BI/query builder;
- no custom SQL or user-defined formulas;
- no accounting general ledger, tax or Stripe payout/settlement report;
- no invented Ticket Type/Product refund allocation;
- no customer-level marketing export or participant personal-data export;
- no scheduled email delivery;
- no persistent public share links;
- no forecasting;
- no profitability or margin claims without authoritative cost data;
- no website conversion or marketing attribution without approved instrumentation;
- no cross-currency aggregation or invented exchange rates;
- no unrestricted customer-level demographic or behavioural analytics;
- no data warehouse/materialised reporting platform;
- no POS, manual refund, rescheduling or unrelated customer-service expansion;
- no production deployment; and
- no broad visual redesign outside the Reports workspace.

## Delivery Sequence

1. Review and approve the report catalogue, Event Group model and terminology.
2. Lock the refund-allocation boundary, comparison denominators and export limits.
3. Commit this plan independently.
4. Implement the tenant-safe Event Group foundation and management controls.
5. Implement and test Ticket Type, Session, date and Product/Variant reports.
6. Implement decision-support reports for sales pace, basket/attach rate, attendance and capacity opportunity.
7. Implement saved-group and ad hoc multi-Event comparison.
8. Build the organiser report catalogue and filters.
9. Implement CSV from the shared server-authoritative result.
10. Implement print-ready output and visual verification.
11. Run CSV/print/group reconciliation, security and responsive acceptance.
12. Complete documentation, closeout and push only after approval.
13. Reassess the complete Pilot Readiness plan before locking the next operational milestone.

## Sprint Completion Definition

Sprint 23 is complete when an authorised organiser can select a detailed Event or Event Group report, understand exactly what each value means, compare Events using fair absolute and normalised measures, identify actionable capacity/sales/attendance patterns, and export matching CSV/print results without Glacier exposing private customer data or overstating the precision of its evidence.

## Locked Decisions

1. Confirm the primary single-Event catalogue: overview, Ticket Type, Session, Event-local date, Product/Variant, sales pace, basket/attach rate, attendance and capacity opportunity.
2. Confirm the many-to-many Event Group model with Season, Tour, Promoter, Campaign and Custom group types.
3. Confirm saved groups plus ad hoc authorised Event comparison are both required.
4. Confirm that category reports show gross item sales and disclose refunds separately rather than claiming category-level net revenue.
5. Sprint 23 delivers CSV and print-friendly browser output. Production-quality XLSX and generated PDF are reserved for the proposed Sprint 24.
6. Exports are aggregate operational reports only, with no customer names, email addresses or participant details.
7. Reports needing new instrumentation/cost data are documented for later rather than approximated in Sprint 23.

## Mandatory Post-Sprint Review

After Sprint 23 closeout and before locking the next platform Sprint, Glacier will re-examine the complete Pilot Readiness and Strategic Roadmap against the implemented repository. The review must:

- update capability statuses from evidence rather than old Sprint assumptions;
- identify remaining pilot blockers, dependencies and operational sign-offs;
- reassess the ordering of security, production readiness, customer service, POS and reporting-productisation work;
- confirm whether proposed Sprint 24 XLSX/PDF work remains the next highest priority; and
- preserve a clear boundary between pilot-critical requirements and post-pilot product expansion.
