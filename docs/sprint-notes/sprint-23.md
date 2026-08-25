# Sprint 23 — Decision-Support Reporting, Event Groups and Exports

## Status

In progress from 25 August 2026. Scope is controlled by `docs/roadmap/sprint-23-plan.md`.

## Slice 1 — Event Group Foundation

The first checkpoint introduces an additive Organisation-owned Event Group model for Seasons, Tours, Promoters, Campaigns and custom collections. Explicit membership allows an Event to belong to multiple Groups and retains organiser-defined Event ordering.

Protected API boundaries provide bounded OWNER/MEMBER reads and OWNER-only creation, update, archive lifecycle and ordered membership replacement. Organisation identity is taken only from authenticated context. Membership validates every Event against the same Organisation before a transaction deletes or creates any relationship, preventing partial or cross-tenant assignment.

Archiving a Group does not delete Events or their commerce/operational records. Deleting an Event removes only its membership rows through the additive relationship. Group reads return presentation-safe Event identity, lifecycle, dates and timezone rather than complete Event graphs.

The migration adds `EventGroup` and `EventGroupEvent` tables, tenant/status and ordering indexes, exact membership uniqueness and a case-insensitive Organisation-level Group-name uniqueness index.

The organiser Reports destination now provides the Event Group management surface. OWNER can create a controlled Group type, select Events, persist their comparison order through keyboard-accessible up/down controls, and archive or restore the Group without deleting any Event. MEMBER receives the same read-only Group presentation without mutation controls.

## Verification to Date

- Event Group focused suite: 2 suites / 9 tests passed.
- Complete API suite: 69 suites / 447 tests passed.
- API production build: passed.
- Prisma schema formatting, generation and validation: passed.
- Additive Event Group migration applied locally; all 31 migrations are current.
- Tests cover authenticated tenant scope, OWNER mutation roles, trimmed creation, duplicate names, cross-tenant Group denial, ordered transactional membership and rejection of a foreign Event before mutation.
- Event Group web checks: 1 suite / 2 tests passed.
- Complete web suite: 21 suites / 60 tests passed.
- Web lint: no new errors; one documented inherited internal-navigation warning remains.
- Web webpack production build: passed and includes the `/reports` route.

## Slice 2 — Detailed Sales Read Model

The first detailed report endpoints add Sales by Ticket Type and Sales by Session using the same OWNER/MEMBER, tenant-scoped and Event-timezone filter boundary established in Sprint 22.

Sales by Ticket Type returns confirmed units, gross persisted Booking Item sales, unit share, issued Tickets and admissions. It explicitly marks refunds as unallocated because PaymentRefund does not identify a Ticket Type or Booking line. Cancelled, expired and reserved Bookings cannot become confirmed Ticket Type sales.

Sales by Session returns confirmed Booking count/value, successful collection, successful refunds, net collected, confirmed Ticket units, issued Tickets, admissions and reserved/remaining/utilised admission capacity. Payment and refund values are attributable at Session level through the Booking's Session relationship.

Both reads support the existing exact Event-local date and Session filters, deterministic ordering and bounded rows. They return no customer or participant identity, Ticket credentials or Payment-provider credentials.

Focused detailed reporting verification: 2 reporting suites / 14 tests passed; API production build passed. New checks reconcile Ticket Type quantities/gross sales, preserve the unallocated-refund boundary and prove Session collection/refund/net plus shared-capacity semantics.

## Slice 3 — Detailed Event Reports Interface

The existing Event Reports workspace now provides one report selector for Event overview, Sales by Ticket Type and Sales by Session. The Event-local date and Session filters are shared across all three views, allowing an organiser to change the reporting lens without changing the population being compared.

Sales by Ticket Type presents confirmed units, gross Ticket sales, unit share, Tickets issued and admissions. Its interface explicitly discloses that successful refunds cannot be allocated to individual Ticket Types with the current persisted PaymentRefund relationship and therefore are not subtracted from those rows.

Sales by Session combines confirmed Booking demand, confirmed Booking value, successful collection, refunds, net collection, Ticket units, issued Tickets, admissions and shared venue capacity. The capacity presentation continues the established Glacier rule that Session admission capacity is shared across Ticket Types and remains separate from Product inventory.

Wide operational tables scroll within their own report card rather than expanding the page. Empty results, loading failures and the operational-versus-accounting limitation remain explicit.

Detailed Event Reports web verification: focused suite 1 / 4 tests passed; complete web suite 21 / 62 tests passed; production build passed. Web lint reports no errors and only the documented inherited internal-navigation warning in `src/lib/api.ts`.

## Slice 4 — Product and Product Variant Reporting

The Product report adds confirmed Product and Variant units, persisted gross item sales, Booking attach rate, active-Rule identification and organiser-defined Product Group context. It uses the same tenant-safe Event-local date and Session filter contract as the other detailed reports and returns no customer or participant identity.

Finite inventory is reported as a current Event-wide operational position using reserved and confirmed Booking Product commitments. Variant stock such as individual hoodie sizes is calculated independently. This is explicitly not labelled a stock-movement history because Glacier does not yet persist receipts, adjustments, damage or reconciliations.

Reusable capacity-controlled Products such as Kangas are reported independently for each matching Session, honouring any Session capacity override. The interface presents the highest-utilisation matching Session as the operational peak and explicitly states that Product capacity does not consume or change rink admission capacity.

Successful refunds remain unallocated at Product and Variant level because PaymentRefund has no Booking Product line relationship. The report therefore presents authoritative gross Product sales rather than fabricated category-level net sales.

Product reporting verification: focused API reporting suites 2 / 15 tests passed; complete API suite 69 / 448 tests passed; API production build passed. Focused Event Reports web suite 1 / 5 tests passed; complete web suite 21 / 63 tests passed; webpack production build passed. Web lint has no errors and retains only the documented inherited navigation warning.

## Slice 5 — Sales by Event Date and Booking Pace

Sales by Event date groups Sessions by their start date in the Event timezone and reconciles confirmed Booking/Ticket demand, persisted gross Booking value, successful collection, successful refunds, net collection, issued Tickets, admissions and shared admission capacity. Payments and refunds remain attached to the selected Session Bookings regardless of transaction timestamp.

Booking pace aligns currently confirmed demand by Event-local calendar days between Booking creation and the selected Session date. Stable lead-time buckets run from 61+ days before through same-day demand, with an explicit post-Session anomaly bucket. Each row includes period and cumulative Booking/Ticket demand so organisers can judge campaign timing from persisted commerce evidence.

The report explicitly discloses that `createdAt`, not `confirmedAt`, determines a Booking's pace bucket. It does not claim website traffic, checkout abandonment, conversion or marketing attribution because Glacier does not currently persist those privacy-reviewed data sources.

Date and pace verification: focused API reporting suites 2 / 17 tests passed; complete API suite 69 / 450 tests passed; API production build passed. Focused Event Reports web suite 1 / 7 tests passed; complete web suite 21 / 65 tests passed; webpack production build passed. Web lint has no errors and retains only the documented inherited navigation warning.
