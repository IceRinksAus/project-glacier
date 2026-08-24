# Sprint 21 Plan — Payment Operations, Recovery and Add-on Organisation

## Planning Status

Approved to proceed on 24 August 2026. This document is the locked Sprint 21 delivery contract.

## Recommendation

Sprint 21 should convert Glacier's proven payment and Product foundations into safer day-to-day operational controls.

The Sprint has three ordered delivery slices:

1. **Payment reconciliation and automatic recovery**
2. **Organiser payment and Booking investigation**
3. **Customer-facing Add-on grouping and ordering**

Payment correctness comes first because a provider/local state mismatch can affect customer money, Ticket issuance and Event admission. Catalogue presentation follows only after the recovery boundary is verified.

## Objective

Deliver an auditable operational path from payment-provider truth to Glacier's local Booking state, while giving organisers clearer investigation tools and controlled Add-on presentation.

The Sprint must preserve the existing Booking, capacity, Rule, inventory, Payment, Ticket and Waiver authority established through Sprints 15–20.

## Evidence Behind This Sprint

Sprint 20's successful Stripe test-mode purchase proved the intended path:

- Stripe's signed webhook confirmed payment;
- Glacier moved the Booking to PAID/CONFIRMED;
- one Ticket was issued;
- the Waiver continuation appeared; and
- finite Product Variant inventory decreased exactly once.

The same acceptance run exposed two older local test Bookings whose Payment rows remained PENDING after Stripe reported successful PaymentIntents. Their reservations had expired, so the scheduler repeatedly attempted a provider cancellation that could never succeed.

This is an operational reconciliation gap rather than a failure of the normal successful checkout. Sprint 21 closes that gap without treating the browser as payment authority.

## Existing Foundations to Preserve

- Stripe PaymentIntent creation with idempotency keys;
- verified signed Stripe webhooks as the normal completion path;
- provider payment references stored against Glacier Payments;
- high-entropy public Booking status credentials;
- PAID/CONFIRMED as the Ticket-issuance boundary;
- idempotent Ticket issuance;
- automatic idempotent refund when provider success arrives after reservation expiry;
- reservation expiry and inventory release;
- Session capacity shared across Ticket Types;
- Product Rule minimums re-evaluated on the server;
- reusable Product per-Session capacity;
- global finite Product Variant inventory; and
- Organisation and Event tenant isolation.

The original 45-suite / 236-test API baseline remains the permanent regression floor. Sprint 20 closed at 61 API suites / 399 tests and 15 web suites / 49 tests; Sprint 21 must not silently reduce either verified baseline.

## Slice 1 — Payment Reconciliation and Automatic Recovery

### Provider status retrieval

Extend the Payment provider boundary with an authoritative read operation for an existing provider payment reference.

For Stripe, this retrieves the PaymentIntent directly and maps only controlled provider states into Glacier's Payment status vocabulary.

### Expired reservation cleanup

Before trying to cancel a locally PENDING payment for an expired Booking, Glacier must retrieve current provider truth.

- Provider **PENDING**: attempt the existing idempotent cancellation.
- Provider **CANCELLED**: close the local Payment as CANCELLED.
- Provider **FAILED**: close the local Payment as FAILED with bounded failure detail.
- Provider **SUCCEEDED**: pass the event through the existing payment-completion service. Because the Booking has expired and cannot be fulfilled, Glacier must use the existing idempotent late-success refund path and must not issue Tickets.

The scheduler must not create a second payment workflow or directly mutate successful Bookings outside `PaymentService`.

### Retry and failure behavior

- Temporary provider failures remain retryable.
- One failed reconciliation must not block other expired Bookings.
- Successfully reconciled terminal states leave the scheduler's PENDING query and stop retrying.
- Refund idempotency must prevent duplicate customer refunds.
- Logs must distinguish cancellation, reconciliation, refund failure and provider unavailability without exposing credentials or unnecessary personal data.

### Automated acceptance

Tests must prove:

- genuinely pending provider payments still cancel;
- missed provider success is detected before cancellation;
- expired late success is refunded once and issues no Ticket;
- duplicate reconciliation cannot duplicate the refund;
- provider FAILED and CANCELLED states close locally;
- provider retrieval failure remains safely retryable; and
- cleanup continues to the next Booking after one failure.

## Slice 2 — Organiser Payment and Booking Investigation

### Operational visibility

Add a tenant-scoped organiser view that allows authorised users to investigate a Booking without direct database or Stripe-dashboard access.

The minimum useful record should show:

- Booking number and lifecycle status;
- Payment status, amount, currency and provider;
- safe provider-reference summary;
- reservation, payment, confirmation, expiry and refund timestamps;
- Ticket issuance state;
- refund state and bounded reason; and
- whether Glacier currently detects an unresolved mismatch.

### Safe recovery actions

Any manual recovery action must:

- require OWNER authority initially;
- verify Booking → Event → Organisation ownership;
- re-read provider truth at action time;
- call the same PaymentService reconciliation path used by automation;
- be idempotent;
- record actor, timestamp, outcome and bounded context; and
- never permit an organiser to mark a Booking paid by assertion.

The preferred initial action is **Reconcile payment**, not a collection of low-level status mutation buttons.

### Customer-service boundary

Sprint 21 may add the minimum Booking search required to reach the investigation record. Broad CRM, Booking modification, rescheduling, discretionary refund management and full POS remain separate scopes unless required to make reconciliation safe.

## Slice 3 — Add-on Grouping and Ordering

### Product groups

Add Event-owned customer-facing Product groups such as:

- Popular;
- Skating aids;
- Safety equipment; and
- Merchandise.

Groups are presentation metadata. They do not replace Categories, Rules, Session Product assignment, capacity or inventory.

### Organiser-controlled order

An OWNER can control:

- the order of Product groups; and
- the order of Products within each group.

The dashboard should support drag-and-drop plus a keyboard-accessible ordering alternative. Ordering writes must be tenant-scoped, validated and transactional.

### Public Add-ons behavior

The customer Add-ons page consumes the persisted group and Product order. Required Products remain clearly identified and cannot be reduced below the authoritative Rule minimum.

Kanga behavior must continue to preserve the existing foundation:

- a qualifying Ticket Rule requires the configured Kanga Product;
- duplicate equivalent required Products must not be automatically added;
- availability remains governed by the selected Session's Product capacity; and
- organiser ordering cannot bypass Rule, capacity or inventory checks.

Product Variants such as hoodie sizes continue to use their own finite global inventory.

### Safe defaults and migration

Existing Products without group/order metadata must remain sellable in a deterministic fallback order. No existing Product, Rule, Session assignment, Booking snapshot or inventory record may be destructively rewritten.

## Security and Privacy Requirements

- No secret key, webhook secret, client secret or possession credential in logs or organiser responses.
- No raw provider payload persisted as a convenience shortcut.
- Provider status remains mapped through Glacier's controlled vocabulary.
- Organiser endpoints require authenticated tenant context and explicit role enforcement.
- Cross-tenant Booking or Payment discovery must return the same safe not-found outcome.
- Payment reconciliation cannot issue a Ticket for an expired, cancelled or otherwise unfulfillable Booking.
- Audit records must avoid unnecessary customer and participant personal information.
- Public Add-on responses remain privacy-minimised.

## Documentation Deliverables

Sprint 21 must update:

- this plan as the immutable scope reference, with deviations explicitly recorded;
- Sprint 21 closeout notes;
- Payment and Booking architecture documentation;
- the API endpoint register for new organiser operations;
- the Product roadmap and relevant Product architecture notes;
- the local-development and operational runbook for reconciliation; and
- the changelog.

Operational documentation must explain the normal webhook path, automatic reconciliation, retry behavior, refund behavior, organiser investigation and escalation boundaries.

## Verification Gates

Before Sprint closeout:

- focused Payment/reconciliation tests pass;
- complete API test suite passes at or above the Sprint 20 baseline;
- complete web test suite passes at or above the Sprint 20 baseline;
- API and web production builds pass;
- changed-file lint and formatting checks pass;
- tenant-isolation and role tests cover new organiser endpoints;
- a local missed-webhook simulation proves automatic reconciliation;
- a real Stripe test-mode acceptance is performed only with explicit approval;
- no duplicate refund or Ticket issuance occurs; and
- browser acceptance covers organiser investigation and public Add-on ordering on desktop and mobile.

Known repository-wide lint and upstream dependency advisories remain visible; they must not be disguised as Sprint-created failures or silently rewritten within unrelated work.

## Locked Non-goals

- no browser-authoritative payment success;
- no direct manual `mark paid` action;
- no rewrite of Stripe webhook signature handling;
- no replacement of Booking, Rule, capacity, inventory, Ticket or Waiver engines;
- no discretionary partial-refund product;
- no Booking rescheduling or exchange workflow;
- no chargeback/dispute management;
- no accounting settlement or general-ledger integration;
- no production deployment;
- no arbitrary Product-page builder; and
- no visual redesign beyond the operational interfaces required by this Sprint.

## Delivery Sequence

1. Commit this locked Sprint 21 plan independently.
2. Implement provider-state retrieval and automatic expired-payment reconciliation.
3. Add reconciliation auditability, operational logging and full failure-state coverage.
4. Build tenant-safe organiser investigation and the single safe reconciliation action.
5. Add Product-group persistence and deterministic ordering.
6. Add dashboard ordering controls and public Add-ons consumption.
7. Run full automated, browser and approved Stripe acceptance.
8. Complete detailed closeout documentation, review and commit sequence before push.

## Sprint Completion Definition

Sprint 21 is complete only when Glacier can detect and safely resolve provider/local Payment divergence, an authorised organiser can understand and request safe reconciliation without database access, and customer Add-ons follow organiser-controlled grouping/order without weakening any commerce rule.
