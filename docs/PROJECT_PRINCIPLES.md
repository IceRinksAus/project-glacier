# Project Glacier Principles

1. Security before convenience.
2. Never trust client-supplied organisation context.
3. Business rules are enforced in the backend.
4. Multi-tenant by design.
5. Configuration over event-specific hard-coding.
6. Prefer consistency over cleverness.
7. Build for maintainability and live-event reliability.
8. Every critical feature must be testable.
9. Documentation is part of the deliverable.
10. Features should reduce operational work.
11. Build the simplest thing that scales.
Avoid unnecessary configuration until there's a genuine business need.
12. Configure at the highest logical level.
Override only when required.

Examples:

Event
Session
Product
13. Separate concerns.
Capacity is not inventory.

Reservations are not payments.

Validation is not booking creation.

These principles explain a lot of the architectural decisions we've made.