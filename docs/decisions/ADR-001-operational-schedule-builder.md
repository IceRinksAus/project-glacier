# ADR-001

## Title

Operational Schedule Builder

## Status

Accepted

## Context

Session-based Events may contain many repeated operating periods.

Creating every Session individually produces repetitive setup work and increases the risk of inconsistent dates, times and capacities.

Glacier requires a reusable scheduling model that supports both recurring operations and irregular Event dates.

## Decision

Glacier will generate Session occurrences from Operational Schedules rather than requiring organisers to create every Session manually.

Generated Sessions remain independent records.

The Event Wizard and Event Workspace use the same scheduling engine.

The Operational Schedule Builder supports four patterns:

- DAILY
- WEEKDAY_WEEKEND
- SELECTED_DAYS
- MANUAL

## Schedule Definitions

### DAILY

One timetable applies to every date within the Operational Schedule range.

### WEEKDAY_WEEKEND

One timetable applies Monday through Friday.

A separate timetable applies Saturday and Sunday.

### SELECTED_DAYS

One timetable applies only to explicitly selected weekdays.

### MANUAL

Exact dates are defined individually.

Each manual date may contain its own timetable.

## Timetable Entries

Timetable entries may be:

- BOOKABLE
- OPERATIONAL

BOOKABLE entries generate Session records.

OPERATIONAL entries remain part of the Operational Schedule definition and do not create bookable Session records.

Examples include:

- Ice resurfacing
- Maintenance
- Operational closures

## Generated Sessions

Generated Sessions retain:

- Event relationship
- Operational Schedule relationship
- Schedule entry identifier
- Start timestamp
- End timestamp
- Capacity
- Status

Generated Sessions remain independent records after creation.

An individual generated Session may later be:

- edited
- cancelled
- deleted when permitted

These actions do not modify the originating Operational Schedule.

Generated Session divergence is tracked using:

`scheduleExceptionType`

Supported values include:

- NONE
- MODIFIED
- CANCELLED

A generated Session becomes `MODIFIED` when independently edited.

A generated Session becomes `CANCELLED` when cancelled.

The Operational Schedule remains the source definition, while generated Sessions represent independently manageable operational occurrences.
## Timezone Handling

Timetable times represent Event-local operating times.

Operational Schedule generation uses the Event timezone to convert local date and time values into UTC before Session persistence.

See:

`ADR-005-event-timezone-handling.md`

## Conflict Handling

Glacier checks proposed generated Sessions against existing Sessions for the same Event.

Overlapping Session ranges are rejected.

Schedule creation and Session creation occur inside a database transaction.

If a conflict exists, no partial Operational Schedule or Session data is persisted.

## Review

The frontend presents a Review step before generation.

The Review step calculates:

- Operating days
- Bookable Sessions
- Operational blocks
- Admission capacity

Pattern-specific details are shown before generation.

## Consequences

Reduced Event setup time.

Consistent scheduling behaviour.

Single scheduling implementation.

Reusable scheduling engine.

Supports recurring and manual Event operations.

Supports schedule exception workflows.

Generated Sessions can be managed independently of the schedule definition.

Individual Session edits and cancellations preserve Operational Schedule provenance without mutating the source schedule.