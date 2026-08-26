# Project Glacier — Pilot Operating Policy Decisions

**Prepared:** 25 August 2026

**Status:** Phase 1 direction substantially confirmed; commercial/legal values, pilot profile and ownership remain open

**Purpose:** Lock and preserve the minimum operating policies governing customer service, refunds, rescheduling, Flexible Tickets and walk-up workflows.

**Strategic source:** `PILOT_READINESS_AND_STRATEGIC_ROADMAP.md`, Phase 1.

---

# 1. Decision Principles

The first pilot should favour controlled, auditable staff workflows over maximum flexibility.

The proposed policies follow these principles:

- confirmed commerce is never silently rewritten;
- financial actions remain traceable to the original Booking and Payment;
- Tickets cannot remain valid when their underlying entitlement is cancelled or moved;
- capacity and inventory are released only when the approved action genuinely removes the entitlement;
- staff permissions follow least privilege;
- automatic behaviour must be deterministic and safe to retry;
- exceptional cases are escalated rather than repaired through direct database changes; and
- the pilot scope stays narrower than the eventual Glacier product.

---

# 2. Proposed Pilot Profile

The precise Event should be selected closer to rehearsal, but Phase 1 should assume:

- one Ice Rinks Australia Organisation;
- one deliberately bounded live Event;
- session-based admission with configurable entry windows;
- Adult, Child and Young Child Ticket Types sharing rink capacity;
- required/recommended Products such as Kangas;
- finite merchandise Variants;
- Stripe online payments;
- staff using the Organiser Platform and Scanner on approved devices;
- OWNER oversight during the live pilot; and
- no unsupported third-party or direct database operational intervention.

Volume, dates, venue, expected Booking count and intended scanner hardware remain to be nominated before Phase 4.

---

# 3. Refund and Cancellation Policy

## Recommended decision

Support controlled full and partial monetary refunds, but keep Booking cancellation separate from refunding money.

This distinction is important because a refund may be goodwill compensation without cancelling attendance, while cancellation must change Tickets and capacity.

## Confirmed commercial direction

Tickets are non-refundable by default and this must be clearly disclosed before purchase. Glacier must nevertheless support discretionary refunds because exceptional circumstances will arise.

Customers may also purchase a paid **Flexible Ticket** entitlement that makes the covered Ticket changeable and/or refundable under defined conditions.

This produces three separate eligibility paths:

1. **Default Ticket:** non-refundable under the ordinary commercial policy.
2. **Discretionary exception:** MANAGER within assigned scope or OWNER may approve a whole or partial exception with a mandatory reason.
3. **Flexible Ticket entitlement:** the customer purchased defined contractual change/refund rights, subject to recorded conditions.

No Glacier rule or public wording may attempt to override applicable law. Final eligibility language, mandatory rights, evidence requirements, deadlines and remedies require Australian legal review before live use.

## Flexible Ticket design requirements

Flexibility must be a durable entitlement attached to the covered Ticket(s), not inferred later from current Event settings or represented only as display text.

At purchase, Glacier must snapshot which Tickets are covered, the fee, allowed actions, cut-off and timezone, permitted-use limit, price-difference treatment, fee refundability, exclusions and accepted policy/version.

The booking journey must clearly show the default non-refundable position, optional fee, purchased benefit, material limits and final selection before payment. Confirmation and customer-service views must show the recorded entitlement.

It should not be an ordinary merchandise Product if that permits detachment from the covered Ticket, inventory consumption or bypass of enforcement. The implementation plan must select an explicit entitlement model after reviewing the existing schema.

## Recommended pilot defaults pending legal/commercial approval

- flexibility is selected per Ticket;
- its fee is persisted separately from Ticket face value;
- the fee is non-refundable unless required by law or the Event is cancelled;
- a covered Ticket may change Session before a defined cut-off;
- a price increase must be paid explicitly;
- a price decrease follows approved policy rather than silently creating credit;
- a flexible refund cancels only the selected Ticket and releases its capacity; and
- use is audited, including remaining rights where limited.

## Confirmed configuration model

Flexible Ticket terms are configurable rather than hardcoded:

- Organisation defaults provide a reusable baseline across Events;
- an Event may deliberately override the permitted settings;
- the setup/readiness interface must show whether each value is inherited or overridden;
- only authorised roles may change the policy;
- changes affect future purchases only; and
- every purchase snapshots the effective version so an existing customer's rights cannot be reduced or changed retrospectively.

Configurable fields include availability, fee calculation/amount, change rights, refund rights, cut-off, permitted-use limit, price-increase/decrease treatment and fee refundability. Public wording must be generated from or validated against the effective approved policy rather than contradicting it.

## Confirmed customer and staff workflow

- the purchaser can open a secure Booking-access link and see the eligibility of each Ticket;
- the purchaser can submit a change or refund request for the covered Ticket(s);
- Glacier may automatically complete a straightforward eligible Session change when the entitlement, cut-off, target availability, Ticket Type rules, Product rules, capacity and price treatment all permit it;
- the original Ticket is invalidated and its replacement issued only as one successful controlled operation;
- a customer refund request does not move money automatically during the first pilot;
- MANAGER within assigned scope or OWNER reviews and confirms the refund;
- STAFF may view the eligibility/request and prepare assistance but cannot approve the refund;
- MANAGER/OWNER can initiate the equivalent change/refund workflow from the organiser dashboard;
- discretionary exceptions always require MANAGER/OWNER approval and cannot be self-approved by the customer; and
- every request, automated decision, approval, denial, provider result and Ticket consequence is audited.

The secure Booking link is a bounded service surface, not a broad customer account/portal. It must use revocable high-entropy access, reveal only the relevant Booking, and apply rate limiting and privacy-safe responses.

Automatic change must fall back to a reviewable request when any eligibility result is uncertain, a price adjustment requires action, inventory/Product rules cannot be preserved, or a concurrent capacity change prevents completion.

## Proposed rules

### Full Booking cancellation

- MANAGER within assigned scope or OWNER may cancel a confirmed Booking.
- STAFF may prepare or request the action, but cannot finalise it.
- A cancellation reason is mandatory.
- Every active Ticket for the Booking becomes invalid immediately.
- Session admission capacity is released for all cancelled Ticket quantities.
- reusable per-Session Product capacity is released.
- finite Product/Variant commitments are released only if the goods have not been fulfilled or collected.
- cancellation does not automatically imply a refund; the operator must deliberately select the approved refund treatment.
- the original Booking and line records remain available for audit rather than being deleted.

### Full refund without cancellation

- MANAGER within assigned scope or OWNER may complete the action.
- A reason is mandatory.
- Tickets and reserved capacity remain valid unless cancellation is separately approved.
- The interface must clearly warn that entry remains allowed.

### Partial attendee/Ticket cancellation and refund

Partial cancellation/refund is a confirmed pilot requirement. For example, a Booking containing five Tickets must allow one attendee's eligible Ticket to be cancelled and refunded while the other four remain valid.

- the operator selects the exact Ticket/participant entitlement being cancelled;
- Glacier identifies the original Ticket Type line value and any Product entitlement attached specifically to that participant;
- the selected Ticket becomes invalid while all unselected Tickets remain unchanged;
- one place of shared Session admission capacity is released;
- reusable Session Product capacity linked to that participant is released where applicable;
- finite merchandise is returned to inventory only if it is explicitly cancelled and unfulfilled;
- the proposed refund is calculated from persisted original line values rather than current catalogue prices;
- the operator sees and confirms the exact refund amount before submission;
- a mandatory reason and acting User are audited;
- successful cumulative refunds cannot exceed successful collected value; and
- a provider failure cannot invalidate the Ticket or release capacity unless the approved operating policy explicitly permits cancellation without refund.

### Amount-only partial refund

A Manager or OWNER may issue a goodwill/price-adjustment refund that does not cancel any Ticket or Product entitlement. The interface must explicitly warn that admission, capacity and inventory remain unchanged.

### Discretionary exception

A default non-refundable Ticket may still receive a discretionary refund from a MANAGER within assigned scope or OWNER. Glacier must distinguish it from a Flexible Ticket claim, require a structured reason, display the recorded eligibility, audit the approver/outcome and report discretionary refunds separately.

### Failed or uncertain refund

- The Booking remains in its prior operational state.
- Glacier records the attempted action and provider result.
- Staff must not repeat the action blindly.
- The case moves to Payment investigation and OWNER escalation.

## Remaining confirmation required

- Whether cancellation after Session start is permitted or requires exceptional OWNER override.
- Whether fulfilled/collected merchandise needs a return-to-stock workflow in the first pilot.
- Flexible Ticket fee, rights, cut-off, permitted-use limit, price-difference treatment and fee refundability.
- Approved Terms, refund policy and checkout wording after legal review.

---

# 4. Rescheduling Policy

## Recommended decision

Support whole-Booking Session rescheduling only during the first pilot. Do not support moving individual Tickets independently.

## Proposed rules

- MANAGER within assigned scope or OWNER may reschedule a confirmed Booking to another Session in the same Event.
- STAFF may look up availability and prepare the change, but MANAGER or OWNER confirms it.
- the target Session must be active, eligible and have sufficient shared admission capacity;
- all existing Ticket Type quantities move together;
- required Product rules must remain satisfied in the target Session;
- reusable Product capacity must be available in the target Session;
- finite Event-wide inventory remains committed and does not move between Sessions;
- old Tickets are invalidated and replacement Tickets are issued;
- old Session capacity is released only after the target allocation succeeds;
- the operation must be transactional so failure cannot leave capacity split between Sessions;
- a reason is mandatory and both previous and new Session identities are audited; and
- any price difference is outside automatic rescheduling unless explicitly approved below.

## Recommended price treatment

For the first pilot, permit rescheduling only when the destination produces no price difference for the existing Booking contents. A different price should require cancellation/refund and a new Booking rather than an implicit charge or credit workflow.

## Implemented pilot boundary

Sprint 28 implemented same-price, whole-Booking-only rescheduling for OWNER and assigned MANAGER before Session start. It requires full eligibility, current capacity/Rule/Product compatibility and replacement Tickets. Scanned, partially adjusted, late and price-changing moves remain excluded. This is the accepted first-pilot operator boundary; Flexible Ticket customer authority is not inferred from it.

---

# 5. Ticket Replacement and Lookup Policy

## Recommended decision

Allow staff to resend or re-present an existing valid Ticket without changing its credential. Only issue a replacement credential when security or entitlement changes require invalidation.

## Proposed rules

- Lookup never processes entry automatically.
- Gate Entry processes an eligible Ticket automatically after a successful scan.
- resend/re-present preserves the existing Ticket identity and admission state;
- replacement invalidates the previous credential before the new one becomes usable;
- replacement requires an operator reason;
- an already-admitted Ticket cannot be reset through ordinary replacement;
- admission reversal, if later required, is OWNER-only and outside initial pilot scope; and
- wrong-Event, cancelled, replaced, early, late and duplicate Tickets return explicit non-entry outcomes.

## Confirmation required

- Whether Ticket delivery by email is mandatory for the pilot or browser presentation is sufficient as fallback.
- Whether an OWNER-only admission reversal is required before the first pilot.

---

# 6. Walk-Up Sales Decision

## Confirmed decision

Walk-up Ticket sales are mandatory for the first pilot. They traditionally represent approximately 50% of sales and are therefore a core Glacier commerce channel, not an optional operational add-on.

The first implementation must be functionally complete and share the same authoritative Ticket Types, Products, Rules, pricing, capacity and inventory as online booking. A later dedicated POS productisation Sprint may substantially improve the till-style visual design and speed, but it must build on this shared commerce foundation rather than create a separate POS catalogue or stock model.

## Minimum proposed scope

- staff select Event and Session;
- Glacier displays shared admission and Product availability;
- staff select Ticket Types and required/optional Products;
- participant/customer minimum details are captured;
- all normal Rules, capacity, inventory and totals remain backend-authoritative;
- payment is recorded through one approved method;
- Tickets are issued through the same fulfilment path;
- Waiver handoff remains available where required; and
- the Booking is marked with a controlled `WALK_UP` source for reporting.

## Session-selection behaviour

The POS must always have a clearly selected operational selling Session. Staff must be able to select and retain that Session manually, including selecting a future Session deliberately.

The intended convenience example is:

- from 9:30 am until immediately before 10:30 am, the default selling Session is the 10:00 am Session;
- at 10:30 am, the default automatically advances to the 11:00 am Session; and
- staff may override the default to sell a later eligible Session.

This does not need to be hardcoded. Traditionally, staff have manually changed the till to the next Session. Glacier should preserve that safe operating method while allowing an organiser to enable automatic scheduled advancement as a convenience.

The recommended model is a dedicated POS selling-Session setting:

- manual mode: staff explicitly choose the active selling Session and it remains selected until changed;
- optional automatic mode: Glacier advances at configured Session selling-window boundaries; and
- future Session override: staff may deliberately select another eligible Session for an individual sale.

If automatic mode is enabled and Sessions overlap or use different windows, Glacier must apply a deterministic order and clearly show the selected date/time before payment. A manual or future-Session selection must never be silently changed while a basket is in progress. Automatic advancement applies only to an empty/new sale, and the selected selling Session must remain prominent on the till.

## Explicit exclusions

- cash-drawer management;
- barcode stock receiving;
- complex discounts;
- split tender;
- offline payment synchronisation;
- exchanges; and
- a general retail POS programme.

## Confirmed merchandise-only sales

The pilot POS must support merchandise-only purchases as well as Ticket-plus-Product purchases.

Merchandise-only sales must:

- use the same Event Product and Variant catalogue as online/POS add-ons;
- enforce active status and finite Product/Variant inventory;
- support quantities and Variant selection such as hoodie size;
- use the same EFTPOS and cash payment methods and reconciliation controls;
- persist a clear merchandise-only sale source/type;
- decrement inventory only after confirmed payment;
- remain idempotent so retries cannot duplicate inventory consumption;
- not consume Session admission capacity;
- not issue Tickets or require participant details; and
- not require a Session unless the organiser has intentionally made that Product Session-specific.

Reusable Session-capacity Products such as Kangas are not ordinary merchandise-only items and cannot be sold without an eligible Session. Rules that require a Product because of a Ticket Type do not apply when no Ticket is being sold.

The implementation must determine whether the current Booking model can safely represent a sale without a Session or whether an additive POS Order/Sale model is required. It must not fake a Session or Ticket merely to satisfy the existing schema.

## Confirmed payment methods

Walk-up sales must accept both EFTPOS and cash.

No existing terminal or provider constrains the pilot. Hardware will be purchased or rented to support Glacier, and the platform must preserve the ability to change providers.

The confirmed architecture is provider-neutral:

- **Universal standalone mode:** any suitable EFTPOS terminal can process the card independently; staff then deliberately confirm the approved amount in Glacier.
- **Optional integrated mode:** a provider-specific adapter may create/observe a terminal payment and return a normalised outcome to Glacier.
- **Shared Glacier contract:** POS completion, Booking/Order fulfilment and reconciliation consume Glacier's normalised payment result rather than provider-specific behaviour.

Standalone mode is the required pilot baseline because it provides the broadest hardware compatibility. Direct integration is optional and should only be added for a deliberately selected provider after its Australian availability, device support, API behaviour, fees, certification and operational reliability are assessed.

Candidate integrated adapters identified from prior organiser experience are:

- Stripe Terminal;
- bank-operated EFTPOS terminals connected through Linkly; and
- Square terminals/readers.

These are candidates rather than committed dependencies. Before selecting the physical pilot setup, Glacier must compare their current Australian hardware availability, integration model, supported payment flows, refunds, failure/status behaviour, network requirements, fees, certification/compliance obligations and ability to operate across the intended web/device environment.

The normalised adapter contract should cover at least: create payment request, provider/device reference, approved, declined, cancelled, timed out, uncertain, refund capability where supported, status lookup and safe idempotent recovery. Provider-specific capabilities must not leak into the core Booking/Order fulfilment contract.

Glacier must never record a standalone EFTPOS or cash payment as a Stripe payment. Glacier must not receive, persist or log raw card number, expiry, CVV or PIN data in either mode.

Both methods require:

- an explicit payment-method selection before completion;
- deliberate staff confirmation that payment was received;
- a persisted method and amount against the Booking;
- staff identity and completion timestamp;
- idempotent completion so a repeated action cannot duplicate fulfilment;
- separate EFTPOS and cash totals in reconciliation/reporting;
- Tickets issued only after payment receipt is confirmed; and
- a controlled correction/escalation path for an incorrectly confirmed payment.

An integrated adapter should additionally support provider reference capture, deterministic status mapping, idempotency and safe handling of approved, declined, cancelled, timed-out and uncertain results. A timeout must never be treated as a decline or retried blindly when the provider may have charged the customer.

Cash tendered and change calculation are useful till conveniences but do not replace the authoritative amount due. Cash-drawer opening, float management and end-of-day till balancing remain outside the first functional slice unless required for pilot reconciliation.

## Remaining confirmation required

- Should the pilot default to manual selling-Session control, optional automatic advancement, or automatic advancement by default?
- If automatic advancement is enabled, should POS use a separate configurable sales-window value rather than the admission-entry window?
- Which terminal/provider will be selected for the physical pilot, after the provider-neutral baseline is implemented?

---

# 7. Confirmed Role Direction

The existing OWNER/MEMBER model is insufficient for pilot operations. Glacier requires at least:

- **OWNER:** Organisation governance and unrestricted authorised oversight. Ordinarily one OWNER per Organisation.
- **MANAGER:** trusted operational administration, including authorised refunds, cancellations and rescheduling within assigned scope.
- **STAFF:** daily POS, scanner, lookup and customer-service preparation without high-risk financial or Organisation-governance authority.

The implementation must preserve existing memberships safely while introducing the new roles. Existing MEMBER records require an explicit migration/default decision rather than accidental privilege elevation.

Because Managers correspond operationally to sites, Glacier must also distinguish role from scope. A MANAGER role does not automatically imply authority across every future site or Event in the Organisation. The implementation plan must inspect the current Venue/Event model and choose a tenant-safe assignment mechanism—such as Organisation-wide versus selected Event/site scope—without fabricating a site concept that the data model cannot yet enforce.

Organisation ownership transfer, inviting/removing Managers and changing roles remain OWNER-only. Glacier should protect against leaving an Organisation without an active OWNER.

---

# 8. Proposed Permission Matrix

| Action | STAFF | MANAGER | OWNER | Proposed pilot rule |
|---|---:|---:|---:|---|
| View assigned Booking/customer/Ticket | Yes | Yes | Yes | Tenant and assignment scoped |
| Use Ticket Lookup / Gate Entry | Yes | Yes | Yes | Existing mode rules retained |
| Complete walk-up sale | Yes | Yes | Yes | Approved payment methods only |
| Resend/re-present valid Ticket | Yes | Yes | Yes | No entitlement change |
| Prepare cancellation/reschedule | Yes | Yes | Yes | No mutation until authorised |
| Replace Ticket credential | No | Yes | Yes | Reason and invalidation required |
| Cancel whole/partial Booking entitlement | No | Yes | Yes | Exact entitlement, reason and audit |
| Complete Session reschedule | No | Yes | Yes | Approved scope and capacity checks |
| Issue whole/partial monetary refund | No | Yes | Yes | Amount/reason/provider result audited |
| Investigate Payments | Proposed read-only | Yes | Yes | No mutation through investigation |
| Change Event operational settings | No | Assigned scope | Yes | Sensitive changes may remain OWNER-only |
| Manage Organisation roles/ownership | No | No | Yes | Governance boundary |
| Reverse admission | No | No | Proposed no | Outside initial scope unless promoted |

This matrix can be loosened after pilot evidence. It should not begin overly permissive.

---

# 9. Audit Requirements

Every sensitive operation must persist:

- Organisation and Event context;
- Booking, Payment, Ticket and Session identifiers as applicable;
- action type;
- previous and resulting state;
- acting User and role;
- timestamp;
- mandatory operator reason;
- requested and successful refund amounts where applicable;
- Stripe/provider reference and result where applicable;
- idempotency/retry identity; and
- failure outcome without falsely recording success.

Audit records must not contain raw card details, Ticket credentials, access tokens or unnecessary participant/customer data.

---

# 10. Event-Day Ownership and Escalation

The pilot must nominate named people for:

- Event operational lead;
- Glacier OWNER approver;
- gate/scanner lead;
- customer-service lead;
- Payment/reconciliation lead;
- technical incident lead; and
- privacy/security escalation.

Severity recommendations:

- **Critical:** security/privacy exposure, incorrect charges, widespread Ticket rejection, capacity corruption or unrecoverable service outage — pause affected operations and invoke rollback/fallback.
- **High:** material Payment/refund failure, scanner degradation or incorrect inventory/capacity affecting multiple customers — escalate immediately and use approved workaround.
- **Normal:** isolated support issue with a safe documented workaround — record and resolve through ordinary support.

Named people, contact methods, response expectations and manual fallback procedures are required before rehearsal.

---

# 11. Decisions Required to Close Phase 1

The organiser must approve or amend these items:

1. Tickets are non-refundable by default, with MANAGER/OWNER discretionary exceptions and an optional paid Flexible Ticket entitlement. **Confirmed direction; exact terms require commercial/legal approval.**
2. Whole and partial refunds/cancellations are available to MANAGER and OWNER; STAFF may prepare but not complete them. Cancellation and refund remain separate actions. **Confirmed direction.**
3. Cancelling releases admission and reusable Product capacity; finite goods return only if unfulfilled.
4. Flexible Ticket rights are snapshotted against covered Tickets at purchase and enforced from that snapshot. **Confirmed direction.**
5. Flexible Ticket customers may request per-Ticket change/refund through secure Booking access. Straightforward eligible Session changes may complete automatically; refunds require MANAGER/OWNER confirmation during pilot. **Confirmed.**
6. Rescheduling invalidates only affected old Tickets and issues replacements transactionally.
7. Glacier introduces OWNER, MANAGER and STAFF access levels, with scope separated from role. **Confirmed direction.**
8. Ordinary Ticket resend does not rotate credentials; replacement does.
9. Admission reversal is excluded unless explicitly promoted.
10. Walk-up Ticket sales are mandatory and use the same catalogue, Rules, capacity and inventory as online sales. **Confirmed.**
11. POS has a prominent active selling Session, supports manual retention/change and permits deliberate future-Session selection. Optional automatic advancement may be enabled but must never change an in-progress sale. **Confirmed direction; pilot default remains to be locked.**
12. Walk-up sales accept EFTPOS and cash through a provider-neutral contract; no raw card data enters Glacier. **Confirmed.**
13. Merchandise-only sales are required, share inventory and payment reconciliation, and do not create admission/Tickets. **Confirmed.**
14. Flexible Ticket uses Organisation defaults with Event overrides and immutable purchase-time policy snapshots. **Confirmed.** Exact commercial values and public/legal wording remain to be approved.
15. Migration/default treatment for existing MEMBER memberships and the Manager site/Event assignment model.
16. Pilot Event profile, dates, expected volume, devices and staff roles.
17. Named operational, Payment, technical and privacy/security owners.

Once these decisions are approved, this document becomes the Phase 1 baseline and the next implementation Sprint can be locked without hidden policy assumptions.
