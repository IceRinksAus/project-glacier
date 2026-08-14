Organisation

Tenant that owns Events.

--------------------------------

Workspace

Operational management area.

--------------------------------

Event Workspace

Operational centre for an individual Event.

--------------------------------

Wizard

Guided setup process.

--------------------------------

Event Timezone

IANA timezone representing the local operating timezone of an Event.

Example:

Australia/Melbourne

--------------------------------

Session

A scheduled bookable operational period.

--------------------------------

Session Detail

Operational view of an individual Session including time, capacity, bookings, status and schedule provenance.

--------------------------------

Session Status

Operational state of a Session.

Current relevant values include:

DRAFT

ACTIVE

CANCELLED

--------------------------------

Operational Schedule

Definition used to generate Sessions from an Event operating pattern.

--------------------------------

Schedule Pattern

Rule describing how an Operational Schedule applies across dates.

Supported patterns:

DAILY

WEEKDAY_WEEKEND

SELECTED_DAYS

MANUAL

--------------------------------

Timetable Entry

Activity definition contained within an Operational Schedule timetable.

--------------------------------

Bookable Entry

Timetable entry that generates a Session record.

--------------------------------

Operational Block

Non-bookable timetable entry representing operational activity such as resurfacing or maintenance.

Operational blocks remain part of the Operational Schedule and do not generate Session records.

--------------------------------

Occurrence

Generated Session record created from an Operational Schedule.

--------------------------------

Schedule Exception

Generated Session that no longer exactly follows its originating Operational Schedule occurrence.

--------------------------------

Schedule Exception Type

State describing whether a generated Session differs from its source schedule.

Values:

NONE

MODIFIED

CANCELLED

--------------------------------

Modified Session

Generated Session that has been independently edited after creation.

--------------------------------

Cancelled Session

Session preserved in Glacier with status CANCELLED.

A generated cancelled Session is also recorded as a CANCELLED schedule exception.

--------------------------------

Selected Days

Schedule pattern where a timetable applies only to selected weekdays.

--------------------------------

Manual Schedule

Schedule pattern where exact dates are defined individually and each date may have its own timetable.

--------------------------------

Schedule Entry ID

Identifier linking a generated Session back to the timetable entry that created it.

--------------------------------

Occupied Capacity

Number of Session admissions currently consuming capacity.

Calculated from BookingItem quantity for RESERVED and CONFIRMED bookings.

--------------------------------

Hard Delete

Permanent removal of a record.

A Session may only be hard deleted when it has no Booking records.

--------------------------------

UTC

Canonical timezone used for timestamp persistence.

Event-local schedule and Session edit times are converted to UTC before storage.

--------------------------------

Ticket Type

Admission product attached to a Session.