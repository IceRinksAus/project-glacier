# Changelog

# Sprint 21 – Payment Operations, Recovery & Add-on Organisation

## In Progress

- Locked the Sprint 21 delivery contract around payment reconciliation, organiser investigation and customer-facing Add-on grouping/order.
- Added authoritative provider Payment retrieval before expired-reservation cancellation.
- Routed missed provider success through the existing idempotent late-success refund path without Ticket issuance.
- Reconciled provider FAILED and CANCELLED states locally so terminal Payments stop indefinite scheduler retries.
- Preserved retry behavior for temporary provider retrieval and cancellation failures.
- Added OWNER-only, tenant-scoped Booking payment investigation and reconciliation endpoints.
- Added append-only attributable reconciliation attempts and masked provider-reference presentation.
- Kept manual reconciliation read-authoritative: a provider-pending Payment is neither cancelled nor marked paid.
- Added the dashboard Bookings register and dedicated payment-investigation workspace.
- Presented lifecycle, masked Payment, refund, Ticket and attributable reconciliation history with one controlled recovery action.

## Current Verification

- Focused Payment and reservation suite: 6 suites and 61 tests passed.
- Full API suite: 62 suites and 413 tests passed.
- API production build: passed.
- Web: 16 suites and 51 tests passed; targeted new-file lint and webpack production build passed.
- Local audit migration applied; two historical missed-success Stripe test Payments each reconciled to one successful AUD 34 refund, retained expired Bookings and issued zero Tickets.
- Authenticated browser acceptance passed for the Bookings register and responsive investigation page with no console warnings or errors.
- Original 45-suite / 236-test regression floor and Sprint 20's 61-suite / 399-test baseline remain preserved.
- No deployment or real Stripe mutation was performed.

# Sprint 20 – Public Event Site, Branding & Routed Booking

## Added

- Controlled Event branding during Event creation and in the Website workspace.
- Tenant-owned FileAsset metadata, validated branding uploads and a development storage-provider boundary.
- ACTIVE-only public Event pages with published logo, hero, colour, font and content identity.
- Dedicated Date, Session, Tickets, Participants, Add-ons, Details, Review, Payment and Confirmation routes.
- Credential-protected public Booking status recovery and authoritative Confirmation.
- Private Ticket presentation and QR routes using separate possession credentials.

## Preserved

- Shared Session admission capacity across every Ticket Type.
- Rule-authoritative required Products, including Young Child Kanga requirements.
- Per-Session reusable Product capacity and independent finite Product Variant inventory.
- Serializable reservation creation, 15-minute holds, expiry release and Stripe webhook authority.
- OWNER/MEMBER/SCANNER tenant and role boundaries.

## Verification

- API: 61 suites and 399 tests passed; production build passed.
- Web: 14 suites and 48 tests passed; full lint passed with one documented legacy navigation warning; webpack production build passed.
- Focused webhook, payment, expiry and inventory verification: 6 suites and 88 tests passed.
- Responsive browser acceptance passed at desktop and 390 × 844 with no browser warnings or errors.
- A $74 Stripe test-mode Booking completed through the signed webhook, issued its Ticket and QR, exposed the Waiver continuation and reduced the selected Hoodie Variant from 50 to 49 remaining.
- Web production audit reported zero known vulnerabilities.
- API production audit retained four high-severity `deepmerge-ts` findings inherited through Prisma; npm reports no fix available.
- No deployment was performed.

## Residual Operational Risk

- Two older expired local acceptance Bookings have PENDING local Payment rows while Stripe reports succeeded PaymentIntents. The expiry scheduler retries cancellation and Stripe rejects it as already succeeded. Production requires monitored provider/local reconciliation so missed webhook divergence is resolved rather than retried indefinitely.

# Sprint 19 – Organiser Event Creation & Setup

## Added

- six-step OWNER Event creation wizard with bounded Event, timezone, venue, jurisdiction, activity and gate-policy inputs
- server-authoritative Event readiness and activation enforcement
- connected readiness destinations for Sessions, Ticket Types, Products and optional Waivers
- Event Ticket Type setup that preserves shared Session admission capacity
- guided Product setup for unlimited extras, reusable per-Session equipment and finite merchandise Variants
- one-click Product assignment to every active Session, with individual exceptions and controlled assignment batches
- Product DRAFT-to-ACTIVE lifecycle checks and safe partial-setup behaviour
- public remaining availability for capacity-controlled Products and finite Variants
- customer selection and Booking persistence for Product Variants

## Capacity and Commerce Safety

- Session capacity remains the shared admission limit across all Ticket Types
- reusable equipment such as Kangas uses a separate per-Session Product pool
- RESERVED and CONFIRMED bookings hold Product and Variant availability; cancelled and expired bookings release it
- reservation creation rechecks Session, Product and Variant availability inside a serializable transaction
- merchandise sizes retain independent global finite inventory and optional price overrides
- active Rule Engine requirements continue to enforce one required Product per matching participant

## Security and Reliability

- OWNER-only Event, Ticket Type and Product mutations; MEMBER read-only behaviour
- tenant scope derived through authoritative Event relationships
- Product activation requires an online Session assignment and a usable active Variant when Variants exist
- partial guided Product setup remains DRAFT if a later configuration step fails
- original 45-suite / 236-test baseline preserved

## Verification

- full API suite: 58 / 58 suites and 378 / 378 tests passing
- full web suite: 9 / 9 suites and 38 / 38 tests passing
- API and web production builds passed
- web production dependency audit reports zero known vulnerabilities
- API audit reports the documented high-severity `deepmerge-ts` advisory inherited through Prisma, with no upstream fix currently available
- no deployment performed

See `sprint-notes/sprint-19.md` and `roadmap/sprint-19-plan.md`.

# Sprint 18 – Staff Scanner & Gate Operations

## Added

- dedicated authenticated Staff Scanner and narrow SCANNER role
- Gate Entry automatic admission and Ticket Lookup controlled-processing modes
- configurable Event entry opening lead and closing grace
- append-only attributable Ticket scan attempts
- QR camera decoding and manual/hardware-scanner fallback
- Event Settings gate-policy controls
- repeatable fictional Staff Scanner preview fixture
- web component testing foundation and 12 scanner workflow tests
- Staff Scanner Event-day runbook and physical-device sign-off matrix

## Security and Reliability

- tenant-scoped selected-Event authority and privacy-minimised results
- strict token-in-body scanner DTOs
- server-time entry-window recalculation
- atomic duplicate-safe admission under concurrent devices
- fail-closed early, late, invalid, wrong-Event, camera and connectivity states
- default denial of SCANNER on ordinary operator routes
- zero known web dependency audit vulnerabilities after a compatible patched nanoid override

## Verification

- full API suite: 58 / 58 suites and 351 / 351 tests passing
- original 45-suite / 236-test baseline preserved
- web scanner suite: 2 / 2 suites and 12 / 12 tests passing
- API and web production builds passed
- Gate, Lookup, duplicate, audit and Event Settings browser workflows verified
- physical iPhone Safari and Android Chrome sign-off remains pending before pilot
- no deployment performed

See `sprint-notes/sprint-18.md` and `operations/STAFF_SCANNER_RUNBOOK.md`.

# Sprint 17 – API Boundary & Security Hardening

## Added

- complete API endpoint security register
- global strict DTO validation with transformation and unknown-field rejection
- environment-configured CORS allowlist with production fail-closed behaviour
- tenant and role regression coverage across legacy operator domains
- bounded public Booking, Customer, Payment and Rule Evaluation DTOs
- documented deployment-edge authentication abuse-control gate

## Secured

- Organisation, User, Category and Ticket Type APIs
- Rule, Booking and Customer operator APIs
- Ticket detail, QR, validation and atomic scan operations
- login credential input and authenticated-user typing
- Organisation scope through trusted JWT context and authoritative relationships
- public Ticket responses through explicit field minimisation

## Removed

- ordinary public Organisation bootstrap route
- duplicate legacy Booking and Customer creation routes
- duplicate legacy Rule Evaluation controller
- unauthenticated legacy Payment initiation route

## Verification

- full API suite: 52 / 52 test suites passing
- full API tests: 326 / 326 passing
- original 45-suite / 236-test baseline preserved
- API production build: passed
- web production build: passed
- browser smoke: login boundary, unauthenticated Event Workspace redirect, public Booking and public Waiver passed
- endpoint register reconciled against all controllers
- no deployment performed

## Remaining Pre-Pilot Controls

- configure and prove deployment-edge rate limiting and monitoring
- complete infrastructure secret, TLS, logging, backup and incident-response controls
- complete production-like tenant-isolation integration and penetration testing
- implement granular Staff permissions, privileged-user MFA and account recovery
- resolve or formally accept remaining dependency findings

See `sprint-notes/sprint-17.md` for the detailed closeout and residual-risk record.

# Sprint 16 – Event Waivers & Digital Acceptance

## Added

- Event-centric Waiver persistence domain
- activity- and jurisdiction-specific Waiver Templates
- Event-specific draft, published and superseded Waiver Versions
- controlled Event/Organisation template substitution
- immutable accepted-version evidence and content hashes
- electronic signature capture
- zero-to-20-minor acceptance support
- high-entropy, hash-only verification credentials
- privacy-minimised public verification API
- mobile public Waiver page requiring no Booking, Ticket, account or email
- tenant-safe operator Waiver workspace
- Waiver version preview and publication workflow
- submission search and evidence detail
- stable public Event Waiver URL
- downloadable venue QR code
- conditional post-payment Waiver shortcut
- dedicated Waiver architecture documentation

## Improved

- Organisation and Event legal/location metadata foundation
- strict validation at the new public Waiver boundary
- successful empty-response handling in the web API client
- Event Workspace navigation
- public Event response minimisation and conditional Waiver discovery

## Security

- Organisation scope comes from authenticated JWT context for operator access
- OWNER authority is required for draft generation and publication
- public retrieval is restricted to active Events and current published versions
- the server chooses authoritative version, timestamp and hashes
- public verification excludes signatory, minor and signature data
- raw verification credentials are never stored
- submission search and evidence remain authenticated and tenant-scoped

## Verification

- full API suite: 51 / 51 test suites passing
- full API tests: 280 / 280 passing
- pre-Sprint API baseline preserved: 45 suites / 236 tests
- API production build: passed
- web production build: passed
- targeted Waiver/web lint: no errors
- public and operator browser workflows: verified
- optional no-Waiver Event state: verified
- Booking-independent fictional acceptance: verified
- stable public link and venue QR: verified

## Known Follow-Up

- production legal templates require approval and seeding
- Event/Organisation Waiver metadata still needs complete operator editing controls
- signature MIME/data-URI validation should be tightened before production
- retention, legal hold, rate limiting and final privacy/legal review remain pre-launch work
- Digital Waiver Pass, Wallet, reminders, scanner enforcement and Booking/Ticket linkage remain deferred

See `sprint-notes/sprint-16.md` for the detailed closeout and limitations.

# Sprint 15 – Stripe Payments & Payment Hardening

## Added

- Stripe Payment provider
- Stripe PaymentIntent creation
- Stripe Payment Element in the public booking flow
- Stripe webhook endpoint and signature verification
- Payment persistence domain
- PaymentRefund persistence domain
- public Booking access tokens
- public payment-initiation service
- provider payment cancellation
- automatic late-success refunds
- stable payment and refund idempotency keys
- payment cancellation tests
- refund hardening tests
- Stripe provider tests
- Stripe webhook tests

## Improved

- Booking money storage using decimal values
- authoritative server-side payment amounts
- reservation expiry handling
- payment / Booking state separation
- Ticket issuance safety
- retry behaviour for provider cancellation failures
- public payment security boundary
- legacy Nest scaffold test harnesses
- API dependency patch level

## Removed

- obsolete duplicate `booking-expiry` scheduler implementation

## Verification

- full API suite: 45 / 45 test suites passing
- full API tests: 236 / 236 passing
- API production build: passed
- real Stripe sandbox PaymentIntent success: verified
- real Stripe sandbox expired-reservation cancellation: verified
- real Stripe sandbox late-success automatic refund: verified
- zero-Ticket protection on expired late payment: verified
- Stripe secrets excluded from Git: verified

## Dependency Review

- non-breaking `npm audit fix` applied
- Prisma patched from 7.9.0 to 7.9.1
- directly remediable audit findings resolved
- three high-severity Prisma transitive `deepmerge-ts` findings remain
- forced Prisma downgrade to 6.12.0 was deliberately not applied

# Sprint 14 – Customer Booking Flow Foundation

## Added

- Dedicated public booking API boundary
- Public Event discovery
- Public Session discovery
- Public Ticket Type discovery
- Public Session Product / Add-on discovery
- Public Customer creation
- Public Booking creation
- Public booking Rule Evaluation preview
- Customer booking route using `/book/[eventId]`
- Session selection
- Multi-Ticket-Type selection
- Participant capture
- Adult, Child and Young Child Ticket Types
- Ticket-age eligibility rules
- Rule-driven Kanga Skating Aid requirements
- Young Child Adult-accompaniment rule
- Booking-level Ticket Type rule context
- Rule Engine `CONTAINS` and `NOT_CONTAINS` operators
- Add-on quantity controls
- Required Add-on minimum quantities
- Optional additional Kanga quantities
- Customer contact capture
- Review & Reserve flow
- Reservation confirmation
- Reservation expiry countdown
- Public booking automated test suite

## Improved

- BookingService Rule Engine context
- Cross-participant rule support
- Public customer API security boundary
- Admission / Add-on separation
- Required-product consolidation
- Multi-participant required-product quantities
- Customer booking flow ordering
- Rule feedback during participant capture
- Booking review and pricing visibility
- Public response minimisation

## Product Decisions

- Young Child (3–5) is treated as a distinct Ticket Type.
- Young Child Tickets require a Kanga Skating Aid.
- Required Add-ons establish minimum quantities rather than fixed quantities.
- Customers may add additional optional Kangas.
- Young Child Tickets require at least one Adult Ticket in the same booking.
- Participant capture occurs before Add-ons so mandatory requirements are known before optional extras are selected.
- The current customer UI is a functional foundation; final customer UX refinement remains future work.

## Verification

- Public Booking tests: 29 passed
- BookingService regression tests: 36 passed
- API production build: passed
- Web production build: passed
- `git diff --check`: passed
- Mixed Ticket Type booking flow: verified
- Ticket-age validation: verified
- Young Child Kanga requirement: verified
- Young Child Adult-accompaniment rule: verified
- Optional additional Kanga selection: verified
- BookingProduct persistence: verified
- Reservation creation and expiry countdown: verified

## Known Technical Debt

- Historical Nest scaffold tests remain incomplete in parts of the wider repository.
- Product lifecycle/status administration requires a future operator-facing workflow.
- Public booking UX requires a dedicated production design pass before launch.

# Sprint 13 – Session Management & Schedule Exceptions

## Added

- Session Detail panel
- Clickable Sessions Timeline cards
- Individual Session editing
- Session overlap protection during edits
- Session occupied-capacity protection
- Schedule exception tracking
- `scheduleExceptionType`
- MODIFIED Session exceptions
- CANCELLED Session exceptions
- Dedicated Session cancellation endpoint
- Session deletion confirmation flow
- Booking-protected hard deletion
- Timeline refresh after Session mutations
- Event-timezone-aware Session display
- Event-timezone-aware Session editing
- `date-fns-tz` support in the web application
- Expanded SessionService automated test suite

## Improved

- Sessions Workspace operational workflow
- Session detail visibility
- Session capacity safety
- Generated Session provenance
- Session cancellation behaviour
- Session deletion behaviour
- Operational Schedule exception visibility
- Event-local Session time handling
- Frontend Session service capabilities
- Sessions hook refresh behaviour

## Fixed

- Session edits could overlap existing Sessions
- Session capacity could be reduced below occupied quantity
- Generic Session updates could bypass dedicated cancellation behaviour
- Session display previously depended on browser timezone
- Generated Session edits were not explicitly tracked as schedule exceptions

## Verification

- SessionService tests: 28 passed
- Operational Schedule regression tests: 38 passed
- API production build: passed
- Web production build: passed
- Session detail browser flow: verified
- Session edit browser flow: verified
- MODIFIED exception browser flow: verified
- Session cancellation browser flow: verified
- CANCELLED exception browser flow: verified
- Session deletion browser flow: verified
- Event-local Session display/editing: verified

## Known Technical Debt

- Historical Nest scaffold tests remain incomplete in parts of the wider repository.
- Reservation-expiry responsibilities should be reviewed in a future technical-debt pass to avoid duplicated scheduling behaviour.

# Sprint 12 – Operational Scheduling

## Added

- Operational Schedule Builder
- Three-step schedule creation workflow
- Daily schedule generation
- Weekday / weekend schedule generation
- Selected weekday schedule generation
- Manual exact-date schedule generation
- Operational timetable blocks
- Schedule review calculations
- Generated Session linkage to Operational Schedules
- Schedule entry identifiers on generated Sessions
- Existing Session conflict detection
- Transactional schedule generation
- Event timezone support
- Event timezone Prisma migration
- `date-fns-tz` timezone conversion
- Automated Operational Schedule test suite

## Improved

- Sessions Workspace operational workflow
- Session generation from recurring patterns
- Admission capacity preview
- Timetable validation
- Session overlap protection
- Local Event time handling
- Schedule-generation error handling
- Sessions Timeline refresh after generation

## Fixed

- Incorrect Session times caused by treating Event-local timetable times as UTC
- Incorrect calendar-date generation caused by timezone conversion
- Schedule generation without required pattern data
- Partial generation risk when Session conflicts exist

## Verification

- Operational Schedule tests: 38 passed
- API production build: passed
- Web production build: passed
- Daily browser generation: verified
- Weekday / weekend browser generation: verified
- Selected-days browser generation: verified
- Manual browser generation: verified

## Known Technical Debt

- Historical Nest scaffold tests remain incomplete because required providers and mocks are not configured in several legacy test modules.
- These failures are separate from the Sprint 12 Operational Schedule test suite.

# Sprint 11 – Event Workspace Foundation

## Added

- Event Workspace for individual events
- Dynamic event routing using `/events/[eventId]`
- Event Header component
- Event Tabs component
- Event Overview component
- Sessions Timeline component
- Session service and hook
- Event-specific session filtering
- Automatic redirect to login when JWT expires

## Improved

- Standardised frontend architecture (Page → Hook → Service → API)
- Event Workspace visual hierarchy
- Shared component structure
- Authentication user experience

## Product Decisions

- Established the distinction between the Event Workspace and Event Wizard.
- Sessions are displayed as a timeline grouped by date.
- Operational Schedule Builder adopted as the future session generation model.
- Organisers define operational patterns rather than repetitive data entry.

## Unreleased

### Added

- BookingValidationService
- BookingExpiryService
- Reservation lifecycle
- Reservation scheduler
- JWT login and `/auth/me`
- bcrypt password verification
- JWT and roles guards
- Organisation-scoped events, sessions, products, variants and session products
- OWNER and MEMBER permission enforcement
- QR generation and ticket scanning
- Duplicate-scan protection
- Session date, capacity and deletion rules
- Product slug, SKU, inventory and capacity validation
- Product validation
- Inventory validation
- Sales window validation
- Session product validation
- Automated booking tests

### Changed

- Capacity calculations ignore expired bookings
- Reservation workflow implemented
- Booking validation centralised
- Protected operations derive organisation context from JWT.
- Sessions cannot move between events.
- Products cannot move between events.
- Variants cannot move between products.
- Session-product assignments cannot move between parents.

### Fixed

- Product availability validation
- Session validation
- Inventory validation
- Reservation expiry handling
