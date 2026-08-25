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
- Complete API suite: 69 suites / 444 tests passed.
- API production build: passed.
- Prisma schema formatting, generation and validation: passed.
- Additive Event Group migration applied locally; all 31 migrations are current.
- Tests cover authenticated tenant scope, OWNER mutation roles, trimmed creation, duplicate names, cross-tenant Group denial, ordered transactional membership and rejection of a foreign Event before mutation.
- Event Group web checks: 1 suite / 2 tests passed.
- Complete web suite: 21 suites / 60 tests passed.
- Web lint: no new errors; one documented inherited internal-navigation warning remains.
- Web webpack production build: passed and includes the `/reports` route.
