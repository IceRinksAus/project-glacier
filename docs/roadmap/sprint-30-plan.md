# Sprint 30 Plan — Flexible Ticket Requests and Controlled Entitlement Use

## Planning Status

Scope confirmed on 28 August 2026 and implemented/browser-accepted on 28 August 2026. The locked scope remains the authoritative Sprint boundary; closeout evidence is recorded in `docs/sprint-notes/sprint-30.md`.

## Recommendation

Sprint 30 should connect the immutable Flexible Ticket rights delivered in Sprint 29 to a secure customer-request and controlled operator-use workflow. It must reuse the Sprint 27 Ticket-adjustment/refund ledger and Sprint 28 whole-Booking Session-reschedule ledger rather than creating a second financial or Ticket-mutation authority.

The first pilot workflow should remain deliberately supervised:

- a customer with possession-scoped Booking access may submit a request against purchased rights;
- Glacier independently evaluates the immutable entitlement snapshot and current operational facts;
- no customer submission itself changes a Ticket, Session, capacity, inventory or Payment;
- assigned MANAGER or OWNER reviews and explicitly approves or declines the request;
- approval invokes the existing authoritative adjustment or reschedule engine;
- entitlement use is consumed only when the underlying controlled action completes; and
- every decision and mutation remains attributable, idempotent and auditable.

This Sprint should not introduce automatic refunds or broad automatic Session changes. Those may be considered only after supervised pilot evidence proves the decision rules and failure handling.

## Objective

Allow a customer to request an eligible cancellation/refund or whole-Booking Session change under a purchased Flexible Ticket entitlement, and allow an authorised organiser to safely approve, decline or investigate that request while Glacier:

- derives rights only from the immutable purchased entitlement;
- checks cut-off, status, use limit and Ticket/Booking eligibility at request and decision time;
- preserves tenant, assignment and possession-token boundaries;
- invokes existing mutation ledgers instead of duplicating them;
- consumes rights exactly once only after successful completion;
- prevents duplicate requests, approvals, refunds, replacements or capacity movements;
- presents clear customer and operator status; and
- retains complete evidence without unnecessary personal data or credentials.

## User Outcome

A customer opens the secure Booking page, sees the Flexible Ticket attached to each covered Ticket and can select **Request cancellation/refund** where purchased rights allow it. If every active Ticket in the unchanged Booking is covered and permits a Session change, the customer can instead select **Request a different Session**, review currently eligible destinations and submit one whole-Booking request.

The customer receives a request reference and can revisit the same possession-scoped page to see `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `COMPLETED`, `DECLINED`, `WITHDRAWN` or `FAILED` status with safe, plain-language information. Submission is not represented as approval or proof of refund.

An OWNER or assigned MANAGER sees the request in Booking investigation, reviews authoritative eligibility and consequences, records a controlled decision note and separately confirms approval or decline. Successful approval completes through the existing Ticket adjustment/refund or whole-Booking Session-reschedule authority and consumes the linked entitlement use. STAFF and SCANNER cannot decide or execute requests.

## Protected Foundations

Sprint 30 must preserve:

- default non-refundable Tickets and applicable-law qualification;
- immutable Sprint 29 policy/version/entitlement snapshots;
- one shared Session admission capacity pool across Ticket Types;
- Product, Variant, Rule, reusable capacity and finite inventory semantics;
- server-authoritative Booking/Payment values;
- Sprint 27 per-Ticket cancellation/refund allocation and provider handling;
- Sprint 28 same-price whole-Booking Session rescheduling and replacement Tickets;
- Ticket validation, scanner and replacement-credential security;
- Organisation, role and Event-assignment isolation;
- public Booking possession-token security;
- append-only commerce, request, decision and mutation evidence; and
- current reporting attribution and reconciliation foundations.

## Core Domain Boundary

### Request is not mutation

A Flexible Ticket request is a durable case record, not a direct Ticket or Payment instruction. Creating, reviewing, declining, withdrawing or failing a request must not itself change Ticket state, Session allocation, Product allocation, entitlement use or money.

Only an approved request may invoke an existing controlled mutation engine. The request then records the resulting Ticket-adjustment or Booking-reschedule identity and mirrors its terminal outcome without rewriting that ledger.

### Entitlement is authority

Eligibility comes from the selected `FlexibleTicketEntitlement` snapshot, not:

- the Event's current Flexible Ticket policy;
- the legacy Booking `flexibleBooking` Boolean;
- a customer statement or support note;
- Payment metadata;
- current marketing wording; or
- organiser discretion disguised as entitlement use.

Current operational facts still apply. A purchased right does not override a scanned/cancelled Ticket, elapsed cut-off, insufficient capacity, invalid Product/Rule assignment, uncertain Payment or another active mutation.

### One use, one completed action

The entitlement's `remainingUses` decreases only in the same protected completion boundary as the linked controlled action. A declined, withdrawn, failed or expired request consumes no use. Exact retry returns the same result. Concurrent approval cannot consume twice.

## Supported Request Types

### Per-Ticket cancellation/refund request

The customer may request cancellation/refund for one or more covered active Tickets whose snapshots permit refund requests.

- Each selected Ticket requires its own active entitlement and remaining use.
- The request may include multiple eligible covered Tickets from the same Booking.
- The authoritative refund amount is the persisted Ticket face value allocation already used by Sprint 27.
- Flexible Ticket fee treatment follows each entitlement's immutable `feeRefundabilitySnapshot`.
- Products remain unchanged in the first slice.
- Customer submission never sends money.
- OWNER/assigned MANAGER approval invokes the Sprint 27 controlled workflow.
- Online card, Cash and standalone EFTPOS evidence retain their existing provider/physical-action boundaries.

If refunding the Flexible Ticket fee cannot be safely allocated through the existing Payment/refund model, the first implementation must fail closed or create an explicit separate allocation rather than hide the amount inside Ticket value.

### Whole-Booking Session-change request

Sprint 28 moves one whole unchanged Booking. Sprint 30 must respect that boundary.

A customer may submit a Session-change request only when:

- every currently active Ticket in the Booking has an ACTIVE entitlement;
- every such entitlement permits Session changes and has remaining use;
- all relevant entitlement cut-offs remain open;
- the Booking has not been partially adjusted;
- all existing Sprint 28 whole-Booking eligibility rules pass; and
- the selected destination requires no unsupported price/content change.

Approval invokes the existing Sprint 28 whole-Booking reschedule engine, creates replacement Tickets and consumes one use from every entitlement authorising the move. If only some Tickets are covered, Glacier clearly explains that online Flexible Ticket Session change is unavailable for that Booking and directs the customer to contact the organiser. It must not silently move uncovered Tickets under a covered attendee's right.

Individual-attendee Session changes are excluded. They require a dedicated future model for participant-level Booking attribution, Products, Rules, Payment differences and replacement credentials.

## Cut-Off and Eligibility Semantics

Glacier evaluates eligibility using server time and the entitlement's snapshotted `cutoffMinutesBeforeSessionSnapshot` against the Booking's current Session start and timezone.

- Request submission must be before the cut-off.
- Approval must re-evaluate the cut-off and all operational facts.
- Submitting before cut-off does not reserve eligibility indefinitely.
- A request that becomes ineligible while awaiting review is declined/failed closed with safe explanation and no consumed use.
- No client-supplied time, eligibility flag, price, destination or use count is authoritative.

The first implementation provides no emergency or post-cut-off override under Flexible Ticket authority. Discretionary organiser actions remain separate Sprint 27/28 operations and must not consume an entitlement unless explicitly linked under valid rules.

## Request Lifecycle

Recommended lifecycle:

- `SUBMITTED` — customer created the request; no operational mutation occurred;
- `UNDER_REVIEW` — authorised operator opened/claimed the request;
- `APPROVED` — decision recorded and controlled execution is in progress;
- `COMPLETED` — linked adjustment/reschedule completed and entitlement use was consumed;
- `DECLINED` — authorised operator rejected the request with controlled reason;
- `WITHDRAWN` — customer withdrew before approval;
- `FAILED` — approval could not complete and no successful mutation/use consumption occurred;
- `EXPIRED` — request could no longer proceed under immutable cut-off/eligibility rules.

Terminal records are immutable. A new request requires remaining entitlement use and fresh eligibility. The service must prevent more than one active request for the same entitlement/action scope.

## Persistence and Audit Evidence

Introduce a dedicated request aggregate and bounded child/allocation records retaining at least:

- opaque public request reference;
- Organisation, Event, Booking and requester relationships;
- request type and lifecycle status;
- selected entitlement, participant and safe Ticket relationships;
- requested destination Session for Session-change requests;
- entitlement policy/version and relevant rights snapshots;
- request-time Session/cut-off/eligibility evidence;
- customer reason selected from a bounded enum and optional concise note;
- customer submission and withdrawal timestamps;
- reviewing/deciding User, controlled reason, factual note and timestamps;
- linked Ticket adjustment or Booking reschedule identity;
- idempotency identity, execution status and safe failure evidence;
- entitlement-use allocation and before/after remaining-use evidence; and
- created/updated/investigation indexes.

Do not store the raw Booking possession token, Ticket token, card data, bank data, health details or unnecessary free-form personal information. Customer and operator notes require length limits and guidance.

Database constraints must prevent:

- duplicate active request coverage for the same entitlement;
- cross-Booking, cross-Event or cross-Organisation linkage;
- more completed uses than the purchased limit;
- one request linking to multiple conflicting mutation results;
- reusing an idempotency key for different action content; and
- deleting historical request/use evidence through cascade behaviour.

## Public Security Boundary

Public request access extends the existing possession-scoped Booking authority; it does not create customer accounts.

- The raw Booking access token remains required for read, submit and withdraw.
- The API resolves the Booking and allowed entitlements from that token.
- Request payloads use safe identifiers but cannot nominate foreign Booking/Ticket/entitlement records.
- Unknown, foreign and mismatched identifiers return non-disclosing responses.
- Public responses contain only the customer's Booking-scoped request details and material status.
- Submission and withdrawal require rate limiting, validation and bounded idempotency.
- No request reference alone grants possession authority.

## Operator Permission Policy

| Capability | OWNER | Assigned MANAGER | STAFF | SCANNER | PUBLIC CUSTOMER |
| --- | ---: | ---: | ---: | ---: | ---: |
| View request on Booking | Yes | Yes | Existing support summary only if required | No | Own possession-scoped Booking |
| Mark under review | Yes | Yes | No | No | No |
| Approve/decline | Yes | Yes | No | No | No |
| Execute linked refund/reschedule | Through controlled approval | Through controlled approval | No | No | No |
| Withdraw before approval | No | No | No | No | Own request |
| Override eligibility/cut-off | No entitlement override | No entitlement override | No | No | No |
| Rewrite completed history/use | No | No | No | No | No |

Controller guards and service-level tenant/assignment checks must both enforce this matrix. OWNER retains Organisation-wide authority but is not an eligibility override.

## Financial and Price-Difference Boundary

### Cancellation/refund

- Ticket value uses the persisted Sprint 27 allocation.
- Fee refundability uses the immutable entitlement snapshot.
- Online refunds use the existing provider authority and reconciliation policy.
- Cash/standalone EFTPOS retain explicit external-action confirmation and evidence.
- No arbitrary refund amount may be entered through the customer request.
- Original Booking and Payment values remain historical and are not rewritten.

### Session change

The first controlled Session-change use remains compatible with Sprint 28's unchanged-price requirement.

- `CHANGE_NOT_PERMITTED` blocks a destination requiring an increase.
- `CUSTOMER_PAYS_DIFFERENCE` is recorded in the entitlement but additional-payment collection remains unsupported in this Sprint; therefore a price-increase destination is not executable.
- `KEEP_ORIGINAL_PRICE` can proceed only where the existing Sprint 28 comparison deems the Booking unchanged.
- `REFUND_DIFFERENCE` requires new credit/refund allocation and is therefore not executed in this Sprint.

The UI must not advertise unsupported price-difference outcomes. A later Sprint may add explicit additional-payment/credit authority.

## Customer Experience

On the secure Booking page:

- covered Tickets show current entitlement status, remaining uses and eligibility deadline;
- eligible actions are presented per covered Ticket;
- Session change appears only when the whole Booking meets the supported boundary;
- the review step states that submission is a request and not approval;
- refund review separates Ticket value and any eligible Flexible Ticket fee;
- Session-change review identifies the whole Booking and all affected Tickets/Products;
- the customer chooses a bounded reason and may add a short factual note;
- successful submission returns a stable request reference and expected next step;
- status history is visible without exposing internal operator notes; and
- withdrawal is available only before approval begins.

Do not promise timing, availability or refund completion beyond observed system state.

## Operator Experience

Booking investigation gains a **Flexible Ticket requests** area showing:

- request reference, type, submitted time and current status;
- covered participants/Tickets and entitlement versions;
- request-time and current eligibility;
- remaining-use consequence;
- refund or Session-change preview from the existing authoritative engine;
- customer reason/note with safe presentation;
- decision reason and mandatory operator note;
- separate high-impact confirmation before approval;
- linked adjustment/reschedule result; and
- immutable timeline and retry/investigation guidance.

The organiser should be able to distinguish requests needing action from completed/declined history. A broader cross-Event case queue may be added only if it can remain bounded and does not displace the Booking-level safe workflow.

## Notifications Boundary

The persisted request status is authority. Email/SMS delivery is not required for Sprint 30 completion unless an existing reliable notification path can be reused without broad scope expansion. The UI should clearly tell customers to revisit their secure Booking link and may display organiser contact details.

Future notification attempts must be recorded separately from request state so delivery failure cannot change eligibility or imply approval.

## Slice 1 — Request and Use Persistence

- add request type/status/reason and use-allocation enums;
- add request, selected-entitlement/Ticket and use-allocation records;
- add links to Ticket adjustment and Booking reschedule outcomes;
- enforce active-request, idempotency and use-count constraints;
- add investigation indexes and safe cascade/restrict behaviour;
- create deterministic forward-only migration; and
- add schema/service tests for relations and invariants.

## Slice 2 — Authoritative Eligibility and Public Request API

- possession-scoped request context/read endpoint;
- refund-request preview and submission;
- whole-Booking Session-change destination/preview and submission;
- immutable entitlement and server-time cut-off evaluation;
- bounded reason/note validation;
- exact idempotency and active-request protection;
- customer withdrawal before review/approval; and
- non-disclosing foreign/mismatched identifier handling.

## Slice 3 — Operator Review and Decision API

- OWNER/assigned MANAGER request inspection;
- claim/under-review transition where useful;
- fresh authoritative refund/reschedule preview;
- controlled approve/decline reasons and mandatory notes;
- separate high-impact execution confirmation;
- STAFF/SCANNER and unassigned denial;
- immutable decision evidence; and
- deterministic retry/investigation state.

## Slice 4 — Controlled Mutation and Entitlement Consumption

- invoke Sprint 27 adjustment/refund for approved covered Tickets;
- invoke Sprint 28 whole-Booking reschedule only under all-covered eligibility;
- link the existing mutation ledger to the request;
- consume entitlement uses atomically with successful controlled completion;
- retain no-use outcome for decline/withdraw/failure/expiry;
- prevent duplicate refund, replacement Ticket, capacity transfer or use consumption;
- preserve provider uncertainty and reconciliation states; and
- update entitlement lifecycle only when its remaining-use semantics require it.

## Slice 5 — Customer and Operator Presentation

- secure Booking entitlement action cards and deadlines;
- request review, submit, reference, status and withdrawal states;
- organiser Booking request review/decision panel;
- linked adjustment/reschedule evidence and safe failure guidance;
- responsive and keyboard-accessible states;
- endpoint/security register updates;
- operational runbook and support boundaries; and
- roadmap/Sprint closeout evidence.

## Required Automated Evidence

At minimum, prove:

1. Possession token can access only its own Booking requests; request reference alone grants nothing.
2. Foreign, cross-tenant, unassigned and mismatched identifiers fail without disclosure.
3. STAFF and SCANNER cannot decide or execute; OWNER and assigned MANAGER can.
4. Current policy and legacy Boolean never grant or alter purchased rights.
5. Refund requests select only active covered Tickets with refund rights and remaining uses.
6. Session-change requests require every active Ticket to be covered and eligible.
7. Cut-off uses server time and immutable snapshot at submission and approval.
8. Scanned, cancelled, adjusted, replaced, unpaid, expired or otherwise ineligible Tickets fail closed.
9. Request submission changes no Ticket, capacity, inventory, Payment or entitlement use.
10. Withdraw/decline/expire/fail consumes no use.
11. Successful refund approval links one Sprint 27 adjustment and consumes exactly one use per selected entitlement.
12. Successful Session change links one Sprint 28 reschedule, consumes one use per active covered Ticket and issues one replacement per participant.
13. Exact retry and concurrent approval cannot duplicate request, refund, Ticket replacement, capacity movement or use consumption.
14. Provider pending/failure preserves investigation evidence and does not falsely report completion.
15. Fee refundability is applied from the entitlement snapshot with explicit allocation.
16. Unsupported price increase/decrease and partial-coverage Session changes are rejected clearly.
17. Customer responses exclude operator-only notes, credentials and unrelated customer data.
18. Existing booking, Payment, Product, inventory, capacity, Ticket, scanner, refund, reschedule and reporting suites do not regress.

## Required Browser Acceptance

Use fictional local data and test-mode Payments.

1. Open a paid Booking with at least two Tickets and selective Flexible Ticket coverage.
2. Verify only the covered Ticket offers a refund request and the uncovered Ticket cannot be selected.
3. Submit a request, receive a stable reference and verify no immediate Ticket/refund/use change.
4. Revisit the secure Booking page and see the same submitted status.
5. Verify STAFF cannot approve; assigned MANAGER can inspect and OWNER can inspect.
6. Decline one request and confirm no entitlement use was consumed.
7. Submit a second eligible refund request, review authoritative values and approve through separate confirmation.
8. Verify exactly the selected Ticket is cancelled/refunded, unaffected Ticket remains active and one entitlement use is consumed.
9. Verify matching customer and organiser status plus linked adjustment evidence.
10. Use an all-covered unchanged Booking to submit a whole-Booking Session-change request.
11. Approve it and verify replacement Tickets, destination Session, capacity transfer and consumed uses.
12. Verify original credentials are denied and replacements resolve correctly.
13. Verify partial coverage, post-cut-off and duplicate submission/approval fail safely.
14. Direct persistence checks prove exact request, decision, linked mutation and use allocation with no duplicate or unrelated Product/inventory effect.

## Documentation Deliverables

- `docs/operations/FLEXIBLE_TICKET_REQUESTS_AND_USE.md`;
- `docs/sprint-notes/sprint-30.md`;
- API endpoint security register update;
- entitlement, adjustment/reschedule and Payment architecture updates;
- migration and idempotency evidence;
- customer/support wording marked pending commercial/legal approval where applicable; and
- roadmap position update reflecting the controlled-use foundation.

## Explicit Exclusions

Sprint 30 does not include:

- individual-attendee Session rescheduling;
- automatic customer refunds or unsupervised automatic Session changes;
- different-Event transfer;
- Ticket Type, Product, Variant or quantity changes during reschedule;
- price-increase collection, stored credit or price-decrease payout for Session changes;
- arbitrary goodwill amounts or Product/merchandise returns;
- post-cut-off or scanned-Ticket entitlement override;
- post-purchase entitlement addition/removal;
- POS/walk-up Flexible Ticket sale or use;
- broad customer accounts, portal or CRM;
- guaranteed email/SMS delivery;
- legal approval of Terms, Privacy Policy or refund wording;
- broad cross-Organisation support tooling; or
- production deployment, operational dashboard or unrelated UX redesign.

## Exit Gate

Sprint 30 closes only when:

- migration and request/use constraints are applied and verified;
- possession-token, tenant, role and assignment boundaries pass;
- request submission is proven non-mutating;
- controlled refund and whole-Booking Session-change approval reuse the existing ledgers;
- entitlement use is exact, atomic and idempotent;
- unsupported partial/price/cut-off scenarios fail closed;
- full automated suites and production builds pass without baseline regression;
- browser acceptance proves customer request, operator decision, linked mutation and matching status;
- direct persistence checks prove no duplicate use/refund/replacement/capacity/inventory effect;
- security, support and operational documentation is current; and
- the organiser accepts the browser workflow before remote push.

## Strategic Result

After Sprint 30, Glacier will have a complete supervised Flexible Ticket operating chain: approved policy → selective purchase → immutable entitlement → secure request → authorised decision → existing controlled refund/reschedule mutation → exact use consumption.

That closes the primary remaining customer-service workflow gap without weakening current financial or Ticket authority. Phase 3 production, security, privacy, infrastructure and rehearsal work should then become the primary delivery track, with any individual-attendee change or automatic decisioning promoted only from real operational evidence.
