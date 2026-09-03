# Staff Scanner Runbook

## Purpose

This runbook covers Event-day use of Glacier's authenticated Staff Scanner. It does not replace venue access, safety, refund or customer-service policy.

## Before Gates Open

1. Confirm production HTTPS, API health and venue connectivity.
2. In Event Settings, confirm the opening lead and closing grace. The default is 30 minutes before start and zero minutes after end.
3. Sign each device into a named staff account. Do not share an OWNER account at the gate when a SCANNER account is sufficient.
4. Select the correct active Event on every device.
5. Set gate devices to **Gate Entry — Automatic admission**.
6. Set POS/help-desk devices to **Ticket Lookup — Detailed POS view**.
7. Confirm the rear camera is permitted, or connect and test the hand scanner.
8. Test eligible, too-early, already-scanned and wrong-Event Tickets before admitting customers.
9. If an OWNER or assigned MANAGER reissues a compromised Ticket link, confirm the old QR is rejected and only the newly delivered QR is accepted. Never copy either credential into notes, chat or incident logs.

## Gate Entry

Gate Entry is intentionally automatic. A valid QR detection or hand-scanner submission immediately asks the server to admit the Ticket. There is no second approval button.

- **Entry granted:** admit the participant, then select **Scan next**.
- **Already scanned:** do not admit automatically; direct the customer to the help desk.
- **Too early / Entry window closed:** follow the Event's escalation policy. The scanner cannot override time policy.
- **Cancelled / Invalid for this Event / Not recognised:** do not admit; direct the customer to the help desk.
- **Unable to verify:** do not treat the Ticket as admitted. Restore connectivity or use the designated operational fallback.

## Ticket Lookup

Ticket Lookup reads first and does not change the Ticket.

1. Scan or enter the Ticket.
2. Review participant, Ticket, Session, entry window and current status.
3. Close the result to leave the Ticket unchanged; or, only when operationally appropriate, select **Process ticket**.
4. Verify the participant shown and select **Confirm entry**.

## Two-Device Pattern

- Gate device: Gate Entry, optimised for throughput.
- POS/help-desk device: Ticket Lookup, optimised for investigation and controlled admission.
- Both may process the same Event concurrently. Glacier permits only one successful `ACTIVE → SCANNED` transition.

## Connectivity and Camera Failure

Glacier has no offline admission mode. Loss of API connectivity fails closed.

- Keep a tested venue network and documented backup connection.
- Camera denial or absence does not grant entry and does not break manual/hardware input.
- Never infer admission from a QR image alone or from a previously loaded result.
- Record the incident and escalation decision outside Glacier if the venue invokes a manual continuity plan.

## Physical Device Sign-Off

Run this matrix on the intended production-like HTTPS environment before pilot use:

| Check                                                      | iPhone Safari | Android Chrome |
| ---------------------------------------------------------- | ------------- | -------------- |
| SCANNER login reaches `/staff/scanner`                     | Pending       | Pending        |
| Rear camera permission and live preview                    | Pending       | Pending        |
| Gate QR scan automatically grants one eligible Ticket      | Pending       | Pending        |
| Duplicate scan shows Already scanned                       | Pending       | Pending        |
| Ticket Lookup remains read-only until confirmation         | Pending       | Pending        |
| Camera stops during result review and resumes on Scan next | Pending       | Pending        |
| Camera denied state exposes manual/hardware fallback       | Pending       | Pending        |
| Network loss never shows Entry granted                     | Pending       | Pending        |
| Portrait layout is legible without horizontal overflow     | Pending       | Pending        |

Record device model, OS/browser version, tester, date and evidence reference when completing each column.

## Post-Event

1. Sign out shared venue devices.
2. Revoke or deactivate temporary SCANNER memberships that are no longer required.
3. Review scan-attempt outcomes for duplicate, invalid, wrong-Event and connectivity patterns.
4. Record operational incidents and feed changes into the next Event plan.
