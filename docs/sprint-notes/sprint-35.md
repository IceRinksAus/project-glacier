# Sprint 35 — Glacier UX Foundation and Organiser Home

## Outcome

Sprint 35 establishes Glacier's first coherent organiser visual system and
implements the highest-priority findings from the guided product walkthrough.
OWNER, MANAGER and STAFF authentication now lands on the existing tenant-scoped
Dashboard. SCANNER remains isolated to the dedicated scanner experience,
including after privileged recovery-code acknowledgement.

The organiser shell now uses a deep navy Glacier sidebar, blue action system,
compact white operational surfaces, a code-native mountain mark, active
navigation and a narrow-screen primary navigation. The direction was refined
against the organiser, setup, customer, tablet and mobile concepts supplied by
the organiser on 16 September. Those references are design direction rather
than evidence that excluded customer-account, native-app or device capabilities
exist.

Events now defaults to the reporting service's exact Current lifecycle and
provides Current, Upcoming and Past groupings, counts, accessible name search
and explicit empty states. Event Overview surfaces authoritative Tickets
issued, admissions, today's Sessions, confirmed Bookings, utilisation, Payment
exceptions and next Session without redefining these as accounting or sales
metrics.

The Website workspace no longer rewrites the organiser origin to an unrelated
local port. ACTIVE Events receive explicit Open and Copy actions with copy
feedback. DRAFT Events show an authenticated design preview and no public-link
action. The existing ACTIVE-only public API boundary was not weakened.

## Product decisions retained

- The Dashboard is the normal organiser home; it is not a duplicate reporting
  backend.
- Lifecycle classification and operational totals remain backend-authoritative.
- Issued Tickets are not described as sold Tickets without supporting financial
  evidence.
- DRAFT presentation can be reviewed by an authenticated organiser but is not
  represented as public.
- The reference concepts establish a visual destination. Sessions calendars,
  Products redesign, richer customer journeys, kiosk POS, scanner-connected
  POS and mobile/device applications remain separate bounded work.

## Browser acceptance

Fictional local data was used throughout. The organiser Dashboard loaded
trusted totals and attention items. Events defaulted to an exact empty Current
state, Upcoming showed five authorised Events, and search narrowed those
results correctly. Australian Ice Festival 2027 showed the new Event Overview
metrics and a private DRAFT Website preview with no public action.

At 1024 × 768 and 390 × 844 the reviewed workspace had no horizontal overflow,
the narrow-screen primary navigation remained available and browser warning and
error logs were empty. A later visual review confirmed the revised blue/navy,
flatter and denser direction. The existing browser session expired during a
desktop reload after that visual review; automated production-build and
responsive evidence remained clean, and no authentication bypass was used.

## Verification

- API: 91 suites / 644 tests passed; production build passed.
- Web: 32 files / 96 tests passed; production build passed.
- All 48 migrations remained current and replayed from empty state.
- Disposable authenticated tenant/role/MFA isolation passed 5 of 5 checks.
- The complete local release gate passed.
- Tracked-secret scanning passed across 634 files and 6 rules.
- Isolated PostgreSQL restore matched all 16 critical tables; the 0.29 MiB
  archive completed in 0.57 seconds and restored in 0.97 seconds.

One initial complete web-suite run timed out in two Event-creation interaction
tests while the local environment was heavily loaded. Both tests immediately
passed in a focused rerun, and the subsequent complete release gate passed all
32 files / 96 tests. A separate gate attempt completed all code checks but could
not reach PostgreSQL inside the restricted command environment. The existing
local PostgreSQL service was confirmed healthy, and the complete gate then
passed with explicit local-service access.

## Protected foundations

No Ticket credential, Payment, refund, capacity, inventory, Flexible Ticket,
Rules, Scanner admission, MFA, role, Event-assignment or public ACTIVE-only
authority changed. No migration or dependency change was required. No real
customer data, real Payment, paid infrastructure, domain, hosting or provider
was used.

## Remaining boundary

This is local application, database and browser evidence only. Managed
production secrets and origins, deployed infrastructure, real POS/Scanner
devices, central monitoring, approved delivery providers, production backup
recovery, legal/privacy approval, accessibility audit and independent security
review remain future evidence. The supplied customer, operations-tablet and
manager-mobile concepts remain product direction, not delivered claims.
