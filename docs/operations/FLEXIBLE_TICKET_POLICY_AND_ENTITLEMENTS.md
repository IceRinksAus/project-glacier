# Flexible Ticket Policy and Entitlements

Flexible Ticket is a paid, per-Ticket service entitlement. It is not a Product, consumes no inventory or Session admission capacity, and does not make Glacier's ordinary Tickets refundable by default.

## Configuration workflow

1. The Organisation OWNER opens **Settings** and creates an Organisation default draft.
2. The OWNER reviews the fee, rights, cut-off, permitted uses, price-difference treatment, fee refundability and customer wording.
3. Publishing makes that version available prospectively. Published versions are never edited in place.
4. In an Event's **Settings**, the OWNER selects:
   - **Inherit default** to use the Organisation's current published default;
   - **Event override** to draft and publish Event-specific terms; or
   - **Not offered** to suppress the offer for future purchases.
5. An assigned MANAGER may inspect the effective Event policy and readiness state but cannot change commercial governance.

Changing configuration affects future reservations only. Every purchased entitlement retains its own fee, policy version, customer summary and material-terms snapshots.

## Purchase and activation

The public booking journey offers Flexible Ticket immediately after Ticket selection and before catalogue Product add-ons. Customers may cover all eligible Tickets, choose particular Ticket units, or decline. Changing Ticket quantities invalidates stale coverage and causes the offer and price consequence to be presented again.

The browser submits selected Ticket-unit/participant identities only. The API independently resolves the effective published policy, persisted Ticket prices, eligibility, fee and authoritative Booking total. Flexible Ticket appears as its own charge and never as merchandise.

Coverage remains `PENDING` while the reservation is unpaid. Confirmed successful Payment issues the Tickets and activates each selected participant's entitlement against the corresponding issued Ticket and Payment evidence. Failed, cancelled or expired Payment does not create active rights. Reconciliation and repeated provider events safely converge on the same charge and entitlement records.

## Evidence and investigation

Customer confirmation and possession-scoped Booking access show which named Ticket holders are covered, the active state and the corresponding safe Ticket number. The organiser Booking investigation view shows the same participant, fee, policy version, rights snapshot, cut-off and remaining-use evidence.

Only the persisted entitlement and immutable snapshot are authority. Operators must not infer coverage from the deprecated Booking-level `flexibleBooking` Boolean, current policy settings, a note, Payment metadata or customer assertion.

## Current operational boundary

Sprint 29 records and presents purchased rights. It does not yet:

- consume an entitlement or decrement remaining uses;
- accept or approve a customer change/refund request;
- move a Ticket or Booking to another Session under entitlement authority;
- issue a refund, credit or additional charge;
- add or remove coverage after Payment; or
- sell Flexible Ticket through POS.

Customer and operator views therefore state that online self-service use is unavailable. Until the controlled-use workflow is delivered, support staff must use existing authorised procedures and must not manually alter entitlement evidence.

## Security and data-integrity boundary

- Organisation governance is OWNER-only.
- Event policy inspection remains tenant- and assignment-scoped.
- Public reads remain bound to the existing Booking possession credential.
- Published versions and completed entitlement snapshots are immutable.
- Raw possession tokens, Payment credentials and unnecessary customer data are excluded from policy and audit records.
- Cross-Organisation and unassigned identifiers retain Glacier's non-disclosing not-found boundary.

## Pre-live requirement

Customer summaries and material terms require commercial/legal approval before a live Event. Wording must retain the default non-refundable Ticket position, applicable-law qualification, cut-off and availability limitations. A technically published local policy is not evidence of that approval.
