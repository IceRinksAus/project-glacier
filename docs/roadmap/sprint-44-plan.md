# Sprint 44 Plan — Checkout Terms, Privacy Notice and Marketing Choice

**Status:** Implementation and complete local verification finished on 5 October 2026; organiser walkthrough remains available

## Outcome

Give Glacier a clear, reproducible checkout-consent boundary. Before a public
or staff-assisted Ticket sale is completed, the purchasing adult must receive
the applicable Ticketing Terms and Privacy Collection Notice. Required
Ticketing Terms acceptance must be affirmative and evidenced against the
Booking. Optional marketing permission must be separate, unchecked, revocable
and attached only to the purchasing adult.

This Sprint proves the workflow and evidence model with fictional local
documents. It does not claim that the wording is legally approved, activate an
email provider or authorise production marketing.

## Evidence entering the Sprint

- Public checkout currently creates an authoritative Booking and Payment but
  does not retain the exact Ticketing Terms or Privacy Collection Notice shown.
- `Customer` holds the purchasing adult's contact details but no independent
  communication preference or consent history.
- `WaiverSubmission` still has optional `marketingConsent` and `mediaConsent`
  fields. Marketing authority must move out of the participation Waiver;
  historical Waiver rows must remain readable and immutable.
- Online, POS, Payment, Ticket, refund, capacity, Product, Scanner, Flexible
  Ticket and Event-assignment foundations are already protected by automated
  evidence and must not be weakened.
- No approved email-delivery provider, production sender identity, final
  Ticketing Terms, Privacy Collection Notice, retention schedule or qualified
  Australian legal/privacy approval currently exists.

## Decisions locked for Sprint 44

1. **Five purposes remain distinct.** Commercial Ticketing Terms, privacy
   notice, transactional Event communications, optional marketing and the
   participation Waiver are never represented by one checkbox.
2. **Required acceptance is not optional consent.** Processing needed to create
   a Booking, take Payment, issue Tickets or send material service/safety
   information is explained, not falsely presented as optional.
3. **Marketing starts off.** It is unchecked by default, declining it never
   blocks purchase, and no existing Booking, Waiver or contact detail implies
   permission.
4. **Only the purchasing adult receives marketing authority.** Dependants,
   Ticket participants and Waiver minors never acquire a marketing profile.
5. **Evidence is append-only.** Later document publication or marketing
   withdrawal does not rewrite what was shown or accepted for an earlier
   Booking.
6. **Published-document authority is server-side.** The client cannot supply
   arbitrary text, hashes or versions as trusted evidence.
7. **Production fails closed.** A production Event cannot take a new Ticket
   payment without published approved checkout documents and required
   acceptance evidence.
8. **POS does not collect marketing in this Sprint.** Staff-assisted sales use
   a deliberate customer-acceptance presentation and attributable operator
   evidence; staff cannot infer or tick optional marketing for a customer.

## Protected foundations

- Organisation, role and Event-assignment boundaries remain server-authoritative.
- Public possession credentials remain scoped to their Booking and expose no
  organiser administration.
- Payment success, reservation expiry, Ticket issuance, refund allocation,
  Session capacity, Product inventory and reusable Product capacity retain
  their existing authorities.
- Existing Waiver, Scanner, POS, Flexible Ticket and public Ticket links retain
  their current behaviour except for the explicitly approved checkout/marketing
  separation.
- Historical `WaiverSubmission.marketingConsent` values remain historical
  evidence only and are never treated as current marketing permission.
- Logs and API responses must not contain document bodies, email addresses,
  consent tokens or unnecessary customer detail.
- Only fictional local/test customer and document data may be used.

## Slice 1 — Document and evidence contract

- Define versioned document authority for:
  - Ticketing Terms and Conditions;
  - Privacy Collection Notice; and
  - optional marketing disclosure/sender wording.
- Bind published documents to the correct Organisation/Event scope with a
  stable version, immutable content, content hash, status, publication time and
  publishing actor.
- Define immutable Booking-level checkout evidence containing at minimum:
  Booking, purchasing Customer, channel, accepted time, required document
  versions/hashes and the privacy version presented.
- Define independent customer marketing evidence containing disclosure version,
  sender, channel, source Booking where applicable, granted/declined time,
  withdrawal time and attributable actor/source.
- Preserve historical evidence when a later document is published or a later
  marketing choice supersedes future authority.
- Add the new Prisma migration and include new critical tables in backup/restore
  verification.

**Acceptance:** Automated tests prove that document publication, Booking
acceptance and marketing history are immutable, correctly scoped and cannot be
cross-tenant or cross-Event referenced.

## Slice 2 — Controlled document publishing

- Add an OWNER and authorised-MANAGER setup surface for the three checkout
  document types, following existing Event-assignment boundaries.
- Use clearly labelled fictional local templates so the workflow can be tested
  without representing them as approved legal wording.
- Require deliberate draft → preview → publish progression; published versions
  cannot be silently edited in place.
- Display current version, status, publication evidence and which Events are
  blocked from checkout because required documents are absent.
- Prevent production-mode publication of test-only documents and fail closed
  when approved production document configuration is missing.

**Acceptance:** An authorised organiser can publish a new test version and an
unauthorised or unassigned user cannot view, publish or attach it.

## Slice 3 — Public checkout presentation and enforcement

- Present linked/readable Ticketing Terms and the Privacy Collection Notice on
  the Review/Payment boundary before Payment submission.
- Require one clear, initially unchecked Ticketing Terms acceptance control.
- Present a separate, initially unchecked optional marketing choice naming the
  organiser/sender and explaining withdrawal.
- Do not describe transactional receipts, Tickets, Payment notices, safety
  information or material Event/Session changes as marketing.
- Submit only version identifiers and explicit choices; the server resolves the
  trusted published content and hashes.
- Atomically retain checkout evidence with the Booking before Payment can be
  completed. Missing, stale, foreign or unpublished required versions fail
  closed with a useful restart/review message.
- Existing confirmed Bookings continue to resolve their original evidence;
  publishing a new version affects future checkout only.

**Acceptance:** A fictional customer can purchase after accepting required
terms with marketing either declined or granted, while missing acceptance,
stale versions and crafted identifiers are rejected server-side.

## Slice 4 — Staff-assisted/POS boundary

- Add a fast POS confirmation step stating that the purchasing adult was shown
  or given access to the current Ticketing Terms and Privacy Collection Notice
  and affirmatively accepted the sale terms.
- Keep the step touch-friendly and inside the unified Ticket/Product basket;
  do not add a separate slow workflow or weaken Session/Product Rules.
- Record the applicable document versions, sale channel, acceptance time and
  authenticated operator against the Booking.
- Do not display or collect optional marketing permission in POS during this
  Sprint. Staff cannot select it on a customer's behalf.
- Merchandise-only handling must follow the documented scope decision: the new
  Ticketing Terms gate applies where a Booking/Ticket contract is created, not
  by accidentally manufacturing a Ticket participant for retail stock.

**Acceptance:** A staff-assisted Ticket sale cannot complete without the
deliberate terms confirmation and produces attributable evidence without adding
queue-heavy data entry.

## Slice 5 — Marketing withdrawal and Waiver separation

- Stop presenting marketing permission in new public Waiver submissions.
- Retain optional media/photography permission as a distinct
  participation-specific choice where configured.
- Preserve old Waiver marketing values for historical interpretation only;
  never import them into current customer marketing authority.
- Provide an authorised OWNER/assigned-MANAGER action to record an explicit
  marketing withdrawal for the purchasing Customer with time and actor.
- Withdrawal immediately makes future marketing authority false without
  cancelling Bookings, Tickets, receipts or operational/safety communication.
- Do not implement bulk messaging, campaigns, marketing analytics or email
  delivery. A public provider-backed unsubscribe link remains future scope
  until a delivery provider and sender ownership are approved.

**Acceptance:** Withdrawal is attributable and irreversible as historical
evidence, current authority resolves false, transactional service remains
unaffected and no dependant record is created.

## Slice 6 — Organiser/customer acceptance and documentation

- Provide a non-technical walkthrough covering document publication, declined
  marketing purchase, granted marketing purchase, missing acceptance, a new
  published version, POS acceptance evidence, withdrawal and Waiver separation.
- Show the retained evidence on the authorised Booking/Customer views without
  exposing it through public Ticket or verification endpoints.
- Update Booking, privacy, Waiver, POS, API endpoint, environment, production
  checklist, security finding, roadmap and Sprint documentation.
- Record wording/provider/retention/legal decisions as external gates rather
  than filling them with implementation assumptions.

## Verification and exit gate

- Focused API/web tests pass after each slice.
- Full API and web suites and production builds pass.
- All committed migrations are current and replay from an empty database.
- Disposable tenant/role/Event/MFA isolation passes all checks.
- Isolated PostgreSQL backup/restore matches every critical table.
- Tracked-secret scanning and the complete local release gate pass.
- Organiser acceptance confirms both marketing choices, required acceptance,
  POS handling, withdrawal and historical evidence.
- Verified slices are committed locally; nothing is pushed without explicit
  organiser approval.

## Outside Sprint 44

- final production legal wording or a claim of Australian legal compliance;
- approved retention/deletion/legal-hold policy implementation;
- email/SMS provider selection, sender/domain purchase or message delivery;
- public unsubscribe delivery links before an approved provider exists;
- campaigns, audience segmentation, customer profiling, marketing analytics or
  dependant marketing;
- expanded public Event homepage content (proposed Sprint 45);
- managed infrastructure, production secrets/monitoring/backups or real data;
- physical device/deployed-provider testing; and
- independent legal, privacy, accessibility or security review.

## Scope confirmation required

Sprint 44 implementation begins only after the organiser approves this plan.
Any requested production wording, communication provider or broader CRM feature
will be recorded as a separate decision rather than silently added during the
Sprint.
