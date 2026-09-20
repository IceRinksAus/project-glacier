# Pilot Rehearsal

This runbook guides the Sprint 42 end-to-end local rehearsal. It uses only
fictional data and does not provide production-readiness evidence.

## Before the walkthrough

From the repository root, run:

```bash
bash scripts/check-local-rehearsal-readiness.sh
```

All checks should pass before testing a card payment. The Stripe listener must
remain open for the whole payment exercise. A configured webhook secret alone
does not prove that the listener is running or that its current signing secret
matches the API configuration.

If forwarding is missing, start it in a separate terminal:

```bash
stripe listen --forward-to localhost:3000/payment/stripe/webhook
```

If the listener displays a different signing secret from the value configured
for `STRIPE_WEBHOOK_SECRET`, update the local API environment and restart the
API. Never paste either secret into walkthrough notes or screenshots.

Manual **Reconcile payment** is a recovery control. It is not a substitute for
normal webhook completion and should not be used during the successful-payment
test unless the missed-webhook scenario is being exercised deliberately.

## Fictional Event profile

Create a new Event rather than adapting an existing acceptance Event.

| Field | Rehearsal value |
| --- | --- |
| Event name | Glacier Harbour Lights 2026 |
| Website slug | `glacier-harbour-lights-2026` |
| State/jurisdiction | Victoria |
| Venue | Harbour Lights Ice Rink |
| Site address | 100 Example Esplanade, Sample Bay VIC 3999 |
| Promoter | Glacier Rehearsal Events Pty Ltd |
| Timezone | Australia/Melbourne |
| Event dates | Three future consecutive days chosen during the walkthrough |
| Sessions | 10:00–12:00 and 13:00–15:00 on each day |
| Capacity | 100 admissions per Session |
| Waiver | Required, using the local Victorian approved-test fixture |

Use a visibly fictional customer domain such as `example.com`. Do not enter a
real person's name, email address, phone number, signature or date of birth.

## Catalogue and Rules

Create or confirm this minimum catalogue:

| Item | Price | Rehearsal purpose |
| --- | ---: | --- |
| Adult Ticket | $20.00 | Adult admission and supporting-Ticket Rule |
| Child Ticket | $15.00 | Age-bounded child admission |
| Young Child Ticket | $0.00 | Young-child admission and required Kanga Rule |
| Blue Kanga | $10.00 | Required Product for each Young Child Ticket |
| Skate Hire | $5.00 | Optional Product |

Configure the existing authoritative Rules so that:

- a Young Child Ticket requires an eligible Adult Ticket in the same purchase;
- each Young Child Ticket adds one Blue Kanga; and
- optional Skate Hire remains independently selectable.

The walkthrough must not use a merchandise-only Kanga sale as a substitute
for Young Child admission because that would understate Session capacity.

## Walkthrough order

Complete the sequence in order and pause when a Blocker occurs:

1. Create the Event and confirm the jurisdiction, dates and timezone.
2. Apply branding and inspect the authenticated draft Website preview.
3. Create all six Sessions and activate them individually or in bulk.
4. Create the Ticket Types, Products and Rules listed above.
5. Configure, preview and publish the Event Waiver.
6. Review Event readiness and activate the Event.
7. Open the public Event Website and book through Date, Session, Tickets,
   Products, details, Waiver, review, payment and confirmation.
8. Complete one normal Stripe test-mode payment while webhook forwarding is
   running. Confirm automatic Booking confirmation and Ticket issuance.
9. Complete Cash and standalone EFTPOS POS sales, Ticket/Booking lookup and
   deliberate admission checks.
10. Exercise customer-service retrieval, rescheduling/refund controls and
    accepted-Waiver PDF evidence.
11. Compare the transaction log with Dashboard and Report totals.

## Transaction evidence sheet

Record each transaction before proceeding. Amounts below are expected only
when the catalogue matches this runbook.

| Ref | Channel | Contents | Expected gross | Expected admissions | Expected Products |
| --- | --- | --- | ---: | ---: | ---: |
| WEB-1 | Stripe test | 1 Adult + 1 Child + 1 Skate Hire | $40.00 | 2 | 1 |
| WEB-2 | Stripe test | 1 Adult + 1 Young Child + required Kanga | $30.00 | 2 | 1 |
| POS-1 | Cash | 2 Adult | $40.00 | 2 | 0 |
| POS-2 | Standalone EFTPOS | 1 Child + 1 Skate Hire | $20.00 | 1 | 1 |
| POS-3 | Cash merchandise | 1 Blue Kanga | $10.00 | 0 | 1 |

Before refunds or rescheduling, the expected combined position is:

- gross sales: **$140.00**;
- issued Tickets/admissions sold: **7**;
- Products sold: **4** (two Skate Hires and two Blue Kangas);
- online card: **$70.00**;
- Cash: **$50.00**; and
- standalone EFTPOS: **$20.00**.

Record Booking references and Ticket counts, but do not copy signed Ticket
credentials, Payment client secrets, Waiver proof credentials or raw provider
payloads into this document.

## Feedback format

For every issue, send:

1. **Where** — page and action;
2. **Expected** — what you thought should happen;
3. **Observed** — what happened;
4. **Impact** — blocked, slowed down, confusing or cosmetic; and
5. **Evidence** — a fictional Booking/Ticket reference or screenshot with no
   credentials.

Classify an issue as a Blocker when it prevents or misstates Payment, Ticket,
admission, legal evidence, tenant/role scope or safe recovery. Stop the
walkthrough at that point so later actions do not obscure the evidence.

## Evidence this rehearsal cannot provide

The local run does not prove managed production secrets, deployed HTTPS and
origin configuration, hosted webhook delivery, real payment settlement,
physical POS/Scanner hardware behavior, managed monitoring/backups, email or
Wallet delivery, or independent legal, accessibility, privacy and security
review.
