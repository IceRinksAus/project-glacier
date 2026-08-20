# Sprint 19 Plan — Organiser Event Creation & Setup

## Planning Status

Approved on 20 August 2026. Implementation may proceed within this locked scope.

## Recommendation

Sprint 19 should deliver the first pilot-grade Organiser productisation slice: an OWNER can create a correctly scoped draft Event through a guided wizard and continue through a truthful setup checklist without developer or database intervention.

Customer booking productisation should follow as its own milestone. Combining both organiser and customer redesign in one Sprint would obscure operational acceptance criteria and create unnecessary regression risk around the stable Booking and Payment engines.

## Objective

Replace the inactive `Create event` control and static readiness display with a coherent setup journey:

OWNER opens Events → Create event → complete guided Event foundation → review → create DRAFT Event → continue setup in Event Workspace → complete Sessions, Ticket Types and optional Waiver → activate only when required foundations are ready

The wizard creates the Event foundation. It does not recreate the mature schedule builder or place every Event operation inside one oversized form.

## Pilot Problem

Glacier currently has strong Event-related backend foundations but no usable Event creation experience:

- `Create event` has no action;
- the API create DTO accepts only name, slug, description, dates and gate offsets;
- timezone, venue, Australian jurisdiction and activity type cannot be supplied through Event creation;
- the Event readiness percentage is hard-coded;
- Products, Ticket Types and several Workspace tabs remain placeholders;
- Event status can currently move to ACTIVE without proving minimum booking foundations;
- organisers still need developer assistance to create and evaluate a usable Event.

Sprint 19 should close this exact gap without redesigning unrelated engines.

## Product Principles

### Draft first

New Events are always created as `DRAFT`. Creation does not make an Event public or bookable.

### One primary decision per step

Each wizard step has one coherent subject, visible progress, plain validation and clear Back/Continue actions. The final mutation occurs only from Review & Create.

### Server authority

The client may generate suggestions and show readiness, but the API owns tenant scope, slug uniqueness, date rules, bounded values and activation eligibility.

### Truthful progress

Readiness is calculated from authoritative Event relationships. Glacier must not display a decorative percentage or mark a task complete merely because its tab was opened.

### Optional means optional

Waiver remains a first-class optional choice. `No Waiver` is a valid Event configuration and does not block readiness.

### Resume through the Workspace

After Event creation, the Event Workspace is the durable setup home. The initial wizard does not need cross-device draft persistence before an Event exists.

### One connected setup journey

The Event foundation wizard remains deliberately focused and does not absorb the full Session, Ticket Type/Product or Waiver builders. Those capabilities remain dedicated Workspace tools because organisers need room to create, review and revisit them throughout the Event lifecycle.

The user experience must nevertheless be continuous:

- successful Event creation opens the new Event Workspace;
- authoritative readiness identifies the next incomplete foundation;
- each readiness item opens the relevant Session, Ticket Type/Product or Waiver destination;
- completing a foundation updates readiness from server state;
- OWNER activation becomes available only when every required and conditional item is complete.

This is the locked product direction for subsequent implementation. It avoids an oversized creation form without leaving organisers to discover disconnected setup screens.

### Progressive UX productisation

Sprint 19 establishes the safe, usable workflow and its authoritative state model; it is not the final visual treatment. Later productisation Sprints may refine layout, transitions, contextual guidance, responsive behaviour and consistency across the specialist builders. Those refinements must preserve the server-authoritative readiness and activation controls delivered here.

## Authorised Users

- OWNER may create Events, edit setup fields and activate an eligible Event.
- MEMBER may view Event details and readiness but may not create, change setup policy or activate.
- SCANNER has no Event creation, readiness or administration access.

The API remains authoritative even when the UI hides or disables unavailable actions.

## Wizard Steps

### 1. Event basics

Required:

- Event name
- public slug
- description optional

Behaviour:

- derive an editable lowercase slug suggestion from the name;
- allow only the existing bounded kebab-case format;
- explain that the slug forms a public Event address and should remain stable;
- reject a conflicting slug with a clear field-level message;
- do not expose another Organisation's Event data while checking conflicts.

Slug uniqueness remains global because the current Event schema and public routing require an unambiguous value.

### 2. Dates and timezone

Required:

- Event start date/time
- Event end date/time
- IANA timezone

Behaviour:

- default timezone to `Australia/Melbourne` for the current Australian pilot context;
- use an explicit approved Australian timezone list rather than browser-local inference;
- require end to be later than start;
- show the interpreted local date/time and timezone on Review;
- submit ISO timestamps and preserve the selected timezone separately.

Changing Event timezone after Sessions exist is out of scope until a safe migration workflow is designed.

### 3. Venue and activity

Required for creation:

- venue name
- address line 1
- suburb
- postcode
- Australian jurisdiction
- activity type

Optional:

- address line 2

Behaviour:

- country is fixed to `AU` in this pilot flow;
- jurisdiction uses the Prisma `AustralianJurisdiction` allowlist;
- activity uses the existing `EventActivityType` allowlist;
- inputs use the same bounded validation in browser and API;
- no external address lookup or geocoding is added in this Sprint.

### 4. Gate entry policy

Required:

- minutes before start that entry opens
- minutes after end that entry closes

Behaviour:

- prefill 30 and 0;
- accept whole minutes from 0 through 240;
- explain Session-linked versus Event-time calculation;
- reuse the Staff Scanner policy language and API constraints;
- allow later OWNER editing from Event Settings.

### 5. Waiver & terms

Required choice:

- No Waiver
- Configure a Waiver after Event creation

Behaviour:

- default to no implicit choice; OWNER must consciously select one;
- explain that No Waiver is valid and does not create an `EventWaiver`;
- if Waiver is selected, mark it as an explicit post-create setup task and route the organiser to the existing Waiver Workspace;
- do not generate or publish legal content automatically during Event creation;
- publication remains a separate OWNER review action under Sprint 16 authority.

The pre-create Waiver choice may be stored in the client only long enough to select the post-create destination. It is not legal evidence.

### 6. Review & create

Show:

- Event identity and slug
- local Event dates and timezone
- venue/address
- jurisdiction and activity
- entry policy
- Waiver choice

Behaviour:

- permit return to any earlier step;
- show one `Create draft Event` action;
- prevent duplicate submission while the request is active;
- handle field conflicts and network errors without losing entered values;
- on success, navigate to the new Event Workspace and its setup checklist;
- never activate or publish the Event as a side effect.

## Event Workspace Readiness

Replace the hard-coded 25% setup card with authoritative readiness items.

### Required activation items

1. Event details complete:
   - name and slug;
   - valid start/end and timezone;
   - required venue/address;
   - jurisdiction and activity type;
   - valid entry policy.
2. At least one ACTIVE Session exists within the Event dates.
3. At least one active Ticket Type exists with a valid non-negative price.

Session capacity is the authoritative shared admission limit across all Ticket Types. Adult, Child and other admission categories consume the same Session capacity in any combination. The legacy Ticket Type `capacity` field is not an activation requirement and is not presented as a rink limit; a future optional per-category sales limit must be introduced under a distinct name and explicit booking rule if required.

### Conditional item

4. Waiver:
   - `NOT REQUIRED` when No Waiver is selected/retained;
   - `INCOMPLETE` when an EventWaiver exists without a published version;
   - `COMPLETE` when it has a current published version.

The existing data model does not persist a separate `waiverRequired` boolean. In Sprint 19, absence of `EventWaiver` means `NOT REQUIRED`. Creating a Waiver makes publication a readiness requirement until it is removed through a future controlled flow or published.

### Informational items

- Products/categories may be shown as optional and do not block activation.
- Branding/Website remains future work and does not block this Sprint's DRAFT readiness.
- Bookings and Customers cannot exist before activation and are not setup tasks.

## Product Setup Continuation

Products remain optional for Event activation, but the Event Workspace should connect their existing catalogue, Session availability and Rule Engine relationships through one guided setup flow.

### Product versus admission capacity

- Session capacity is the shared rink admission limit across every Ticket Type.
- Ticket Types describe participant admission categories and pricing.
- Products describe non-admission extras such as Kanga skating aids, hire items, food or merchandise.
- Product inventory or product-specific capacity is independent of Session admission capacity and is enabled only when that extra requires its own operational limit.

### Optional and required Products

Assigning an active Product to a Session makes it available as an optional add-on for that Session. A Product becomes mandatory only through an active server-side Rule.

The guided builder must support the established Kanga pattern without exposing raw rule JSON:

1. create the Product as DRAFT;
2. select the Sessions where it is available;
3. optionally select one or more Ticket Types that require it;
4. express the requirement through the existing `REQUIRE_PRODUCT` action using the stable Product slug;
5. calculate one required unit per matching participant unless a future explicit quantity option is added;
6. review availability and requirements before Product activation.

For example, each Young Child Ticket may require one Kanga. Two matching participants therefore require a minimum of two Kangas, while customers may add more voluntarily. Public rule preview provides early guidance, but the Booking service remains authoritative and re-evaluates the same requirement before reservation creation.

Product setup must preserve tenant scope across Product, Session and Ticket Type relationships. Partial setup remains DRAFT and must not become publicly selectable. Raw condition/action editors and a general-purpose Rules redesign remain outside this Sprint.

Readiness response should include item identifiers, status, explanation and destination tab. The percentage, if retained, is derived from required and conditional items only.

## Activation Boundary

`PATCH /event/:id/status` must not activate an Event that fails required readiness.

When `status: ACTIVE` is requested, the service must transactionally or authoritatively re-evaluate:

- Event ownership;
- required Event details;
- date ordering and timezone;
- at least one eligible active Session;
- at least one active Ticket Type;
- Waiver publication only when an EventWaiver exists.

Failure returns a structured or clearly bounded list of missing setup items. The UI displays those items and does not imply activation.

Moving ACTIVE to INACTIVE remains an OWNER action. Deletion safety remains unchanged.

## API Changes

### Extend Event creation DTO

Add strict fields:

- `timezone`
- `venueName`
- `addressLine1`
- `addressLine2?`
- `suburb`
- `postcode`
- `country` fixed/allowed as `AU`
- `jurisdiction`
- `activityType`
- existing entry-policy fields

Retain trusted `organizationId` from JWT only. Do not accept status, Organisation or relationship collections from the body.

### Slug conflict handling

Creation should convert the Event unique constraint into a stable `409 Conflict` response. A separate availability endpoint is optional; if added, it must return only availability and must not disclose Event ownership or metadata.

Final creation must always recheck through the database constraint regardless of an earlier availability result.

### Readiness endpoint

Recommended route:

- `GET /event/:id/readiness`

Authority:

- JWT OWNER/MEMBER;
- Event → Organisation scope;
- SCANNER denied.

The endpoint returns setup state only, not Booking, Customer or financial data.

### Status activation

Keep the existing status route but add readiness enforcement and behavioural tests. Do not add a second competing activation endpoint.

## Web Changes

- connect `Create event` to a dedicated wizard route or dialog appropriate for desktop/tablet;
- use reusable field, step, error-summary and review patterns rather than one-off markup;
- preserve values when navigating Back or after a rejected submission;
- use accessible labels, field errors, focus movement and keyboard navigation;
- support tablet and desktop as the primary Organiser surfaces while remaining usable on mobile;
- replace static Event readiness with API-driven status and destinations;
- add an explicit activation action only for OWNER and only after readiness review;
- retain the existing Event Workspace navigation and dedicated Sessions/Waiver tools;
- progressively connect the dedicated Session and Ticket Type/Product builders to readiness destinations so setup feels like one guided journey.

Recommended routes:

- `/events/new`
- `/events/:eventId` for post-create setup

## Out of Scope

- customer Event-site redesign;
- public Booking step redesign;
- embedded Session, Operational Schedule or Ticket Type/Product builders inside the Event foundation wizard;
- complete Products, Categories or Ticket Types UI redesign;
- Booking/Customer service tools;
- POS/on-site sales;
- reporting and reconciliation;
- Event branding/media upload;
- address lookup, maps or geocoding;
- recurring Event templates or Event duplication;
- cross-device persistence of an uncreated wizard;
- automatic Waiver publication;
- per-Session scanner policy;
- deployment or production data mutation.

## Security and Privacy Controls

- OWNER-only Event creation and activation;
- trusted JWT Organisation scope;
- strict DTO allowlist and bounded strings;
- enum validation for jurisdiction and activity;
- safe ISO date parsing and server date-order validation;
- fixed/allowlisted timezone values;
- database-backed global slug uniqueness;
- no tenant data in slug conflict responses;
- no client-authoritative status or readiness;
- no automatic legal publication;
- no Customer, Participant or Payment data introduced to setup responses;
- CSRF exposure remains constrained by bearer-token API design, with broader session architecture unchanged;
- audit/monitoring of privileged Event activation remains a pre-pilot operational requirement.

## Testing and Verification

### API

- OWNER creation succeeds with complete valid input;
- MEMBER and SCANNER creation denied;
- caller-supplied Organisation/status/unknown fields rejected;
- cross-tenant Event readiness denied without disclosure;
- bounds and enum/date/timezone validation;
- end-after-start validation;
- slug collision returns conflict;
- defaults remain 30/0 when omitted at direct API boundary;
- readiness states for missing Session, Ticket Type and Waiver publication;
- No Waiver does not block activation;
- unpublished existing Waiver blocks activation;
- activation succeeds only when all required conditions are current;
- concurrent or stale UI state cannot bypass server readiness;
- existing tenant, scanner, Booking, Payment and Waiver regressions preserved.

### Web

- required field and step validation;
- slug suggestion and editable override;
- Back/Continue preserves values;
- Review shows correct timezone-local interpretation;
- single final submission and duplicate-click prevention;
- API conflict/network error preserves form;
- successful creation routes to the new Event;
- real readiness replaces decorative progress;
- MEMBER cannot see create/activate controls;
- accessible labels, error summary and keyboard step navigation.

### Browser

- OWNER creates a fictional DRAFT Event without developer intervention;
- Event appears in Organisation Event list;
- readiness accurately identifies missing Sessions and Ticket Types;
- adding existing supported foundations changes readiness;
- activation is blocked while incomplete;
- optional No Waiver state is represented correctly;
- tablet/desktop layout smoke;
- no deployment.

## Baseline

Sprint 19 begins from:

- 58 API suites and 351 API tests passing;
- 2 web suites and 12 web tests passing;
- API and web production builds passing;
- web npm audit reporting zero known vulnerabilities;
- clean synchronized `main` at `7626e2f`;
- original 45-suite / 236-test baseline preserved.

## Recommended Implementation Sequence

1. Approve and commit this Sprint contract.
2. Extend and test the strict Event creation boundary.
3. Add authoritative readiness calculation and activation enforcement.
4. Add the web Event creation service/types.
5. Build the accessible multi-step wizard and Review submission.
6. Connect the Events list action and successful routing.
7. Replace static readiness with authoritative Workspace guidance.
8. Add activation UX for eligible OWNERs.
9. Add API and web behavioural tests.
10. Run full regression, dependency audit and production builds.
11. Run fictional OWNER browser creation and readiness verification.
12. Update architecture, operations, endpoint register, roadmap, changelog and Sprint notes.

## Definition of Done

Sprint 19 is complete when an authenticated OWNER can create a fully described DRAFT Event through a coherent wizard without developer assistance; Glacier safely validates tenant scope, identity, dates/timezone, venue, jurisdiction/activity and gate policy; the Event Workspace reports authoritative setup readiness; optional No Waiver remains valid; and ACTIVE status cannot be granted until current server-side Event, Session, Ticket Type and conditional Waiver requirements are satisfied. MEMBER and SCANNER cannot mutate setup, stable Booking/Payment/Ticket/Waiver behaviour remains green, and no deployment occurs.

## Approved Scope Decision

Sprint 19 is **Organiser Event Creation & Setup**. Customer Experience Productisation remains the next separate milestone.

The approved continuation model is also locked: Event creation, Session setup, Ticket Type/Product setup, optional Waiver setup, readiness review and activation form one guided journey through the Event Workspace. The specialist builders remain separate from the six-step Event foundation wizard and are linked through contextual destinations and authoritative readiness state.

Visual and interaction polish will continue in later productisation Sprints. Sprint 19's interface is the functional pilot foundation, not a declaration that the organiser experience has reached its final design.
