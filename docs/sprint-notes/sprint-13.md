# Sprint 13

## Objective

Enable organisers to safely manage individual Session occurrences after schedule generation, including editing, cancellation, deletion, conflict protection and schedule-exception tracking.

---

## Features Completed

### Session Detail Panel

Sessions in the Sessions Timeline are now interactive.

Selecting a Session opens a right-side detail panel showing:

- Session name
- Event-local date
- Event-local start and end time
- Capacity
- Booked quantity
- Available capacity
- Status
- Schedule exception state
- Operational Schedule origin
- Schedule entry identifier
- Booking count

---

## Session Editing

Organisers can edit an individual Session after it has been generated.

Editable fields include:

- Session name
- Date
- Start time
- End time
- Capacity

Editing one Session does not alter sibling Sessions generated from the same Operational Schedule.

Generated Sessions remain independent records.

---

## Session Conflict Protection

Session edits are checked against existing Sessions for the same Event.

An update is rejected when the proposed Session time overlaps another Session.

Adjacent Sessions remain valid.

Example:

10:00–11:00

11:00–12:00

The Session being edited is excluded from its own conflict check.

---

## Capacity Protection

Session capacity cannot be reduced below current occupied capacity.

Occupied capacity is calculated using:

`BookingItem.quantity`

for bookings with status:

- RESERVED
- CONFIRMED

Expired or otherwise inactive Booking records do not consume Session capacity.

Capacity may be reduced to exactly the occupied quantity.

---

## Schedule Exception Tracking

Sessions now include:

`scheduleExceptionType`

Default value:

`NONE`

Supported Sprint 13 values:

- NONE
- MODIFIED
- CANCELLED

A Session generated from an Operational Schedule becomes:

`MODIFIED`

when edited independently.

A standalone Session remains:

`NONE`

when edited.

A generated Session becomes:

`CANCELLED`

when cancelled.

---

## Session Cancellation

Cancellation now uses a dedicated API action rather than the generic Session update path.

Endpoint:

`PATCH /session/:id/cancel`

Cancellation:

- sets Session status to `CANCELLED`
- preserves the Session record
- marks generated Sessions as `CANCELLED` schedule exceptions
- prevents further editing

The generic update path rejects attempts to set:

`status = CANCELLED`

and requires the dedicated cancellation action.

---

## Session Deletion

Sessions may be permanently deleted only when they have no Booking records.

If any Booking record exists:

- hard deletion is blocked
- the Session must be preserved
- cancellation remains the appropriate operational action

A cancelled Session with no Booking records may still be permanently deleted.

Deleting one generated Session does not delete or modify its originating Operational Schedule.

---

## Booking and Capacity Distinction

Sprint 13 formalised an important distinction.

### Occupied Capacity

Used when validating Session capacity.

Calculated from `BookingItem.quantity` for:

- RESERVED bookings
- CONFIRMED bookings

### Deletion Protection

Used when deciding whether a Session can be hard deleted.

Deletion is blocked when any Booking record is attached to the Session.

These rules are intentionally different.

---

## Event Timezone Behaviour

Session display and editing now use the Event timezone.

The frontend no longer relies on the browser timezone for Event operational time.

Session timestamps remain stored in UTC.

When editing a Session:

- stored UTC timestamps are displayed in Event-local time
- organiser-entered local date/time is converted back to UTC before the API request

The web application now also uses:

`date-fns-tz`

---

## Frontend Components

Sprint 13 introduced or expanded:

- `SessionDetailPanel`
- `EditSessionForm`
- `SessionsTimeline`
- `SessionsWorkspace`
- `useSessions`
- Session service integration
- Event timezone propagation

The Sessions Timeline now supports:

- clickable Session cards
- Session detail display
- schedule-exception visibility
- refresh after Session mutations

---

## Automated Testing

The SessionService test suite now contains 28 passing tests.

Coverage includes:

- Session creation
- Organisation ownership
- Session listing
- Session detail retrieval
- Session editing
- Event date boundaries
- Sales window validation
- Session deletion
- Booking-protected deletion
- Session overlap protection
- Adjacent Session allowance
- Capacity reduction protection
- Occupied-capacity calculation
- Generated Session modification tracking
- Standalone Session behaviour
- Session cancellation
- Generated cancellation tracking
- Organisation-scoped cancellation
- Dedicated cancellation-path enforcement

Final result:

28 passed, 28 total.

---

## Regression Verification

Operational Schedule regression tests:

38 passed, 38 total.

API production build:

Passed.

Web production build:

Passed.

Browser testing confirmed:

- Session detail panel
- Session editing
- Name changes
- Capacity changes
- Generated Session `MODIFIED` state
- Standalone Session `NONE` state
- Session cancellation
- Generated Session `CANCELLED` state
- Session deletion with no bookings
- Timeline refresh after mutations
- Event-local timezone display and editing

---

## Architectural Decisions

Generated Sessions remain independent records after creation.

Operational Schedule provenance is preserved through:

- `operationalScheduleId`
- `scheduleEntryId`

Schedule divergence is tracked using:

`scheduleExceptionType`

Session editing and cancellation do not modify the originating Operational Schedule.

Cancellation is a business action and uses a dedicated API path.

Hard deletion is allowed only for Sessions without Booking records.

Session time display and editing must use the Event timezone.

The backend remains authoritative for:

- Organisation scope
- Session conflicts
- Event boundaries
- Capacity
- Cancellation
- Deletion

---

## Product Decisions

Organisers must be able to manage individual Session occurrences after schedule generation.

Normal schedule behaviour should remain intact while allowing one-off operational exceptions.

Cancelled Sessions should remain visible for operational history.

Sessions with bookings must not be hard deleted.

Generated Session exceptions should be visible without altering the source Operational Schedule.

---

## Sprint Outcome

The Sessions Workspace now supports the complete operational lifecycle of an individual Session.

Organisers can:

- inspect a Session
- edit it safely
- create a schedule exception
- cancel it
- permanently delete it when permitted

Sprint 13 closes the operational gap between bulk Session generation and day-to-day Session management.

---

## Next Sprint

Sprint 14

Scope to be defined during Sprint planning.