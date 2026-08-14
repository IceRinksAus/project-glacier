# Frontend Architecture

## Philosophy

Pages orchestrate.

Components render.

Hooks retrieve data.

Services communicate with the API.

The API client performs HTTP requests.

---

## Standard Flow

Page

↓

Hook

↓

Service

↓

API Client

↓

Nest API

---

## Folder Structure

app/

components/

hooks/

services/

lib/

---

## Rules

Pages never call the API directly.

Components never fetch data directly unless the component represents an isolated interaction requiring a specific record.

Hooks should own reusable collection retrieval and refresh behaviour.

Services contain business API calls.

The API client contains HTTP implementation.

Business workflows should be composed from reusable components rather than duplicated across pages.

The backend remains authoritative for business validation.

---

## Event Workspace

The Event Workspace uses dynamic routing:

`/events/[eventId]`

The Event Workspace is the operational centre for an Event.

Event tabs expose individual operational capabilities.

The Sessions Workspace is responsible for:

- Session visibility
- Session-generation workflows
- individual Session management

---

## Sessions Workspace

The Sessions Workspace contains:

- Sessions header
- Create Schedule action
- Sessions Timeline
- Operational Schedule Builder
- Session Detail Panel
- Session Edit workflow

Generated Sessions refresh into the Sessions Timeline after schedule creation.

Session mutations also refresh the Sessions Timeline.

---

## Sessions Timeline

`SessionsTimeline`

Groups Sessions by Event-local calendar date.

Session times are formatted using the Event timezone.

Session cards are interactive.

Selecting a Session opens:

`SessionDetailPanel`

Schedule exceptions may be surfaced directly on Session cards.

---

## Session Detail Panel

`SessionDetailPanel`

Displays:

- Session name
- Event-local date
- Event-local time
- Capacity
- Booked quantity
- Available capacity
- Status
- Schedule exception
- Operational Schedule origin
- Schedule entry identifier
- Booking count

The detail panel supports:

- Edit Session
- Cancel Session
- Delete Session

The panel refreshes after successful Session mutations.

---

## Session Editing

`EditSessionForm`

Converts UTC Session timestamps into Event-local values for display.

Organiser-entered Event-local date/time values are converted back to UTC before the Session update API call.

The frontend uses:

`date-fns-tz`

Editable fields include:

- name
- date
- start time
- end time
- capacity

Backend validation remains authoritative for:

- Event boundaries
- overlaps
- occupied capacity
- cancellation rules

---

## Operational Schedule Builder

Operational Schedule creation uses a three-step workflow.

### Step 1

Schedule details.

Includes:

- Schedule name
- Start date
- End date

### Step 2

Pattern-specific timetable configuration.

Supported components include:

- `ScheduleTimetableStep`
- `WeekdayWeekendTimetableStep`
- `SelectedDaysTimetableStep`
- `ManualScheduleStep`

### Step 3

`ScheduleReviewStep`

Review presents expected generation results before the API request is submitted.

Review calculations include:

- Operating days
- Bookable Sessions
- Operational blocks
- Total admission capacity

---

## Schedule Patterns

### DAILY

Uses one timetable.

### WEEKDAY_WEEKEND

Uses separate weekday and weekend timetables.

### SELECTED_DAYS

Uses one timetable plus selected weekday values.

### MANUAL

Uses exact manual dates.

Each date contains its own timetable.

---

## Service Integration

Operational Schedule requests use:

`operational-schedule.service.ts`

Session management requests use:

`session.service.ts`

The Session service supports:

- Session list retrieval
- Session detail retrieval
- Session updates
- Session cancellation
- Session deletion

The shared API client handles:

- JSON requests
- JWT authentication
- Expired-session handling
- HTTP errors

---

## State

Schedule-builder state remains local to the schedule workflow until generation.

Pattern-specific state includes:

- Daily timetable entries
- Weekday entries
- Weekend entries
- Selected weekdays
- Manual dates and timetables

Session collection state is managed through:

`useSessions`

The hook exposes refresh behaviour so Session mutations can update the timeline without remounting the entire workspace.

---

## Principle

Frontend validation improves usability.

Backend validation protects correctness.

The frontend must not replace authoritative API validation.

Event operational times must be rendered and edited using the Event timezone, not the browser timezone.