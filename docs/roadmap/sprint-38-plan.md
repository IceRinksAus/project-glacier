# Sprint 38 Plan — Touch-first POS and Connected Ticket Service

**Status:** Complete 17 September 2026

## Outcome

Turn the existing authoritative POS commerce foundation into a fast,
touch-first tablet/kiosk experience and let an authorised POS operator scan a
pre-purchased Ticket for lookup followed by deliberate individual admission.
Separate the organiser's Scanner navigation from the dedicated scanner-device
experience, while preserving all current commerce, Ticket and access-control
authorities.

This Sprint is a user-experience and bounded service integration Sprint. It is
not a new till, a new Ticket engine or a hardware procurement Sprint.

## Confirmed product direction

- POS is designed first for landscape tablets and square terminals, while
  remaining usable on smaller mobile screens and desktop.
- Ticket Types and Products appear as large, obvious touch targets using the
  Sprint 37 tile label, colour and optional image. Text-only tiles such as
  `ADULT`, `CHILD` and `TODDLER` remain first-class.
- A persistent order panel shows quantities, required additions, authoritative
  total and the next action.
- Ordinary walk-up sales do not ask staff to enter participant names.
- Product requirements remain automated by backend Rules. For example, adding
  a Toddler Ticket causes the required Kanga quantity to appear once in the
  basket with a clear `Required by Ticket rule` explanation.
- POS may scan an existing Ticket for lookup. Lookup never consumes a Ticket;
  admission is a separate deliberate action with a confirmation boundary.
- The organiser-facing Staff Scanner page remains within the Glacier dashboard
  shell and explains configuration/readiness. A dedicated SCANNER login still
  opens only the full-screen operational scanner.

## Slice 1 — Kiosk catalogue and basket contracts

- Carry Ticket Type tile label, colour and current image metadata into the
  authorised POS catalogue response.
- Carry current Product image metadata into Ticket and merchandise catalogue
  responses without exposing local storage keys.
- Add bounded, authenticated POS asset reads scoped through Organisation and
  Event access. Reuse the Sprint 37 asset authority rather than creating a
  second image store.
- Return the information needed to group touch targets clearly as Tickets,
  required/session Products and merchandise while preserving existing Product
  Group ordering as an optional presentation aid.
- Retain the existing Event and Session selection authority. A remembered
  selection is only a convenience and never grants access.
- Keep all price, sales-window, active-state, inventory, Product capacity and
  Session capacity decisions server-authoritative.

## Slice 2 — Touch-first ticket sales

- Replace the long form-led Ticket mode with a two-area operating layout:
  1. large Ticket/Product tiles grouped by a small category switch; and
  2. a persistent order panel with line items, quantities and total.
- Make one tap add an item. Provide large plus/minus controls in the order panel
  and prevent visually disabled items from being treated as authoritative.
- Keep the selected Event and Session permanently visible. Changing either
  clears the basket only after an explicit warning when it contains items.
- Show the recommended Session but require deliberate operator selection, as
  today. Never silently advance or move a basket to another Session.
- Evaluate Rules as the basket changes and clearly distinguish automatic
  required quantities from optional quantities. The API re-evaluates again
  during reservation, so browser manipulation cannot remove a requirement.
- Present stock/capacity/sales-window errors in plain operating language and
  retain the basket when a safe correction is possible.
- Preserve the two-step payment boundary: server-authoritative review first,
  then explicit Cash or Standalone EFTPOS confirmation with idempotency.
- Retain completion evidence and immediate access to issued Tickets.

## Slice 3 — Participant-free ordinary walk-up sales

- Remove participant-name fields from the ordinary POS Ticket flow.
- Create bounded non-personal ordinal attendee labels inside the trusted POS
  service only where the existing Booking/Ticket schema requires an internal
  label. Do not pretend they are customer names and do not expose them as
  customer-supplied identity.
- Create one minimal walk-up Customer record for the sale without invented
  email, phone or purchaser identity.
- Do not silently assume that every Event can be anonymous. Before reservation,
  identify active Rules or Waiver requirements that genuinely require an age or
  named participant and present a clear exception flow or block with guidance.
- Never infer a Toddler's age from a label or default every participant to age
  18. Ticket-Type-based Product Rules continue to work directly from the
  selected Ticket Type.
- Preserve online-booking customer and participant collection unchanged.
- Record the sale source as `WALK_UP` and retain operator/Payment audit evidence.

## Slice 4 — POS Ticket scan, lookup and deliberate admission

- Add a POS `Scan existing Ticket` action that accepts the same signed `gt1`
  credential and temporary one-way legacy compatibility as the Scanner.
- Support camera scan where the browser/device permits it and hardware scanners
  that present as keyboard input. Keep a manual code fallback for local/test
  evidence.
- Reuse the shared Ticket credential and Scanner service result model rather
  than duplicating Ticket validity logic in POS.
- Authorise OWNER, MANAGER and STAFF only for Events in their current scope.
  SCANNER remains unable to call POS routes.
- Lookup shows Event, Session, Ticket Type, current admission state and safe
  customer/participant context needed for service. It does not consume or alter
  the Ticket.
- Admission requires a separate, prominent confirmation. It consumes only the
  selected Ticket through the existing atomic admission authority and preserves
  duplicate/too-early/too-late/cancelled/wrong-Event responses.
- A scan must never add the existing Ticket to a new-sale basket or create a new
  Booking, Payment or Ticket.
- Provide `Return to sale` and `Scan next Ticket` paths suited to a busy counter.

## Slice 5 — Organiser Scanner separation

- For OWNER, MANAGER and STAFF, `/staff/scanner` uses the normal Glacier shell
  and becomes a Gate Entry readiness/how-it-works workspace rather than a
  desktop scanning surface.
- Show the configured entry window, eligible Events, role/assignment guidance,
  device sign-in instructions and the distinction between lookup and admission.
- Do not expose credentials, recovery codes or device secrets in the organiser
  workspace.
- For a dedicated SCANNER account, retain direct login routing to the existing
  full-screen scanner-only interface with no organiser navigation.
- Preserve the existing operational scanner interaction unless focused tests
  reveal a defect. Real Zebra/Android/iOS validation remains future evidence.

## Responsive and accessibility acceptance

- Primary target: landscape tablet/square terminal around 1024 × 768.
- Also verify 1280 × 800 desktop and 390 × 844 mobile layouts.
- Use at least 44 px touch targets, strong selected/focus states, keyboard
  navigation, visible quantities and text/status labels in addition to colour.
- Keep the order total and checkout action reachable without excessive
  scrolling on the primary tablet target.
- Test empty, loading, no-Session, unavailable, Rule-added, payment-review,
  completion, scan-ready, scan-error and already-admitted states.

## Authority and compatibility boundaries

- Preserve Organisation, role and Event-assignment checks on every POS and
  Ticket-service request. Client-selected identifiers never grant access.
- Preserve signed Ticket credentials, reissue invalidation and non-secret audit
  evidence.
- Preserve Booking reservation expiry, server pricing, Session capacity,
  Product/Variant inventory, Rule evaluation, Payment/refund idempotency and
  duplicate-safe Ticket issuance.
- Preserve controlled cancellation/refund, rescheduling and Flexible Ticket
  foundations. Sprint 38 does not add those mutations to the kiosk.
- Preserve merchandise-only sales and their honest Retail Sale ledger; apply
  the common visual tile/order-panel language without merging the ledgers.
- Do not add Stripe Terminal, Square, Linkly, split tender, discounts, vouchers,
  cash drawers, shifts, offline sync or return-to-stock.
- Use fictional local/test data only. Do not purchase or provision devices,
  payment hardware, domains, hosting or other services.

## Focused verification

- POS catalogue tests cover visual metadata, scoped asset reads, ordering and
  cross-tenant/Event denial.
- Anonymous walk-up tests cover internal ordinal records, no invented contact
  data, Rule enforcement, age/identity exceptions and unchanged online flows.
- Kiosk tests cover touch tiles, quantities, required Product explanation,
  Event/Session basket reset, review/payment boundaries and completion.
- Ticket-service tests prove lookup does not mutate admission state, admission
  is deliberate and atomic, and wrong-role/Event/tenant requests are denied.
- Scanner routing tests prove organiser roles retain the dashboard shell while
  SCANNER remains full-screen and isolated from POS.
- Browser acceptance uses fictional Tickets and sales at the three target
  viewport sizes. Real device and payment-terminal claims are not made.

## Exit gate

- Focused tests pass after each small slice.
- API and web suites and production builds pass.
- Migration status and disposable migration replay pass; avoid a schema change
  unless the participant-free contract cannot be represented safely otherwise.
- Disposable tenant/role/Event/MFA isolation passes, including POS Ticket lookup
  and admission denial.
- Isolated PostgreSQL backup/restore matches every critical table.
- Tracked-secret scan and complete local release gate pass.
- Documentation records exact delivered behavior, browser evidence and limits.
- Verified slices are committed locally. Nothing is pushed without explicit
  organiser approval.

## Explicitly deferred evidence and scope

- Real Zebra reader, Android, iOS, square-terminal, receipt-printer, cash-drawer
  and EFTPOS-device testing.
- Managed production media delivery, deployed secrets, monitoring and offline
  behavior.
- Stripe Terminal, Square, Linkly or another integrated payment provider.
- Shift/till balancing, split tender, discounts, vouchers, exchanges, returns
  and broad POS administration.
- Independent accessibility, privacy and security review.
- Customer accounts or broad changes to the public booking journey.
