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

14. Review the current codebase before starting a new Sprint.

Each Sprint should begin from a known, committed state.

Preferred Sprint-start workflow:

Previous Sprint complete

↓

Code committed and pushed

↓

Documentation updated

↓

Working tree clean

↓

Create committed repository snapshot

↓

Review relevant backend, frontend, schema, tests and architecture

↓

Identify reusable logic and existing constraints

↓

Finalise Sprint implementation plan

↓

Begin coding

This reduces duplicated functionality, inconsistent validation and unnecessary architectural rework.

A repository snapshot may be created using:

`git archive --format=zip --output=sprint-XX-project-review.zip HEAD`

The snapshot is temporary working material and should not be committed to the repository.

15. Regression testing protects completed Sprints.

New Sprint work must not silently break previously completed platform capabilities.

Where relevant, existing critical test suites should be rerun before a Sprint is closed.

These principles explain a lot of the architectural decisions we've made.