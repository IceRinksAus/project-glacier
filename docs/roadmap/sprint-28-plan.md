# Sprint 28 Plan — Controlled Whole-Booking Session Rescheduling

## Planning Status

Scope confirmed on 26 August 2026. This plan must be reviewed and committed before implementation begins.

## Recommendation

Sprint 28 should deliver Glacier's first controlled Booking-change workflow: an authorised OWNER or Event-scoped MANAGER can move an eligible confirmed Booking from its current Session to another active Session in the same Event, while Glacier atomically transfers admission and reusable Product commitments, invalidates the original Tickets and issues replacement Tickets.

This Sprint is deliberately narrower than general exchanges or Flexible Tickets. Every active Ticket in the Booking moves together, the Booking contents and price remain unchanged, and the destination must satisfy the same authoritative rules as the original purchase.

## Objective

Allow an authorised operator to inspect an eligible Booking, select a valid destination Session, review the exact operational consequences and execute one auditable, idempotent reschedule without:

- overselling shared Session admission capacity;
- overselling reusable Session Product capacity;
- changing Ticket Types, Products, quantities or prices;
- leaving valid credentials for both Sessions;
- partially moving the Booking after failure; or
- weakening Organisation, Event or assignment isolation.

## User Outcome

From Booking investigation, an OWNER or assigned MANAGER can:

1. see whether the Booking is eligible to move;
2. see valid destination Sessions in the same Event;
3. preview admission and Product capacity effects;
4. see which Tickets will be invalidated and replaced;
5. record a controlled reason and mandatory explanatory note;
6. explicitly confirm the high-impact operation;
7. receive the completed reschedule reference and replacement Tickets; and
8. review immutable previous/new Session and Ticket evidence later.

Unaffected commerce history remains intact. No money moves and no Booking contents are repriced.

## Protected Foundations

Sprint 28 must preserve:

- shared Session admission capacity across Ticket Types;
- Ticket Type, Product, Variant and Rule authority;
- finite Event-wide inventory and reusable per-Session Product capacity as separate concepts;
- backend-authoritative Booking snapshots and pricing;
- existing Stripe, Cash and standalone EFTPOS Payment evidence;
- Sprint 27 Ticket-adjustment and refund history;
- Ticket scan timing, lookup and atomic admission rules;
- Event assignment and Organisation tenant boundaries;
- public Ticket possession-token security; and
- immutable historical Booking and Payment records.

## Locked Eligibility Policy

The first rescheduling slice accepts only a Booking that:

- belongs to the authenticated Organisation and an Event within the operator's current assignment scope;
- is `CONFIRMED` and `PAID`;
- has a current Session and at least one issued Ticket;
- has only `ACTIVE` Tickets;
- has no scanned, cancelled or otherwise adjusted Ticket;
- has no completed or in-progress Ticket adjustment;
- has not reached the original Session start time according to server time;
- is not already in another reschedule operation; and
- can move in full without changing its contents or price.

A Booking containing a partially cancelled/refunded Ticket is ineligible in Sprint 28. This avoids silently reviving cancelled Tickets or moving only part of a Booking under a whole-Booking policy. A later policy may deliberately support active-entitlement-only movement after operational evidence.

OWNER is not a bypass for eligibility, scan state, time, capacity, pricing, Event ownership or idempotency.

## Destination Session Policy

The destination Session must:

- belong to the same Event as the Booking;
- be active and different from the current Session;
- start in the future according to server time;
- remain within the Event's valid schedule;
- have sufficient shared admission capacity for every active Ticket;
- support every Ticket Type in the unchanged Booking under current Event rules;
- have every required Session Product assignment;
- have enough reusable Product capacity for the unchanged Booking quantities; and
- produce no price difference for the existing Ticket and Product contents.

The preview and execution services must independently revalidate these conditions. A valid preview does not reserve capacity indefinitely and does not guarantee later execution if concurrent demand consumes availability.

## Price and Commerce Boundary

Sprint 28 permits same-price Session moves only.

- Ticket Types, Product/Variant selections, quantities, unit-price snapshots, GST and Booking total remain unchanged.
- No additional Payment, refund, credit, goodwill value or price-difference balance is created.
- Finite Event-wide Product/Variant inventory remains committed to the Booking and does not decrement or replenish again.
- Reusable Session Product commitments move from the original Session to the destination Session.
- Merchandise-only Retail Sales are not Bookings and cannot be rescheduled.

If the destination would require different contents or money, Glacier must deny the move and direct the operator to the separately controlled cancellation/refund and new-Booking path.

## Capacity Authority

Execution must transfer capacity as one serializable operation:

- reserve the required shared admission places in the destination;
- verify reusable destination Product capacity;
- update the Booking and its Session-bound records to the destination;
- release the corresponding original Session admission and reusable Product commitments exactly once; and
- retain before/after evidence in the reschedule ledger.

The Booking must never consume both Sessions after completion, neither Session after failure, or a mixture after interruption. Concurrency tests must prove that only available destination capacity can be committed.

Capacity calculations must continue to account conservatively for confirmed Bookings during Ticket replacement. The implementation must not create a transient public availability window that double-sells the released original capacity before the move is durable.

## Ticket Replacement Authority

Successful rescheduling changes the admission entitlement and therefore requires new credentials.

- every original ACTIVE Ticket becomes `CANCELLED` or a dedicated replacement-invalidated state only if that state is proven safe across all consumers;
- the original Ticket's public token becomes unusable immediately;
- one replacement Ticket is issued for each original Ticket/participant;
- each replacement points to the destination Session through the updated Booking authority;
- old-to-new Ticket relationships and numbers are retained in immutable reschedule allocations;
- no raw public Ticket token is stored in audit records;
- retries return the already-issued replacements rather than issuing duplicates; and
- customer presentation and scanner lookup clearly reject original credentials while accepting replacements under normal timing rules.

Sprint 28 must inspect whether the existing `CANCELLED` result communicates replacement clearly enough. Presentation may say **Replaced after Session change** using the reschedule relationship without introducing a new Ticket state unnecessarily.

## Immutable Reschedule Ledger

Introduce an aggregate such as `BookingReschedule` with immutable Ticket mappings and Product/capacity snapshots. It must retain at least:

- Organisation, Event and Booking ownership;
- reschedule number and client idempotency key;
- lifecycle state;
- original and destination Session IDs plus names/start-time snapshots;
- requesting operator and role evidence;
- controlled reason and mandatory bounded note;
- Ticket count and admission places transferred;
- reusable Session Product quantities transferred;
- old/new Ticket mappings and safe number snapshots;
- created, completed and failed timestamps;
- failure code/message suitable for operations but free of credentials; and
- recovery identity needed to finish or safely replay an interrupted operation.

Original Booking history must remain reconstructable. Updating the Booking's current Session is operational authority; the reschedule ledger is historical authority.

## Controlled Reasons

Initial reasons should include:

- customer request;
- Event or Session operational issue;
- organiser correction;
- Flexible Ticket entitlement reserved for later use, not selectable until implemented; and
- other, requiring a detailed note.

The first three and other are available to authorised operators. No customer entitlement is inferred from the reason.

## Permission Policy

| Capability                             | OWNER |             MANAGER |                                  STAFF | SCANNER |
| -------------------------------------- | ----: | ------------------: | -------------------------------------: | ------: |
| View reschedule history                |   Yes | Assigned/all Events |      Existing read-only Booking access |      No |
| View eligibility/destinations          |   Yes | Assigned/all Events | No mutation preparation in first slice |      No |
| Preview move                           |   Yes | Assigned/all Events |                                     No |      No |
| Execute move                           |   Yes | Assigned/all Events |                                     No |      No |
| Override scanned/adjusted/late Booking |    No |                  No |                                     No |      No |

Controller guards and service-level access checks must both enforce this policy. Foreign and unassigned records use Glacier's privacy-safe not-found boundary.

## Preview and Execution Contract

Preview must return a short-lived signed/opaque reference or equivalent server-verifiable parameter hash binding:

- Booking;
- original and destination Sessions;
- selected unchanged Booking contents;
- Ticket identities/states;
- admission and reusable Product quantities;
- price/no-price-difference result;
- operator Organisation/Event scope; and
- expiry.

Execution must require that exact preview authority plus a client idempotency key. It must re-read all mutable state and fail safely if Session status, time, access, Ticket state, Rules, or capacity changed.

No destination capacity, price, Ticket count or Product effect supplied by the browser is authoritative.

## Failure and Recovery

- Validation failure creates no reschedule and changes no Booking, Ticket or capacity state.
- A concurrency loss returns a clear destination-unavailable result without partial mutation.
- A database interruption must roll back the entire transfer and Ticket replacement.
- A retry with the same idempotency key returns the same completed result.
- A retry with a different key against an already-moved Booking must not repeat the move accidentally.
- Notification or email delivery, if invoked, occurs after durable completion and cannot roll back operational truth.
- Failed Ticket delivery leaves replacements retrievable from the secure browser/dashboard surfaces.

Because Sprint 28 has no external financial provider call, the authoritative move should complete within a database transaction with appropriate isolation and bounded retry.

## Slice 1 — Persistence and State Contract

- add controlled reschedule lifecycle/reason enums;
- add Booking reschedule and immutable Ticket-mapping persistence;
- retain original/destination Session and Product/capacity evidence;
- add idempotency and one-active-operation constraints;
- add investigation indexes;
- establish old/new Ticket relationship without exposing tokens;
- create a deterministic forward-only migration; and
- add schema/service tests for uniqueness and relations.

## Slice 2 — Eligibility and Preview

- load the tenant- and assignment-scoped Booking authority;
- reject unpaid, non-confirmed, scanned, cancelled, adjusted, late and foreign Bookings;
- list only valid same-Event destination Sessions;
- evaluate admission capacity, Ticket Type/Rule compatibility and reusable Product capacity;
- verify unchanged contents and price;
- disclose finite inventory as unchanged;
- return exact Ticket/Product/capacity consequences; and
- issue short-lived execution authority.

## Slice 3 — Atomic Execution and Ticket Replacement

- require the preview authority and idempotency key;
- revalidate access and all mutable state;
- transfer admission and reusable Product commitments transactionally;
- update Session-bound Booking records;
- invalidate every original Ticket;
- issue exactly one replacement per original Ticket;
- complete the immutable ledger; and
- provide deterministic replay and concurrency behaviour.

## Slice 4 — Booking Investigation Interface

Add a separated **Change Session** workflow for OWNER/MANAGER:

- eligibility summary and precise denial reasons;
- destination Session selection with date, time and remaining capacity;
- explicit statement that every Ticket moves together;
- unchanged Ticket Types, Products, quantities and total;
- reusable Product transfer and finite-inventory explanation;
- reason and mandatory note;
- high-impact confirmation naming old/new Session and replacement count;
- duplicate-submission protection;
- completion result with reschedule number and replacement Tickets; and
- immutable reschedule history on the Booking.

STAFF must not receive a superficially disabled mutation as a substitute for API enforcement.

## Slice 5 — Consumer Behaviour, Reporting and Operations

- public presentation rejects old credentials and presents replacements normally;
- Ticket Lookup/Gate Entry reject old Tickets and accept replacement Tickets within normal windows;
- Booking investigation/search indicates a Session change without rewriting history;
- Session reporting attributes the current Booking/Tickets/capacity to the destination and does not double-count the original;
- Event/Ticket Type/Product gross sales remain unchanged;
- audit/reporting can identify reschedule count and operational reasons without PII expansion;
- add the operator runbook and endpoint/security register updates; and
- record automated, persistence and browser evidence in Sprint notes.

## Required Automated Evidence

At minimum, prove:

1. OWNER and correctly assigned MANAGER can preview/execute; STAFF, SCANNER, foreign and unassigned actors cannot.
2. Cross-Organisation Booking, Session and Ticket identifiers fail without disclosure.
3. Original/current same Session, different Event, inactive, past and full destinations fail.
4. Unpaid, non-confirmed, scanned, cancelled, partially adjusted and late Bookings fail.
5. Shared admission capacity transfers exactly once.
6. Required reusable Product capacity transfers exactly once; finite inventory remains unchanged.
7. Current Rules and destination assignments are revalidated.
8. Price or content difference fails without mutation.
9. All original Tickets become unusable and exactly one replacement per participant is issued.
10. Existing public, lookup and gate paths return correct old/new Ticket outcomes.
11. Exact idempotent retry returns one reschedule and one replacement set.
12. Concurrent attempts cannot oversell capacity, split the Booking or issue duplicate Tickets.
13. Transaction failure leaves Booking, Sessions, Products and Tickets unchanged.
14. Reporting moves operational attribution without changing gross commerce totals.
15. No raw token, Payment credential or unnecessary customer data enters audit output.

## Required Browser Acceptance

Use fictional local data.

1. OWNER opens an eligible confirmed, paid multi-Ticket Booking before Session start.
2. The interface lists same-Event destination Sessions and excludes invalid Sessions.
3. Preview states that all Tickets move, shows old/new Session, exact admission places and reusable Products, and confirms price/products remain unchanged.
4. The interface requests separate confirmation immediately before the reschedule.
5. After approval, one reschedule completes and replacement Tickets are visible.
6. The Booking remains confirmed and paid with the same total and contents.
7. Old Ticket lookup denies entry as replaced/cancelled; a replacement Ticket validates for the destination under normal entry timing.
8. Original Session capacity increases and destination capacity decreases by the same Ticket count.
9. Reusable Product capacity transfers; finite merchandise inventory is unchanged.
10. Exact browser retry does not create another reschedule or Ticket set.
11. An assigned MANAGER succeeds on an authorised Event and is denied on an unassigned Event.
12. STAFF and SCANNER cannot access the mutation surface or endpoint.

## Documentation Deliverables

- `docs/operations/BOOKING_SESSION_RESCHEDULING.md`;
- `docs/sprint-notes/sprint-28.md`;
- API endpoint security register update;
- schema/architecture and migration evidence where applicable;
- reporting definition update; and
- roadmap position update reflecting completed Sprint 26–28 foundations.

## Explicit Exclusions

Sprint 28 does not include:

- individual Ticket/attendee rescheduling;
- partially adjusted Booking rescheduling;
- customer self-service or secure Booking change requests;
- Flexible Ticket configuration, purchase or entitlement use;
- any price increase, credit, refund or additional Payment;
- different-Event transfer;
- Ticket Type, participant, Product, Variant or quantity changes;
- Product returns or inventory restocking;
- scanned-Ticket or post-start override;
- full Booking cancellation;
- arbitrary Ticket replacement unrelated to Session change;
- email-template redesign or guaranteed delivery; or
- broad exchange/customer-portal functionality.

## Exit Gate

Sprint 28 closes only when:

- migrations are applied and verified;
- automated tests and production builds pass without baseline regression;
- tenant, role, assignment, concurrency and idempotency evidence passes;
- authenticated browser acceptance proves the complete old-to-new Session and Ticket journey;
- direct persistence checks prove one ledger, correct capacity/Product transfer and exactly one replacement set;
- operational and security documentation is current; and
- the organiser accepts the browser workflow before push.

## Strategic Result

After Sprint 28, Glacier will have controlled operator foundations for walk-up commerce, merchandise-only commerce, individual Ticket cancellation/refund and whole-Booking Session changes. The next planning decision can then choose between Flexible Ticket/customer-request authority, the operational portfolio dashboard, or beginning the production/security-hardening track based on pilot criticality rather than unfinished transaction integrity.
