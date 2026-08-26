# Project Glacier Documentation

This folder is the visible, version-controlled source of truth for Project Glacier.

## Rule

No significant technical, product, commercial, or operational decision should exist only in chat.

It must be recorded here and committed with the code.

---

## Core Documentation

- `PROJECT_PRINCIPLES.md`
- `PRODUCT_ROADMAP.md`
- `CHANGELOG.md`
- `GLOSSARY.md`
- `CONTRIBUTING.md`

Current pilot and product-planning control documents:

- `roadmap/PILOT_READINESS_AND_STRATEGIC_ROADMAP.md`
- `roadmap/PILOT_READINESS_REASSESSMENT_AFTER_SPRINT_23.md`
- `roadmap/LEGACY_SYSTEM_CAPABILITY_REVIEW.md`

---

## Architecture

- `architecture/SYSTEM_ARCHITECTURE.md`
- `architecture/frontend_architecture.md`
- `architecture/AUTHENTICATION_AND_PERMISSIONS.md`
- `architecture/BOOKING_ENGINE.md`
- `architecture/MULTI_TENANCY.md`
- `architecture/SECURITY_PRIVACY_AND_COMPLIANCE.md`
- `architecture/FILE_AND_MEDIA_STORAGE.md`
- `architecture/WAIVERS.md`

---

## Architecture Decisions

Architecture Decision Records are stored in:

`decisions/`

Current decisions include:

- Booking Engine
- JWT Tenant Context
- Operational Schedule Builder
- Organisation Roles
- Immutable Parent Relationships
- Backend Rule Enforcement
- Event Timezone Handling

---

## Sprint Notes

Sprint implementation notes are stored in:

`sprint-notes/`

Current notes include:

- `sprint-notes/sprint-10.md`
- `sprint-notes/sprint-11.md`
- `sprint-notes/sprint-12.md`
- `sprint-notes/sprint-13.md`
- `sprint-notes/sprint-14.md`
- `sprint-notes/sprint-15.md`
- `sprint-notes/sprint-16.md`
- `sprint-notes/sprint-17.md`

Sprint 17's approved contract:

- `roadmap/sprint-17-plan.md`

## Security Controls

- `security/API_ENDPOINT_REGISTER.md`
- `security/AUTHENTICATION_ABUSE_CONTROLS.md`
- `operations/PRODUCTION_CHECKLIST.md`

Earlier Sprint releases are stored under:

`releases/`

---

## Sprint Workflow

Before implementation begins for a new Sprint:

1. Complete and verify the previous Sprint.
2. Commit and push code.
3. Update documentation.
4. Confirm a clean working tree.
5. Create a temporary committed repository snapshot.
6. Review relevant code, schema, tests and architecture.
7. Finalise Sprint scope and implementation plan.
8. Begin coding.

Repository review snapshots are temporary working files and should not be committed.

See:

`PROJECT_PRINCIPLES.md`

---

## Business Documentation

Commercial and product-business documentation is stored in:

`business/`

---

## Operations

Development and deployment documentation is stored in:

`operations/`

---

## Documentation Principle

Code describes what Glacier does.

Architecture documents describe how Glacier is structured.

ADRs describe why significant technical decisions were made.

Sprint notes describe what changed during each Sprint.

The Product Roadmap describes where Glacier is going.

The Changelog records delivered capability.
