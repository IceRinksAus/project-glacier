# Sprint 39 Plan — Configuration and Publishing Clarity

**Status:** Approved 18 September 2026 — implementation in progress

## Outcome

Give organisers a clear, scalable settings structure, bring Event operational
configuration and Gate Entry readiness together, and make Website preview/live
publishing actions accurate. Preserve the substantial Reports and Waiver
foundations for their own dedicated reviews rather than diluting this Sprint
across unrelated workflows.

This is primarily an information-architecture and usability Sprint. It should
reuse existing authorities and avoid a schema change unless inspection reveals
that a required setting cannot be represented safely.

## Product decisions

- Organisation settings and Event settings are different scopes and must be
  labelled and navigated separately.
- Personal security is visible to the signed-in user; Team/access and
  Organisation policy remain OWNER-governed.
- Event configuration should be grouped by operating concern rather than by the
  order in which features were added.
- Gate Entry readiness belongs with Event operations. The organiser workspace
  explains configuration and device readiness; operational scanning remains on
  the dedicated Scanner device or the bounded POS Ticket-service path.
- `Preview` and `Open live website` are distinct actions. A DRAFT Event can be
  previewed by an authorised organiser but must never be described as publicly
  available.
- Reports and Waiver receive navigation/status improvements only where needed
  to fit the new structure. Their detailed functionality is explicitly deferred
  to dedicated Sprints.

## Slice 1 — Settings information architecture

- Replace the current long `Team and Access` settings page with a Settings home
  and clear grouped sections:
  1. **My account and security** — password/session context and MFA lifecycle;
  2. **Team and access** — roles, Event scope and attributable Manager MFA reset;
  3. **Organisation policies** — Organisation-wide Flexible Ticket defaults and
     future policy locations; and
  4. **Event configuration** — searchable links into each authorised Event's
     settings rather than duplicating Event-scoped forms globally.
- Preserve existing role visibility: every signed-in organiser can manage their
  own security; only OWNER can mutate Team/access and Organisation policy.
- Add concise summary cards showing current state and the effect of each area,
  with progressive disclosure for detailed forms.
- Retain final-OWNER protection, SCANNER assignment restrictions, MFA reset
  reason/audit behavior and immediate session enforcement.
- Do not add invitations, ownership transfer, password email recovery, billing
  plans or customer-facing account settings.

## Slice 2 — Event Settings workspace

- Rework the Event `Settings` tab into an overview with grouped panels:
  - **Tickets and sales** — Ticket Types, selling state and links to existing
    catalogue configuration;
  - **Flexible Tickets** — Event mode and effective Organisation policy;
  - **Gate Entry** — entry opening/closing window and device-readiness link;
  - **Website and publishing** — DRAFT/ACTIVE status, design readiness and
    preview/live actions;
  - **Waiver** — not configured, draft or published state and a link to the
    dedicated workspace; and
  - **Data and reporting** — links to Event Reports and authorised exports.
- Keep each setting's existing authority and service; the overview must not
  become a second mutation path where one already exists.
- Make scope explicit on every panel with `Organisation setting`, `Event
  setting`, `Inherited` or `Effective for this Event` labels.
- Preserve Event-assignment boundaries when listing or opening settings.

## Slice 3 — Gate Entry configuration and readiness

- Place the existing entry-window controls inside the Event Settings Gate Entry
  panel with plain-language examples of when a Ticket becomes valid.
- Show Event-local timezone, venue, entry window, eligible Scanner assignments
  and readiness checks without exposing credentials or device secrets.
- Link to the organiser Scanner guidance workspace introduced in Sprint 38.
- Explain the three bounded operating paths:
  1. dedicated SCANNER device Gate Entry;
  2. Scanner Ticket Lookup followed by confirmation; and
  3. POS Ticket lookup followed by deliberate admission.
- Retain the existing atomic admission, signed credential, wrong-Event,
  too-early, closed-window, cancelled and duplicate-scan authorities.
- Do not add remote device management, shared PINs, offline scanning, device
  provisioning or real-hardware claims.

## Slice 4 — Website preview and publishing correctness

- Fix public URL construction so local links use the configured web origin and
  never rewrite the working web port to the API port.
- For DRAFT Events, replace misleading public-link actions with an explicit
  authenticated `Preview design` action and text explaining that customers
  cannot access the Event yet.
- For ACTIVE Events, show `Open live website` and `Copy public URL` using the
  same canonical URL contract.
- Keep the private preview clearly marked and prevent it from becoming a public
  bypass around Event status.
- Improve Website readiness evidence for missing logo/hero/colours/content while
  retaining safe fallbacks.
- Replace remaining framework placeholder browser metadata with Glacier/Event
  titles and descriptions using non-sensitive published data only.
- Preserve branding upload validation, tenant ownership and authenticated asset
  preview controls.

## Slice 5 — Cross-surface status and navigation

- Add consistent status language and deep links between Settings, Website,
  Waiver, Reports and Gate Entry without duplicating their business logic.
- Use statuses that come from authoritative persisted state, not inferred
  browser completion: `Not configured`, `Draft`, `Ready`, `Published`, `Active`
  and `Needs attention` only where their meaning is defined.
- Retain the standard Glacier shell and full-height navigation on organiser
  pages. Dedicated SCANNER remains the sole full-screen exception.
- Verify direct URLs, back navigation, empty/loading/error states and assigned-
  Event denial.

## Reports and Waiver boundary

Sprint 39 does **not** redesign Reports or Waiver internals.

- Reports already includes Event Groups, multi-Event scorecards, Event reports,
  CSV and print/PDF presentation. A later dedicated review should address
  report discovery, KPI hierarchy, date comparison, saved views and operational
  versus executive reporting without weakening calculation authority.
- Waiver already includes template generation, versioning, publication, public
  submission, QR and evidence lookup. A later dedicated review must include
  legal wording ownership, consent/guardian rules, retention and privacy review;
  it should not be treated as a cosmetic subtask.

## Authority, privacy and compatibility boundaries

- Preserve Organisation, role, Event-assignment and privileged-MFA checks on
  every read and mutation. Navigation visibility is not the security boundary.
- Preserve all Ticket credentials/admission, Payment/refund, Booking,
  rescheduling, capacity, inventory, Rules, Flexible Ticket, POS and Scanner
  foundations.
- Do not expose customer data, Ticket credentials, recovery codes, device
  secrets, storage keys or private Event data in status summaries or metadata.
- Use fictional local/test data only.
- Do not purchase or provision a domain, hosting, email, cloud media, Scanner
  hardware or another paid service.
- Avoid unrelated dependency, formatting or schema changes.

## Focused verification

- Settings tests cover personal versus OWNER-only sections, scope labels,
  progressive disclosure and unchanged access/MFA payloads.
- Event Settings tests cover grouped status, deep links, inherited/effective
  policy labels and assigned-Event boundaries.
- Gate Entry tests cover timezone/window presentation, readiness, role/assignment
  evidence and no credential disclosure.
- Website tests cover configured-origin URLs, DRAFT authenticated preview,
  ACTIVE public actions, copy behavior and safe browser metadata.
- Existing Team, MFA, Flexible Ticket, branding, Waiver, reporting and Scanner
  focused suites remain green.
- Browser acceptance uses fictional Events at desktop, tablet and mobile widths.

## Exit gate

- Focused tests pass after each small slice.
- API and web suites and production builds pass.
- Migration status and disposable migration replay pass.
- Disposable tenant/role/Event/MFA isolation passes 5 of 5 checks.
- Isolated PostgreSQL backup/restore matches every critical table.
- Tracked-secret scan and complete local release gate pass.
- Documentation records delivered navigation, authority, browser evidence and
  limitations.
- Verified slices are committed locally. Nothing is pushed without explicit
  organiser approval.

## Explicitly deferred evidence and scope

- Detailed Reports UX/analytics review and new reporting calculations.
- Detailed Waiver legal, guardian, retention and submission-flow review.
- Customer account/preferences settings, invitations and ownership transfer.
- Password-recovery email delivery until provider/account ownership is approved.
- Real Scanner/POS device validation and offline operation.
- Managed production secrets, deployment, monitoring and media delivery.
- Independent accessibility, legal, privacy and security review.
