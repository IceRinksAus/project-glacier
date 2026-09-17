# Sprint 38 — Touch-first POS and Connected Ticket Service

## Outcome

Sprint 38 turns the established walk-up commerce foundation into a touch-first
POS workspace and connects counter staff to the existing Ticket lookup and
atomic admission authority. It does not create a second catalogue, pricing
engine, scanner engine or payment ledger.

## Touch-first sales

- Ticket Types render as large colour, label or optional-image tiles using the
  Sprint 37 presentation metadata.
- Session Products use their optional managed images and retain existing
  Product/Variant price, capacity and inventory behavior.
- The selected Event and Session remain prominent and the recommended Session
  still requires deliberate selection.
- The order rail shows Ticket quantities, line totals, overall total and the
  payment-review action.
- Existing Cash and Standalone EFTPOS review/confirmation boundaries remain
  unchanged and server-authoritative.
- Required Products such as a Kanga continue to be added through backend Rules
  and are re-evaluated by the Booking engine during reservation.

## Participant-free walk-up boundary

Ordinary counter sales no longer show participant first-name or last-name
fields. The trusted POS service overwrites any client-supplied names with
bounded non-personal labels such as `Walk-up guest 1`, and the associated
Customer is stored as `Walk-up sale` without invented email or phone data.

Age remains visible for the operator because the current Rule engine may use
participant age. Glacier does not infer age from `Toddler`, `Child` or another
presentation label. Ticket-Type-based Kanga requirements continue to work from
the selected Ticket Type itself.

## Connected Ticket service

OWNER, MANAGER and STAFF can open `Scan existing Ticket` inside POS for an
Event they are authorised to operate. The service accepts camera scans,
keyboard-wedge/USB/Bluetooth scanner input and manual signed-code entry.

Lookup calls the existing Scanner service and is read-only. It shows safe
Ticket, Session and admission-state evidence but does not change the Ticket,
create a Booking or create a Payment. An eligible Ticket displays a separate
`Confirm and admit this Ticket` action. Only that action calls the existing
atomic admission authority, retaining wrong-Event, already-scanned, cancelled,
too-early and closed-window handling. SCANNER remains excluded from POS.

## Scanner route separation

OWNER, MANAGER and STAFF now see a Glacier-shell Scanner readiness workspace
with entry-window, assignment, device sign-in and lookup-versus-admission
guidance. Dedicated SCANNER accounts still receive the full-screen operational
scanner with no organiser navigation.

## Verification

- API: 92 suites / 660 tests passed; production build passed.
- Web: 36 files / 109 tests passed; production build passed.
- Focused connected-POS/Scanner verification: 5 files / 26 tests passed.
- All 49 Prisma migrations remained current and replayed from empty state.
- Disposable authenticated tenant/role/MFA isolation passed 5 of 5 checks.
- Isolated PostgreSQL backup/restore matched all 16 critical tables; the 0.29
  MiB archive completed in 0.44 seconds and restored in 0.98 seconds.
- The tracked-secret scan passed across 656 files and 6 rules.
- The complete local release gate passed.

The live development server was stopped at closeout, so a fresh in-app browser
tab correctly returned connection refused. No browser/device acceptance is
claimed from that attempt; component interaction tests and isolated production
builds are the current UI evidence.

## Protected foundations

Organisation, role and Event-assignment boundaries remain on every request.
Signed Ticket credentials, reissue invalidation, Rules, server pricing,
reservation expiry, capacity, Product/Variant inventory, Payment/refund
idempotency, Ticket issuance, rescheduling and Flexible Ticket foundations were
not weakened. No schema migration or dependency change was required.

## Remaining boundary

Real Zebra, Android, iOS, square-terminal, camera, receipt-printer and EFTPOS
testing remains future evidence. So do managed production media, deployed
secrets, monitoring, offline behavior, payment-terminal integration, till/shift
balancing and independent accessibility, privacy and security review. No paid
service, device, domain or infrastructure was purchased or provisioned.
