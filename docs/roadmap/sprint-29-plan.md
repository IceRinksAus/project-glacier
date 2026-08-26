# Sprint 29 Plan — Flexible Ticket Policy, Purchase and Entitlement Foundation

## Planning Status

Scope confirmed on 27 August 2026. This plan must be committed before implementation begins.

## Recommendation

Sprint 29 should establish Flexible Ticket as a first-class, versioned commercial entitlement purchased for specific Tickets. It must replace the meaning implied by the legacy Booking-level `flexibleBooking` Boolean without treating flexibility as merchandise, inventory or an informal operator note.

This Sprint creates and sells the entitlement. It does not consume the entitlement, accept a customer change/refund request, automatically move a Ticket, or send money. Those later actions must rely on the immutable rights created here and on the controlled adjustment/reschedule ledgers delivered in Sprints 27–28.

## Objective

Allow an Organisation to define approved Flexible Ticket defaults, allow an Event to deliberately inherit or override them, and allow a purchaser to add flexibility to selected Ticket participants while Glacier:

- calculates the fee from server-authoritative policy and persisted Ticket prices;
- includes the fee in the Booking total and existing Payment flow;
- snapshots the exact purchased rights and wording per covered Ticket;
- prevents later configuration changes from altering sold rights;
- exposes clear coverage and terms in customer and operator views; and
- preserves tenant, pricing, Ticket, Product, capacity and Payment foundations.

## User Outcome

An OWNER can establish Organisation defaults and configure an Event as inherited, deliberately overridden or unavailable. During public booking, immediately after tickets are added to the basket, the customer receives a concise add-on offer such as **Want peace of mind? Make your tickets flexible for changes or cancellation from $X per ticket.** The customer can accept for all eligible tickets, choose individual tickets or clearly decline, then review the exact fee and material rights before payment. The completed Booking later shows exactly which issued Tickets are covered.

OWNER, assigned MANAGER and authorised support readers can inspect the recorded entitlement on a Booking. No role can use or rewrite that entitlement in Sprint 29.

## Protected Foundations

Sprint 29 must preserve:

- default non-refundable Ticket policy and applicable-law qualification;
- backend-authoritative Booking pricing and reservation expiry;
- one shared Session admission capacity pool across Ticket Types;
- Product, Variant, Rule, reusable capacity and finite inventory semantics;
- online Stripe and walk-up Cash/standalone EFTPOS evidence;
- Ticket issuance and participant identity mapping;
- Sprint 27 adjustment/refund and Sprint 28 reschedule ledgers;
- Organisation, role and Event-assignment isolation;
- public Booking possession-token security; and
- append-only historical commerce and audit evidence.

## Commercial Boundary

Flexible Ticket is a service entitlement, not a Product.

- It consumes no inventory or Session capacity.
- It is selected per Ticket participant, not for the Booking as an indivisible whole.
- Its fee is a distinct immutable Booking charge with persisted calculation evidence.
- It is paid in the same transaction as the covered Ticket.
- It cannot be added or removed after Payment in Sprint 29.
- A pending reservation may be recreated or safely recalculated through the existing authoritative booking flow; confirmed commerce is never edited in place.
- The fee's eventual refundability is recorded as a right snapshot, but Sprint 29 does not execute a refund.

## Configuration Authority

### Organisation defaults

OWNER can maintain a versioned default policy containing:

- availability;
- fee calculation method and value;
- whether Session changes are permitted;
- whether refund requests are permitted;
- cut-off duration before Session start;
- permitted-use limit;
- price-increase treatment;
- price-decrease treatment;
- fee-refundability treatment;
- customer-facing summary and material terms; and
- policy/version identity and effective status.

Initial fee methods may support a fixed amount per covered Ticket and a percentage of the persisted Ticket face value. All money calculations use decimal-safe server logic and explicit rounding. Unsupported or incomplete configuration cannot be published.

### Event policy

OWNER configures each Event in one of three explicit modes:

- **INHERIT** — use the currently published Organisation default for future purchases;
- **OVERRIDE** — use an Event-owned published policy version; or
- **DISABLED** — do not offer flexibility for future purchases.

The Event setup/readiness surface must show the mode, effective policy source, version and material values. MANAGER may inspect but not govern commercial policy in the first slice. Publishing a new version affects future reservations only.

Deleting or editing a published policy in place is forbidden. A new version supersedes it prospectively.

## Purchase-Time Authority

The public browser may submit only selected participant identities. The API independently resolves:

- Organisation and Event;
- effective published policy and version;
- participant/Ticket Type price snapshots;
- eligibility;
- per-Ticket fee;
- total flexibility charge;
- Booking total; and
- material rights/writing to snapshot.

The final review must separately show Ticket subtotal, Product subtotal, Flexible Ticket fees and total. It must state that ordinary Tickets are non-refundable by default and describe the selected paid benefit without promising rights outside the effective policy or applicable law.

Selection must remain bound to participants through reservation and Ticket issuance. Quantity-only coverage without participant identity is insufficient.

## Public Add-On Offer and Journey

Flexible Ticket must feel like an optional Ticket add-on in the customer journey even though its persistence is a dedicated entitlement rather than a catalogue Product.

- The offer appears when the customer continues after adding one or more eligible Tickets to the basket, before ordinary Product add-ons.
- On desktop it may use an accessible modal or focused interstitial; on mobile it may use a bottom sheet or dedicated step. The interaction must work without hover and retain keyboard/focus accessibility.
- The headline uses concise peace-of-mind language and immediately states the exact per-Ticket fee or applicable percentage-derived amount.
- Material benefits and limits are summarised in plain language, with expandable full terms.
- The primary choices are **Add to all eligible tickets**, **Choose tickets**, and a clear **No thanks** path.
- Choosing individual coverage identifies Ticket units by Ticket Type/position initially and binds them deterministically to the corresponding participant and issued Ticket later in the journey.
- The basket updates immediately with a separately labelled Flexible Ticket amount. It must not appear inside merchandise/add-on grouping or consume Product quantities.
- Declining does not block checkout and must not trigger repeated interruption within the same unchanged booking journey.
- If Ticket quantities/types later change, Glacier must revalidate coverage and show the offer/price consequence again rather than silently charging or dropping flexibility.
- The review page repeats selected coverage, exact total fee and material rights before Payment.
- Wording must avoid implying unconditional cancellation/refund rights and remains marked for commercial/legal approval before live use.

## Immutable Entitlement Evidence

Introduce explicit version and entitlement aggregates, with names confirmed during schema design, that retain at least:

- Organisation, Event, Booking, participant and issued Ticket relationships;
- immutable public entitlement/reference number;
- source policy and published version;
- inherited/overridden source evidence;
- Ticket Type and face-value snapshot;
- fee method, input, calculated amount, currency and rounding evidence;
- change/refund rights;
- Session-relative cut-off and timezone evidence;
- permitted-use limit and initial remaining uses;
- price increase/decrease treatment;
- fee refundability;
- customer-facing summary/material-terms snapshot;
- purchase and Payment/confirmation state linkage;
- creation/activation timestamps; and
- future-safe lifecycle fields without granting current consumption authority.

The entitlement becomes active only when the Booking's existing successful confirmation/Payment authority completes. Expired or failed reservations must not create active rights.

No raw access token, Payment credential or unnecessary customer data belongs in policy or entitlement audit records.

## Legacy `flexibleBooking` Treatment

The current Booking-level Boolean is not proof of purchased flexibility.

- Existing records must not be upgraded into entitlements by inference.
- New public/POS inputs must stop treating the Boolean as commercial authority.
- The field may remain temporarily for migration compatibility but must be deprecated, always false for new authority, and excluded from eligibility decisions.
- Removal may occur only after all consumers and local fixtures are migrated and verified.
- Any existing true record must be reported for manual investigation rather than silently converted.

## Eligibility and Cut-Off Semantics

Sprint 29 records rights but must still prevent obviously invalid sales:

- the Event must have an effective published and available policy;
- the selected participant must belong to the same new reservation;
- fee input must use the persisted server Ticket price;
- the Session must be sufficiently before the configured cut-off at reservation confirmation according to server time;
- zero, negative, malformed or excessive configuration is rejected;
- one entitlement may cover a Ticket at most once; and
- concurrent or repeated confirmation cannot duplicate the entitlement or fee.

The exact later change/refund eligibility is evaluated when a right is used, using the immutable snapshot and current operational facts. Purchase does not guarantee destination availability or override applicable law.

## Permission Policy

| Capability | OWNER | MANAGER | STAFF | SCANNER | PUBLIC PURCHASER |
| --- | ---: | ---: | ---: | ---: | ---: |
| Govern Organisation defaults | Yes | No | No | No | No |
| Govern Event override/disable | Yes | No | No | No | No |
| Inspect effective Event policy | Yes | Assigned Events | No | No | Public material terms only |
| Select coverage before purchase | No operator shortcut | No operator shortcut | POS deferred | No | Own pending reservation only |
| View purchased entitlement | Yes | Assigned Events | Existing Booking support scope | No | Possession-scoped Booking only |
| Consume/change/refund entitlement | No | No | No | No | No |

Controller guards and service-level tenant/assignment checks must both enforce this matrix. Cross-Organisation and unassigned identifiers use Glacier's non-disclosing not-found boundary.

## Payment, Idempotency and Failure Policy

- Flexibility fees form part of the existing Booking total before PaymentIntent creation.
- Stripe metadata is not commercial authority; persisted Booking charges and entitlements are.
- Cash/standalone EFTPOS purchase support is excluded until the POS journey deliberately exposes per-participant selection; no hidden default may charge walk-up customers.
- Repeated reservation/confirmation/webhook processing creates at most one charge and entitlement per covered Ticket.
- Failed or expired Payment leaves no active entitlement.
- A late successful Payment follows existing late-success investigation protections and must not create unreviewed duplicate rights.
- Configuration changes between reservation creation and confirmation must not silently reprice a valid reservation; the reservation-bound version remains authoritative for its existing bounded lifetime.
- Any inconsistency fails closed and is visible for investigation without exposing credentials.

## Slice 1 — Persistence and Policy Contract

- add policy status/source/fee/right enums;
- add versioned Organisation policy and Event mode/override persistence;
- add immutable Booking charge and per-participant/Ticket entitlement persistence;
- add uniqueness, active-version and investigation indexes;
- define currency, decimal rounding and bounded configuration validation;
- define legacy Boolean deprecation handling;
- create a deterministic forward-only migration; and
- add schema/service tests for constraints and relations.

## Slice 2 — Authoritative Configuration Services

- OWNER-only Organisation default draft/publish/version workflow;
- OWNER-only Event inherit/override/disable workflow;
- tenant-safe effective-policy resolver;
- prospective-only version changes;
- Event readiness integration;
- MANAGER assigned-Event inspection without mutation; and
- audit-safe policy summaries without customer data.

## Slice 3 — Public Quote and Reservation Integration

- expose only effective public material terms;
- trigger the optional add-on offer immediately after eligible Tickets enter the basket and before Product add-ons;
- provide add-all, choose-tickets and clear-decline paths without repeated interruption;
- carry pre-participant Ticket-unit selections forward and bind them deterministically to participants;
- calculate fixed/percentage fees server-side;
- revalidate and clearly re-offer after covered Ticket quantities/types change;
- show Ticket, Product and flexibility subtotals;
- bind selections and policy version to the reservation;
- include charges in authoritative Booking total and Payment creation;
- reject stale, foreign, duplicate or ineligible selections; and
- stop accepting the legacy Boolean as authority.

## Slice 4 — Confirmation and Ticket Entitlement Activation

- activate exactly one entitlement per covered Ticket after confirmed successful commerce;
- bind participant coverage to the issued Ticket;
- retain immutable fee/rights/terms snapshots;
- support deterministic Payment/webhook replay;
- leave failed/expired reservations inactive;
- expose safe entitlement references, not credentials; and
- preserve late-success investigation behaviour.

## Slice 5 — Organiser and Customer Presentation

- Organisation default and Event override settings with source/version clarity;
- Event readiness indication;
- accessible responsive add-on prompt/interstitial, basket state and review presentation;
- confirmation/secure Booking view showing covered Tickets and recorded rights;
- Booking investigation view showing fee, policy version, rights and unused state;
- explicit statement that online self-service use is not yet available;
- accessibility and responsive-state coverage; and
- operational documentation and endpoint/security register updates.

## Required Automated Evidence

At minimum, prove:

1. Only OWNER can govern policy; scoped MANAGER can inspect; STAFF, SCANNER, foreign and unassigned actors cannot mutate.
2. INHERIT, OVERRIDE and DISABLED resolve deterministically and tenant-safely.
3. Published versions are immutable and configuration changes affect only future reservations.
4. Invalid fees, rights, cut-offs, terms and version transitions fail.
5. Public responses reveal only approved material terms and no internal/customer data.
6. Per-participant selection cannot cover a foreign, missing or duplicate participant.
7. Fixed and percentage fees use persisted Ticket prices, decimal-safe rounding and correct totals.
8. Products, inventory, admission capacity and Ticket face values are unchanged by flexibility.
9. Payment creation includes the exact persisted flexibility charge.
10. Successful confirmation creates one active entitlement per covered Ticket.
11. Failed/expired Payment creates no active entitlement; late-success handling remains controlled.
12. Exact retries and duplicate webhooks cannot duplicate fees or entitlements.
13. A policy change after reservation does not silently reprice its bounded quote.
14. Legacy `flexibleBooking` values never grant rights.
15. Cross-tenant identifiers fail without disclosure and audit output contains no sensitive token or unnecessary PII.
16. Existing online booking, POS, refund, reschedule, reporting, Ticket and scanner suites do not regress.

## Required Browser Acceptance

Use fictional local data.

1. OWNER creates and publishes an Organisation default.
2. One Event visibly inherits it; another deliberately overrides or disables it.
3. Assigned MANAGER can inspect but cannot change policy; STAFF cannot access governance.
4. Customer adds at least two Tickets and receives the add-on offer before ordinary Product add-ons.
5. Customer tests add-all, clear decline and choose-tickets behaviour, then applies flexibility to only one Ticket.
6. Changing Ticket quantity forces an accurate coverage/price revalidation without a hidden charge.
7. Review separately shows Ticket, Product, flexibility and total values plus material terms.
8. Booking completes through Stripe test mode without duplicate charge.
9. Confirmation and public Booking access show one Ticket covered and one not covered.
10. Organiser Booking investigation shows the same immutable version, fee and rights.
11. Changing the published policy afterward does not alter the completed entitlement.
12. A new reservation receives the new effective version and price.
13. Disabled Event and post-cut-off scenarios do not offer or accept flexibility.
14. Direct persistence verification proves one charge and one entitlement for the selected Ticket, with no inventory/capacity side effect.

## Documentation Deliverables

- `docs/operations/FLEXIBLE_TICKET_POLICY_AND_ENTITLEMENTS.md`;
- `docs/sprint-notes/sprint-29.md`;
- API endpoint security register update;
- Booking/Payment and entitlement architecture updates;
- migration evidence and legacy-field disposition;
- public commercial/legal wording marked pending approval where applicable; and
- roadmap position update reflecting the completed foundation.

## Explicit Exclusions

Sprint 29 does not include:

- customer change/refund request submission;
- automatic or operator entitlement consumption;
- individual-Ticket or whole-Booking rescheduling under entitlement authority;
- any new refund, credit or additional-payment execution;
- price-difference collection or credit;
- post-purchase entitlement addition/removal;
- POS/walk-up flexibility sales;
- broad customer accounts or portal;
- email/SMS template redesign or guaranteed delivery;
- legal approval of Terms, Privacy Policy or refund wording;
- promotion/discount codes, subscriptions, memberships or insurance; or
- the operational portfolio dashboard or production deployment work.

## Exit Gate

Sprint 29 closes only when:

- the migration is applied and verified;
- policy/version/entitlement constraints and legacy handling are proven;
- server-authoritative fee and Payment integration passes concurrency/idempotency tests;
- tenant, role and assignment boundaries pass;
- full automated suites and production builds pass without baseline regression;
- authenticated and public browser acceptance proves configuration, selective purchase, confirmation and immutable history;
- direct persistence checks prove exact fee/coverage and no capacity/inventory side effect;
- security, operations and architecture documentation is current; and
- the organiser accepts the browser workflow before remote push.

## Strategic Result

After Sprint 29, Glacier will possess durable commercial authority for Flexible Tickets. Sprint 30 can then safely implement secure customer requests and controlled entitlement use against the proven Sprint 27 refund and Sprint 28 reschedule foundations, without inventing rights at service time.
