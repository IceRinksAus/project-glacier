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
- Session management
- Schedule exception handling
- Public customer booking flow
- Public booking API boundary
- Ticket-age eligibility rules
- Rule-driven required Add-ons
- Cross-participant booking rules

## Completed

✔ Backend Booking Engine

✔ Authentication

✔ Multi-tenancy

✔ Rule Engine

✔ Reservation Lifecycle

✔ Event Workspace

✔ Operational Scheduling

✔ Session Management

✔ Customer Booking Flow Foundation

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

## Sprint 13 Complete

### Session Management & Schedule Exceptions

- Session Detail panel
- Individual Session editing
- Session conflict protection
- Booking-safe capacity reductions
- Schedule exception tracking
- MODIFIED generated Sessions
- CANCELLED generated Sessions
- Dedicated Session cancellation
- Booking-protected hard deletion
- Session deletion confirmation
- Event-timezone-aware Session display
- Event-timezone-aware Session editing
- Timeline refresh after Session mutations

### Verification

- 28 SessionService tests passing
- 38 Operational Schedule regression tests passing
- API production build passing
- Web production build passing
- Edit / cancel / delete browser flows verified
- Schedule exception behaviour browser-tested successfully

---

## Sprint 14 Complete

### Customer Booking Flow Foundation

- Dedicated public booking API boundary
- Public Event and Session discovery
- Public Ticket Type discovery
- Customer booking route
- Ticket selection
- Participant capture
- Adult / Child / Young Child Ticket Types
- Ticket-age validation
- Rule-driven Kanga requirements
- Young Child Adult-accompaniment rule
- Optional additional Add-ons
- Customer contact capture
- Review & Reserve
- Reservation creation
- Reservation confirmation and expiry countdown

### Verification

- 29 Public Booking tests passing
- 36 BookingService regression tests passing
- API production build passing
- Web production build passing
- Mixed booking browser flow verified
- Rule-driven booking behaviour verified

---

## Current

→ Sprint 15

Scope to be defined during Sprint planning.

---

## Future

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