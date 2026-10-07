# Sprint 44 — Checkout Terms, Privacy Notice and Marketing Choice

**Status:** Complete; organiser walkthrough and final local release gates passed

## Objective

Give Glacier a reproducible checkout-consent boundary without conflating the
commercial sale contract, privacy notice, transactional communication,
optional adult marketing or participation Waiver.

## Delivered slices

### 1. Document and evidence authority

- Added immutable Event-scoped document versions for Ticketing Terms, Privacy
  Collection Notice and the optional marketing disclosure.
- Added Booking-level online/POS acceptance evidence and separate append-only
  adult marketing grant, decline and withdrawal evidence.
- Enforced Organisation/Event relationships and one published version per
  Event/type at the database and service boundaries.

### 2. Controlled organiser publishing

- Added an Event Settings workspace for OWNER and assigned MANAGER to draft,
  preview and publish each document type.
- Clearly labels local templates as fictional and prevents test-only documents
  from satisfying production publication.
- Shows current publication/readiness without allowing an old version to be
  silently edited in place.

### 3. Public checkout

- Shows the published Ticketing Terms and Privacy Notice before payment.
- Required terms acceptance and optional marketing are both initially
  unchecked; declining marketing never blocks purchase.
- The server rejects missing, stale, foreign or unpublished identifiers and
  resolves the authoritative version/content hash before payment.

### 4. POS checkout

- Added a touch-friendly confirmation that the purchasing adult received the
  current terms/privacy material and accepted the sale terms.
- Persists the authenticated operator, POS channel, time and exact document
  evidence in the same transaction as successful walk-up payment.
- Does not collect marketing at POS and leaves merchandise-only sales outside
  the Ticket-contract evidence path.

### 5. Withdrawal and Waiver separation

- New public Waivers retain optional media permission but no longer collect
  marketing; old Waiver values remain historical and never become authority.
- Customer detail shows the latest choice per authorised Event.
- OWNER and assigned MANAGER can append an attributable withdrawal only for a
  currently granted choice. A repeated request returns the existing withdrawal
  without manufacturing duplicate evidence.
- Withdrawal does not cancel Bookings/Tickets or suppress receipts and material
  Event/safety communication.

## Organiser acceptance guide

Use fictional data only:

1. In an Event's Settings, open Checkout documents and verify each draft can be
   previewed before publication.
2. Publish all three fictional document types and confirm the Event reports
   checkout ready. Publish a newer version and verify the old version remains
   visible as immutable history.
3. Start public checkout. Confirm payment is blocked until Ticketing Terms are
   checked, while marketing remains optional and unchecked.
4. Complete one purchase with marketing declined and one with it granted.
   Confirm both Bookings remain operational and retain the exact evidence used.
5. Complete a POS Ticket sale only after deliberate staff terms confirmation.
   Confirm no marketing choice is offered and a merchandise-only sale is not
   turned into a Ticket Booking.
6. Open the granted purchasing Customer, record withdrawal and confirm the
   current Event choice changes to withdrawn while Booking/Ticket history stays
   available.
7. Complete a new public Waiver and confirm it offers media permission but no
   marketing control. Historical Waiver records remain readable.

## Protected boundaries

- Organisation, role and Event-assignment checks remain server-authoritative.
- Dependants, participants and Waiver minors never receive marketing authority.
- Public Ticket, Waiver proof and Booking-possession responses do not expose
  organiser consent evidence.
- Payment, refund, Ticket, capacity, inventory, Rule, Scanner and Flexible
  Ticket authorities are unchanged except for the explicit pre-payment gate.
- No real wording, customer data, sender, domain, campaign or delivery provider
  was introduced.

## Verification evidence

Initial closeout completed 5 October 2026:

- API: 94 suites / 709 tests passed;
- web: 51 files / 152 tests passed;
- API and web production builds passed;
- configured database: 56 migrations found and current;
- disposable database: all 56 committed migrations replayed successfully;
- tenant, role, Event-assignment and MFA isolation: 5/5 checks passed;
- isolated PostgreSQL backup/restore: 23 critical tables matched, 0.42 MiB
  archive, 3.08-second backup and 2.27-second restore;
- tracked-secret scan: 726 tracked files / 6 rules passed after staging the
  closeout note; and
- complete local release gate passed.

The first complete-gate attempt passed all application tests and builds, then
stopped because the restricted process could not reach local PostgreSQL. A
direct readiness check confirmed PostgreSQL was accepting connections; after
local-network permission was granted, the entire gate was rerun from the
beginning and passed. This was an execution-environment access boundary, not a
database or application failure.

## Organiser acceptance and remediation

Completed with fictional local data by the organiser on 8 October 2026:

- Event Settings showed the published Ticketing Terms, Privacy Collection
  Notice and optional marketing disclosure used by public checkout.
- Public checkout required affirmative Ticketing Terms acceptance while
  leaving marketing optional. Purchases completed successfully with marketing
  both declined and granted, without changing Booking, Ticket or payment
  authority.
- Customer marketing withdrawal completed while the related Booking and
  Tickets remained available.
- POS required deliberate terms confirmation, offered no marketing choice and
  retained the existing walk-up sale behaviour.
- Booking search initially did not find a Booking from its Ticket number. The
  search authority was extended through the related Ticket records, focused
  API/web verification passed, and the organiser confirmed the Ticket number
  returned the correct Booking.
- Stripe's secure iframe failed to load in the embedded browser and could leave
  the payment control indefinitely unavailable without a clear recovery path.
  Checkout now detects a load failure or timeout, confirms that no payment was
  submitted, disables submission and offers an in-place retry. Focused web
  verification and the production build passed.
- A new public Waiver retained media permission where configured and presented
  no marketing control. Its completion evidence and downloadable record
  worked.
- An older Waiver submission remained readable with its original details,
  signature, historical choices and downloadable PDF intact.

Final post-acceptance verification completed 8 October 2026:

- API: 94 suites / 709 tests passed;
- web: 51 files / 153 tests passed;
- API and web production builds passed;
- configured database: 56 migrations found and current;
- disposable database: all 56 committed migrations replayed successfully;
- tenant, role, Event-assignment and MFA isolation: 5/5 checks passed;
- isolated PostgreSQL backup/restore: 23 critical tables matched, 0.47 MiB
  archive, 0.68-second backup and 1.07-second restore;
- tracked-secret scan: 726 tracked files / 6 rules passed; and
- complete local release gate passed.

## Closeout

All six implementation slices and the two organiser-acceptance remediations
are verified locally on `main`. Nothing has been pushed for Sprint 44;
explicit organiser approval remains required before updating `origin/main`.

## External gates retained

- qualified approval of production Ticketing Terms, Privacy Collection Notice,
  marketing wording, retention, withdrawal and transactional boundaries;
- approved sender/domain/provider ownership and provider-backed unsubscribe;
- managed production secrets, HTTPS/edge controls, monitoring and backups;
- representative deployed POS/customer device acceptance; and
- independent legal, privacy, accessibility and security review.
