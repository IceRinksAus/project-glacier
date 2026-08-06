# Changelog

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