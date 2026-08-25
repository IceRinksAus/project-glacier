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
