# Changelog

## Unreleased

### Added
- JWT login and `/auth/me`
- bcrypt password verification
- JWT and roles guards
- Organisation-scoped events, sessions, products, variants and session products
- OWNER and MEMBER permission enforcement
- QR generation and ticket scanning
- Duplicate-scan protection
- Session date, capacity and deletion rules
- Product slug, SKU, inventory and capacity validation

### Changed
- Protected operations derive organisation context from JWT.
- Sessions cannot move between events.
- Products cannot move between events.
- Variants cannot move between products.
- Session-product assignments cannot move between parents.
