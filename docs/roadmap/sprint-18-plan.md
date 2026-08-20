# Sprint 18 Plan — Staff Scanner & Gate Operations

## Planning Status

Approved on 20 August 2026 following confirmation of the two-device Gate Entry and Ticket Lookup operating model, configurable time-based admission windows, and optional processing from Ticket Lookup.

## Objective

Give authenticated Event staff a fast, privacy-conscious and reliable mobile workflow for validating a Glacier Ticket and deliberately admitting its participant.

The Staff application has two explicit modes.

Gate Entry:

staff sign-in → choose an active Event → choose Gate Entry → scan → automatic server validation and admission → review the compact result → scan next

Ticket Lookup:

staff sign-in → choose an active Event → choose Ticket Lookup → scan → view detailed Ticket record → close or select Process ticket → confirm entry → scan next

The intended Event-day arrangement can use multiple devices simultaneously. For example, a gate device remains in Gate Entry for rapid admission, while a POS/help-desk device remains in Ticket Lookup so staff can inspect a Ticket and optionally process it when appropriate.

A Ticket is ready to admit only while its server-calculated entry window is open.

## Why This Should Be Next

Sprint 17 secured the Ticket validation and atomic scan boundary. Glacier now has the backend authority needed for a Staff-facing workflow without exposing the broader organiser application.

Gate operation is also the next concrete pilot capability in the strategic roadmap. Delivering it now proves that issued Tickets can be used safely at a real Event while keeping customer-service, refund and wider operational tools in later milestones.

## Product Principles

### Fast mode, deliberate mode

Gate Entry is the high-throughput operating mode: reading a Ticket immediately calls the authoritative admission operation and processes entry when eligible, without a second button click. Ticket Lookup begins read-only, prioritises details and presents a secondary `Process ticket` action when eligible; selecting it opens an explicit entry confirmation. Staff can close a Lookup result without changing the Ticket.

After a result is acknowledged, either mode returns immediately to ready state.

### Minimal information

The scanner shows only the information needed to make the entry decision:

- validation outcome
- participant name
- Ticket number
- Event
- Session and start time
- previous check-in time when already scanned

It does not show Customer contact details, payment records, complete Booking details, waiver signatures or unrelated participants.

Lookup may additionally show Ticket Type, issued time and current Ticket state. Broader Customer/Booking support remains part of the later Operator Service Tools milestone.

### Server authority

The browser decodes a QR value, but the API decides whether it belongs to the selected Event and whether the Ticket may be admitted. The client never derives Ticket state or marks a Ticket locally.

### Operational clarity

Entry outcomes must be visually and textually distinct:

- `READY TO ADMIT`
- `ENTRY GRANTED`
- `ALREADY SCANNED`
- `CANCELLED`
- `TOO EARLY`
- `ENTRY WINDOW CLOSED`
- `INVALID FOR THIS EVENT`
- `UNABLE TO VERIFY`

Colour is supplementary; text, iconography and sound/haptic feedback must not rely on colour alone.

## Approved Technical Direction

### Staff role

Introduce a dedicated Organisation role named `SCANNER`.

- OWNER retains all operator and scanner capability.
- MEMBER retains current operator reads and scanner capability during the transition.
- SCANNER receives only the dedicated scanner context, validation and admission routes.
- SCANNER must not gain access to ordinary Booking, Customer, catalogue, Event administration, Ticket detail or QR-generation routes.

Role strings should be centralised into a shared allowlist/type rather than duplicated across guards and DTOs.

Event-specific staff assignment is not required in this Sprint. A SCANNER may select from active Events in their authenticated Organisation. Event-level assignment can be added when staff rostering is designed; the existing `EventUser` table must not be treated as authoritative until that workflow exists.

### Dedicated API boundary

Add a Staff scanner controller rather than building the UI directly on broad Ticket endpoints.

Recommended routes:

- `GET /staff/scanner/events`
- `GET /staff/scanner/events/:eventId/context`
- `POST /staff/scanner/events/:eventId/validate`
- `POST /staff/scanner/events/:eventId/admit`

Token values belong in strict request DTOs rather than URLs so possession credentials are less likely to appear in access logs, browser history or proxy paths.

All routes require JWT authentication and explicit OWNER, MEMBER or SCANNER authority. Event ownership and active status are checked server-side. Validation and admission require the scanned Ticket's Event to equal the selected Event.

The existing Ticket endpoints remain for compatibility during this Sprint, but the Staff UI uses only the dedicated Staff boundary. Any later removal is a separately verified migration.

The validate route powers Ticket Lookup and is strictly read-only. Gate Entry calls the admit route immediately when a Ticket is read; confirmed Lookup `Process ticket` also calls the admit route. The admit route always recalculates eligibility before it may transition Ticket state.

Lookup remains useful outside the admission window: it shows the same-Event Ticket's details and explains whether it is early, currently eligible, already scanned, cancelled or closed. Time policy restricts admission, not legitimate staff lookup.

### Camera decoding

Use `@zxing/browser` with a QR-only reader and the rear-facing camera preference. The native `BarcodeDetector` API remains limited/experimental and is not a safe sole dependency for the expected iPhone and Android mix.

Camera access is requested while the authenticated scanner is ready, stops on route exit or result review, and restarts only when the scanner returns to ready state. The UI must explain denied/unavailable camera access.

Provide two fallbacks:

- manual secure-token entry for hardware scanners or damaged camera workflows;
- image-file QR decoding if it can be implemented and tested without broadening the Sprint.

Manual entry is required. Image upload is desirable but not a Definition of Done blocker.

Camera operation requires HTTPS outside localhost and must be included in deployment readiness documentation.

### Admission audit

Add an append-only `TicketScanAttempt` record for every authenticated admission attempt that reaches the authoritative service, including:

- Organisation
- Event
- Ticket when resolved
- acting User
- result
- originating mode (`GATE_ENTRY` or `TICKET_LOOKUP`)
- attempt time
- prior check-in time where applicable

Do not store the raw secure token, Customer details or duplicated participant data. The record is operational/security evidence, not a replacement for Ticket status.

Read/reporting UI for the audit history is outside this Sprint, but persistence and tests are required so gate actions are attributable from the first operational release.

The successful Ticket state transition and corresponding audit record must be created atomically. Duplicate/concurrent admissions must still produce exactly one successful state transition.

### Time-based entry policy

Add an Event-level Ticket entry policy with two explicit parameters:

- `entryOpensMinutesBeforeStart` — default `30` minutes;
- `entryClosesMinutesAfterEnd` — default `0` minutes.

For a Session Ticket, the authoritative window is:

`Session start − opening lead time` through `Session end + closing grace time`

For a legitimate Ticket without an assigned Session, the Event start and end are used instead. All comparisons use server time and stored absolute timestamps; the Event timezone is used only for staff-facing display.

Example: a 10:00 am–11:00 am Session with the defaults admits from 9:30 am through 11:00 am inclusive. A configured 15-minute closing grace extends that window to 11:15 am.

New Event setup must offer both values as optional configuration, prefilled with the safe 30/0 defaults. The Event Workspace must also provide OWNER-only controls for later changes, with bounded whole-minute values from 0 to 240. Existing Events receive the safe defaults through the migration. These are Event-wide defaults in Sprint 18; per-Session overrides are deferred.

Validation returns `NOT_YET_VALID` before the opening instant and `ENTRY_WINDOW_CLOSED` after the closing instant, including the relevant staff-facing window times. Admission recalculates the window on the server at mutation time rather than trusting an earlier validation response.

## In-Scope Work

### 1. Scanner-specific authorisation

- centralise Organisation role vocabulary
- allow OWNER to create SCANNER users
- ensure login/JWT carries SCANNER without broadening ordinary guards
- add systematic role-policy tests
- keep inactive-user login rejection

### 2. Event context

- list only active Events owned by the authenticated Organisation
- choose and retain the current Event in the scanner session
- display Event name, venue and Event dates
- display the configured entry policy and calculated local window for the scanned Ticket
- optionally surface current Sessions for context, without turning Session selection into admission authority
- reject cross-tenant, draft, completed or otherwise unavailable Event context

### 3. Entry-window administration

- add bounded Event persistence fields with 30-minute-before and zero-minute-after defaults
- accept optional customised values during new Event setup
- add OWNER-only Event Workspace controls
- validate whole-minute values from 0 to 240
- preserve Event-timezone display and server-authoritative instant comparisons
- keep per-Session override rules out of scope

### 4. Validation service

- accept only a 64-character lowercase hexadecimal Glacier Ticket token
- return a typed, privacy-minimised result
- distinguish ready, too early, window closed, already scanned, cancelled, wrong Event and not found/malformed outcomes
- avoid revealing a cross-tenant Ticket's Event or participant information
- return Session timing and the calculated entry window for staff context
- return Ticket Type, issued time and current Ticket state for read-only lookup
- keep validation read-only
- prove in tests that lookup never calls a Ticket update or creates an admission-attempt record

### 5. Admission service

- require the selected Event ID and scanned token
- retain the atomic ACTIVE → SCANNED transition
- recalculate and enforce the entry window at admission time
- record `checkedInAt`
- return deterministic success/too-early/window-closed/already-scanned/cancelled/invalid results
- atomically record the attributable scan attempt
- remain safe under rapid repeat and concurrent requests

### 6. Mobile Staff scanner UI

- dedicated `/staff/scanner` route and focused shell
- authenticated-route handling and sign-out
- active Event selection
- explicit `Gate Entry` and `Ticket Lookup` mode selection
- visually persistent mode label and distinct result layout
- retain the selected Event and mode on that device/browser so a gate station and POS lookup station remain in their intended contexts across ordinary page reloads
- camera permission/start/stop lifecycle
- visible scan target and concise instructions
- QR-only continuous detection with duplicate-frame suppression
- automatic Gate Entry processing on a camera or hand-scanner read, followed by a compact, unmistakable outcome
- Event Settings controls for owners to review and update the 0–240 minute opening and closing offsets, with the 30/0 creation defaults explained in context
- detailed Ticket Lookup with secondary `Process ticket` only for an eligible Ticket
- explicit confirmation after selecting `Process ticket` from Lookup
- close/scan-next action that leaves the looked-up Ticket unchanged
- large thumb-friendly Process, Close and Scan next actions
- accessible outcome presentation independent of colour
- manual token/hardware-scanner fallback
- portrait-first responsive layout with safe-area spacing
- prevent the screen sleeping only if a supported, permission-safe approach can be added without making the core flow fragile

### 7. Resilience

- prevent multiple in-flight validation/admission requests
- ignore duplicate camera frames while a result is active
- show a recoverable network failure without falsely granting entry
- never cache a successful result as authority for a later scan
- provide clear offline messaging
- do not implement offline admission or later reconciliation in this Sprint

### 8. Documentation and operational readiness

- scanner architecture and state authority
- camera/HTTPS/device requirements
- role and privacy decisions
- scan-attempt audit semantics
- event-day start-up checklist
- event-day failure/fallback procedure
- explicit offline limitation

## Explicitly Out of Scope

- offline admission and conflict reconciliation
- native iOS or Android applications
- Apple Wallet or Digital Waiver Pass
- waiver-based admission blocking
- facial recognition or identity-document checks
- customer search, Booking support or payment troubleshooting
- refunds, cancellations or Session transfers
- walk-up sales/POS
- attendance dashboard or exports
- staff rostering and Event-specific assignment UI
- full granular permission framework beyond SCANNER
- device fleet management
- push notifications
- broad organiser UI redesign
- production deployment

## Security and Privacy Requirements

- Raw Ticket tokens must not be persisted in scan-attempt records or application logs.
- Scanner API tokens must be supplied in validated request bodies, not URL paths.
- Cross-tenant and wrong-Event scans must not disclose participant or Event details.
- SCANNER users must be denied ordinary operator APIs.
- Camera streams remain in the browser and are not uploaded or stored.
- The UI must stop media tracks when scanning pauses or the component unmounts.
- Admission always requires a fresh authoritative API response.
- A network error must never render as a successful entry.
- Successful admission and audit evidence must be transactionally consistent.

## Acceptance Scenarios

### A. Staff access

1. OWNER creates a SCANNER user.
2. SCANNER signs in and reaches only the scanner workflow.
3. SCANNER sees active Events from their Organisation.
4. SCANNER cannot access ordinary Event, Booking, Customer or catalogue APIs.

### B. Valid Ticket

1. Staff selects Event A.
2. Camera or manual input reads an ACTIVE Ticket for Event A within its calculated entry window.
3. Glacier shows `READY TO ADMIT` with minimal participant/session detail.
4. Staff taps Admit.
5. Exactly one ACTIVE → SCANNED transition occurs.
6. Glacier shows `ENTRY GRANTED` and records the attributable attempt.
7. Scanner returns to ready state on `Scan next`.

### C. Ticket Lookup without processing

1. Staff selects Event A.
2. Staff scans an ACTIVE, SCANNED or CANCELLED Ticket for Event A.
3. Glacier displays the Ticket number, Ticket Type, participant, Event, Session, issued time, status, entry-window information and previous check-in time where applicable.
4. A secondary `Process ticket` action is available only when the Ticket is ACTIVE and inside its entry window.
5. Staff closes the result without selecting that action.
6. Ticket status and `checkedInAt` remain unchanged and no admission-attempt record is created.
7. Closing returns to scanner-ready state.
8. Wrong-Event and cross-tenant Tickets disclose no Ticket or participant details.

### D. Process from Ticket Lookup

1. Staff looks up an eligible Ticket in Ticket Lookup mode.
2. Staff selects `Process ticket`.
3. Glacier asks for explicit confirmation while retaining the Ticket identity and eligibility summary.
4. Staff confirms entry.
5. The API recalculates eligibility and performs the same atomic admission used by Gate Entry.
6. Glacier shows `ENTRY GRANTED` and records the attributable attempt.

### E. Time-window enforcement

1. A 10:00 am–11:00 am Session uses the default 30-minute opening lead and no closing grace.
2. At 9:29 am, validation returns `TOO EARLY` and admission cannot change the Ticket.
3. From 9:30 am through 11:00 am, the Ticket can be admitted.
4. After 11:00 am, validation returns `ENTRY WINDOW CLOSED` and admission cannot change the Ticket.
5. If an OWNER configures a 15-minute closing grace, admission remains possible through 11:15 am.
6. Admission recalculates the server-authoritative window even when an earlier validation was ready.

### F. Lookup detection remains read-only

1. Ticket Lookup detects a valid QR.
2. Glacier displays the detailed result without calling admission.
3. Staff closes the result without selecting and confirming `Process ticket`.
4. Ticket remains ACTIVE and no admission audit is recorded. Gate Entry is intentionally different: a valid detection immediately attempts admission.

### G. Duplicate or concurrent scan

1. The same Ticket is submitted twice or from two devices.
2. Only one request grants entry.
3. Later/concurrent result is `ALREADY SCANNED` with the authoritative time.
4. Attempts are recorded without duplicating successful admission.

### H. Two-device Event operation

1. Device 1 selects Event A and remains in Gate Entry mode.
2. Device 2 selects Event A and remains in Ticket Lookup mode at the POS/help desk.
3. Each device retains and visibly displays its own selected mode.
4. Device 1 automatically attempts admission as soon as the camera or hand scanner reads a Ticket.
5. Device 2 can inspect a Ticket without changing it, then optionally select and confirm `Process ticket` when it is eligible.
6. Admission from either mode uses the same server authority and records the originating mode.
7. Concurrent processing still permits only one successful Ticket transition.

### I. Invalid boundaries

1. Malformed, unknown, cancelled, cross-tenant or wrong-Event tokens are submitted.
2. No Ticket state changes.
3. No unrelated participant/Event data is disclosed.
4. Staff receives a clear operational outcome.

### J. Camera unavailable

1. Camera permission is denied or no camera exists.
2. Scanner explains the problem without entering a broken state.
3. Staff can use manual/hardware input.

### K. Connectivity failure

1. Validation or admission cannot reach the API.
2. Glacier shows `UNABLE TO VERIFY`.
3. Entry is never shown as granted.
4. Staff can retry when connectivity returns.

## Test and Verification Control

Sprint 18 begins from:

- 52 API test suites passing
- 326 API tests passing
- API production build passing
- web production build passing
- clean synchronized `main` at `feef901`

Completion requires:

- schema migration and generated Prisma client verified
- API role/tenant/wrong-Event/time-boundary/atomicity/audit tests using an injected clock
- scanner controller/service tests
- web component/state tests for scan lifecycle and result mapping
- explicit tests proving lookup alone cannot call admission and Lookup processing requires both the action and confirmation
- camera adapter tests with media/decoder mocks
- API and web production builds
- existing 52-suite / 326-test baseline preserved
- browser smoke on desktop fallback
- physical-device test on at least one iPhone Safari and one Android Chrome device before pilot sign-off
- two-device concurrent scan test
- camera-denied and network-failure tests
- documentation and changelog closeout
- clean commits and no deployment

Current automated verification after the web testing foundation was added:

- 58 API suites and 351 API tests passing
- 2 web suites and 12 scanner tests passing
- Gate automatic admission, Lookup read-only/confirmation, early, late, duplicate, wrong-Event, unknown, malformed, network-failure, camera-denied and camera-shutdown behaviours covered
- production dependency audit reporting zero known vulnerabilities after pinning the patched compatible `nanoid` release

## Recommended Implementation Sequence

1. Approve and commit this Sprint contract.
2. Add central role vocabulary and SCANNER denial/allowance tests.
3. Add append-only scan-attempt persistence.
4. Add Event entry-window persistence and OWNER configuration controls.
5. Add the dedicated Staff scanner API and focused service tests.
6. Preserve and test atomic Ticket and time-window authority under concurrency.
7. Add the scanner web route, authentication routing and Event selection.
8. Add the QR camera adapter and lifecycle tests.
9. Add review/admit/result/scan-next state flow.
10. Add manual/hardware fallback and resilience states.
11. Run full regression and production builds.
12. Run browser and physical-device verification.
13. Update architecture, operations, endpoint register, roadmap, changelog and Sprint notes.

## Definition of Done

Sprint 18 is complete when an authenticated OWNER, MEMBER or narrowly authorised SCANNER can select an active Event and use either Gate Entry or Ticket Lookup; automatically process a Gate Entry scan or perform a read-only Lookup; grant entry through the automatic Gate operation or the Lookup mode's secondary action and confirmation; admit an eligible participant only inside the configured server-authoritative entry window; receive an unmistakable result and safely continue scanning; while early, late, wrong-Event, cross-tenant, cancelled, duplicate and connectivity cases cannot falsely grant entry or leak unrelated data, and every admission attempt is attributable without storing raw Ticket credentials.

## Approved Product Decisions

1. Use automatic validation and admission in Gate Entry for concert-style throughput; retain deliberate `Review → Process → Confirm` behaviour in Ticket Lookup.
2. Add a narrow Organisation-level `SCANNER` role; Event-specific staff assignment remains later work.
3. Record append-only admission attempts from the first scanner release.
4. Treat offline admission as explicitly out of scope; loss of connectivity must fail closed.
5. Use a dedicated Staff scanner API with token-in-body requests instead of building on the existing token-in-path endpoints.
6. Use Event-wide defaults of 30 minutes before Session/Event start and zero minutes after Session/Event end, configurable by OWNER from 0 to 240 minutes.
7. Provide distinct Gate Entry and Ticket Lookup modes; Lookup may process an eligible Ticket through a secondary action and explicit confirmation.
