# ADR-005

## Title

Event Timezone Handling

## Status

Accepted

## Context

Glacier supports Events that operate in specific local timezones.

Session times entered by organisers represent local Event operating times.

Storing those values without timezone conversion can cause Sessions to appear at incorrect times or on incorrect calendar dates.

This becomes especially important when UTC dates differ from Event-local dates.

## Decision

Every Event will define an IANA timezone.

Example:

`Australia/Melbourne`

Organisers enter operational times in the Event's local timezone.

Glacier converts Event-local date and time values into UTC before persistence.

UTC is the canonical stored timestamp representation.

Operational Schedule generation uses the Event timezone when creating Session start and end timestamps.

Timezone conversion is performed using:

`date-fns-tz`

## Principles

Event time is authoritative for Event operations.

UTC is authoritative for timestamp persistence.

A local Event time must represent the same intended operating time regardless of:

- Server timezone
- Database timezone
- Developer machine timezone
- User browser timezone

## Consequences

Session timestamps are portable and unambiguous.

Events can operate correctly across different Australian and international timezones.

UTC timestamps may fall on a different calendar date from the Event-local date.

Frontend presentation must use the appropriate Event timezone when Event-local time is required.

Timezone-aware behaviour must be included in automated tests.

## Future Impact

This decision should also be applied to future timezone-sensitive capabilities including:

- Ticket sales windows
- Booking cut-off times
- Event opening hours
- Staff rosters
- Notifications
- Reporting
- Operational deadlines