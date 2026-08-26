# Flexible Ticket Governance

Flexible Ticket is a paid, per-Ticket service entitlement. It is not a Product, does not consume inventory or Session capacity, and does not make Glacier's ordinary Tickets refundable by default.

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

The public booking journey offers Flexible Ticket immediately after Ticket selection. Customers may cover all eligible Tickets, choose particular Ticket units, or decline. The API recalculates the fee from persisted Ticket prices and includes it in the authoritative Booking total.

Coverage remains `PENDING` while the reservation is unpaid. Confirmed successful Payment issues the Tickets and activates each selected participant's entitlement against the corresponding Ticket and Payment. Failed, cancelled or expired Payment does not create active rights. Duplicate provider events safely reconcile the same records.

## Current operational boundary

Sprint 29 records and presents purchased rights. It does not yet consume an entitlement, move a customer to another Session, approve a cancellation, or issue a refund automatically. Customer confirmation and operator Booking investigation views therefore state that self-service use is unavailable and direct the customer to the organiser.

Operators must not treat the legacy Booking-level `flexibleBooking` Boolean as proof of coverage. Only a persisted Flexible Ticket entitlement and its immutable snapshot are authoritative.

## Pre-live requirement

Customer summaries and material terms require commercial/legal approval before a live Event. The wording must retain the default non-refundable Ticket position, applicable-law qualification, cut-off and availability limitations.
