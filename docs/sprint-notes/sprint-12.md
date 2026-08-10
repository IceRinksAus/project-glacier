# Sprint 12

## Objective

Establish the Operational Schedule Builder as Glacier's primary session-generation workflow and complete recurring and manual operational scheduling within the Event Workspace.

---

## Features Completed

### Operational Schedule Builder

- Three-step schedule creation workflow
- Schedule name and operating date range
- Pattern-specific timetable builders
- Review step before generation
- Automatic Session generation
- Sessions Timeline refresh after generation

---

### Schedule Patterns

#### Daily

- One timetable applied to every operating day
- Bookable sessions generated for each day
- Operational blocks retained in the schedule definition
- Admission capacity calculated before generation

#### Weekday / Weekend

- Separate weekday timetable
- Separate weekend timetable
- Automatic weekday/weekend date selection
- Independent capacity and operational-block calculations

#### Selected Days

- Organisers select specific weekdays
- One timetable applied only to matching weekdays
- Review screen shows selected weekdays
- Sessions generated only on matching dates

#### Manual

- Exact dates selected individually
- Each date has its own timetable
- Different activities can be configured on different dates
- Duplicate manual dates prevented
- Sessions generated only on explicitly selected dates

---

## Session Generation

Operational schedules generate independent Session records.

Only BOOKABLE timetable entries create Session records.

OPERATIONAL timetable entries remain part of the Operational Schedule definition and do not create bookable Sessions.

Generated Sessions retain:

- Event relationship
- Operational Schedule relationship
- Schedule entry identifier
- Capacity
- Start time
- End time
- Draft status

---

## Conflict Protection

Operational Schedule generation checks for conflicts with existing Sessions.

A proposed Session conflicts when its time range overlaps an existing Session for the same Event.

Schedule creation and Session creation occur inside a database transaction.

If any conflict is detected:

- No Operational Schedule is created
- No Session records are generated
- No partial data remains

---

## Event Timezone Support

Events now define an IANA timezone.

Example:

`Australia/Melbourne`

Organisers enter timetable times using the Event's local time.

Glacier converts the local date and time into UTC before persistence.

UTC remains the canonical stored representation.

The Event timezone is used to preserve the intended local date and time when generating Sessions.

The implementation uses:

`date-fns-tz`

A Prisma migration added the Event timezone field.

---

## Frontend Components

Sprint 12 introduced or expanded:

- `ScheduleBuilder`
- `ScheduleReviewStep`
- `WeekdayWeekendTimetableStep`
- `SelectedDaysTimetableStep`
- `ManualScheduleStep`
- Operational Schedule service integration

The schedule builder remains part of the Event Sessions Workspace.

---

## Automated Testing

The Operational Schedule test suite contains 38 passing tests.

Coverage includes:

- Daily generation
- Weekday / weekend generation
- Selected-day generation
- Manual generation
- Operational blocks
- Schedule entry linkage
- Operational Schedule linkage
- Correct start and end times
- Event timezone conversion
- Invalid schedule ranges
- Invalid timetable definitions
- Timetable overlap detection
- Existing Session conflict detection
- Transaction safety
- Selected-day validation
- Manual-date validation

Final result:

38 passed, 38 total.

---

## Build Verification

API production build:

Passed.

Web production build:

Passed.

Browser testing confirmed all four Operational Schedule patterns generate Sessions on the correct dates and at the correct Event-local times.

---

## Known Test-Suite Debt

The complete API test command currently includes historical Nest scaffold tests that instantiate controllers and services without required providers or mocks.

Examples include missing:

- PrismaService
- Controller services
- Payment provider dependencies
- Booking service dependencies

These failures are separate from the Sprint 12 Operational Schedule test suite.

They do not prevent the API or Web production builds from succeeding.

This should be addressed as dedicated test-health work.

---

## Architectural Decisions

Operational Schedules are the primary mechanism for bulk Session creation.

Generated Sessions remain independent records.

Event-local time is entered by organisers and converted to UTC for persistence.

Operational blocks are schedule-definition data and do not become bookable Session records.

Schedule generation is transactional.

Conflict detection occurs before schedule and Session persistence.

All four supported schedule patterns use the same Operational Schedule generation service.

---

## Product Decisions

Organisers should define how an Event operates rather than repeatedly entering individual Sessions.

Recurring patterns should cover normal Event operations.

Manual scheduling should support exceptional or irregular operating dates.

The Review step should show the expected operational impact before data is generated.

Session generation must preserve the Event's local operating time regardless of server or database timezone.

---

## Sprint Outcome

The Operational Schedule Builder is complete for the four planned schedule patterns.

Glacier can now generate Event Sessions through:

- Daily schedules
- Weekday / weekend schedules
- Selected weekday schedules
- Exact manual schedules

The Sessions Workspace has progressed from a timeline viewer into an operational Session-generation workspace.

Operational Scheduling is now a reusable platform capability.

---

## Next Sprint

Sprint 13

Scope to be defined during Sprint planning.