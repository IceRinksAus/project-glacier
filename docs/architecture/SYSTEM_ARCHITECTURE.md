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

Customer Product groups form optional Event-owned presentation metadata:

```text
Event
  └─ ProductGroup
       └─ Product (optional presentation assignment)
```

This branch does not replace Product Rules, Session assignment, capacity or inventory.

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
- Staff Scanner Event scope, server-time admission policy and atomic Ticket transition

---

## Event Workspace

The Event Workspace is the operational centre for an Event.

It provides access to Event-specific capabilities including:

- Overview
- Sessions
- Operational scheduling
- Session management
- Waiver configuration, publication, QR and submission evidence
- owner-configurable Ticket entry-window policy
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

## Staff Scanner and Gate Operations

The dedicated `/staff/scanner` surface is separate from the broader Event Workspace. OWNER, MEMBER and the narrow SCANNER role may use its tenant-scoped routes; SCANNER does not inherit ordinary Event, Booking, Customer, catalogue or Ticket administration access.

Gate Entry submits a decoded or hardware-scanner Ticket credential directly to the authoritative admission route. Ticket Lookup uses the read-only validation route first and requires `Process ticket` plus confirmation before admission. Both admission paths recalculate Event/Session timing on the server and use the same atomic `ACTIVE → SCANNED` transition.

Event-wide policy defines a bounded 0–240 minute opening lead and closing grace. Session-linked Tickets use Session times; other Tickets use Event times. The default is 30 minutes before start and zero minutes after end.

Every authenticated admission attempt is appended to `TicketScanAttempt` with Organisation, Event, acting User, mode, outcome, time and resolved Ticket where safe. Raw Ticket credentials are not copied into the audit record. Connectivity loss fails closed.

See `operations/STAFF_SCANNER_RUNBOOK.md` and `security/API_ENDPOINT_REGISTER.md`.

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

### Customer Add-on Presentation

`ProductGroup` is Event-owned presentation metadata. It is intentionally separate from catalogue Category, Rule evaluation, Session Product assignment, capacity and inventory. Groups define customer headings and their order; Product `sortOrder` defines order within a group. Ungrouped Products remain sellable through a deterministic fallback section.

OWNER ordering writes validate the complete Event-owned group/Product set and update transactionally. The public Add-ons response exposes only the group fields needed for presentation and continues to derive required minimums and availability from the existing Rule, Session capacity and Product/Variant inventory systems.

### Flexible Ticket request and use authority

Flexible Ticket remains a service entitlement rather than a Product. `FlexibleTicketPolicy` supplies immutable published commercial versions and `FlexibleTicketEntitlement` snapshots the exact per-participant rights purchased with a Booking. Current Event settings and the legacy Booking Boolean never become service-time authority.

`FlexibleTicketRequest` is a durable case record. Its selected items bind the entitlement, participant and currently issued Ticket with request-time value, fee, deadline and remaining-use evidence. Creating, reviewing, declining, withdrawing, failing or expiring a request does not itself mutate a Ticket, Session, Product, inventory allocation, Payment or entitlement use.

An approved refund request delegates to the existing `TicketAdjustment` engine. An approved Session-change request delegates to the existing whole-Booking `BookingReschedule` engine and is permitted only when every active Ticket is covered and eligible. The request stores only the resulting ledger identity; it does not duplicate the financial, capacity or credential mutation record.

After the delegated operation reports completion, Glacier records one `FlexibleTicketUseAllocation` per authorising entitlement and decrements `remainingUses` through a serializable, compare-and-update finalisation transaction. Exact retry returns the same linked result. Pending provider outcomes retain an approved/investigation state and do not prematurely consume a use.

Public request access is possession-scoped through the existing hash-only Booking credential. The reusable browser link places the raw credential in the URL fragment, which is not sent as part of the HTTP request URL; the client submits it only in the validated API body. Operator reads and decisions require OWNER or assigned MANAGER authority at both guard and service layers.
