# Sprint 29 — Flexible Ticket Policy, Purchase and Entitlement Foundation

## Status

Implemented and browser-accepted on 27 August 2026 under the locked scope in `docs/roadmap/sprint-29-plan.md`.

## Delivered

Glacier now treats Flexible Ticket as a first-class paid service entitlement for selected Tickets rather than as merchandise or a Booking-wide Boolean. An Organisation OWNER can create and publish immutable default policy versions. Each Event can explicitly inherit that default, publish an Event-specific override, or disable the offer. Assigned MANAGER users may inspect effective policy but cannot govern it.

The public journey presents the optional peace-of-mind offer immediately after Ticket selection and before Product add-ons. A customer can cover all eligible Ticket units, choose specific units or decline. Changed Ticket quantities force revalidation and a fresh offer. The server resolves policy, eligibility and persisted Ticket prices, calculates fixed or percentage fees with decimal-safe logic, and includes the distinct Flexible Ticket charge in the authoritative reservation and Payment total.

Successful Booking confirmation activates exactly one immutable entitlement for each selected participant and corresponding issued Ticket. Failed or expired commerce grants no active right, while Payment reconciliation and webhook retry remain idempotent. Customer confirmation/secure Booking access and organiser Booking investigation present matching coverage, fee, policy version, terms and remaining-use evidence without exposing possession or Payment credentials.

## Persistence and legacy boundary

The forward-only Sprint 29 migration adds versioned Organisation and Event policy persistence, explicit Event mode/source evidence, reservation-bound charges and per-participant/Ticket entitlement records with lifecycle, version, fee and rights snapshots. Local migration history now contains 41 migrations.

The legacy Booking-level `flexibleBooking` Boolean is not authority and is never promoted into an entitlement. Existing values are retained only for compatibility/investigation while new purchase and eligibility decisions rely exclusively on the dedicated records.

Flexible Ticket does not consume Product inventory, reusable Product capacity or Session admission capacity. It does not change Ticket face values. It is paid in the same transaction but persists as a separate commercial charge and entitlement.

## Organiser and customer presentation

Organisation **Settings** provides the OWNER draft/publish workflow with fee, rights, cut-off, permitted-use, price-treatment and customer wording controls. Event **Settings** provides inherit/override/disabled governance and shows effective source/version readiness. Incomplete overrides cannot masquerade as ready configuration.

The public offer supports add-all, selective coverage and clear decline. Decline is remembered for the unchanged journey, while later Ticket changes deliberately reopen the decision. Review separates Ticket, Product and Flexible Ticket subtotals. Confirmation identifies only covered participants/Tickets and explicitly states that online self-service changes and cancellations are not yet available.

The organiser Booking investigation surface presents entitlement state, participant, safe Ticket identity, immutable policy version, fee, use limit and cut-off alongside existing Payment evidence.

## Automated verification

Final verification passed:

- complete API suite: 78 suites / 536 tests;
- complete dashboard/public web suite: 26 files / 78 tests;
- API TypeScript and production build;
- web TypeScript and webpack production build; and
- repository whitespace/error check.

The automated evidence covers OWNER governance, assigned MANAGER inspection, role/assignment and tenant denial, INHERIT/OVERRIDE/DISABLED resolution, immutable prospective versions, configuration validation, public-response minimisation, selective participant binding, fixed/percentage calculations, authoritative totals, successful activation, failed/expired Payment, replay/idempotency, legacy-Boolean denial and non-regression of Product, capacity, Payment, Ticket, refund, reschedule, reporting and scanner foundations.

## Browser acceptance

Using fictional local data, the Ice Rinks Australia OWNER created and published Organisation default policy version 1 with a `$5.00` fixed per-covered-Ticket fee, a 1,440-minute cut-off and one permitted use. Event Settings visibly demonstrated DISABLED, INHERIT and Event OVERRIDE governance; the active acceptance Event was restored to INHERIT before purchase.

The public flow demonstrated:

- two Ticket units producing an accurate `$10.00` add-all offer;
- choose-tickets reducing coverage to one unit and `$5.00`;
- a three-Ticket quantity change forcing a fresh `$15.00` offer;
- clear decline without repeated interruption in the unchanged journey; and
- separate Ticket and Flexible Ticket amounts at review.

Two Stripe test-mode purchases completed after explicit user confirmation. The first booking, `PG-1787804852362-4863`, confirmed one Adult Ticket plus one `$5.00` entitlement for a `$29.00` total. Manual local reconciliation safely re-read Stripe after the local webhook was absent and produced one active entitlement without duplication.

The strict selective acceptance booking, `PG-1787805997005-3873`, contained one Adult and one Child Ticket. Only the Adult was covered. Review showed `$24.00` and `$18.00` Ticket charges, one `$5.00` Flexible Ticket charge and a `$47.00` total. After Stripe test Payment and reconciliation, organiser investigation showed `CONFIRMED` / `PAID`, two active Tickets and exactly one ACTIVE `$5.00` policy-version-1 entitlement for the Adult. Customer confirmation showed both Ticket links but listed only the Adult under Flexible Ticket coverage, with the same safe Ticket identity and self-service boundary.

A direct read-only persistence audit of that booking confirmed:

- 2 participants;
- aggregate Ticket item quantity 2;
- 2 issued Tickets;
- exactly 1 ACTIVE Flexible Ticket entitlement at `$5.00`, policy version 1;
- the entitlement participant matched an issued Ticket participant; and
- 0 Products, proving the Flexible Ticket purchase introduced no merchandise inventory commitment.

Capacity and reusable inventory non-interference are additionally covered by the focused service tests because Flexible Ticket never enters Product or admission allocation models.

## Documentation and security

`docs/operations/FLEXIBLE_TICKET_POLICY_AND_ENTITLEMENTS.md` records the governance, purchase, activation, investigation, security and present operational boundary. The API endpoint security register documents the new guarded and public surfaces. Customer wording remains explicitly pending commercial/legal approval before live use.

## Deferred boundary

Sprint 29 does not consume entitlements, accept customer requests, execute changes/refunds, collect price differences, add post-Payment coverage, sell flexibility at POS or approve legal terms. Those remain separate controlled work. Sprint 30 may now build secure request and consumption workflows against the immutable rights delivered here and the Sprint 27–28 adjustment/reschedule ledgers.
