# POS Merchandise Sales Runbook

## Purpose

Merchandise Sale mode is for counter purchases that do not include admission. It creates a `RetailSale`, immutable line snapshots and a Payment. It does not create a Booking, Customer, participant, Session relationship or Ticket.

## Operator procedure

1. Open **Point of Sale** and choose **Merchandise Sale**.
2. Select the Event. Only Events available to the signed-in operator may be used.
3. Add eligible merchandise and select a Variant where required.
4. Select **Review payment**. Glacier rechecks catalogue eligibility, price, quantity limits and shared stock, then creates a short reservation.
5. For standalone EFTPOS, wait for the separate terminal to approve. Glacier must never receive or store card details. Add the bounded terminal reference when available.
6. For Cash, count the amount received.
7. Select the matching method and confirm the exact displayed total once.
8. Retain the Sale number for later investigation.

The browser total is indicative until review. The server-authoritative total on the confirmation screen is the amount that must be received.

## Inventory behaviour

Tracked Product and Variant stock is shared with eligible Product sales attached to admission Bookings. An active merchandise reservation temporarily commits stock. Completion makes that commitment permanent; expiry releases it. Configured inventory is not destructively rewritten.

Session-required or capacity-controlled Products, including reusable Session equipment, do not appear in merchandise mode. Untracked Products may be sold without presenting a false finite stock number.

## Investigation

Use **Find merchandise Sales** from POS. Choose the Event and optionally search by Sale number. Merchandise Sales remain separate from the Booking list so admission and retail records cannot be confused.

The record shows Sale/payment state, lines, total, method, reference where supplied, receiving operator and timestamps. Cash, standalone EFTPOS and online card are distinct methods.

## Expiry, retries and corrections

- An expired unpaid Sale cannot be completed; start a new Sale.
- A safe exact completion retry returns the original completion and does not create a second Payment.
- A reused idempotency key with different payment details is rejected.
- Sprint 26 does not provide void, refund, return, exchange or restock actions.
- If the wrong item, amount or method is confirmed, stop and escalate to a Manager or Owner. Do not create an offsetting or fictional Booking.

## Access and privacy

OWNER, MANAGER and STAFF may use POS only within their Event scope. SCANNER cannot access the route or API. Merchandise mode collects no purchaser identity and accepts no raw card data.
