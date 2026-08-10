# Product Roadmap

## Vision

A production-grade, multi-tenant ticketing and event-operations platform for Ice Rinks Australia and other session-based event operators.

## Completed Foundation

- PostgreSQL and Prisma
- Organisations and users
- Events and sessions
- Ticket issuance, QR generation, validation and scanning
- JWT authentication
- Role-based access control
- Multi-tenant security
- Products, variants and session products
- Backend Booking Engine
- Reservation lifecycle
- Rule Engine
- Event Workspace
- Sessions Timeline
- Operational Schedule Builder
- Event timezone handling

## Completed

✔ Backend Booking Engine

✔ Authentication

✔ Multi-tenancy

✔ Rule Engine

✔ Reservation Lifecycle

✔ Event Workspace

✔ Operational Scheduling

---

## Sprint 11 Complete

### Event Workspace

- Event Header
- Event Tabs
- Event Overview
- Sessions Timeline
- Dynamic Event Routing
- Shared Frontend Architecture

### Architectural Decisions

- Event Workspace is the operational centre of every Event.
- Event Wizard is a separate onboarding workflow.
- Session management begins with timeline views grouped by date.
- Operational Schedule Builder is the primary bulk Session-generation model.

---

## Sprint 12 Complete

### Operational Scheduling

- Sessions Workspace schedule creation
- Operational Schedule Builder
- Daily operating schedules
- Weekday / weekend operating schedules
- Selected weekday operating schedules
- Manual exact-date schedules
- Review and capacity calculations
- Operational blocks
- Automatic Session generation
- Existing Session conflict detection
- Transactional schedule generation
- Event timezone support
- UTC Session persistence

### Verification

- 38 Operational Schedule tests passing
- API production build passing
- Web production build passing
- All four scheduling patterns browser-tested successfully

---

## Current

→ Sprint 13

Scope to be defined during Sprint planning.

---

## Future

- Booking engine product integration
- Capacity and inventory reservations
- Rule-engine integration
- Payments
- Waivers
- Customer portal
- Staff scanner
- Admin portal
- Reporting
- Memberships
- Gift Cards
- POS
- CRM
- Venue Management

---

## Version Milestones

- v0.1 Foundation
- v0.5 End-to-end booking
- v0.8 Internal pilot-ready
- v0.9 Live-event pilot
- v1.0 Production release