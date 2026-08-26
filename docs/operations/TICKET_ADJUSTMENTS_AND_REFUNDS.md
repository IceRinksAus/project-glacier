# Ticket Adjustments and Discretionary Refunds

## Purpose

Glacier sells Tickets as non-refundable by default. This workflow allows an authorised OWNER or MANAGER to record a documented exception against individual admission Tickets without cancelling the remainder of the Booking.

## Before adjusting a Ticket

Confirm the Booking, participant, Session and Ticket with the customer. The Ticket must be ACTIVE in a confirmed, paid Booking. SCANNED, CANCELLED, foreign, unpaid or otherwise ineligible Tickets cannot be adjusted. STAFF and SCANNER roles cannot prepare or execute adjustments.

The review screen is authoritative. It shows the exact persisted Ticket value, number of admission places released, original payment method and Products that remain unchanged. Do not promise a refund until Glacier reports it as successful.

## Actions

- **Cancel only** invalidates the selected Ticket and releases one shared Session admission place. It does not move money.
- **Cancel and refund** invalidates the Ticket, releases capacity and refunds or records the exact persisted Ticket value.

Every action requires a controlled reason and a meaningful operator note. Glacier retains the operator, time, selected Tickets, value allocation, payment relationship and result in an immutable adjustment history. Retries use the same adjustment/idempotency identity and must not release capacity or refund twice.

## Payment procedures

### Online card

Glacier requests the exact partial refund through the configured payment provider. A pending or failed result is not proof that the customer received money. Leave the original Payment and Booking values unchanged and escalate uncertain provider outcomes for reconciliation.

### Cash

Return the cash physically before selecting the final confirmation. The confirmation records that the named operator completed an external physical action; Glacier does not move cash itself.

### Standalone EFTPOS

Complete the refund on the external terminal first. Record the bounded terminal/refund reference when prompted, then confirm the matching amount in Glacier. Never enter card numbers, bank details, PINs or terminal credentials.

## What remains unchanged

Unaffected Tickets remain valid and scannable. The Booking remains confirmed. Products, reusable equipment and merchandise remain attached and continue to consume their existing capacity or inventory. Original Booking Items and Payment amounts are historical records and are not rewritten.

For example, cancelling an Adult Ticket from a Booking that also contains a Young Child Ticket and a Kanga releases one admission place and refunds only the Adult Ticket value. The Young Child Ticket and Kanga remain unchanged.

## Escalation

Do not override a scanned Ticket. Do not create an arbitrary goodwill amount, Product refund, exchange, reschedule or mixed-tender allocation through this workflow. For an uncertain online provider result, retain the failed/pending adjustment evidence and escalate to an OWNER for provider reconciliation. Do not repeat a refund with a new adjustment merely because the first result is unclear.

## Reporting boundary

Successful Ticket-adjustment allocations reduce the relevant Ticket Type's net Ticket sales. Legacy and automatic refunds without authoritative Ticket allocation remain separately disclosed as unallocated refunds. Product reporting stays gross because Products are not refunded by this workflow.
