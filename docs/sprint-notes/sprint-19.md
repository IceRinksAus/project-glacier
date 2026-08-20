# Sprint 19 — Organiser Event Creation & Setup

## Status

Implementation-complete and locally verified on 20 August 2026. No deployment was performed.

## Outcome

Sprint 19 turns the existing Event, Session, Ticket Type, Product, Rule and Waiver foundations into a connected organiser setup journey. An authenticated OWNER can create a correctly scoped DRAFT Event, see truthful readiness, enter each specialist setup area, and activate only after the server confirms the required booking foundations.

The Sprint also completes the Product continuation agreed during implementation: organisers can configure Products without changing Glacier's established admission, equipment and merchandise capacity models.

## Event Creation and Readiness

The Event creation experience now provides six guided steps:

1. Event identity and stable public slug.
2. dates and an approved Australian IANA timezone.
3. venue and Australian address details.
4. jurisdiction and activity type.
5. configurable gate-entry opening and closing windows.
6. review and single DRAFT Event creation.

The API remains authoritative for tenant identity, slug uniqueness, bounded inputs, valid date ordering and Event status. The Event Workspace reads readiness from current persisted relationships rather than a decorative client percentage.

Required readiness covers Event details, at least one eligible active Session and at least one active Ticket Type. Waiver readiness is conditional: no EventWaiver means `NOT REQUIRED`; once configured, a current published version is required. Products remain optional for Event activation.

An OWNER may activate only when a fresh server-side readiness evaluation succeeds. MEMBER access remains read-only, and SCANNER has no Event administration authority.

## Connected Specialist Setup

The initial Event wizard deliberately remains focused on the Event foundation. It does not duplicate the mature specialist builders.

After creation, readiness destinations connect the organiser to:

- Sessions and the operational schedule;
- Ticket Types;
- Products;
- optional Waiver generation and publication;
- final readiness review and activation.

The Event navigation orders Ticket Types before Products, matching the normal setup dependency: define admission choices first, then configure optional or rule-driven Products against them.

This is one guided journey through durable Workspace tools, not one oversized form. Later UX Sprints may improve visual polish and transitions without weakening server authority or changing the underlying models.

## Locked Capacity Model

### Admission

Session capacity is the shared rink admission limit. Adult, Child and other Ticket Types are categories and prices within that same pool. A Session with capacity 150 may therefore sell any valid combination totalling 150 participants. Ticket Types do not own separate capacity.

### Reusable equipment

Kangas and similar hire equipment use Product capacity, separate from admission. A Product supplies the default reusable quantity and a SessionProduct may provide a Session-specific override. RESERVED and CONFIRMED BookingProduct quantities hold that selected Session's pool. Expired or cancelled reservations release it.

### Merchandise

Finite merchandise uses global Product Variant inventory. Small and Large hoodies retain independent quantities, optional price overrides and availability. Exhausting one size does not hide an available size. Variant inventory is held by RESERVED and CONFIRMED bookings and released by inactive reservation states.

### Unlimited extras

Products without inventory tracking or Product capacity remain unlimited, subject to their normal status, channel and Session assignment rules.

## Guided Product Setup

The Event Products tab now provides a four-step OWNER workflow:

1. enter Product identity, stable slug, description and price;
2. choose Unlimited, Reusable per Session, or Finite Variant inventory;
3. choose the active Sessions where the Product is available;
4. review and optionally apply Ticket Type requirements where the Product is unambiguous.

For Event-wide Products such as Kangas, **Apply to all active Sessions** selects the complete current Session schedule in one action. Organisers can clear or adjust individual Sessions before creation. Persistence runs in controlled batches of ten assignments so a schedule containing hundreds of Sessions does not launch hundreds of simultaneous requests.

The workflow creates a DRAFT Product first, then configures Variants, Session assignments and any requirement Rule before activation. If a later request fails, the partial Product remains safely DRAFT and is not publicly selectable.

Ticket Type requirements use the established server-side `REQUIRE_PRODUCT` action and stable Product slug. One unit is required per matching participant. Finite Variant merchandise cannot be configured as a Ticket Type requirement in this workflow because customers must choose their own size or option; this prevents an ambiguous parent Product requirement.

Product activation requires:

- tenant ownership through the Product's Event;
- at least one active SessionProduct assignment for online non-admission Products;
- at least one usable active, online Variant when the Product has Variants.

## Booking and Availability Protection

Public Product discovery returns only active, online Products assigned to the selected Session. Capacity-controlled Products and finite Variants expose remaining quantity and are omitted when exhausted.

Reservation creation performs a fresh check inside a serializable database transaction. It protects:

- shared Session admission capacity;
- per-Session reusable Product capacity, including overrides;
- global Product inventory;
- global Product Variant inventory;
- valid active Product-to-Session assignment;
- active online Variant ownership and price snapshotting;
- current Rule Engine minimum quantities.

Serializable conflicts are retried. This closes the race where two simultaneous customers could both observe the same final unit before either reservation committed.

## Persistence Change

Migration `20260820094000_add_booking_product_variant` adds nullable `BookingProduct.productVariantId` and its Product Variant relationship. Nullable storage preserves existing non-Variant BookingProducts and Kanga behaviour.

The migration was applied to the local development database and the generated Prisma client was refreshed.

## Security and Tenant Boundaries

- OWNER is required for Event, Ticket Type, Product, Product Variant, SessionProduct, Rule and activation mutations.
- MEMBER can view the relevant operator state but cannot mutate it.
- SCANNER remains isolated from ordinary administration routes.
- Organisation scope comes from the authenticated JWT and authoritative Event relationships.
- Product activation performs a tenant-filtered lookup and returns Not Found outside the caller's Organisation.
- cross-Event Session/Product relationships continue to fail closed.
- public discovery remains read-only and minimised to booking-relevant fields.

## Automated Verification

- API: 58 of 58 suites passed; 378 of 378 tests passed.
- Web: 9 of 9 suites passed; 38 of 38 tests passed.
- API production build: passed.
- Web production build: passed with the webpack compiler. The default Turbopack attempt was blocked by the desktop sandbox's internal port restriction, not by source compilation; webpack completed compilation, TypeScript, static page generation and trace collection.
- Focused Product workspace lint: passed.
- Original 45-suite / 236-test baseline: preserved.

Behavioural coverage includes Event DTO bounds, tenant safety, readiness and activation; OWNER/MEMBER UI boundaries; shared Session capacity; required Kanga quantities; concurrent Product availability; Variant ownership, price and inventory; exhausted public availability; and guided Product setup.

## Dependency Audit

- Web production dependencies: zero known vulnerabilities.
- API production audit: four high-severity findings from the same `deepmerge-ts` stack-exhaustion advisory inherited through Prisma's dependency chain. npm reports no fix available. No application-owned merge of recursive untrusted object graphs was introduced in this Sprint. The finding remains a monitored upstream dependency risk and must be reassessed when Prisma publishes a compatible fix.

## Browser Acceptance

Browser acceptance passed against an isolated production preview and the current local development database:

- authenticated OWNER opened the Event Products workspace;
- the catalogue clearly stated that Products do not consume rink admission capacity;
- a fictional reusable Kanga Product was created with capacity 20, assigned to one active Session, required for the Young Child Ticket Type and activated;
- the operator catalogue reported the Product as ACTIVE, Per-Session capacity and assigned to one Session;
- public booking with one Adult and one Young Child applied the new Product at minimum quantity one, prevented removal below the minimum and displayed 20 remaining;
- the pre-existing Kanga requirement continued to apply independently, confirming that the new rule did not replace established Event rules;
- a fictional hoodie Product was created with Small stock 50 at $50 and Large stock 40 at a $55 Variant price override;
- Variant merchandise remained intentionally unavailable for Ticket Type requirement selection;
- the public Add-ons step displayed Small and Large as separate choices with the correct independent remaining quantities and prices;
- an Adult-only booking displayed Products as optional and applied no participant-driven minimums;
- the Event Products workspace and public Add-ons page produced no browser console errors;
- the dashboard rendered coherently at the in-app browser's narrow desktop/tablet viewport, including horizontally scrollable Event tabs.

The browser run used fictional local acceptance records only and did not submit a customer Booking, payment or external communication.

## Deliberate Non-Goals

- no deployment;
- no customer booking visual redesign;
- no embedded Session or Product builders inside the Event foundation wizard;
- no raw Rule JSON editor;
- no separate Ticket Type capacity;
- no broad POS, reporting or customer-service workflow;
- no claim that the organiser UX has reached final visual polish.

## Remaining Pilot Gates

Sprint completion does not waive the cross-platform pilot gates already documented:

- physical iPhone Safari and Android Chrome Staff Scanner verification;
- deployment-edge rate limiting, alerting and abuse evidence;
- managed production secrets, TLS, logs, monitoring and backup/restore proof;
- password recovery, privileged-user MFA and granular Staff permissions;
- production-like tenant-isolation integration and independent security testing;
- final Waiver legal, privacy and retention review;
- monitoring and remediation of the Prisma `deepmerge-ts` advisory.

## Next Milestone

The next recommended Sprint is Customer Experience Productisation: public Event presentation and the booking journey. It should consume the authoritative Event, Session, Ticket Type, Product, Rule, availability and Waiver foundations completed here rather than redesigning them.

The next organiser UX planning pass should also separate setup from daily operation more clearly. **Create Event** should own the guided creation/setup journey. After creation, **Events** should primarily track the Organisation's current Event portfolio and each Event Workspace should prioritise operational status and daily management; configuration must remain accessible without dominating routine use. This is a documented future direction, not an implementation claim in Sprint 19.
