# System Architecture

Project Glacier is a multi-tenant event commerce and operations platform.

## Stack

- NestJS API
- Prisma ORM
- PostgreSQL
- Next.js
- JWT + Passport
- bcrypt
- QR code generation
- date-fns-tz
- Stripe server SDK
- Stripe.js / React Stripe.js

## Core Model

Organisation

↓

Users / Memberships

↓

Events

↓

Operational Schedules

↓

Sessions

↓

Products

↓

Variants

↓

Session Products

↓

Bookings

↓

Payments / Payment Refunds

↓

Participants

↓

Tickets

Event Waivers form a separate Event branch:

```text
Event
  └─ EventWaiver
       ├─ WaiverVersion ← WaiverTemplate
       └─ WaiverSubmission
            └─ WaiverMinor
```

This branch is intentionally independent of Booking and Ticket identity.

---

## Security

JWT contains:

- User ID
- Email
- Role
- Organisation ID

Controllers extract authenticated context.

Services scope protected queries through Organisation relationships.

The backend is authoritative for:

- Permissions
- Tenant scope
- Booking rules
- Capacity
- Inventory
- Ticket state
- Payments
- Operational Schedule validation
- Session generation
- Session editing
- Session conflict validation
- Session cancellation
- Session deletion
- Waiver template selection and substitution
- Waiver version publication
- Waiver acceptance timestamp, version and hashes
- operator Waiver tenant scope

---

## Event Workspace

The Event Workspace is the operational centre for an Event.

It provides access to Event-specific capabilities including:

- Overview
- Sessions
- Operational scheduling
- Session management
- Waiver configuration, publication, QR and submission evidence
- Future Event operations modules

Dynamic Event routing uses:

`/events/[eventId]`

---

## Event Waivers

An Event may have zero or one `EventWaiver`. Absence is the valid no-Waiver state.

Approved templates are selected by activity type and Australian jurisdiction. Controlled substitution creates Event-specific version snapshots. Published versions are immutable and changes require a new version.

The public route resolves the current published version through a stable opaque Event slug. Public acceptance requires no Booking, Ticket, account or email. Glacier records the exact version, server acceptance time, electronic signature, hashes and optional minors.

Operator access is JWT-authenticated and Organisation-scoped. Public verification uses a high-entropy credential and returns no signatory/minor identity.

See:

`architecture/WAIVERS.md`

---

## Operational Scheduling

Operational Schedules define how an Event operates.

Supported patterns:

- DAILY
- WEEKDAY_WEEKEND
- SELECTED_DAYS
- MANUAL

Operational Schedule definitions contain timetable entries.

Timetable entries may be:

- BOOKABLE
- OPERATIONAL

BOOKABLE entries generate independent Session records.

OPERATIONAL entries remain in the schedule definition.

Operational Schedule generation validates:

- Event ownership
- Schedule date range
- Event timezone
- Timetable entries
- Pattern-specific configuration
- Timetable overlaps
- Existing Session conflicts

Operational Schedule and Session persistence occurs transactionally.

---

## Session Management

Generated Sessions remain independent records.

Sessions may be edited individually without modifying sibling Sessions or the originating Operational Schedule.

Session updates validate:

- Organisation ownership
- Event date boundaries
- Start and end time ordering
- Sales windows
- Existing Session overlaps
- Occupied capacity

Session overlap checks exclude the Session being edited.

Adjacent Sessions are allowed.

---

## Schedule Exceptions

Generated Sessions preserve provenance through:

- `operationalScheduleId`
- `scheduleEntryId`

Session divergence from the originating schedule is tracked using:

`scheduleExceptionType`

Supported values include:

- NONE
- MODIFIED
- CANCELLED

Generated Session edit:

`MODIFIED`

Generated Session cancellation:

`CANCELLED`

Standalone Session edit:

`NONE`

Operational Schedule definitions remain unchanged when an individual generated Session is edited, cancelled or deleted.

---

## Session Capacity

Occupied Session capacity is calculated using:

`BookingItem.quantity`

for bookings with status:

- RESERVED
- CONFIRMED

Session capacity cannot be reduced below the occupied quantity.

Expired and other inactive Booking states do not consume Session capacity.

---

## Session Deletion

Hard deletion is allowed only when the Session has no Booking records.

This rule intentionally differs from occupied-capacity calculation.

A Booking record may prevent deletion even when it does not currently consume Session capacity.

Sessions with Booking records should be cancelled rather than deleted.

---

## Session Cancellation

Cancellation uses a dedicated business action:

`PATCH /session/:id/cancel`

Cancellation:

- preserves the Session
- sets status to `CANCELLED`
- marks generated Sessions as `CANCELLED` schedule exceptions

Generic Session update cannot be used to bypass the cancellation flow.

---

## Time Architecture

Each Event defines an IANA timezone.

Example:

`Australia/Melbourne`

Organisers enter Event operating times in Event-local time.

The API converts Event-local date and time into UTC before persistence.

PostgreSQL stores canonical timestamps.

The frontend displays Session operational times using the Event timezone.

Session editing converts Event-local organiser input back into UTC before persistence.

Timezone-sensitive operations must use the Event timezone rather than:

- server timezone
- browser timezone
- developer machine timezone

See:

`decisions/ADR-005-event-timezone-handling.md`

---

## Booking & Payment Flow

Public Booking UI

↓

Public Booking API

↓

BookingValidationService

↓

Rule Engine

↓

Booking Service

↓

Reservation Created

↓

Stripe PaymentIntent

↓

Stripe Payment Element

↓

Signed Stripe Webhook

↓

Payment Service

↓

Eligible Booking Confirmation

↓

Ticket Issuance

Reservation expiry is handled by `BookingReservationService`.

Expired Bookings with unresolved provider Payments are cleaned up through PaymentIntent cancellation.

Late provider success against an expired Booking triggers an idempotent refund rather than Booking resurrection.

---

## Operational Schedule Flow

Sessions Workspace

↓

Schedule Builder

↓

Pattern Definition

↓

Review

↓

Operational Schedule API

↓

Validation

↓

Conflict Detection

↓

Transaction

↓

Operational Schedule Created

↓

Bookable Sessions Created

↓

Sessions Timeline

---

## Session Management Flow

Sessions Timeline

↓

Session Detail Panel

↓

Edit / Cancel / Delete

↓

Session API

↓

Organisation Validation

↓

Business Validation

↓

Persistence

↓

Timeline Refresh

---

## Domain Relationships

Organisation

↓

Event

↓

Operational Schedule

↓

Session

↓

Ticket Type / Product

↓

Booking

↓

Payment / PaymentRefund

↓

Customer
