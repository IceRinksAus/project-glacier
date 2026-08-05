# Changelog

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