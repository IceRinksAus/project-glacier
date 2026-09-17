# Sprint 37 Plan — Product Catalogue and Service Lookup

**Status:** Approved 17 September 2026 — implementation in progress

## Outcome

Make Products feel like a usable catalogue rather than a grouping tool, add
safe Product and Ticket Type presentation assets, and complete the operator
lookup surfaces needed to find recent Bookings and Customers quickly. Existing
commerce, capacity, inventory, Rules and access-control authorities remain
unchanged.

## Product decisions

- Product creation and management is the primary workspace. Customer-facing
  grouping and ordering becomes an optional secondary action.
- A Product may have one optional internally managed image. Organisers can
  upload, preview, replace or remove it; Glacier shows a consistent placeholder
  when no image exists.
- Product images use authorised Glacier file assets rather than arbitrary
  external URLs. The existing legacy `imageUrl` field is preserved for
  compatibility but is not the new upload authority.
- Ticket Types gain presentation metadata for a prominent tile: a short display
  label and validated colour. An optional internally managed image is supported,
  but text-and-colour tiles such as `ADULT` and `CHILD` remain the default.
- Images and colours are presentation only. They cannot change price,
  availability, Ticket entitlement, Rules, capacity or inventory.
- The supplied blue Kanga photograph is a design reference. Only an explicitly
  approved repository copy may become a seed/demo asset; automated tests use
  synthetic image fixtures.

## Slice 1 — Asset and presentation contracts

- Add Product-image and Ticket-Type-image purposes to the existing FileAsset
  authority, with explicit Product/Ticket Type ownership relations.
- Extend the existing PNG/JPEG signature, declared-type, dimension and 5 MB
  controls to catalogue images; reject malformed, mismatched or oversized
  content before storage.
- Require Organisation and Event ownership for upload, read, replacement and
  removal. OWNER controls mutation; authorised Event operators may read.
- Mark replaced assets non-current and remove replaced local objects using the
  existing privacy-safe cleanup pattern.
- Add Ticket Type tile label and colour fields with bounded validation and safe
  defaults. Add optional current asset references to Product and Ticket Type.
- Expose private organiser and public published-Event asset reads without
  leaking storage keys or allowing cross-tenant/Event access.
- Preserve local filesystem storage for local/test evidence. Managed production
  object storage, retention policy, malware scanning and delivery/CDN evidence
  remain deployment requirements.

## Slice 2 — Product-first organiser workspace

- Replace the current split emphasis with a clear catalogue header, search,
  status/availability filters and a prominent `Create Product` action.
- Present Products as useful cards or rows showing image/placeholder, name,
  price, active state, channel availability, stock/capacity model, Session
  coverage and any Ticket Type requirement.
- Move grouping/order into a secondary `Customer display` panel opened after
  Products exist; retain all current ordering behavior.
- Rework Product creation into a concise guided flow:
  1. details, price and optional image;
  2. availability/inventory model;
  3. Session availability;
  4. optional Ticket Type requirement and review.
- Present simple requirement automation explicitly as `Required for these Ticket
  Types`. Selecting Toddler for a Kanga creates or updates the linked active
  `PRODUCT_REQUIREMENT` Rule requiring one Kanga per matching participant.
- Show linked requirement evidence on the Product and make later edits update
  the owned Rule deterministically without duplicate or orphaned automation.
  Complex cross-Product or conditional logic remains in the dedicated Rules
  workspace.
- Provide upload preview, replace and remove controls with accessible labels,
  progress/error states and a stable fallback tile.
- Keep incomplete multi-step creation safely in DRAFT and never activate a
  partly configured Product.
- Add bounded edit/status actions for existing Products without recreating or
  silently changing inventory, capacity or Rules.

## Slice 3 — Ticket Type visual tiles

- Add editable tile label, colour and optional image to Ticket Type setup.
- Offer sensible text-first examples such as Adult, Child and Toddler without
  inserting business Rules or prices automatically.
- Preview the tile as it will appear in later customer/POS work while keeping
  the present booking controls usable when no styling is configured.
- Carry the presentation metadata through authorised organiser and public
  catalogue responses.
- Do not redesign the full customer ticket-selection journey or touch-first POS
  in this Sprint; those consumers may adopt the new metadata in their approved
  later scopes.

## Slice 4 — Booking lookup refinement

- Preserve the implemented newest-first server search, filters, pagination and
  Event-assignment boundaries.
- Improve at-a-glance hierarchy, status labels, responsive/mobile presentation,
  loading/empty/error states and the route into Booking detail.
- Support Event-scoped entry from an Event workspace without duplicating a
  second Booking authority.
- Keep search bounded to Booking number and authorised customer name/email;
  do not add bulk export or broad personal-data discovery.

## Slice 5 — Customer lookup workspace

- Add a dedicated Customers page using a new bounded, paginated server search
  contract rather than loading every Customer and Booking into the browser.
- Search authorised customer name, email or phone with minimum/maximum query
  limits, stable newest-activity ordering and a bounded page size.
- Show concise list evidence: customer name, masked-or-appropriate contact
  summary, authorised Booking count, most recent Booking/Event and last
  activity.
- Add a Customer detail workspace containing only Bookings visible through the
  operator's Organisation, role and Event assignments.
- Support Event-scoped entry from the Event workspace and link back to the
  existing Booking detail authority.
- Do not add CRM notes, marketing profiles, messaging, customer accounts,
  deduplication/merge, export or deletion workflows.

## Authority, privacy and compatibility boundaries

- Preserve Organisation, role and Event-assignment checks on every list, detail
  and asset operation. A supplied Event/Product/Ticket Type identifier never
  grants access by itself.
- OWNER remains the catalogue/image mutation role. MANAGER/STAFF capabilities
  do not expand unless an existing explicit authority already permits the
  operation.
- Preserve Ticket issuance and credentials, Payment/refund idempotency,
  Booking reservation, Session capacity, Product/Variant inventory, Rules,
  Scanner, Flexible Tickets, POS and public-booking foundations.
- Do not add domains, cloud storage, email delivery, hosting or paid services.
- Use fictional local/test customer and commerce data only.
- Avoid logging image content, customer search terms, email addresses, phone
  numbers, storage keys or other sensitive values.

## Focused verification

- Migration and service tests cover asset relations, replacement/removal,
  rollback cleanup, validation and tenant/Event denial.
- Product tests cover Product-first layout, optional grouping, upload lifecycle,
  safe DRAFT behavior and unchanged inventory/capacity/requirement payloads.
- Ticket Type tests cover defaults, colour/label validation, optional image and
  unchanged admission authority.
- Booking tests cover newest-first defaults, filters, Event-scoped entry,
  responsive states and detail links.
- Customer tests cover search bounds, pagination, deterministic ordering,
  Event assignment, cross-tenant denial and detail redaction.
- Browser acceptance uses fictional Products, Ticket Types, Bookings and
  Customers at desktop, tablet and mobile widths.

## Exit gate

- Focused tests pass after each small implementation slice.
- API and web suites and production builds pass.
- Migration status and disposable migration verification pass.
- Disposable tenant/role/Event isolation passes, including catalogue assets and
  Customer search/detail denial.
- Isolated PostgreSQL backup/restore matches every critical table, including new
  asset relations.
- Tracked-secret scan and the complete local release gate pass.
- Documentation records exact delivered behavior, evidence and limitations.
- Verified slices are committed locally. Nothing is pushed to GitHub without
  explicit organiser approval.

## Explicitly deferred evidence and scope

- Managed production media storage, CDN/delivery, deployed retention/cleanup,
  production secrets and monitoring.
- Real-device POS/Scanner testing and the touch-first kiosk redesign.
- Independent accessibility, privacy and security review.
- Customer accounts, communications, CRM, marketing consent and bulk data
  workflows.
- Full public booking/POS visual adoption of Ticket Type tiles beyond any small
  compatibility change required to preserve current behavior.
