# Sprint 37 — Product Catalogue and Service Lookup

## Outcome

Sprint 37 turns Products into the primary organiser catalogue and makes the
relationship between Products, Ticket Types and Rules visible and maintainable.
It also adds secure local Product/Ticket Type presentation assets and a bounded
Customers workspace, while retaining the existing newest-first Bookings
authority.

For the Kanga example, the workflow is now explicit: selecting `Toddler` under
`Required for these Ticket Types` creates or updates one deterministic active
`PRODUCT_REQUIREMENT` Rule. That Rule requires one Kanga for each matching
participant. The Product card shows the current requirement, and an OWNER can
later change the Ticket Types or clear the requirement. Clearing makes the same
Rule inactive; reselecting reactivates it rather than creating a duplicate.
Backend Rules remain the final authority during booking.

## Catalogue presentation

- Products now lead with searchable, filterable visual cards, clear status,
  pricing, availability and requirement evidence.
- Customer display grouping and ordering remain available as a secondary
  action after Products exist.
- Product creation supports an optional PNG/JPEG image and an explicit guided
  path through details, availability, Sessions and Ticket Type requirements.
- Existing Products support image add/replace/remove, status changes and
  requirement maintenance without recreating the Product or changing its
  price, inventory or capacity model.
- Ticket Types support a short tile label, validated colour and optional image
  during creation and through a later OWNER-only appearance editor. Text and
  colour remain the default, so tiles such as `ADULT`, `CHILD` and `TODDLER` do
  not require artwork.

The supplied blue Kanga photograph was used only as design context. It was not
copied into the repository. Automated evidence uses synthetic image fixtures.

## Asset authority

The catalogue uses Glacier-managed `FileAsset` records rather than trusting
arbitrary external URLs. Product and Ticket Type images have explicit purposes,
current relations and Organisation/Event ownership checks. Uploads accept only
bounded PNG/JPEG content whose declared type, signature and dimensions agree.
Replacement makes the former asset non-current and removes the prior local
object using the existing cleanup pattern.

OWNER controls image and presentation mutation. Authenticated, authorised
organisers receive the image through scoped application endpoints; storage
keys are not exposed. Local filesystem storage is evidence for development and
test only. Public delivery was intentionally not added before an approved
customer/POS consumer and managed-media contract exist.

## Customers and Bookings

The new Customers workspace provides bounded server search, pagination and
stable recent-activity ordering. Lists show a masked phone summary, authorised
Booking count, latest Booking/Event and activity; detail shows the full contact
record only to an authorised operator and only includes visible Bookings.
Organisation and Event-assignment scope are applied in the database query, not
after a broad read.

Event Bookings and Customers tabs now enter the shared workspaces with an Event
filter. The existing newest-first Booking search, filters, pagination and detail
authority were preserved rather than duplicated.

## Browser acceptance

Fictional local Australian Ice Festival data was used. The Product workspace
loaded searchable cards, image controls and the secondary customer-display
section. The Event-scoped Customers workspace loaded the authorised fictional
customer with a masked phone number and the selected Event retained. No real
customer, Payment or marketing data was used.

## Verification

- API: 92 suites / 659 tests passed; production build passed.
- Web: 35 files / 106 tests passed; production build passed.
- All 49 Prisma migrations were current and replayed from empty state.
- Disposable authenticated tenant/role/MFA isolation passed 5 of 5 checks.
- Isolated PostgreSQL backup/restore matched all 16 critical tables; the 0.29
  MiB archive completed in 0.64 seconds and restored in 1.56 seconds.
- The tracked-secret scan passed across 652 files and 6 rules, and the complete
  local release gate passed.

## Protected foundations

No Ticket credential, issuance, Payment/refund idempotency, Booking reservation,
Session capacity, Product/Variant inventory, Rules enforcement, Scanner,
Flexible Ticket, POS or public-booking authority was weakened. Image and tile
metadata are presentation only and cannot grant entitlement or alter price,
capacity, stock or admission. No domain, hosting, cloud storage, email service
or other paid infrastructure was purchased or provisioned.

## Remaining boundary

Managed production object storage/CDN, retention and cleanup, malware scanning,
deployed secrets, monitoring, public/POS catalogue image delivery, real-device
POS/Scanner testing, and independent accessibility, privacy and security review
remain future evidence. Sprint 38 may consume the new visual catalogue in the
approved touch-first POS and scanner-connected Ticket service design; it must
continue to use the existing Rules, pricing, capacity, inventory and deliberate
admission authorities.
