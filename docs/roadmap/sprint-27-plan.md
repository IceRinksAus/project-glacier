# Sprint 27 Plan — Partial Ticket Cancellation and Discretionary Refunds

## Planning Status

Proposed implementation scope prepared on 26 August 2026. This plan must be reviewed, accepted and committed before implementation begins.

## Recommendation

Sprint 27 should deliver Glacier's first controlled post-purchase correction workflow: an authorised OWNER or MANAGER can cancel one or more individual admission Tickets in a confirmed Booking and, where discretion permits, refund the authoritative value of those Tickets without cancelling or refunding the remainder of the Booking.

The workflow must treat Ticket cancellation, admission-capacity release and money movement as related but distinct outcomes. Glacier must preserve an immutable explanation of who decided what, why, when, for which Tickets, against which Payment and with which provider result.

This Sprint is not a broad returns, exchanges, rescheduling or customer-policy programme. It establishes the durable adjustment ledger those later workflows can reuse.

## Objective

Allow an authorised OWNER or Event-scoped MANAGER to inspect a confirmed admission Booking, select eligible active Tickets, record a mandatory discretionary reason, obtain a server-authoritative refundable amount, and either:

- cancel the selected Tickets without a refund; or
- cancel them and process/record an exact partial refund using the original supported payment method.

Unaffected Tickets, participants, Products and payment value remain intact and usable. A partial adjustment must never cancel the whole Booking accidentally.

## User Outcome

From Booking investigation, an authorised operator can:

1. see each Ticket, participant, Ticket Type, original unit value, scan state and prior adjustment state;
2. select one or more eligible Tickets;
3. choose **Cancel only** or **Cancel and refund**;
4. select a controlled reason and enter a mandatory explanatory note;
5. review the exact amount, capacity effect and payment method before confirmation;
6. confirm the high-impact action once with idempotent protection;
7. see provider/manual refund progress and final outcome clearly; and
8. review an immutable adjustment history on the Booking.

The purchaser-facing terms remain non-refundable by default. This interface represents authorised organiser discretion; it does not create a customer entitlement or public self-service refund route.

## Evidence Inspected

- `Ticket` is already a one-to-one participant admission credential with `ACTIVE`, `SCANNED` and `CANCELLED` states.
- `BookingParticipant.ticketTypeId` identifies the Ticket Type for an individual Ticket.
- `BookingItem` retains the authoritative Ticket Type unit-price snapshot, although its quantity is currently aggregated.
- `PaymentRefund` already stores provider, idempotency key, amount, status, reason and provider reference, but does not identify Tickets or the deciding operator.
- the payment-provider interface and Stripe implementation already accept a partial refund amount.
- existing late-success refunds must remain separate automatic compensating actions.
- Cash and standalone EFTPOS Payments retain method, receiving operator and optional terminal reference from Sprint 25.
- admission capacity is shared at Session level across Ticket Types; Ticket Type is not its own capacity pool.
- reusable Session Product capacity and finite merchandise inventory are separate from admission capacity.
- Sprint 23 reporting deliberately treats current refunds as unallocated because no Ticket/line allocation exists.
- Sprint 24 provides OWNER, MANAGER, STAFF and SCANNER roles plus Event assignment enforcement.
- Booking status remains a coarse string and cannot honestly describe every combination of partially cancelled Tickets and retained Products.

## Locked Design Direction

### Immutable Ticket adjustment authority

Introduce a dedicated aggregate such as `TicketAdjustment` with immutable child allocations where necessary. It must retain at least:

- Booking and Event ownership;
- adjustment number and idempotency key;
- controlled action: `CANCEL_ONLY` or `CANCEL_AND_REFUND`;
- controlled lifecycle state;
- reason code and mandatory bounded operator note;
- requesting operator and timestamps;
- authoritative requested/refundable/refunded totals and currency;
- selected Ticket allocations, each with Ticket, participant, Ticket Type and unit-value snapshots;
- admission-capacity release evidence;
- related Payment and PaymentRefund where money movement applies; and
- failure/provider evidence without raw financial credentials.

Ticket status alone is not sufficient audit history. `PaymentRefund.reason` alone is not sufficient allocation or actor evidence. The adjustment record is the operational authority joining the decision, selected Tickets and financial result.

One Ticket may have at most one successful cancellation adjustment. Database uniqueness must prevent duplicate cancellation under concurrent or retried requests.

### Ticket cancellation and refund are distinct

- **Cancel only** invalidates eligible Tickets and releases their admission places without moving money.
- **Cancel and refund** invalidates eligible Tickets, releases their admission places and requests/records the exact authorised refund.
- a failed or pending external refund must remain visible and reconcilable; Glacier must not imply money was returned merely because a Ticket was cancelled.
- a refund must not be issued without the selected Tickets becoming unusable as part of the controlled workflow.
- existing automatically generated late-success refunds remain non-Ticket adjustments and must not be relabelled.

The implementation must define transaction boundaries around the unavoidable external-provider call. It must be retry-safe if the process stops after Stripe accepts the refund but before Glacier records the result.

### Authoritative refundable amount

For this Sprint, each selected Ticket's maximum discretionary refund is its persisted `BookingItem.unitPrice` for the participant's Ticket Type. The server resolves this relationship; the browser cannot supply a price or total.

- zero-priced Tickets may be cancelled but add `$0.00` to the refund;
- the refund cannot exceed the sum of selected Ticket unit values;
- the total of successful and pending allocations against a Ticket cannot exceed that Ticket's unit value;
- the total of all successful/pending refunds against a Payment cannot exceed its successful collected amount;
- Products, merchandise, booking fees, Flexible Ticket fees and other add-ons are not automatically included;
- no discretionary arbitrary amount or goodwill credit is allowed in Sprint 27; and
- no refund is inferred for a Product merely because its related attendee Ticket was cancelled.

This precise Ticket allocation allows future Ticket Type reporting to distinguish gross sales, allocated Ticket refunds and net Ticket sales without rewriting historical Booking totals.

### Payment selection and method handling

Glacier must resolve an eligible successful Payment belonging to the Booking and verify remaining refundable balance.

- `ONLINE_CARD`: create a partial refund through the existing provider abstraction using a durable idempotency key. For the pilot this is Stripe-backed.
- `CASH`: require a second explicit confirmation that cash was physically returned, then record a successful manual refund with actor and time.
- `STANDALONE_EFTPOS`: require confirmation that the external terminal refund succeeded and capture a bounded refund/reference value before recording success.
- mixed/split tender and allocation across multiple Payments are outside this Sprint. If a Booking has no single eligible Payment able to fund the full selected amount, fail safely and require escalation.
- Payments belonging to Retail Sales are not eligible for Ticket refunds.

No raw card data, bank details or terminal credentials may be accepted or persisted.

### Eligibility and non-refundable policy

The default commercial policy remains **non-refundable**. The operator interface must state that a refund is a discretionary exception and require a reason for every action.

Initial controlled reasons should include:

- medical or compassionate exception;
- Event or Session operational issue;
- duplicate purchase;
- organiser correction; and
- other, requiring a more detailed note.

Eligibility for Sprint 27:

- Booking must be confirmed and paid;
- selected Ticket must belong to that Booking and Event;
- Ticket must be `ACTIVE` and not already adjusted;
- `SCANNED` Tickets are ineligible because admission has already been consumed;
- `CANCELLED` Tickets are ineligible except for exact idempotent replay;
- expired/reserved/unpaid Bookings are ineligible;
- Event assignment and current membership are revalidated at preview and execution; and
- no date-based automatic customer entitlement is introduced.

An exceptional refund after scanning requires a later explicit override policy and is not silently granted to OWNER in this Sprint.

### Capacity release

Successful Ticket cancellation releases one place per cancelled Ticket into the shared Session admission pool. It does not alter Ticket Type-specific capacity because no such pool exists.

Capacity calculations must evolve carefully:

- active confirmed Tickets consume admission after fulfilment;
- confirmed Bookings that have not yet finished Ticket issuance must remain conservatively counted from Booking Items;
- cancelled Tickets do not consume admission;
- partial cancellation must not mark the entire Booking cancelled;
- the adjustment records whether capacity release completed; and
- exact retries cannot release capacity twice.

Reusable Product capacity, finite Product/Variant inventory and merchandise inventory do not release automatically. A Kanga or other Product remains on the Booking until a later Product-return/correction workflow exists.

### Booking and Ticket presentation

The Booking remains `CONFIRMED` when only some Tickets are cancelled. Avoid introducing a misleading `PARTIALLY_CANCELLED` Booking status unless implementation proves every existing consumer can safely adopt it. Derive presentation labels such as **Partially adjusted** from Ticket/adjustment records.

If every Ticket is cancelled, the Booking still retains financial and Product history. A full Booking-cancellation status transition is outside Sprint 27 unless it can be proven necessary and safe; the adjustment view is the source of truth.

Ticket lookup and Gate Entry must immediately return the existing cancelled outcome for adjusted Tickets. Unaffected Tickets remain scannable.

## Permission Policy

| Capability | OWNER | MANAGER | STAFF | SCANNER |
|---|---:|---:|---:|---:|
| View adjustment history | Yes | Assigned/all Events | Read-only only if existing Booking access permits | No |
| Prepare/select Tickets | Yes | Assigned/all Events | No | No |
| Preview exact outcome | Yes | Assigned/all Events | No | No |
| Cancel without refund | Yes | Assigned/all Events | No | No |
| Process/record partial refund | Yes | Assigned/all Events | No | No |
| Reconcile failed/pending refund | Yes | Assigned/all Events | No | No |
| Override scanned Ticket | No in Sprint 27 | No | No | No |

OWNER and MANAGER use the same safety rules. OWNER is not a bypass for Ticket ownership, scan state, amount limits, idempotency or provider evidence.

## Slice 1 — Persistence and Allocation Contract

- add controlled adjustment action, state and reason enums;
- add immutable Ticket adjustment and per-Ticket allocation persistence;
- link the adjustment to Booking, Event, requesting operator, Payment and optional PaymentRefund;
- snapshot participant display name, Ticket number, Ticket Type name and unit value;
- add unique constraints preventing a Ticket from being cancelled twice;
- add Event/Booking/operator/state/time indexes for investigation;
- add actor/reference fields to manual refund evidence where the adjustment relationship does not already provide them;
- retain existing automatic PaymentRefund rows unchanged;
- use a deterministic forward-only migration; and
- document the allocation boundary for reporting.

No historical refund may be retroactively allocated to a Ticket without authoritative evidence.

## Slice 2 — Preview and Eligibility Service

Add a server-authoritative preview operation that:

- revalidates current OWNER/MANAGER membership and Event scope;
- loads the Booking, Tickets, participants, Ticket Types, Booking Items, Payments, prior refunds and adjustments;
- validates every selected Ticket and rejects mixed-Booking or foreign identifiers;
- resolves exact unit values from persisted Booking snapshots;
- identifies the eligible payment method and remaining refundable balance;
- calculates selected Ticket count, refund total and shared-capacity release;
- discloses Products that will remain unchanged;
- returns no unnecessary customer contact details; and
- issues a short-lived preview token or equivalent parameter hash so execution cannot silently differ from the reviewed selection.

The service must use privacy-safe not-found behaviour for foreign or unassigned records.

## Slice 3 — Idempotent Execution and Provider Reconciliation

- require a client idempotency key and exact preview/selection match;
- create the adjustment intent and Ticket allocations transactionally;
- use database uniqueness to prevent concurrent duplicate Ticket selection;
- for cancel-only, atomically cancel Tickets and complete the adjustment;
- for Cash, require explicit physical-return confirmation before success;
- for standalone EFTPOS, require a bounded external refund reference;
- for online card, call the provider with exact amount and durable idempotency;
- persist pending/succeeded/failed/cancelled provider outcomes accurately;
- provide safe retry and reconciliation when provider truth and local state diverge;
- mark Tickets cancelled only under the documented state machine;
- never mutate the original Booking, Booking Item, Product or Payment amount; and
- ensure notification/email failure, if added later, cannot roll back financial truth.

Provider calls must not occur inside a database transaction that remains open over network I/O. The state machine must instead make each transition recoverable and single-application.

## Slice 4 — Booking Investigation Interface

Extend the Booking detail view with a clearly separated **Adjust Tickets** workflow for OWNER/MANAGER:

- show Tickets individually with participant, Ticket Type, price and ACTIVE/SCANNED/CANCELLED state;
- prevent selection of ineligible Tickets and explain why;
- show Products and state explicitly that they are unchanged;
- provide Cancel only versus Cancel and refund choices;
- require controlled reason plus bounded note;
- preview refund method, amount and capacity release;
- use a high-impact confirmation panel with explicit wording;
- prevent duplicate submission while allowing safe retry;
- show pending/provider-failed states without claiming success;
- display final adjustment number, affected Tickets, method, amount, operator and time; and
- show immutable adjustment history alongside existing Payment/refund investigation.

STAFF may retain existing Booking visibility but must not receive hidden or disabled financial mutation controls as a substitute for API enforcement. SCANNER continues to use only the scanner surface.

## Slice 5 — Reporting, Operations and Documentation

- allocate successful Ticket refunds to Ticket Types using adjustment allocations;
- add explicitly named gross Ticket sales, allocated Ticket refunds and net Ticket sales metrics;
- keep unallocated legacy/automatic refunds separately disclosed;
- update Session/Event/Event Group refund and net reconciliation without double subtraction;
- preserve Product/Variant gross reporting because Products are not refunded here;
- distinguish requested, pending, failed and successful refund states;
- update Booking search/investigation labels for partial adjustments;
- document online-card, Cash and standalone EFTPOS operating procedures;
- document provider uncertainty and reconciliation escalation;
- document why scanned Tickets and Products cannot be adjusted in this Sprint;
- update API endpoint, architecture, security and operational registers; and
- record exact automated and authenticated browser evidence in Sprint notes.

## Required Browser Acceptance

Use fictional local records and explicit confirmation before any simulated money movement.

1. OWNER opens a confirmed multi-Ticket Booking and sees each Ticket's participant, type, value and state.
2. Selecting one of five active Tickets previews only that Ticket's persisted unit value and one released admission place.
3. Confirming an online-card partial refund creates one allocated adjustment and one provider refund without changing the other four Tickets.
4. Exact retry returns the same adjustment/refund; conflicting reuse is rejected.
5. A failed/pending provider response is presented accurately and can be reconciled safely.
6. A Cash refund requires explicit confirmation that cash was returned and records the Manager/Owner.
7. Standalone EFTPOS requires an external reference and is never labelled Stripe.
8. Cancel-only cancels the selected Ticket and releases capacity without creating a PaymentRefund.
9. The cancelled Ticket is denied at Gate Entry and Lookup; unaffected Tickets remain valid.
10. A scanned Ticket cannot be selected or directly adjusted.
11. Products, Kangas and merchandise remain unchanged and visibly disclosed.
12. The Booking remains confirmed and displays partial-adjustment history rather than appearing wholly cancelled.
13. MANAGER succeeds only within assigned Event scope; foreign/unassigned direct access is denied.
14. STAFF and SCANNER cannot call preview or execution endpoints.
15. Reporting reconciles gross, allocated refund, unallocated refund and net values without double counting.
16. Existing public booking, POS Ticket Sale, merchandise Sale, Stripe webhook, Ticket scanning, Waiver and reporting workflows remain green.
17. Desktop and tablet layouts remain usable without page-level horizontal overflow.

## Automated Verification Requirements

Minimum evidence:

- Prisma format/generation and forward migration validation/application;
- adjustment model, immutable allocation, actor and index tests;
- per-Ticket unit-value resolution across multiple Ticket Types;
- zero-price Ticket cancellation;
- duplicate/mixed/foreign Ticket rejection;
- scanned/already-cancelled/reserved/unpaid Booking rejection;
- OWNER/MANAGER allow and STAFF/SCANNER deny tests;
- Event-assignment and cross-tenant denial tests;
- preview-to-execution parameter matching;
- concurrent duplicate cancellation protection;
- partial Stripe refund request and durable idempotency tests;
- provider success/failure/pending/reconciliation interruption tests;
- Cash and standalone EFTPOS evidence tests;
- remaining-refundable Payment cap tests;
- cancel-only and cancel-and-refund state-machine tests;
- shared Session capacity release and unaffected Ticket tests;
- Ticket scan/lookup cancelled regression tests;
- Product, reusable capacity and inventory non-mutation tests;
- Ticket Type/Session/Event/Event Group reporting reconciliation tests;
- focused Booking interface tests;
- full API and dashboard suites;
- API and dashboard production builds;
- changed-file lint/format and Git whitespace checks; and
- authenticated browser acceptance for OWNER, scoped MANAGER, STAFF and SCANNER.

The new baseline must not weaken Sprint 26's 75 API suites / 491 tests and 24 dashboard files / 73 tests.

## Security, Privacy and Financial Controls

- require current OWNER/MANAGER membership and Event scope on preview, execute, retrieve and reconcile;
- take Organisation, Event, Booking, Ticket, amount, price, Payment and operator authority only from server-side records;
- use allowlisted reason codes and bounded plain-text notes;
- never log public Ticket tokens, access tokens, raw card data or unnecessary customer details;
- prevent refund above selected Ticket value or remaining Payment balance;
- prevent two adjustments from owning the same cancelled Ticket;
- require explicit confirmation for manual Cash/EFTPOS evidence;
- retain original financial records and append adjustments/refunds;
- disclose provider uncertainty rather than optimistically marking success;
- ensure exact retry cannot duplicate provider refund, Ticket cancellation or capacity release;
- use non-disclosing cross-tenant denial behaviour; and
- keep public self-service refund authority closed.

## Explicitly Out of Scope

- automatic refund entitlement or public customer self-service;
- legal finalisation of Terms, Privacy Policy or refund policy wording;
- Flexible Ticket fee purchase, entitlement or automated eligibility;
- Session/date changes, rescheduling or replacement Ticket issuance;
- cancelling or refunding scanned Tickets;
- arbitrary partial amounts, goodwill credit or price overrides;
- Product/add-on refund, Kanga return, merchandise return/exchange or inventory restock;
- Retail Sale refunds or voids;
- whole-Booking cancellation automation;
- split-tender or multi-Payment refund allocation;
- refund to a different card/account or bank transfer;
- integrated Stripe Terminal, Linkly, Square or bank terminal control;
- chargebacks, disputes or fraud case management;
- email/SMS refund receipts;
- accounting exports, till balancing or settlement reconciliation productisation;
- bulk Event cancellation/refund operations; and
- broad Booking-detail visual redesign.

## Protected Foundations

Sprint 27 must not change:

- the routed public date → Session → Ticket → participant → add-on → checkout journey;
- Booking as admission-commerce authority;
- Retail Sale as separate merchandise-commerce authority;
- shared Session admission capacity across Ticket Types;
- reusable Session Product capacity and finite inventory semantics;
- Product/Variant price and grouping authority;
- online Stripe PaymentIntent, webhook and late-success protections;
- Sprint 25 walk-up Ticket Sale and Ticket issuance;
- Sprint 26 merchandise Sale, stock commitment and Payment parentage;
- Gate Entry versus Ticket Lookup modes and entry-window rules;
- Waiver versioning, acceptance and verification evidence;
- OWNER-only Event configuration;
- current membership and Event-assignment enforcement; or
- historical Booking, Payment, refund, Ticket and reporting evidence.

## Completion Gate

Sprint 27 is complete only when:

- an authorised OWNER and scoped MANAGER can cancel/refund one Ticket from a multi-Ticket Booking in the browser;
- unaffected Tickets remain valid and all Products remain unchanged;
- exact amount, selected Tickets, Payment, reason, actor, provider result and capacity release are durably attributable;
- Cash, standalone EFTPOS and online-card evidence remain unambiguous;
- scanned, duplicate, cross-tenant and unauthorised actions fail safely;
- capacity and reports reconcile without inferred or double-counted values;
- provider interruption and retry behaviour are proven;
- full regression suites/builds and browser acceptance pass;
- operations and architecture documentation record the delivered behaviour; and
- Ice Rinks Australia accepts the workflow before remote push.

## Follow-On Sequence

After Sprint 27 acceptance:

1. Session/date change, Ticket replacement and Flexible Ticket entitlement;
2. Product and Retail Sale return/refund/restock workflows;
3. cross-channel financial, settlement and till reconciliation productisation;
4. operational portfolio dashboard using stable commerce and adjustment sources;
5. production/security hardening and complete operational rehearsal; and
6. evidence-led UX productisation.

This sequence makes corrections safe before expanding customer flexibility, while preserving Glacier's append-only financial evidence and shared operational foundations.
