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

Participants

↓

Tickets

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

---

## Event Workspace

The Event Workspace is the operational centre for an Event.

It provides access to Event-specific capabilities including:

- Overview
- Sessions
- Operational scheduling
- Future Event operations modules

Dynamic Event routing uses:

`/events/[eventId]`

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

## Time Architecture

Each Event defines an IANA timezone.

Example:

`Australia/Melbourne`

Organisers enter Event operating times in Event-local time.

The API converts Event-local date and time into UTC before persistence.

PostgreSQL stores canonical timestamps.

Timezone-sensitive operations must use the Event timezone rather than the server timezone.

See:

`decisions/ADR-005-event-timezone-handling.md`

---

## Booking Flow

Booking API

↓

BookingValidationService

↓

Rule Engine

↓

Booking Service

↓

Reservation Created

↓

BookingExpiryService

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

Customer