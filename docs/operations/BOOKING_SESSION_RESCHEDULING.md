# Booking Session Rescheduling

## Purpose

This runbook governs Glacier's first-pilot whole-Booking Session-change workflow. It allows an OWNER or an Event-authorised MANAGER to move an eligible confirmed, paid Booking to another active Session in the same Event. It does not change the Booking contents or move money.

## Authority

- OWNER may act across Events in the authenticated Organisation.
- MANAGER may act only within current Event assignment scope.
- STAFF and SCANNER cannot preview or execute a Session change.
- No role may override a scanned, adjusted, cancelled, unpaid, late or otherwise ineligible Booking.
- Foreign and unassigned records use the same not-found boundary as unknown records.

## Before starting

From Booking investigation, verify the customer request and confirm that the Booking is the intended record. Glacier then authoritatively checks that:

- the Booking is confirmed and paid;
- every Ticket is active and unscanned;
- the original Session has not started;
- no Ticket adjustment or other Session change is in progress;
- the destination belongs to the same Event and is active and future;
- shared admission and every reusable Product have sufficient capacity;
- required Ticket Type, Product and Rule assignments remain valid; and
- contents, quantities, price and total remain unchanged.

The list of destination Sessions is a convenience view, not reserved inventory. Preview and execution repeat the checks.

## Procedure

1. Open **Bookings**, locate the Booking, and open its investigation record.
2. In **Change Session**, select a destination offered by Glacier.
3. Select the controlled reason and enter a concise factual explanation. Do not enter payment credentials, health details or unnecessary personal information.
4. Select **Review Session change**.
5. Read the high-impact review. Confirm the original and destination Session, Ticket count, admission transfer, reusable Product transfer and unchanged total.
6. Obtain any operational approval required by the organiser's policy.
7. Select **Confirm Session change** once.
8. Record the displayed `BR-...` reference when communicating the outcome.

Completion atomically moves the Booking, invalidates every original Ticket, issues exactly one replacement per participant, transfers shared admission and reusable Product commitments, and writes immutable evidence. Finite merchandise inventory and all Payment/refund records remain unchanged.

## Customer and gate handling

- The old Ticket page says **Replaced after Session change** and does not display its QR.
- Ticket Lookup and Gate Entry deny the old credential and show the safe replacement Ticket number.
- The replacement credential behaves as an ordinary active Ticket for the destination Session and remains subject to its configured entry window.
- Never grant entry against the cancelled original or manually mark it scanned.

The replacement number is operational identification only. Glacier never reveals or stores the replacement possession token in the reschedule audit response.

## Failure and retry

- A validation or capacity error means no move occurred. Re-read the error and choose another valid Session if appropriate.
- If execution returns an uncertain technical error, keep the page open and retry the same confirmation. The interface retains its idempotency identity so an exact retry returns the existing completed result instead of issuing another Ticket set.
- Do not start a new change with a different destination or repeated notes until Booking investigation and Session-change history prove the first attempt did not complete.
- Escalate persistent uncertainty to an OWNER with Booking number, attempted destination, approximate time and any displayed error. Do not include Ticket tokens.

## Investigation and reporting

The Booking retains its confirmed/paid status, total, contents and current destination Session. The Session-change ledger retains original/destination Session snapshots, reason, operator, capacity evidence and original-to-replacement Ticket-number mappings.

Event overview reporting counts completed Session changes and controlled reasons without customer or participant identity. Operational Session/Ticket attribution follows the Booking's current Session and excludes superseded credentials; gross Event, Ticket Type and Product commerce remains unchanged.

## Explicitly unsupported

- individual attendee movement;
- partially adjusted Booking movement;
- different-Event transfer;
- Ticket Type, Product, Variant, quantity or price changes;
- additional Payment, credit or refund;
- customer self-service or Flexible Ticket entitlement;
- scanned-Ticket or post-start override; and
- arbitrary replacement Ticket issuance.
