# Sprint 21 — Payment Operations, Recovery and Add-on Organisation

## Status

Completed on 24 August 2026. Scope remained controlled by `docs/roadmap/sprint-21-plan.md`; no locked non-goal was introduced.

## Slice 1 — Automatic Payment Reconciliation

The initial implementation closes the provider/local divergence found during Sprint 20 acceptance.

Previously, the reservation scheduler found every expired Booking with a locally PENDING Payment and immediately attempted cancellation. If Stripe had already succeeded but Glacier missed the webhook, Stripe correctly rejected cancellation and the same impossible operation retried every minute.

Glacier now retrieves authoritative provider state before cancellation:

- PENDING proceeds to the existing idempotent provider cancellation;
- CANCELLED is recorded locally through `PaymentService`;
- FAILED is recorded locally with bounded provider failure context; and
- SUCCEEDED enters the existing payment completion path.

An expired Booking cannot be confirmed by reconciliation. Provider success is retained as financial truth, the Booking remains expired, no Ticket is issued and the existing idempotent late-success refund is used.

The normal successful path remains Stripe's verified signed webhook. Reconciliation is a recovery control for missed delivery or state divergence.

## Reliability Boundaries

- Provider reads use the shared `PaymentProvider` interface rather than Stripe-specific logic in the scheduler.
- Refund creation retains its stable idempotency key and duplicate-refund protection.
- Provider retrieval or cancellation failures leave the Payment pending for retry.
- Failure on one expired Booking does not block cleanup of the remainder.
- Reconciled terminal Payments leave the scheduler's PENDING query.
- Logs identify reconciliation outcomes without logging secrets or customer details.

## Verification to Date

- Focused Payment/provider/reservation tests: 6 suites and 61 tests passed.
- Focused Booking/payment operations tests: 6 suites and 76 tests passed.
- Complete API suite: 62 suites and 413 tests passed.
- API production build: passed.
- Tests cover provider retrieval, pending cancellation, missed success/refund, no Ticket issuance, FAILED and CANCELLED closure, and retry after provider outage.
- No database migration, browser payment or real Stripe mutation was required for this slice.

## Slice 2 — Organiser Payment Investigation Foundation

The backend now defines two OWNER-only, tenant-scoped operations:

- `GET /booking/:id/payment-investigation`; and
- `POST /booking/:id/payment-reconciliation`.

The investigation response supplies the Booking lifecycle, customer and Event context, Session, Ticket issuance, Payment attempts, refunds and reconciliation history needed for customer-service investigation. Full provider references are never returned; the response exposes only a masked suffix.

The manual action is deliberately **Reconcile payment**, not **Mark paid**. It re-reads provider truth through `PaymentService`. A still-pending provider Payment is reported without cancellation or local status mutation. Terminal provider state uses the same completion, Ticket and late-refund rules as the automated path.

Every manual attempt records Organisation, Event, Booking, optional Payment, acting User, trigger, outcome, provider status, success state, bounded error detail and timestamp. Cross-tenant Booking IDs receive the same not-found result as unknown IDs.

The schema migration and generated client validate, the API production build passes and the complete API suite now passes 62 suites / 413 tests.

## Organiser Dashboard Presentation

The platform Bookings destination now opens a real tenant-scoped register rather than an empty navigation destination. It shows Booking number, customer, Event, lifecycle state, payment summary, total and creation time, with a path into the operational investigation.

The dedicated Booking investigation page presents:

- Booking, payment and Ticket summary cards;
- customer, Event, Session and lifecycle timestamps;
- masked Payment attempts and bounded failure information;
- refunds;
- issued Tickets;
- attributable reconciliation history; and
- the single `Reconcile payment` control when a locally pending Payment exists.

The UI never offers `Mark paid`. When Stripe still reports PENDING, the page explicitly states that no local state was changed.

The Bookings register now supports bounded, server-side operational discovery by customer name, email or Booking number. Organisers can narrow results by Event, then a Session owned by that Event, filter Booking and Payment state, and choose a deterministic sort order. Results are tenant-scoped, return only the register fields required by the dashboard and are paginated at 25 rows by default with a hard 100-row maximum.

Web verification now passes 17 suites / 53 tests, targeted lint for every new Bookings file and the webpack production build with `/bookings` plus `/bookings/[bookingId]` routes.

## Local Reconciliation Acceptance

The additive reconciliation-attempt migration was applied successfully to the local PostgreSQL database on 24 August 2026, bringing the development database to all 29 migrations.

After the updated API restarted, the scheduler found the two historical Sprint 20 mismatch Bookings and retrieved their authoritative Stripe state. Both were reconciled as provider successes and processed through the late-success compensation path.

Database verification confirmed for each Booking:

- Booking remains `EXPIRED` and `UNPAID`;
- local Payment is `SUCCEEDED`;
- exactly one `SUCCEEDED` AUD 34 refund exists with a provider reference; and
- zero Tickets were issued.

The records no longer match the scheduler's locally PENDING query, so the impossible per-minute cancellation retry has stopped. This is direct local/Stripe test-mode evidence of the Slice 1 recovery behavior, not only mocked test coverage.

The API and both canonical web previews were restarted successfully on ports 3000, 3001 and 3002.

Authenticated browser acceptance then verified:

- the Bookings register loads current tenant Bookings with Booking, customer, Event, lifecycle, payment and total columns;
- the recovered AUD 34 Booking opens its dedicated investigation page;
- the provider reference is masked;
- the page shows EXPIRED/UNPAID, provider SUCCEEDED, one successful AUD 34 refund and zero Tickets;
- no reconciliation button appears after the terminal state has already been resolved;
- the narrow responsive presentation has no horizontal page overflow; and
- the browser console reports no warnings or errors.

The refreshed production dashboard was also accepted against current local data. An exact email lookup returned one correct Booking, Event filtering exposed only the selected Event's Sessions, and narrowing to its 10:30 Session retained the correct single result. The updated `/bookings` workspace remains open on port 3002 for organiser review.

The completed search slice passes the full API suite at 64 suites / 418 tests, the full web suite at 17 suites / 53 tests, both production builds and targeted dashboard lint.

## Slice 3 — Add-on Grouping and Ordering

Glacier now persists Event-owned customer-facing Product groups separately from catalogue Categories. Groups contain only presentation name, optional description and order. Products retain their existing `sortOrder` as their order inside a group and may remain ungrouped without becoming unavailable.

OWNER operations can create and edit groups, reorder the complete Event group set, and assign/reorder the complete non-admission Product set transactionally. Every read and mutation resolves through Event → Organisation. Incomplete, duplicate or foreign ID sets are rejected before writes, preventing partial or cross-tenant ordering.

The organiser Product workspace now supports:

- drag-and-drop group and Product ordering;
- keyboard-accessible up/down controls;
- explicit Product group selectors; and
- a clear boundary explaining that presentation does not change Rules, Session capacity or inventory.

The public Add-ons response returns privacy-minimised group metadata and applies deterministic group, Product and name/ID fallbacks. The Add-ons step renders semantic group headings and preserves an `Other add-ons` section for existing ungrouped Products. Required Product minimums, Kanga Rule evaluation, per-Session Product capacity and finite Variant inventory remain unchanged.

The additive migration was applied locally, bringing the development database to all 30 migrations. Browser acceptance created `Popular` and `Merchandise` for the Tenant Security Test Event, moved Kanga into `Popular`, moved Safety Pack into `Merchandise`, and verified the public Add-ons page rendered those headings and Products in the saved order while preserving current availability figures.

Verification passes 65 API suites / 424 tests, 17 web suites / 54 tests, targeted changed-file lint and both production builds.

## Closeout

Sprint 21 meets its completion definition:

- provider/local Payment divergence is detected and safely resolved without browser authority;
- authorised organisers can find, understand and request safe reconciliation without database access;
- reconciliation is attributable, bounded and cannot become a manual `mark paid` path;
- customer Add-ons follow persisted organiser grouping/order without weakening Rules, capacity or inventory; and
- the original 45-suite / 236-test regression floor and Sprint 20's 61-suite / 399-test baseline remain exceeded.

Final verification is 65 API suites / 424 tests and 17 web suites / 54 tests, with API and webpack web production builds passing, changed-file lint passing, 30 local migrations current and authenticated browser acceptance complete on both organiser and customer previews.

The production-dependency audit reports zero web vulnerabilities. The API retains four high-severity `deepmerge-ts` advisories inherited through Prisma; npm reports no fix available. This matches the documented pre-existing dependency risk and was not introduced or concealed by Sprint 21.

No additional Stripe mutation was performed at closeout. The already-completed acceptance used authoritative Stripe test-mode state for two historical missed-success PaymentIntents and proved exactly one successful refund and zero Tickets for each. Repeating a charge/refund would add no new acceptance coverage.

No deployment or production data mutation was performed. The separate pilot-readiness roadmap draft remains outside the Sprint 21 commit sequence.
