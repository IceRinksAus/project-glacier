# Sprint 41 Plan — Waiver Templates, Participant Coverage and Staff Verification

**Status:** Implemented locally 20 September 2026; organiser browser acceptance pending

## Outcome

Make Glacier's Waiver workflow usable from legal-template preparation through
customer completion and event-day verification. Organisers should manage
jurisdiction-aware source templates from a main Waivers destination, attach an
approved version during Event setup, and see completion in the same Booking or
Ticket lookup used by staff.

Customers must be able to complete the Waiver during booking or independently
from an Event QR code. One responsible adult may cover themselves and any
number of dependants in their care. Glacier must provide a clear, privacy-safe
proof of completion without treating Waiver acceptance as Ticket consumption or
admission.

## Existing foundation to preserve

- Event-specific `EventWaiver` with a stable public slug.
- Activity/jurisdiction `WaiverTemplate` revisions and
  `DRAFT`/`APPROVED`/`RETIRED` lifecycle.
- Immutable Event `WaiverVersion` snapshots with source-template provenance,
  content hash and publish/supersede lifecycle.
- Atomic `WaiverSubmission` plus zero-to-many `WaiverMinor` records.
- Server acceptance time, content/acceptance hashes and hashed high-entropy
  verification credential.
- Narrow public verification response that excludes identity, dependants and
  signature evidence.
- Organisation-scoped operator retrieval and OWNER-only Event draft/publication
  authority.
- Booking confirmation may navigate to the stable Event Waiver but currently
  creates no Booking, participant or Ticket relationship.

Ticket, Booking, Payment/refund, Rule, capacity, inventory, rescheduling,
Flexible Ticket, POS, Scanner and credential authorities remain protected.

## Agreed product decisions

- Add **Waivers** to the main organiser sidebar.
- Keep Event Waiver selection/configuration in the Event setup workflow.
- Maintain source templates by activity, Australian jurisdiction and revision.
- Legal wording and operational safety rules are separate controlled sections;
  state-specific law must not be normalised into generic wording.
- Historical NSW 2026, WA 2026, VIC 2025 and SA 2024 waivers are source
  material, not automatically approved Glacier legal content.
- Customers may sign during booking or independently before participation.
- A responsible adult may sign for themselves and zero-to-many dependants, or
  sign only for dependants where the approved wording permits it.
- Booking-originated completion can be explicitly associated with Booking
  participants. Generic QR completion remains valid without a Booking.
- Independent submissions may be explicitly matched by authorised staff later;
  Glacier must not use fuzzy or silent identity matching.
- Booking and Ticket lookup should show Waiver coverage so staff do not need a
  separate operational search.
- Waiver status informs staff but does not mutate Ticket validity, consume a
  Ticket or grant admission.
- Proof of completion begins with a secure mobile page, QR credential and
  browser Print / Save PDF. Native Apple/Google Wallet passes remain deferred.
- Mandatory risk acceptance, guardian acceptance, optional media consent and
  optional marketing consent must remain distinguishable.

## Source-waiver review decisions

The supplied references demonstrate shared risk, conduct, supervision,
signature and jurisdiction-warning concepts, but material differences must be
preserved and reviewed:

- NSW combines Ticket sale/refund/admission terms, rink rules, media consent
  and risk wording and refers to the former 123 Tix workflow.
- WA and VIC share a close structural base but use different jurisdictional
  statutes and warning language.
- SA contains a former Event/operator identity, a 2022 title, different minimum
  age and alcohol rules, prescribed-form wording, unresolved strike-out choices
  and placeholder instructions.
- Minimum age, helmet, accompaniment and alcohol differences appear to include
  Event/operator policy and must not be assumed to be jurisdictional law.
- Media permission is bundled into all supplied examples; Glacier should store
  optional media consent separately unless current qualified advice requires a
  different approach.

No supplied wording will receive Glacier `APPROVED` status solely because it
was used previously. Current legal entity, insurer, Event, jurisdiction,
dependant, privacy and consent suitability remain organiser/legal evidence.

## Slice 1 — Organisation Waiver hub and template lifecycle

- Add Waivers to the full-height primary organiser navigation.
- Build an organisation-authorised Waiver hub showing:
  - template activity, jurisdiction and revision;
  - draft, approved-for-use and retired state;
  - approval evidence metadata without claiming Glacier supplied legal advice;
  - Events using each template/version;
  - missing-jurisdiction coverage; and
  - a clear route into Event Waiver configuration and submissions.
- Resolve the existing globally stored template boundary so one Organisation
  cannot create, alter or infer another Organisation's legal content. Preserve
  any intentionally platform-curated template through an explicit authority,
  not an accidental unscoped table.
- Require OWNER authority for template mutation, approval-for-use and
  retirement. Record attributable lifecycle evidence without copying complete
  legal text into audit logs.
- Preserve revision history. Approved content is never edited in place.
- Permit controlled placeholders only; fail closed for missing or unsupported
  substitutions.

## Slice 2 — Event configuration and policy separation

- Keep Waiver configuration in Event setup and the Event Waiver workspace.
- Allow an authorised Event to select only a compatible approved-for-use
  template for its activity and jurisdiction.
- Explain why draft generation is blocked when activity, jurisdiction,
  required Event/operator data or a compatible approved template is missing.
- Separate Event/operator substitutions and configurable safety rules from the
  jurisdiction-specific legal section.
- Model minimum age, helmet, adult-accompaniment and alcohol rules as explicit
  reviewed Event policy where required; do not silently derive them from a
  state code.
- Preserve immutable publication and supersession. Existing submissions retain
  the exact accepted version after later publication.

## Slice 3 — Customer signing and participant coverage

- Present two clear choices: adult participant, or responsible adult with
  dependant(s).
- Support:
  - signatory participating alone;
  - signatory participating with one or more dependants; and
  - signatory covering dependant(s) without participating, only where the
    selected template permits that relationship.
- Add and remove dependant rows without an artificial low limit. Retain a
  documented abuse/storage bound.
- Minimise child data. Collect date of birth only where required for legal,
  eligibility or safety evidence.
- Persist explicit covered-person records and guardian relationship evidence.
- Store mandatory risk acceptance separately from optional media consent and
  any future marketing consent.
- Preserve server-authoritative accepted time, exact published version, hashes
  and atomic submission creation.
- Improve mobile readability, accessible signatures, validation, error recovery
  and completion language.

## Slice 4 — Optional Booking and participant association

- Add an optional same-Event Booking association to a Waiver Submission.
- Represent explicit coverage of Booking Participants rather than attaching a
  single Waiver flag to the whole Booking.
- When entered from a Booking flow, use the existing bounded Booking possession
  authority to offer only that Booking's participants for coverage.
- Do not expose or store raw Booking-access or Ticket credentials in Waiver
  records, logs or URLs beyond their existing controlled use.
- Generic Event QR completion remains Booking-independent.
- Add an authenticated staff action to associate an independent submission with
  selected same-Event Booking Participants. Require confirmation and
  attributable audit evidence; prohibit silent/fuzzy name matching.
- Reject cross-Event, cross-Organisation, cancelled/superseded evidence or
  duplicate-conflicting coverage according to documented rules.
- Derive Ticket context through its authoritative Booking Participant/Booking
  relationship rather than duplicating a mutable Ticket reference where
  unnecessary.

## Slice 5 — Proof of completion

- Replace the transient success state with a durable mobile verification page.
- Show a clear completed state, Event, acceptance time, covered-person count and
  safe proof reference.
- Provide a QR code carrying only the secure proof credential or verification
  URL. Keep only the one-way credential hash in PostgreSQL.
- Support browser Print / Save PDF with verification context; do not embed the
  stored signature or unnecessary child details in the default proof.
- Permit the customer to retain/reopen proof without exposing the full legal
  evidence record publicly.
- Define replacement/revocation behavior before any credential reissue is
  introduced.

## Slice 6 — Integrated staff lookup

- Add Waiver coverage to authorised Booking detail, POS Ticket/Booking lookup
  and the appropriate event-day staff view.
- Display compact, non-colour-only statuses:
  - complete and matched;
  - partially covered;
  - missing;
  - independently completed but not matched; and
  - needs review.
- Show only the minimum operational fields by default: applicable Event,
  participant coverage, signatory relationship, accepted time and version.
- Gate full signature/legal evidence behind the existing higher-authority
  operator evidence surface; do not display it in Scanner or routine POS views.
- Scanner-only users must not gain template administration or unrestricted
  child/signature access.
- Do not automatically consume or reject a Ticket in this Sprint. A missing
  required Waiver produces a prominent operational warning pending an approved
  admission-policy decision.

## Slice 7 — Documentation and operator acceptance

- Document template provenance, versioning, approval evidence and the boundary
  between platform structure and legal approval.
- Document Booking association, explicit participant coverage, proof credential
  authority, staff matching and audit behavior.
- Update privacy inventory, child-data handling, retention/legal-hold decision
  register, production checklist and staff runbook.
- Use fictional local/test identities and dependants only.
- Browser acceptance should cover desktop organiser work and mobile customer
  signing/proof, plus tablet POS and handset Scanner/lookup presentation.

## Authority, privacy and security boundaries

- Every organiser read/write remains Organisation-, role- and Event-assignment
  scoped on the server. Navigation is not an authority boundary.
- Template scope must be explicit. No Organisation may mutate or infer another
  Organisation's content or approval evidence.
- Public routes expose only the current active Event's published version and a
  narrow proof result.
- Signature data, full waiver text, child dates of birth and participant
  identity never appear in application logs, general reports or public proof.
- Public submission/proof endpoints require the existing abuse-protection
  framework and privacy-safe monitoring evidence.
- Participant matching is explicit and same-Event; names alone are not proof of
  identity.
- Optional consent is not bundled into mandatory participation acceptance.
- No automatic deletion is implemented until retention and legal-hold policy is
  approved. Any future deletion must preserve applicable evidentiary duties.
- No production legal wording is invented, silently rewritten or represented
  as legally approved by Glacier engineering.

## Focused verification

- Template tests: tenant isolation, roles, revision uniqueness, lifecycle,
  compatible selection, immutable approved revisions and audit attribution.
- Event tests: missing configuration, compatible template selection, draft
  rendering, publication, supersession and historical-submission integrity.
- Submission tests: adult only, adult plus multiple dependants, guardian-only
  mode, consent separation, invalid/future dates, bounded payload and atomicity.
- Association tests: Booking possession authority, same-Event participant
  coverage, generic QR independence, explicit staff matching, cross-tenant and
  cross-Event denial, duplicate/conflict handling and audit evidence.
- Proof tests: credential entropy/hash-only storage, invalid proof,
  privacy-minimal response, print view and no signature/child-data leakage.
- Staff tests: Booking/Ticket status projection, partial coverage, least
  privilege, SCANNER restrictions and no Ticket/admission mutation.
- Preserve all existing Payment, refund, capacity, inventory, Rule, Ticket,
  POS, Scanner, rescheduling and Flexible Ticket suites.

## Exit gate

- Focused tests pass after each small implementation slice.
- API and web suites and production builds pass.
- Committed migrations are current and replay successfully from empty state.
- Disposable tenant/role/Event/MFA isolation passes all 5 checks and gains
  focused Waiver cross-tenant/assignment evidence.
- Isolated PostgreSQL backup/restore includes every new critical Waiver table or
  relationship and matches all critical tables.
- Tracked-secret scan and complete local release gate pass.
- Browser acceptance uses fictional local data and confirms organiser,
  customer, POS and staff lookup flows.
- Documentation records implementation, exact evidence and deferred legal,
  privacy, infrastructure and device claims.
- Verified slices are committed locally. Nothing is pushed without explicit
  organiser approval.

## Explicitly deferred

- Final approval of NSW, WA, VIC, SA or other jurisdiction legal wording.
- Legal conclusions about guardian capacity, statutory exclusions, media
  consent, retention or evidentiary sufficiency.
- Native Apple Wallet and Google Wallet passes.
- Email/SMS delivery, reminders or recovery until an approved provider and
  account ownership exist.
- Automatic biometric, fuzzy-name or identity-document matching.
- Automatic Ticket invalidation, consumption or gate admission based on Waiver
  state without an approved event-day policy and rehearsal evidence.
- Automated deletion before retention and legal-hold policy approval.
- Managed production secrets, private deployed file storage, deployed
  monitoring/alerts, real device/hardware validation and independent legal,
  privacy, accessibility and security review.
- Paid domains, hosting, communications providers or other infrastructure.

## Scope confirmation required

Implementation began only after explicit organiser approval of this plan. The
historical waiver links will remain documented source material; their wording
will not be promoted to `APPROVED` production content by implementation alone.
