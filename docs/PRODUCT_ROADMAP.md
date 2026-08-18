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
- Stripe payment collection
- Payment and refund persistence
- Stripe webhook processing
- Reservation payment cancellation
- Automatic late-success refunds

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

✔ Stripe Payments & Payment Hardening

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

## Sprint 15 Complete

### Stripe Payments & Payment Hardening

- Stripe Payment provider
- Stripe PaymentIntent creation
- Stripe Payment Element
- signed Stripe webhooks
- persistent Payment domain
- persistent PaymentRefund domain
- secure public Booking access tokens
- authoritative backend payment amounts
- reservation-expiry PaymentIntent cancellation
- automatic refunds for late successful payments
- Ticket issuance only after eligible payment confirmation
- decimal money standardisation

### Verification

- 45 / 45 API test suites passing
- 236 / 236 API tests passing
- API production build passing
- real Stripe sandbox payment verified
- real Stripe cancellation path verified
- real Stripe automatic refund path verified
- zero-Ticket protection verified

---

## Current

→ Sprint 16

Scope to be defined during Sprint planning.

---

## Cross-Cutting Platform Workstreams

These workstreams apply across multiple future Sprints and should be considered whenever relevant features are planned.

### Security, Privacy & Compliance

Glacier will treat security, privacy and regulatory compliance as permanent architectural requirements.

Key requirements include:

- privacy-by-design
- security-by-design
- least-privilege access
- strong multi-tenant isolation
- secure authentication
- Multi-Factor Authentication for privileged users
- encryption in transit and at rest
- managed secrets
- narrow public APIs
- rate limiting and abuse protection
- audit logging
- secure production logging
- data-retention policies
- deletion / anonymisation workflows
- backup and restore testing
- incident-response planning
- dependency and vulnerability review
- Australian privacy and regulatory review
- external security testing at the appropriate pre-pilot / pre-launch stage

Before production launch, applicable requirements must be verified against current authoritative Australian sources and reviewed by appropriately qualified legal/privacy professionals where required.

Detailed architecture:

`docs/architecture/SECURITY_PRIVACY_AND_COMPLIANCE.md`

### File & Media Storage Architecture

File-heavy Glacier modules should use dedicated cloud object storage rather than storing large binary content in PostgreSQL.

The storage architecture should support:

- private-by-default storage
- Organisation ownership
- signed upload and download access
- direct-to-storage uploads
- image compression
- thumbnail generation
- lazy loading
- CDN delivery where appropriate
- upload type / size validation
- malware scanning where appropriate
- lifecycle / archival policies
- retention and deletion
- storage usage monitoring
- Australian data-residency review
- recovery testing

Detailed architecture:

`docs/architecture/FILE_AND_MEDIA_STORAGE.md`

Implementation should occur when first required by a file-heavy feature such as Waivers, Maintenance, Incidents or document attachments.

### Customer Booking UX

The Sprint 14 public booking journey is a functional foundation rather than the final production customer experience.

A dedicated future UX refinement phase should focus on:

- progressive disclosure
- mobile-first design
- one primary decision per step
- clearer visual hierarchy
- plain customer-facing rule messages
- contextual validation
- obvious Continue actions
- reduced visible system-state information
- automatic handling of mandatory requirements where practical

The customer should not need to understand Glacier's internal Rule Engine, Product or operational structure.

---

## Waiver Phase Requirements

The Waiver phase must include a standalone legal/content and Glacier functional review of the current operational waiver template.

Scope should include:

- review of existing waiver wording
- risk acknowledgement structure
- participant declarations
- guardian / minor handling
- privacy wording
- optional consent separation
- waiver versioning
- digital acceptance design
- immutable acceptance evidence
- Booking / Participant linkage
- guardian relationship capture
- acceptance timestamp
- audit evidence
- reminder / resend workflow
- QR / check-in waiver status
- data retention
- privacy requirements
- current Australian legal verification

The detailed Waiver architecture should be finalised only after the existing operational waiver template is reviewed.

---

## Pre-Pilot Security & Privacy Gate

Before Glacier is approved for a live public pilot, the platform must pass a formal Security & Privacy Gate.

Minimum gate requirements:

- security architecture review
- privacy data-flow review
- personal-data inventory
- tenant-isolation verification
- privileged-access review
- MFA readiness
- public API exposure review
- secrets-management review
- encryption review
- payment-security review
- file-upload security review
- audit-logging review
- retention / deletion policy review
- backup and restore test
- incident-response plan
- vulnerability / dependency review
- Australian privacy / compliance review
- external penetration testing at the appropriate stage
- legal/privacy professional review before production launch

Critical findings must be resolved before live public use.

## Future

- Rule-engine integration
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
- Customer booking UX refinement
- Security & Privacy hardening
- File & Media Storage implementation
- Pre-Pilot Security & Privacy Gate

---

## Version Milestones

- v0.1 Foundation
- v0.5 End-to-end booking
- v0.8 Internal pilot-ready
- v0.9 Live-event pilot
- v1.0 Production release