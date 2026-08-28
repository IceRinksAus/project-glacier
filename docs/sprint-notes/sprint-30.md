# Sprint 30 — Flexible Ticket Requests and Controlled Entitlement Use

## Status

Implemented and browser-accepted on 28 August 2026 under the locked scope in `docs/roadmap/sprint-30-plan.md`.

## Delivered

Glacier now connects immutable purchased Flexible Ticket rights to a supervised operating workflow. A customer holding the Booking's high-entropy possession credential can inspect safe eligibility, submit a cancellation/refund request for an individually covered Ticket, submit a whole-Booking Session-change request only when every active Ticket is covered, revisit durable status and withdraw a still-submitted request.

Submission, review, decline and withdrawal are case actions only. They do not themselves cancel Tickets, move capacity, change Products or inventory, move money or consume an entitlement use. An OWNER or Event-assigned MANAGER must claim review, record a controlled reason/note, inspect a fresh authoritative preview and separately confirm the decision. STAFF and SCANNER have no decision authority.

Approved refund requests reuse the Sprint 27 Ticket-adjustment/refund ledger. Approved Session changes reuse the Sprint 28 unchanged whole-Booking reschedule ledger. The request records the linked `TA-...` or `BR-...` identity, exact retry converges on the same mutation, and one use allocation is written only after successful completion. Declined, withdrawn and failed requests consume no use.

## Persistence and authority

Two forward-only migrations add the request, selected-item and use-allocation records plus controlled Flexible Ticket mutation reasons. Database constraints protect request lifecycle/link consistency, bounded notes and exact remaining-use transitions. Local migration history now contains 43 migrations.

Eligibility always derives from the immutable Sprint 29 entitlement snapshot plus current operational facts. Current Event policy, marketing wording, the legacy Booking `flexibleBooking` Boolean, Payment metadata and organiser discretion cannot create entitlement authority. The customer request reference alone grants no access.

## Customer and organiser presentation

The secure Booking-management route keeps the raw possession credential in the browser fragment rather than the query string. It presents covered participant/Ticket identity, remaining uses, request deadline, eligible actions, safe destination Sessions and customer-visible history. Copy consistently states that a request is not approval or proof of refund.

Booking investigation now presents requests beside immutable entitlement, Ticket and Payment evidence. The organiser workflow records attributable review, approve/decline choice, controlled reason/note, a high-impact consequence preview and a distinct confirmation action. Refund previews show the authoritative Ticket value. Session-change previews name the destination and retain the existing capacity, Rule, Product and unchanged-price boundaries.

## Automated verification

Final verification passed:

- complete API suite: 81 suites / 555 tests;
- complete dashboard/public web suite: 28 files / 84 tests;
- API TypeScript and production build;
- web TypeScript and webpack production build; and
- repository whitespace/error check.

Coverage includes possession-token denial, response minimisation, selective eligibility, whole-Booking coverage, cut-off/use/Ticket checks, exact request replay, duplicate prevention, OWNER/MANAGER assignment enforcement, controller role metadata, decline/no-use behaviour, controlled refund/reschedule delegation, completion-only use allocation, customer and organiser component behaviour and retained Sprint 27–29 regression coverage.

## Browser acceptance

Acceptance used fictional local bookings and Stripe test mode.

Selective booking `PG-1787805997005-3873` contained two active Tickets and one covered Adult entitlement. Customer access offered refund only for the covered Adult and clearly rejected a whole-Booking move because the Child was uncovered. Submitting `FTR-1787872897415-4DB5FF` left both Tickets active, created no adjustment and retained one use. OWNER review and decline recorded attributable controlled evidence; the customer immediately saw `DECLINED`, with no use consumed.

A second request, `FTR-1787873853212-46F040`, produced an authoritative `$24.00` Ticket-refund preview. After explicit user confirmation, Stripe test refund completed successfully as `TA-1787876004205-B7FF07`. Only the selected Adult Ticket was cancelled, the Child Ticket remained active, the non-refundable `$5.00` Flexible Ticket fee was untouched, and the exact entitlement use moved from one to zero. Organiser investigation and customer status both showed `COMPLETED` with the linked adjustment evidence.

All-covered one-Ticket booking `PG-1787804852362-4863` offered the alternate 12:00pm Session. Request `FTR-1787876052991-CBA1BA` was reviewed and approved through the separate high-impact confirmation. Reschedule `BR-1787876066219-A503F5` completed: the original Ticket was cancelled, one replacement Ticket was issued for the destination Session, the Booking Session changed, Payment remained unchanged and the one entitlement use was consumed. The customer view followed the replacement Ticket and showed the linked completed reschedule.

Acceptance also identified and corrected ambiguous organiser wording so the entitlement card now labels its immutable reference as **Original Ticket** and its status as **Entitlement** status rather than implying the original Ticket remains active after replacement.

## Security and operations

`docs/operations/FLEXIBLE_TICKET_REQUESTS_AND_USE.md` records the customer, organiser, refund, Session-change, status, failure/retry and pre-live boundaries. The API endpoint register and architecture/security documents now record all public and management endpoints, possession-token hashing, fragment handling, tenant/assignment authority, response minimisation, idempotency and completion-only use allocation.

## Deferred boundary

Sprint 30 does not add individual-attendee Session moves, different-Event transfers, Ticket/Product/quantity changes during a move, price-difference settlement, automatic customer decisions, post-purchase coverage, POS Flexible Ticket use, merchandise returns, arbitrary goodwill values, guaranteed notifications or legal approval.

An entitlement whose immutable snapshot says its Flexible Ticket fee is refundable with the Ticket fails closed until Glacier has an explicit fee-to-Payment refund allocation. The fee is never hidden inside Ticket value or handled as an unrecorded amount.

With the supervised Flexible Ticket operating chain complete, Phase 3 production-platform and security hardening becomes the primary roadmap track.
