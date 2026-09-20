# Sprint 41 — Waiver Templates, Participant Coverage and Staff Verification

## Outcome

Sprint 41 makes Waivers an organisation-level and event-day workflow while preserving the Event-specific immutable evidence foundation. Organisers can govern jurisdiction/activity templates, configure each Event, accept independent or Booking-linked submissions, issue privacy-minimal completion proof and see participant coverage during POS Ticket or Booking lookup.

The implementation does not assert that historical wording is current legal advice. NSW 2026, WA 2026, VIC 2025 and SA 2024 source forms remain review material only and were not inserted as approved production templates.

## Delivered

- Added **Waivers** to desktop and mobile organiser navigation and built an organisation hub for templates and Event entry points.
- Added explicit `PLATFORM_CURATED` and Organisation template authority, revision isolation, approval reference/user/time and OWNER-only create/approve/retire actions.
- Organisation-approved wording takes precedence for its activity/jurisdiction; controlled platform wording is the only fallback.
- Added separate signatory participation, optional media consent and optional marketing consent evidence.
- Preserved one adult plus zero-to-20 dependants and added guardian-only signing support at the data/UI boundary.
- Booking confirmation passes the existing raw Booking possession credential only in the browser fragment. The server validates its hash, paid/confirmed state and exact Event, then offers only that Booking's participants.
- Added explicit adult/dependant participant relationships, same-Event checks and a non-sensitive `WaiverAssociationAudit`.
- Generic Event QR signing remains independent of a Booking.
- Added durable public proof with Event, immutable version, acceptance time, covered-person count, secure verification QR and browser Print / Save PDF. The public response excludes names, signature and child details; PostgreSQL stores only the proof-token hash.
- Added explicit staff matching for independent submissions. Assigned OWNER/MANAGER enters the Booking and selects exact participants; Glacier performs no fuzzy name matching.
- Added compact linked/not-linked Waiver status to POS Ticket and Booking lookup. Status is advisory and does not change Ticket validity, consume entry or admit a guest.
- Tightened legal-evidence routes to OWNER/MANAGER with assigned-Event enforcement. SCANNER cannot retrieve signatures, child dates of birth or template administration.

## Data and migration evidence

Two forward-only migrations add template authority/approval provenance, Booking and participant coverage, optional consent fields and attributable association audit evidence. A follow-up integrity migration preserves platform-template revision uniqueness when `organizationId` is null and adds the Booking foreign key for association audits.

The repository now contains 52 committed Prisma migrations. They applied to the working database and replayed successfully from empty state during the disposable isolation gate.

## Verification

- Focused waiver/template/Event/scanner suites passed throughout each slice.
- API: 92 suites / 675 tests passed; production build passed.
- Web: 39 files / 119 tests passed; production Webpack build passed.
- All 52 migrations are current and replayed from empty state.
- Disposable authenticated tenant/role/Event/MFA isolation passed 5 of 5 checks.
- Tracked-secret scanning passed across 679 files and 6 rules.
- Isolated PostgreSQL backup/restore matched all 20 critical tables; the 0.31 MiB archive completed in 0.60 seconds and restored in 1.25 seconds.
- The complete local release gate passed.
- Browser navigation confirmed the new Waivers destination is present in the protected desktop and mobile primary navigation. The local authentication session expired when opening it, so final organiser/customer/POS responsive acceptance remains an explicit organiser review rather than a claimed completed check.

## Protected foundations

Tenant, role and Event-assignment enforcement remains server-authoritative. Booking possession does not grant access to another Event or participant. Signature evidence and child dates of birth stay out of routine POS/Scanner responses and audit logs. Ticket credentials, admission, Payment/refund, capacity, inventory, Rule, rescheduling and Flexible Ticket authorities were not changed.

Only fictional local/test data was used. No domain, hosting, cloud service, email/SMS provider, Wallet provider or paid infrastructure was purchased or provisioned.

## Deferred evidence and decisions

- Current qualified legal approval for each jurisdiction/activity template, guardian capacity, liability wording and statutory warning form.
- Approved optional media/marketing language, customer privacy notice, child-data handling, retention period, correction/deletion process and legal hold.
- Automatic admission blocking or Ticket mutation based on Waiver status.
- Native Apple Wallet / Google Wallet proof passes and email/SMS delivery.
- Managed production secrets, coordinated edge abuse protection, central monitoring/alerts, managed backup/restore and deployed storage evidence.
- Representative handset/tablet/POS/scanner hardware testing and independent accessibility, privacy, legal and security review.

## Local commits

- `32fefa4` — organisation template authority and association foundations
- `3235c5c` — organisation Waivers workspace
- `aa26629` — Booking-linked coverage, proof and staff visibility
- `0ba2f39` — assigned-Event access and audited staff matching

No Sprint 41 commit has been pushed. The branch remains local pending explicit organiser approval after browser acceptance.
