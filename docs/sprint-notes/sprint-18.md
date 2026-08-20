# Sprint 18 — Staff Scanner & Gate Operations

## Status

Implementation complete and locally verified on 20 August 2026. No deployment was performed. Physical iPhone Safari and Android Chrome verification remains required before pilot sign-off.

## Objective

Provide authenticated Event staff with a fast, privacy-minimised and server-authoritative workflow for Ticket lookup and admission, including configurable time windows and safe concurrent operation.

## Delivered

### Persistence and policy

- Event-wide opening lead and closing grace, each bounded to whole minutes from 0–240.
- Defaults of 30 minutes before start and zero minutes after end.
- Append-only `TicketScanAttempt` evidence with Organisation, Event, User, mode, outcome, time and resolved Ticket where safe.
- No raw Ticket possession credential in the attempt record.

### Authority and API

- Central OWNER, MEMBER and narrow SCANNER role vocabulary.
- Default denial of SCANNER on older operator routes unless explicitly allowed.
- Dedicated tenant-scoped `/staff/scanner` Event, context, validate and admit routes.
- Strict token-in-body DTOs.
- Read-only Ticket Lookup and atomic server-authoritative admission.
- Event/Session time-window recalculation at admission time.
- Concurrent duplicate protection: only one request can transition `ACTIVE → SCANNED`.

### Staff experience

- Dedicated `/staff/scanner` route and SCANNER login destination.
- Persistent active Event and device mode.
- **Gate Entry:** automatic admission attempt on QR or hand-scanner submission.
- **Ticket Lookup:** detailed read-only result, optional Process ticket action and explicit confirmation.
- Rear-camera QR decoding with manual/hardware fallback.
- Clear entry granted, ready, early, closed, cancelled, duplicate, wrong-Event, invalid and connectivity states.
- Camera resources stop during result review and on route exit.

### Event administration

- OWNER API and Event Settings controls for the Event-wide entry window.
- Browser-verified validation, successful update, scanner propagation and restoration of the fictional preview defaults.

## Security and Privacy Controls

- JWT role and Organisation context remain authoritative.
- Ticket lookup is restricted to the selected Event and authenticated Organisation.
- Wrong-Event results do not disclose unrelated participant details.
- Scanner results exclude Customer contact, payment, complete Booking, Waiver signature and unrelated participant data.
- Connectivity loss and non-eligible states fail closed.
- Successful admission is atomic and attributable.
- Web dependency audit reports zero known vulnerabilities after the compatible `nanoid 3.3.18` override.

## Verification Evidence

### Automated

- API: 58 of 58 suites passing.
- API: 351 of 351 tests passing.
- Original 45-suite / 236-test baseline remains included and green.
- Web: 2 of 2 suites and 12 of 12 Staff Scanner tests passing.
- API production build passed.
- Web production build passed.
- Focused Scanner/Event lint and TypeScript checks passed.
- Web npm audit: zero known vulnerabilities.

Coverage includes role and tenant boundaries, strict DTOs, time boundaries, wrong Event, atomicity, concurrency, append-only attempts, automatic Gate admission, read-only Lookup, confirmed Lookup processing, close-without-processing, malformed credentials, early, late, duplicate, unknown, network failure, camera denial and camera shutdown.

### Browser

- Fictional SCANNER login and active Event selection verified.
- Gate Entry automatic hand-scanner submission verified.
- Entry-granted and already-scanned outcomes verified.
- Ticket Lookup read-only close and confirmed processing verified.
- Separate Gate Entry and Ticket Lookup audit modes verified in the local database.
- Event Settings 30/0 defaults, invalid 241-minute rejection, valid 45/15 save and scanner propagation verified; fixture restored to 30/0.

## Commit Checkpoints

- `9ea3e65` — approved Sprint contract.
- `75393cb` — persistence and role foundation.
- `a587c64` — dedicated Staff Scanner API boundary.
- `cdbf68b` — Event entry-window API configuration.
- `ad6672a` — Staff Scanner web workflow.
- `ba79e99` — automatic Gate Entry admission and preview fixture.
- `26eb01b` — Event Settings entry-window controls.
- `f5b868e` — automated web scanner workflows and dependency audit remediation.

## Residual Pilot Gates

1. Complete the physical iPhone Safari and Android Chrome matrix in `docs/operations/STAFF_SCANNER_RUNBOOK.md` on production-like HTTPS.
2. Prove venue connectivity and the documented continuity/escalation process; Glacier deliberately has no offline admission.
3. Configure monitoring, central logs, backups, managed secrets, TLS and incident ownership.
4. Complete production-like tenant-isolation integration and independent penetration testing.
5. Configure deployment-edge abuse limits and alerting.
6. Complete privileged-account MFA, recovery and session-revocation decisions.
7. Review children/privacy, Ticket and audit retention with legal/privacy advisers.

## Definition of Done Assessment

The Sprint software contract is met: authenticated authorised staff can select an active Event; use automatic Gate Entry or controlled Ticket Lookup; enforce configurable server-time windows; receive privacy-minimised fail-closed outcomes; admit atomically under concurrency; and preserve attributable append-only evidence without copying raw Ticket credentials.

Sprint 18 is implementation-complete. Pilot sign-off remains conditional on the physical-device matrix and the broader production-readiness controls above.
