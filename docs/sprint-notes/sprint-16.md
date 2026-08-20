# Sprint 16 — Event Waivers & Digital Acceptance

## Status

Core implementation complete and locally verified on 20 August 2026.

The implementation remains uncommitted at the time of this closeout. The Waiver persistence foundation was previously committed in `0659a93`.

## Objective

Deliver Glacier-native, Event-centric digital waivers without changing the authority of the existing Booking, Payment, Rule Engine or Ticket domains.

A person can complete a published Event Waiver without a Booking, Ticket, Customer account or email address. An Event can continue to exist and operate without a Waiver.

## Delivered Capability

### Persistence foundation

- Added optional Organisation legal, contact and address metadata.
- Added optional Event venue, address, Australian jurisdiction and activity-type metadata.
- Added `EventWaiver`, with at most one Waiver configuration per Event and a stable unique public slug.
- Added revisioned, activity- and jurisdiction-specific `WaiverTemplate` records.
- Added immutable Event-specific `WaiverVersion` snapshots with draft, published and superseded states.
- Added `WaiverSubmission` evidence tied to the exact accepted version.
- Added zero-to-many `WaiverMinor` records with name and date of birth.
- Added content, acceptance-statement and verification-token hashes.

The additive migration was committed in `0659a93`.

### Template and version lifecycle

- Resolves the latest approved template for an Event's activity type and jurisdiction.
- Generates Event-specific drafts using controlled placeholder substitution.
- Rejects missing Event/Organisation values and unsupported template variables.
- Records source-template provenance and a SHA-256 content hash.
- Assigns sequential Event Waiver version numbers.
- Publishes only draft versions.
- Supersedes the previously published version when a replacement is published.
- Preserves historical published wording and existing submissions.
- Creates stable, opaque public slugs using 24 random bytes.

Glacier does not generate production legal wording. Templates must be separately authored and approved.

### Public Waiver API and mobile page

- Public retrieval exposes only an active Event's current published Waiver version.
- Draft, superseded and inactive-Event Waivers are not publicly retrievable.
- The mobile-first page displays Event details, exact published wording, version and acceptance statement.
- A signatory must provide a non-blank full name, explicitly accept the statement and draw an electronic signature.
- A responsible adult may include zero to 20 minors, each with a bounded name and valid non-future date of birth.
- Submission persistence is atomic, including nested minors.
- The server chooses the authoritative Waiver version, content hash and acceptance time.
- Completion returns a high-entropy verification credential once.
- Glacier stores only the credential's SHA-256 hash.
- The public verifier returns only Event name, Waiver title/version, acceptance time and verified status.

### Operator workspace

- Added a Waiver tab to the existing Event Workspace.
- Shows a valid no-Waiver state without making Waivers mandatory.
- Shows Event activity/jurisdiction readiness.
- Supports draft generation, version history, exact preview and publication.
- Shows the stable public Waiver link for published Waivers.
- Generates a 512 px PNG QR code with error correction level H and margin 2.
- Provides a downloadable venue QR image.
- Lists up to 100 recent submissions.
- Supports bounded signatory-name search.
- Shows submission evidence, signature image, accepted version/time and minors.

All operator endpoints use JWT authentication, role guards where mutation authority is required, and Organisation scope sourced from the authenticated user context.

### Booking integration

- The public Event response includes `waiverPublicSlug` only when the Event has a published Waiver.
- The post-payment success experience conditionally offers a separate `Complete waiver now` action.
- The action opens the same independent public Event Waiver used by the venue QR code.
- Payment confirmation, Booking status, Ticket issuance and Rule Engine authority remain unchanged.
- No Booking, Ticket, Participant or Customer linkage was added to Waiver submissions.

### Shared web response handling

- The web API client now accepts a successful empty response as `null`.
- This fixed the optional no-Waiver state, where a valid empty response previously produced an `Unexpected end of JSON input` alert.

## API Surface

### Authenticated operator routes

- `GET /event/:eventId/waiver`
- `GET /event/:eventId/waiver/qr-code`
- `GET /event/:eventId/waiver/submissions`
- `GET /event/:eventId/waiver/submissions/:submissionId`
- `POST /event/:eventId/waiver/drafts` — OWNER
- `POST /event/:eventId/waiver/versions/:waiverVersionId/publish` — OWNER

### Deliberately public routes

- `GET /public/waivers/:publicSlug`
- `POST /public/waivers/:publicSlug/submissions`
- `GET /public/waivers/verifications/:verificationToken`

The public controller uses a strict local `ValidationPipe` with transformation, whitelisting and rejection of non-whitelisted fields. This avoids broad changes to legacy controller validation while making the new public boundary authoritative.

## Security and Evidence Decisions

- Operator Organisation identity is never accepted from request parameters or bodies.
- Public lookup is limited to active Events and the latest published version.
- Clients cannot select a version, timestamp or authoritative hash.
- Signatory and minor names are length-bounded and must contain non-whitespace.
- Submission signature payloads are limited to 200,000 characters.
- A submission may contain at most 20 minors; Sprint 16 intentionally does not reproduce a previous five-minor vendor limit.
- Minor date values must be real `YYYY-MM-DD` dates and cannot be in the future.
- Verification credentials are 32 random bytes encoded as 64 hexadecimal characters.
- Raw verification credentials are returned only on completion and are never stored.
- Public verification responses contain no signatory or minor identity.
- Submission search and evidence are never exposed through the public API.
- Published wording is snapshotted so later template or Event changes do not alter accepted evidence.

## Verification Evidence

### Automated

- Focused Event Waiver service/controller tests: 23 passed.
- Full API regression: 51 of 51 suites passed.
- Full API regression: 280 of 280 tests passed.
- Pre-Sprint baseline preserved: the existing 45 suites and 236 tests remain green within the expanded totals.
- API production build: passed.
- Web production build: passed.
- Targeted Waiver/web lint: no errors; one pre-existing internal-navigation warning remains in `src/lib/api.ts`.
- `git diff --check`: passed before documentation closeout.

### Browser and manual

Verified locally against the development preview:

- Published public Waiver retrieval.
- Exact development-preview wording and version display.
- Required name and explicit acceptance controls.
- Missing-signature validation.
- Pointer-drawn signature capture.
- Booking-independent adult submission with fictional test identity.
- Completion screen and one-time verification credential generation.
- Authenticated Event Waiver workspace.
- Published status, stable link and version preview.
- Submission search and evidence detail.
- Optional Event with no Waiver.
- No-Waiver empty-response error fix.
- QR display and download were reviewed by the user in the operator workspace.

The full Stripe sandbox purchase scenario was not repeated during this closeout. The complete API regression remained green, and the Booking integration has focused conditional-CTA tests.

## Local Preview Data

The local development database contains explicitly non-production fixtures used for browser verification:

- Event: `Tenant Security Test`
- Event ID: `cmscjcelb0000korp3ogwayuv`
- Public slug: `sprint16-preview`
- Development template ID: `dev-sprint16-template`
- Development Event Waiver ID: `dev-sprint16-event-waiver`
- Development published version ID: `dev-sprint16-waiver-version`
- Template revision: `9999`

The fixture wording is prominently labelled development-only and is not approved legal wording. Browser testing created fictional local submissions, including `Alex Glacier Test`. These records may be removed when the local preview is no longer needed.

## Configuration and Operations

- The API uses `WEB_APP_URL` as the public web origin encoded in generated Waiver QR codes.
- Local fallback: `http://localhost:3001`.
- Production must set `WEB_APP_URL` to the canonical public HTTPS web origin before venue QR codes are generated.
- Public web API calls continue to use `NEXT_PUBLIC_API_URL`.
- The current API production-preview entry point is `dist/src/main.js`; the existing `start:prod` script still points to the wrong compiled path and was not broadened into Sprint 16.
- Next.js development mode can exhaust local file descriptors in this workspace, so browser review used a production build with `next start`.

## Known Limitations and Deferred Work

These points are explicit so the UI does not imply production readiness beyond the delivered foundation:

- No production Waiver template has been legally approved or seeded.
- The existing Event creation experience is not a full setup wizard; Sprint 16 added the optional Waiver workspace instead of a broad Event-creation rewrite.
- Event activity, jurisdiction and Organisation/Event legal metadata exist in persistence, but dedicated operator editing controls for all of those values are not yet implemented. Draft generation remains disabled when required metadata is absent.
- Signature validation currently enforces a non-empty bounded string, not a strict PNG data-URI MIME pattern. The supplied public UI produces PNG data URLs, but additional server-side format validation is recommended before production launch.
- Signature evidence is stored in PostgreSQL text for this bounded first version. Private object storage and signed document/PDF generation remain deferred.
- There is no dedicated public verification web page; the privacy-minimised verification API is implemented.
- There is no Digital Waiver Pass or Apple Wallet pass.
- No reminder, invitation, Customer Portal, POS, Booking/Ticket identity matching or scanner enforcement was added.
- No retention/deletion workflow or legal hold tooling was added.
- Production rate limiting, abuse monitoring and final privacy/legal review remain pre-launch work.

## Explicitly Preserved Boundaries

Sprint 16 did not add:

- mandatory Waivers for Events
- Booking, Ticket, BookingParticipant or Customer linkage
- email requirements
- participant invitation or reminder workflows
- Ticket issuance or payment blocking
- scanner admission decisions based on Waiver state
- AI-generated legal wording
- broad legacy security or validation refactors
- signed PDFs or object storage

## Definition of Done Assessment

The core Event-centric Waiver foundation, lifecycle, public acceptance, immutable evidence, operator retrieval, QR access, conditional Booking shortcut, automated regression and browser verification are complete.

The original optional Event Setup Wizard concept was delivered through the existing Event Workspace because Glacier does not yet have the planned multi-step Event Wizard. Production legal content, metadata administration and the pre-launch controls listed above remain deliberately visible follow-up work rather than being treated as implicitly complete.

## Closeout State

- Persistence foundation commit: `0659a93`.
- Application, web and documentation changes: present in the working tree and not yet committed.
- No deployment was performed.
- Local preview services are temporary and may stop when the desktop work session ends.
