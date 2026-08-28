# Flexible Ticket Requests and Controlled Use

## Purpose

This runbook governs the supervised first-pilot use of Flexible Ticket rights. A customer request is not approval and does not itself cancel a Ticket, change a Session, release capacity, alter inventory, consume an entitlement or move money.

Only an active persisted Flexible Ticket entitlement and its immutable purchase snapshot establish rights. Current Event settings, the legacy Booking `flexibleBooking` Boolean, customer statements, Payment metadata and informal notes are not authority.

## Customer procedure

1. Open the secure Booking-management link supplied on confirmation. Treat this link like a Ticket because it contains a private possession credential in its browser fragment.
2. Review the covered participant, Ticket, remaining uses and request deadline.
3. Choose an available action:
   - **Request cancellation/refund** for an individually covered eligible Ticket; or
   - **Request a different Session** only when Glacier confirms that every active Ticket in the unchanged Booking is covered and eligible.
4. Select a bounded reason and optionally add a short factual note. Do not enter card/bank details, credentials or detailed health information.
5. Review the statement that submission is not approval, then submit once.
6. Retain the `FTR-...` reference and revisit the secure link for status.
7. A `SUBMITTED` request may be withdrawn before organiser review. Later states require organiser contact.

Do not promise a refund, destination Session or completion time from submission alone.

## Organiser procedure

OWNER or Event-assigned MANAGER:

1. Open the Booking investigation record and locate **Flexible Ticket requests**.
2. Confirm the customer, Booking, participant, Ticket and request reference.
3. Select **Review request**. This records attributable review but changes no commerce.
4. Choose approve or decline and record a concise factual decision note.
5. Select **Review decision** and read the high-impact preview.
6. For approval, confirm the exact Ticket refund or whole-Booking destination/capacity consequence. Glacier rechecks the immutable entitlement, remaining use, deadline, Ticket state and existing mutation rules.
7. For Cash or standalone EFTPOS, complete the matching external refund first and record the required confirmation/reference. Never enter card data or a PIN.
8. Select the separate **Confirm approval** or **Confirm decline** action once.
9. Communicate an outcome only from the recorded final state and linked `TA-...` or `BR-...` evidence.

STAFF and SCANNER cannot review or decide requests. OWNER is not an eligibility override.

## Refund boundary

Approved refunds use the existing Sprint 27 Ticket-adjustment ledger and persisted Ticket value. Unaffected Tickets remain active; Products remain unchanged. Online provider, Cash and standalone EFTPOS evidence retains the existing refund runbook boundary.

If the purchased snapshot says the Flexible Ticket fee is refundable with the Ticket, approval currently fails closed because the fee requires a separate explicit Payment allocation. Do not hide that fee inside Ticket value or issue an unrecorded manual amount. Escalate until the allocation capability is delivered.

## Session-change boundary

Approved Session changes use the existing Sprint 28 whole-Booking ledger. Every active Ticket must have an eligible entitlement and one use is consumed from each only after completion. All original Tickets are replaced and existing capacity/Product/Rule checks remain authoritative.

Individual-attendee movement, partial coverage, content/quantity changes, different Events and price-difference collection/credit are unsupported. Contact with the organiser does not permit bypassing these constraints under entitlement authority.

## Status meanings

- `SUBMITTED` — customer case recorded; nothing changed.
- `UNDER_REVIEW` — authorised organiser began review; nothing changed.
- `APPROVED` — controlled execution is underway or awaiting a provider outcome; do not claim completion.
- `COMPLETED` — linked controlled action completed and exact entitlement use was recorded.
- `DECLINED` — request refused with controlled evidence; no use consumed.
- `WITHDRAWN` — customer withdrew before review; no use consumed.
- `FAILED` — controlled action did not complete; no use consumed. Investigate before accepting a new request.
- `EXPIRED` — deadline/current eligibility elapsed before completion; no use consumed.

## Failure and retry

If approval returns an uncertain technical result, keep the Booking open and retry the same decision. Glacier derives the downstream idempotency identity from the request so exact retry converges on the same adjustment/reschedule and final use allocation.

Do not create a discretionary adjustment or reschedule merely because a Flexible Ticket decision appears delayed. First inspect request, linked mutation and Payment/provider status. A pending refund is not proof the customer received money.

## Pre-live requirements

- Commercial/legal approval of customer terms and default non-refundable wording.
- Named request-review owners and response expectations.
- Provider, Cash and EFTPOS refund rehearsal.
- Physical device and accessibility acceptance of the customer and organiser pages.
- Monitoring/support guidance for approved requests with pending or failed linked mutations.
