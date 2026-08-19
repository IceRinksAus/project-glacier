# Project Glacier — Authoritative Pre-Sprint 16 Baseline
**Prepared:** 19 August 2026  
**Repository baseline:** `ff456bd1a4aba7548bad2ec57a47914fb3524975`  
**Branch:** `main`  
**Purpose:** Prevent scope drift by reconciling the current repository, version-controlled documentation, Sprint 15 handover, Sprint 16 planning decisions, and the current operational waiver.

---

# 1. Authority Order

For work beginning Sprint 16, use this order when sources conflict:

1. **Current committed repository at `ff456bd`** — authoritative for what Glacier actually does today.
2. **Latest explicit Sprint 16 decisions in the current planning conversation** — authoritative for the new Sprint 16 scope.
3. **This baseline document** — reconciles those decisions against the repository and should be used as the working control document.
4. **Version-controlled architecture/docs** — authoritative unless superseded by a newly agreed Sprint 16 decision that has not yet been committed.
5. **Sprint 15 handover** — authoritative for Sprint 15 closeout state and operational verification.
6. **Earlier planning handover** — historical context only where superseded by later decisions.

Important correction:
The previously generated `PROJECT_GLACIER_SPRINT_16_PLANNING_CHAT_HANDOVER.md` still describes the Event Setup Wizard waiver step as required. That was subsequently revised by the user.

**Current decision: Waiver & Terms is a standard but OPTIONAL Event Setup Wizard step.**

An Event may be valid with no waiver. If an organiser chooses to create a waiver, Glacier then enforces the complete waiver generation / approval / publication workflow.

---

# 2. Verified Repository State

The user verified locally before creating the review archive:

- working tree: clean
- branch: `main`
- HEAD: `ff456bd1a4aba7548bad2ec57a47914fb3524975`
- `origin/main` points to `ff456bd`
- previous commit: `bfd78c9` — Sprint 15 Stripe feature delivery

Recent Git history:

- `ff456bd` — chore: finalise Sprint 15 documentation and test baseline
- `bfd78c9` — feat: complete Sprint 15 Stripe payments
- `638c77e` — Document security privacy and storage roadmap
- `5a98d2f` — Document Sprint 14 customer booking flow
- `39caf23` — Complete Sprint 14 customer booking flow
- `54cacf0` — Document Sprint 13 session management
- `28eac38` — Complete Sprint 13 session management and exceptions
- `93b4ae9` — Complete Sprint 12 documentation
- `a1e3248` — Document Sprint 12 operational scheduling
- `d3495bb` — Complete Sprint 12 operational schedule builder
- `e7ffea7` — Add operational schedule generation and conflict protection
- `dc086ec` — Sprint 11: Complete Event Workspace foundation
- `604502a` — Sprint 10: Complete booking validation and reservation lifecycle
- `9ee5bc7` — Build Glacier backend foundation
- `7076592` — Add initial project documentation

No Sprint 16 code has been committed or started.

---

# 3. Repository Structure — Current Reality

Current tracked applications:

- `apps/api` — NestJS API
- `apps/web` — Next.js web application

Current documentation:

- `docs/architecture`
- `docs/business`
- `docs/decisions`
- `docs/operations`
- `docs/releases`
- `docs/roadmap`
- `docs/sprint-notes`

Important correction to older project descriptions:

- there is **no current tracked `apps/admin`**
- there is **no current tracked `apps/staff`**
- there is **no current tracked shared `packages/*` application structure**

These may remain future architectural directions, but they do not exist on `main` today.

---

# 4. Current Technology Stack

## API

- NestJS 11
- TypeScript
- Prisma 7.9.x
- PostgreSQL
- Passport / JWT
- bcrypt
- Stripe Node SDK 22.5.0
- `qrcode`
- `date-fns-tz`
- Nest Schedule

## Web

- Next.js 16.3
- React 19
- TypeScript
- Tailwind
- Stripe.js / React Stripe.js
- React Hook Form
- Zod
- TanStack React Query installed
- `date-fns-tz`

Current local architecture in docs:
- API: localhost:3000
- Web: localhost:3001

---

# 5. Prisma / Data Model Baseline

The current Prisma schema contains 21 models:

1. Organization
2. User
3. UserOrganization
4. Event
5. OperationalSchedule
6. Session
7. Category
8. Product
9. ProductVariant
10. SessionProduct
11. TicketType
12. Customer
13. Booking
14. BookingItem
15. BookingParticipant
16. BookingProduct
17. Payment
18. PaymentRefund
19. EventUser
20. Ticket
21. Rule

Current Prisma enums:

- `PaymentRefundStatus`
- `TicketStatus`
- `PaymentStatus`

There are 23 applied migration directories in the repository.

## Organization today

Current fields are only:

- `id`
- `name`
- `slug`
- `status`
- `createdAt`
- `updatedAt`

Relations:
- Events
- UserOrganization memberships

There is currently **no** structured:
- legal name
- trading name
- ABN
- business address
- contact profile
- waiver configuration

## Event today

Current fields:

- `id`
- `name`
- `slug`
- `description`
- `startDate`
- `endDate`
- `timezone`
- `status`
- `organizationId`
- timestamps

Relations:
- team
- Ticket Types
- Sessions
- Operational Schedules
- Categories
- Products
- Bookings
- Rules

There is currently **no** structured:
- venue name
- street address
- suburb
- postcode
- State/Territory/jurisdiction
- activity type
- waiver relation/configuration

## Booking / Payment / Ticket

Current Booking includes:
- Booking number
- status
- Decimal total
- flexible booking flag
- Customer / Event / optional Session
- Booking Items
- Participants
- Products
- Tickets
- Payments
- reservation timestamps
- payment summary status
- public access token hash

Payment:
- historical provider attempt records
- amount/currency
- provider reference
- idempotency key
- state timestamps
- refund relation

PaymentRefund:
- historical refund records
- independent state
- provider/idempotency references

Ticket:
- unique Ticket number
- high-entropy secure token
- Ticket status
- Booking
- unique Participant relation
- issuedAt / checkedInAt

---

# 6. API Module Baseline

The API currently imports modules for:

- Auth
- Organization
- User
- Event
- Ticket Type
- Customer
- Booking
- Session
- Category
- Product
- Product Variant
- Session Product
- Rule
- Payment
- Ticket
- Booking Validation
- Operational Schedule
- Public Booking
- Prisma
- Schedule
- Config

There is no Waiver module yet.

---

# 7. Authentication and Tenant Architecture

## Current JWT model

Login:
- normalises email
- verifies bcrypt password
- checks `isActive`
- loads Organisation memberships
- selects the first Organisation membership
- signs JWT

JWT claims:
- `sub`
- `email`
- `role`
- `organizationId`

Known existing limitation:
A multi-Organisation user currently receives the first Organisation membership; there is no active-Organisation selector yet.

## Strong protected pattern

Newer modules such as Event, Session, Product, Product Variant and Session Product use:

JWT Guard
→ Roles Guard
→ `@CurrentUser()`
→ trusted `organizationId`
→ service query scoped through Organisation relationship

This is the pattern Sprint 16 must follow for internal/operator Waiver administration.

---

# 8. Confirmed Security Debt

The current codebase contains two generations of API security.

## Properly protected newer operator surfaces include

- Event
- Session
- Product
- Product Variant
- Session Product
- Operational Schedule

## Legacy/unprotected or broadly exposed surfaces include

- Organization
- User
- Booking
- Customer
- Category
- Ticket Type
- Rule
- Rule Evaluation
- Ticket
- general Payment creation endpoint

Important examples:

### Organization

Current `OrganizationController` has no guard and exposes:
- list all Organisations
- create Organisation
- add User to Organisation

`findAll()` includes Events and Organisation Users.

### Booking

Current general Booking controller has no guard:
- list all Bookings
- retrieve Booking by ID
- create Booking

Its service reads are not tenant-scoped.

### Ticket

Current Ticket controller has no guard:
- token lookup
- validation
- scan/check-in mutation
- QR generation by Ticket ID
- Ticket retrieval by ID

Ticket `getTicketById` / token lookup includes participant, customer, Event and Session data.

### Rule

Current Rule CRUD controller is unguarded and its service is not tenant-scoped.

## Baseline security conclusion

This is known **pre-existing technical/security debt**.

Sprint 16 must not broaden the problem.

New Waiver operator endpoints must use the newer protected pattern.

A deliberate API boundary / multi-tenant hardening workstream is required before live pilot.

---

# 9. Input Validation Baseline

`class-validator` and `class-transformer` are installed and some DTOs exist.

However, current `main.ts`:

- creates Nest app with `rawBody: true` for Stripe
- enables CORS for localhost:3001
- listens on configured/default port

It does **not** currently install a global Nest `ValidationPipe`.

Sprint 16 introduces a new unauthenticated public submission surface with signature and minor data, so validation policy must be explicit before that endpoint is considered complete.

This does not require a whole-platform validation rewrite, but the new Waiver boundary must be authoritative and strongly validated.

---

# 10. Booking Engine Baseline

Current Booking architecture is materially developed.

The Booking flow:

- validates Customer
- validates Event active state
- validates Session and Event relationship
- validates Session status / sales window
- validates selected Products
- validates Session Products
- validates quantity / inventory / product status
- evaluates active Event rules for each participant
- consolidates rule-driven required products
- validates Ticket Types against Event
- calculates Session occupied capacity
- validates required Product availability
- calculates server-side totals
- creates reservation and related records

Backend Rule Engine remains authoritative.

## Capacity concurrency technical debt

Current Booking creation calculates:
current occupied quantity
→ remaining capacity
→ creates Booking

There is no clear transactional/locking strategy protecting that read-then-create decision against simultaneous requests.

This is not Sprint 16 scope, but requires pre-pilot review.

---

# 11. Rule Engine Baseline

Rule data is Event-owned and JSON-configured.

Rule Engine supports conditions including:

- EQUALS
- NOT_EQUALS
- GREATER_THAN
- GREATER_THAN_OR_EQUAL
- LESS_THAN
- LESS_THAN_OR_EQUAL
- IN
- NOT_IN
- CONTAINS
- NOT_CONTAINS
- EXISTS
- NOT_EXISTS

Actions currently include:

- REQUIRE_PRODUCT
- BLOCK_BOOKING
- WARNING

Booking evaluates rules per Participant and includes Booking-level Ticket Type context.

Current ice-rink Booking logic from Sprint 14 includes:
- Adult
- Child
- Young Child (3–5)
- under-3 prohibition
- Young Child Kanga requirement
- Adult accompaniment rule

---

# 12. Operational Schedule / Session Baseline

Operational Schedule Builder supports:

- DAILY
- WEEKDAY_WEEKEND
- SELECTED_DAYS
- MANUAL

It generates Sessions transactionally and preserves schedule provenance.

Session architecture includes:

- Event-local time / UTC persistence
- IANA Event timezone
- individual Session editing
- overlap protection
- capacity protection
- schedule exception tracking
- dedicated cancellation
- deletion protection

Generated Session exception states:
- NONE
- MODIFIED
- CANCELLED

This architecture is mature and not part of Sprint 16 unless the Event Setup Wizard needs to link into existing Event setup navigation.

---

# 13. Payment Baseline — Sprint 15

Sprint 15 is considered closed and stable.

Core flow:

Reservation
→ Stripe PaymentIntent
→ Payment Element
→ signed Stripe webhook
→ persistent Payment state
→ eligible Booking confirmation
→ Ticket issuance

## Important invariants

- browser payment success is not authoritative fulfilment
- Booking total is server-authoritative
- Stripe provider state is separate from Booking state
- Payment attempts are historical
- retries use unique idempotency keys
- pending provider Payments are cancelled after Booking expiry
- provider cleanup failure does not stop Booking expiry
- late Stripe success after expiry produces automatic full refund
- expired Booking remains expired
- Tickets are not issued for the late-success/refund case

Sprint 16 must not change these behaviours.

---

# 14. Public Payment Security

Public payment creation requires:

- Booking ID
- correct high-entropy Booking public access token

The token is hashed in persistence.

The public client cannot supply the Stripe amount.

This is a good narrow-capability pattern, but Sprint 16 Waivers intentionally use a different operational model and do not require a Booking token.

---

# 15. Ticket Baseline

Ticket issuance:
- creates one Ticket per BookingParticipant without an existing Ticket
- uses high-entropy secure token
- duplicate participant Ticket issuance is protected

Ticket validation:
- ACTIVE → valid
- SCANNED → already scanned
- CANCELLED → invalid

Check-in mutation uses atomic `updateMany` on `status: ACTIVE` to protect duplicate scans.

QR generation:
- server-side `qrcode`
- PNG
- error correction H
- 512px
- margin 2

Sprint 16 may reuse the QR library/pattern for stable Event waiver URLs but should not refactor Ticket logic unnecessarily.

---

# 16. Web Application Baseline

Current web routes:

- `/`
- `/login`
- `/events`
- `/events/[eventId]`
- `/book/[eventId]`

There is no dedicated current:
- Admin app
- Staff app
- Event creation wizard route
- Waiver route

## Dashboard

Current `/` is a scaffolded Organisation dashboard with:
- static greeting/date
- Create new event button with no implemented workflow
- placeholder platform welcome panel

## Events list

`/events`:
- fetches Organisation-scoped Events through the protected Event API
- lists Event name/status/description/dates
- has a `Create event` button with no implemented action

## Event Workspace

`/events/[eventId]`:
- Overview
- Sessions
- Products
- Ticket Types
- Bookings
- Customers
- Website
- Reports
- Settings

Only Overview and Sessions currently render real workspaces.
Other tabs are placeholders.

There is currently no Waivers tab.

## Frontend architecture

Documented standard:
Page
→ Hook
→ Service
→ shared API client
→ Nest API

This pattern should be followed by Sprint 16.

## Authentication

API client:
- reads JWT from localStorage
- sends Bearer token
- on 401 removes local session and redirects to `/login`

Login page currently hard-codes API URL `http://localhost:3000` rather than using the shared API abstraction/environment value.

This is existing technical debt, not Sprint 16 scope unless touched by the new flow.

---

# 17. Public Booking UI Baseline

The public booking route is currently approximately 1,879 lines in a single client page.

It covers:
- Event
- Session
- Ticket selection
- Participant capture
- rule preview
- Add-ons
- Customer details
- Review
- reservation
- countdown
- Stripe Payment Element
- Booking confirmation

The current payment-confirmed section displays:
- Payment confirmed
- Booking confirmed
- Tickets issued
- Payment reference

There is a clean place immediately after this success content for Sprint 16's optional waiver call-to-action.

Important design decision:
Do not further monolithically embed the whole Waiver form in this Booking page.

The Booking page should only link to the independent public Event Waiver.

---

# 18. Automated Test Baseline

Static review of the committed test suite confirms:

- 45 API `*.spec.ts` files
- exactly 236 Jest `it()` / `test()` calls

This matches the Sprint 15 closeout report:
- 45 / 45 suites passed
- 236 / 236 tests passed
- API build passed

Largest substantive suites include:
- Operational Schedule
- Booking Validation
- Session
- Payment
- Booking
- Public Booking
- Stripe provider
- Webhook
- Refund / cancellation

A number of older controller/service specs remain harness-only with one `should be defined` test.

Current Event specs are examples of harness-only tests.

There are currently **zero web unit/spec test files** in the repository.

Sprint 16 should add meaningful API tests for the Waiver domain and perform real browser/manual verification for the web path.

---

# 19. Documentation Baseline

The structured `/docs` tree is the strongest project documentation and is explicitly designated the version-controlled source of truth.

Important current documents:

- `PROJECT_PRINCIPLES.md`
- `PRODUCT_ROADMAP.md`
- `CHANGELOG.md`
- architecture docs
- ADRs
- Sprint notes 10–15
- operations docs
- security/privacy docs
- file/media storage docs

## Documentation hygiene debt

Root `README.md` still says:
- Version: Sprint 1 - Foundation
- lists Waivers as though part of core modules
- lists Docker though current tracked application structure does not demonstrate a completed production container architecture

This root README is stale relative to `/docs`.

ADR numbering also contains multiple `ADR-001-*` files.

These are documentation-hygiene issues, not Sprint 16 feature scope.

---

# 20. Roadmap Baseline and Scope Conflict to Control

Current `PRODUCT_ROADMAP.md` correctly says:

`Current → Sprint 16 — Scope to be defined during Sprint planning.`

That is now stale because Sprint 16 planning has been completed in chat but has not yet been committed.

The Roadmap's broad **Waiver Phase Requirements** include:

- existing waiver wording review
- guardian/minor handling
- privacy wording
- optional consent separation
- versioning
- digital acceptance
- immutable evidence
- Booking / Participant linkage
- guardian relationship capture
- timestamp
- audit evidence
- reminder/resend
- QR/check-in waiver status
- retention/privacy/legal verification

This is a **broader future Waiver programme** than the agreed Sprint 16 scope.

To prevent scope creep:

**Sprint 16 intentionally does NOT deliver all items in the broad roadmap waiver list.**

Specifically deferred:
- mandatory Booking / Participant linkage
- guardian relationship enumeration
- reminder / resend workflow
- automatic check-in/scanner waiver state
- email/SMS invitation system
- Customer Portal integration

The roadmap should be updated during Sprint 16 documentation work to distinguish:
- Sprint 16 foundation
from
- later Waiver integration enhancements

---

# 21. Operational Waiver Baseline — Bathurst

The supplied Bathurst Ice Rink waiver currently combines:

- Ice Rink Terms & Conditions
- risk acknowledgement
- voluntary assumption of risk
- responsibility for personal fitness
- responsibility for children in care
- first-aid / medical treatment authority
- photo/video/sound consent
- conditions of sale
- conditions of admission
- recreational-services liability wording
- rink safety rules
- weather/refund provisions
- competition/promotion provisions
- signed acceptance statement

Acceptance section includes:
- explicit acceptance declaration
- signatory name
- date
- drawn signature
- up to five minors
- each minor name + DOB

Operational pattern:
one adult signatory
→ signs for themselves
→ may include minors in their care

Glacier should preserve this operating concept while removing the arbitrary five-minor limit.

---

# 22. Bathurst / Glacier Rule Discrepancy

Bathurst legal/operational wording currently says:
- under 10 helmet required
- under 7 must be accompanied on ice by adult
- under 3 not permitted

Current Glacier booking rules use:
- under 10 helmet
- under 5 adult accompaniment
- ages 3–5 Kanga requirement
- under 3 prohibited

This has not been resolved.

Sprint 16 must not silently alter the Rule Engine or legal template to force a match.

Control principle:

**Approved waiver text and Booking Rule Engine are separate authoritative domains.**

The operational/legal rule discrepancy requires explicit business/legal confirmation later.

---

# 23. FINAL LOCKED SPRINT 16 OBJECTIVE

## Sprint 16 — Event Waivers & Digital Acceptance

Deliver a Glacier-native Event-based digital waiver capability that:

- works independently of ticket purchasing channel
- can be opened from a stable public Event URL / venue QR
- requires no Booking, Ticket, Customer account, or email
- allows each adult to complete their own acceptance
- allows a responsible adult to include multiple minors in their care
- captures explicit acceptance and electronic signature
- persists immutable evidence against the exact published Event waiver version
- supports tenant-safe operator retrieval
- offers online purchasers an optional post-purchase shortcut to the same Event waiver
- supports a future Digital Waiver Pass / Wallet proof model

---

# 24. FINAL Event Setup Wizard Decision — OPTIONAL

This is the most important correction to the earlier Sprint 16 planning handover.

## Platform rule

`Waiver & Terms` is a standard **optional** Event Setup Wizard page.

The organiser may choose:

- `Create waiver`
or
- `Skip — not required for this event`

A Glacier Event can exist and be published without a Waiver.

This protects Glacier's wider use beyond ice skating and avoids forcing irrelevant legal workflows on future Organisations.

## If skipped

- no EventWaiver is required
- Event setup proceeds normally
- online Booking shows no waiver CTA
- no public waiver URL/QR is active

## If enabled

The Waiver workflow becomes internally strict:

- Event jurisdiction / State is known
- appropriate approved template is selected
- Organisation/Event details are substituted
- organiser previews the generated document
- authorised organiser approves/publishes
- published Event-specific version is immutable
- stable public URL/QR becomes active

Avoid ambiguous half-configured active waivers.

## Ice Rinks Australia

Operationally, Ice Rinks Australia can choose to create a waiver for every relevant skating Event without making that a universal Glacier platform requirement.

A future Organisation-level default/recommendation policy may be added later if useful.

---

# 25. Sprint 16 Event Setup / Template Concept

Future Event creation flow should introduce a proper Event Wizard; one does not exist today.

Likely conceptual flow:

`/events`
→ `Create event`
→ `/events/new`

Wizard may include:
- Event details
- dates/timezone
- venue/address
- sessions/products/rules setup as appropriate
- Waiver & Terms — OPTIONAL
- review

The existing Event Workspace remains the operational centre after creation.

A Waivers tab can later be added to `/events/[eventId]` for:
- review
- public QR/link
- submissions
- version history / management

Exact wizard step order should be implemented consistently with existing Event/Session workflows rather than forcing every existing module into a single large Sprint 16 UI rewrite.

---

# 26. State / Jurisdiction Template Decision

Glacier should not dynamically invent legal wording.

Use approved State/Territory-specific templates.

Initial activity family:
- Ice Skating

Conceptual template set:
- ICE_SKATING_NSW
- ICE_SKATING_VIC
- ICE_SKATING_QLD
- ICE_SKATING_SA
- ICE_SKATING_WA
- ICE_SKATING_TAS
- ICE_SKATING_ACT
- ICE_SKATING_NT

Templates should contain pre-reviewed wording.

Glacier performs controlled substitution of structured variables such as:
- Event name
- venue
- Event address
- promoter/legal entity
- trading name
- ABN
- Event dates
- jurisdiction

Do not use AI/application logic to improvise production legal clauses.

---

# 27. Organisation / Event Data Needed for Sprint 16

Current models do not contain sufficient structured data.

Expected additive fields need final naming/design during implementation review.

## Organisation likely needs

- legal name
- trading name
- ABN
- business/contact address fields
- contact details where genuinely required

Fields should initially be nullable/backwards compatible unless a migration-safe onboarding strategy is defined.

## Event likely needs

- venue name
- structured address
- State/Territory / jurisdiction
- activity type or template category

Important modelling principle:

Do not casually conflate:
- Organisation postal address State
with
- Event legal jurisdiction

The Event jurisdiction is consequential because it selects the legal template.

---

# 28. Event Waiver Domain — Working Shape

Final Prisma design must be made against the actual current schema, but the agreed responsibilities are:

## Waiver Template Family
Reusable activity/legal template family.

## Jurisdiction Template Revision
Approved State/Territory-specific source wording and metadata.

## Event Waiver
Optional Event-level configuration with stable public slug.

## Event-specific Waiver Version
Rendered immutable document generated from:
jurisdiction template revision
+ Organisation data
+ Event data

## Waiver Submission
Immutable signatory acceptance evidence.

## Waiver Minor
Zero or more minors covered by the adult submission.

Important:
Presence/absence of EventWaiver is preferable to a redundant `waiverRequired` Boolean unless a richer future policy genuinely needs separate state.

---

# 29. Public Waiver Journey — Locked

Public waiver must be usable by:

- online Glacier purchaser
- adult friend whose Ticket was purchased by someone else
- walk-up / POS customer
- complimentary attendee
- promotional/prize attendee

No Booking lookup required.

No email required.

No customer account required.

Customer journey:

Event public waiver
→ approved current wording
→ explicit agreement
→ signatory full name
→ electronic signature
→ zero or more minors
→ submit
→ completion proof

---

# 30. Online Booking Integration — Locked

After normal Stripe-confirmed Booking success:

Current confirmation remains:
- Booking confirmed
- payment received
- Tickets issued

If the Event has an active published waiver, add a separate CTA card:

**Get ready for your session**

Each adult skater should complete their own waiver before going onto the ice. A responsible adult may include children in their care.

**Complete waiver now**

The link opens the same public Event waiver URL used by the venue QR.

It does NOT:
- link waiver to Booking
- mark Booking waiver-complete
- block Ticket issuance
- invite each Participant
- require waiver before payment

---

# 31. Signature / Evidence Decision

Current operational process uses a drawn signature.

Sprint 16 should initially retain an electronic signature experience.

The API must make:
- accepted version
- acceptedAt
- content integrity/hash
- signatory
- minors
- acceptance declaration
- verification credential

server-authoritative.

Completed evidence should not be silently overwritten.

Initial preference:
store compact structured signature evidence in PostgreSQL if practical.

Do not introduce object storage / signed PDF generation merely because it is possible.

If legal/operational requirements later require retained document files, use the documented File & Media Storage architecture.

---

# 32. Verification Credential / Wallet

Every completed Waiver Submission should be designed to support a high-entropy verification credential.

Use cases:
- completion screen
- future staff lookup
- verification QR
- Digital Waiver Pass
- Apple Wallet
- Google Wallet
- future scanner integration

The credential itself should not encode personal information.

## Digital Waiver Pass

Concept:
proof/receipt of a completed waiver.

It is not the authoritative legal record.

Glacier remains authoritative.

## Apple Wallet

Architecture support is part of Sprint 16 thinking.

Actual Apple Wallet implementation remains a **stretch goal** and must not block core Sprint completion.

---

# 33. Sprint 16 Core In-Scope

- Sprint 16 documentation / architecture update
- optional Event Setup Wizard Waiver step
- structured Event/Organisation data required for waiver generation
- activity/jurisdiction-aware template selection
- approved template revision model
- controlled variable substitution
- Event-specific draft generation
- organiser preview/approval
- immutable published version
- stable Event public waiver URL
- waiver QR generation
- mobile public waiver page
- explicit acceptance declaration
- signatory name
- electronic signature
- zero or more minors
- minor name + DOB
- server-authoritative timestamp/version/hash
- verification credential
- completion screen
- authenticated tenant-safe operator retrieval
- online Booking success CTA
- focused API tests
- real browser/mobile verification
- full API regression/build closeout
- web build
- documentation/changelog/roadmap update

---

# 34. Sprint 16 Explicitly Out of Scope

To prevent scope creep, do NOT introduce these merely because the broader roadmap mentions them:

- mandatory Booking linkage
- Ticket linkage
- BookingParticipant linkage
- Customer linkage
- email requirement
- participant-specific waiver invitations
- email reminder/resend workflow
- SMS reminders
- Customer Portal
- POS API integration
- automatic Ticket/waiver identity matching
- scanner admission blocking from waiver state
- full Staff Scanner redesign
- full Admin application
- CRM
- Reporting
- Memberships
- Gift Cards
- POS system
- Venue Management
- signed PDF generation unless proven necessary
- object storage unless proven necessary
- broad legacy-controller security refactor
- Booking capacity concurrency redesign
- Customer tenancy redesign
- broad status-enum migration
- root README/ADR cleanup except documentation directly touched by Sprint 16
- general AI legal-text generation

---

# 35. Sprint 16 Security Rules

New internal/operator Waiver endpoints:
- JWT authenticated
- Roles guarded where appropriate
- Organisation scope from trusted auth context
- cross-tenant access denied

New public Waiver endpoints:
- deliberately narrow
- active/published Event Waiver only
- draft versions never leak
- server chooses active WaiverVersion
- client cannot set authoritative acceptance timestamp
- client cannot set authoritative content hash
- payload sizes bounded
- signature input validated
- minor data validated
- verification tokens high entropy
- submission list/search never exposed publicly
- public verification response privacy-minimised

---

# 36. Sprint 16 Test Control

The current 45/236 API baseline must remain green.

Sprint 16 tests should include:

## Template / Version
- tenant ownership
- correct jurisdiction selection
- publication
- immutability
- provenance
- historical version preservation

## Event Waiver
- optional/no waiver state works
- enabled waiver resolves correct template
- stable public slug
- inactive/draft not public
- address/jurisdiction validation where implemented

## Public Retrieval
- no auth required
- only active published data
- no draft/internal leakage
- no arbitrary version selection

## Submission
- adult valid
- explicit acceptance required
- name required
- signature required
- server timestamp
- zero/minultiple minors
- >5 minors supported
- DOB validation
- signature/payload limits
- atomic persistence
- immutable version association

## Operator
- auth required
- tenant scoped
- cross-tenant denied

## Online Booking Regression
- Stripe flow unchanged
- Ticket issuance unchanged
- waiver CTA conditional on active Event waiver
- no waiver Event still books normally

---

# 37. Real-World Sprint 16 Acceptance Scenarios

## A. Online purchaser

- Event has published waiver
- normal Booking
- Stripe sandbox payment
- Booking confirmed
- Tickets issued
- confirmation shows waiver CTA
- CTA opens Event public waiver
- adult signs + minors
- submission persists against exact version
- confirmation/verifier works

## B. No Booking / POS-equivalent

- open Event waiver URL directly
- no Booking
- no Ticket
- no email
- sign
- submit
- persist
- operator can find record

Scenario B is essential because it proves the architecture remains purchase-channel independent.

## C. Event without waiver

- create/configure Event
- skip Waiver step
- Event remains usable/publishable
- public Booking flow works
- no waiver CTA displayed
- no public waiver falsely implied

This scenario is now essential because the latest product decision makes Waivers optional.

---

# 38. Definition of Done — Revised

Sprint 16 is complete when:

1. An Event may validly have no waiver.
2. If an Event has a Waiver, the configuration/publish path is complete and internally consistent.
3. Published Event Waiver versions are immutable.
4. Stable public URL / QR resolves the current approved version.
5. Public waiver works with no Booking/Ticket/account/email.
6. Adult can accept for self.
7. Responsible adult can include multiple minors.
8. Explicit acceptance and electronic signature are captured.
9. Glacier retains authoritative immutable acceptance evidence.
10. Operator retrieval is authenticated and tenant-safe.
11. Online Booking success optionally links to the Event waiver without changing payment/Ticket authority.
12. 45 existing API suites remain green plus new Sprint 16 suites.
13. API production build passes.
14. Web build passes.
15. real online and no-Booking flows are verified.
16. documentation is updated so chat is no longer the only place the Sprint 16 decisions exist.
17. Apple Wallet is optional/stretch and does not determine Sprint success.

---

# 39. Recommended Implementation Sequence

## Phase 0 — Commit the Sprint 16 contract to docs
Before material feature code:
- create `docs/sprint-notes/sprint-16.md`
- update Product Roadmap current section
- record optional Event Wizard decision
- distinguish Sprint 16 foundation from future broader Waiver integration
- record Bathurst rule discrepancy
- record Wallet stretch

## Phase 1 — Final exact schema/API design
Use current repository fields to finalise:
- Organisation legal profile additions
- Event venue/jurisdiction/activity additions
- Waiver models/enums/relations

Do not create redundant required-waiver state if absence/presence of EventWaiver is enough.

## Phase 2 — Migration and core domain
- additive Prisma migration
- template/version/event waiver model
- generation/provenance/hash
- tests

## Phase 3 — Operator administration
- safe Organisation profile update path
- optional Event wizard / Event creation path
- template selection
- preview/publish
- QR/link
- tenant-safe Waiver workspace

## Phase 4 — Public Waiver API
- retrieve current public waiver
- submit acceptance
- minors
- signature
- verification credential
- security/validation tests

## Phase 5 — Public Waiver web
- mobile-first page
- signature canvas
- minors
- confirmation

## Phase 6 — Booking success CTA
- conditional Event waiver link only

## Phase 7 — Verification / Wallet stretch
- completion QR / verification
- Apple Wallet only if core remains contained

## Phase 8 — Regression / closeout
- focused tests
- full API suite
- builds
- Stripe booking regression
- direct/no-Booking waiver scenario
- Event-without-waiver scenario
- docs/changelog/roadmap
- clean Git closeout

---

# 40. Near-Term Technical Debt / Future Work — Do Not Lose

These are now explicitly recorded so they do not get accidentally pulled into Sprint 16 or forgotten:

1. Legacy API authentication / tenant isolation hardening
2. Ticket scan/check-in staff authorisation
3. Global/public input validation policy
4. Booking capacity concurrency
5. Customer identity/Organisation ownership model
6. Public booking UI decomposition
7. production CORS/environment configuration
8. rate limiting / abuse controls
9. audit logging
10. MFA / privileged-user hardening
11. data retention / deletion framework
12. file/media object storage when actually required
13. pre-pilot Security & Privacy Gate
14. root README / ADR numbering hygiene
15. multi-Organisation active-context flow
16. broader Waiver future items: reminders, Ticket linkage, scanner status, customer portal integration

---

# 41. Scope-Drift Guardrails

During Sprint 16, any proposed change should be checked against these questions:

1. Is it required for the agreed Event-centric waiver foundation?
2. Does it preserve the ability to submit a waiver without a Booking?
3. Does it preserve Event-without-waiver as a valid state?
4. Does it preserve Sprint 15 payment/Ticket authority?
5. Is it reusing current Glacier architecture rather than inventing a duplicate?
6. Is it a pre-existing technical-debt item that should be deferred?
7. Does it accidentally implement one of the explicitly deferred roadmap items?
8. Does it introduce infrastructure (object storage, PDF generation, email/SMS, Wallet) before it is actually required?
9. Is the backend authoritative for security, tenant scope and evidence?
10. Will the decision be committed to docs rather than existing only in chat?

If the answer indicates scope expansion, pause and explicitly agree the change before implementation.

---

# 42. Final Reconciliation Result

## Nothing material has been lost from Sprint 15

The repository snapshot exactly matches the expected Sprint 15 closeout commit.

The source tree confirms:
- Stripe/payment architecture delivered
- Payment/PaymentRefund models present
- public Booking payment token present
- BookingReservationService active
- Ticket issuance/scanning present
- Sprint 14 public booking flow present
- Sessions / Operational Schedule architecture present
- documentation updates present
- 45 spec files / 236 test declarations present

## The main redirection discovered is documentation/planning drift, not code drift

Two specific stale statements must not control Sprint 16:

1. The broad Product Roadmap Waiver list includes future Booking/Participant linkage, reminders and scanner integration. These are not all Sprint 16 requirements.
2. The earlier Sprint 16 planning handover says the Event Wizard waiver step is required. The latest agreed decision supersedes it: the step is optional.

## Current authoritative Sprint 16 direction

**Event-centric, optional, purchase-channel-independent digital waivers with approved jurisdiction templates, Event-specific immutable versions, public QR/mobile acceptance, operator retrieval, optional online Booking shortcut, and future-proof verification/Wallet support.**

This baseline should be treated as the control document until Sprint 16 decisions are committed into the repository.
