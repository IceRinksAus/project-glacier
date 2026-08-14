# Changelog

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