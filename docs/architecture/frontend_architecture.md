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

Components never fetch data directly.

Hooks never render UI.

Services contain business API calls.

The API client contains HTTP implementation.

Business workflows should be composed from reusable components rather than duplicated across pages.

---

## Event Workspace

The Event Workspace uses dynamic routing:

`/events/[eventId]`

The Event Workspace is the operational centre for an Event.

Event tabs expose individual operational capabilities.

The Sessions Workspace is responsible for Session visibility and Session-generation workflows.

---

## Sessions Workspace

The Sessions Workspace contains:

- Sessions header
- Create Schedule action
- Sessions Timeline
- Operational Schedule Builder

Generated Sessions refresh into the Sessions Timeline after schedule creation.

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

The Schedule Builder submits pattern-specific payloads through the service layer.

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

The backend remains authoritative for final validation and conflict detection.

---

## Principle

Frontend validation improves usability.

Backend validation protects correctness.

The frontend must not replace authoritative API validation.