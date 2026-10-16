# Sprint 45 — Public Event Homepage and Content Structure

**Status:** Complete locally, including organiser acceptance remediation and
full verification

## Objective

Turn the branded public Event entry page into a useful customer homepage while
preserving Glacier's authoritative booking, commerce, Waiver and access-control
boundaries.

## Delivered slices

### 1. Versioned content authority

- Added Event-scoped draft, published and archived homepage versions.
- Added bounded structured About and visit-planning fields, eight ordered
  Highlights and twelve ordered FAQs.
- Enforced one draft and one live version per Event, serializable publication,
  immutable published history and Organisation/Event ownership.
- Added the additive 57th Prisma migration.

### 2. Organiser content studio

- Extended the Website workspace instead of creating another disconnected
  setup area.
- Added private draft editing, ordered Highlight/FAQ controls, a complete
  authenticated content preview and deliberate publication status/actions.
- Added ten common FAQ question templates covering arrival, skate hire,
  clothing, age/suitability, Session length, transport, accessibility, food,
  Waivers and booking changes. Templates require an Event-specific answer
  before the draft can be saved.
- Preserved the existing Website mutation authority.

### 3. Public Event homepage

- Added a responsive branded header, conditional section navigation, enriched
  hero, Event essentials, About, What's On, Plan Your Visit, FAQs and repeated
  Date-first booking actions.
- Kept the published participation Waiver discoverable without presenting it
  as Ticketing Terms.
- Existing ACTIVE Events with no published homepage content retain the safe
  minimal presentation.

### 4. Accessibility, privacy and resilience

- Added skip navigation, semantic headings/landmarks, keyboard-operable FAQ
  disclosure, visible focus treatments and reduced-motion variants.
- Added server-side 4.5:1 contrast enforcement for core page, card, hero and
  booking-button colour combinations.
- Public responses expose only the current published bounded content. Draft,
  archived and administrative version data remain private.
- Updated the restore drill to compare all three new critical content tables.

## Protected boundaries

- The homepage contains no independent Session, Ticket Type, price, Product,
  Rule, capacity or inventory calculation.
- Booking continues through the existing `/book/:eventId/date` journey.
- Ticketing Terms remain at checkout; participation Waivers remain separate.
- Payment, refund, Ticket, Scanner and Flexible Ticket authorities are
  unchanged.
- No raw HTML, custom CSS/JavaScript, external assets, embeds, analytics,
  domains, hosting or paid services were introduced.

## Verification evidence

Focused verification completed during implementation:

- Event-site DTO, lifecycle, controller and public-projection API tests passed;
- organiser content-studio and public homepage web tests passed; and
- API and web production builds passed after their respective slices.

Complete local verification completed 8 October 2026:

- API: 96 suites / 719 tests passed;
- web: 52 files / 158 tests passed;
- API and web production builds passed;
- configured database: 57 migrations found and current;
- disposable database: all 57 committed migrations replayed successfully;
- tenant, role, Event-assignment and MFA isolation: 5/5 checks passed;
- isolated PostgreSQL backup/restore: 26 critical tables matched, 0.48 MiB
  archive, 0.56-second backup and 1.13-second restore;
- tracked-secret scan: 736 tracked files / 6 rules passed after committing the
  implementation documentation; and
- complete local release gate passed.

## Organiser acceptance guide

Use fictional local content only:

1. Open an Event's Website tab and confirm Brand identity and Homepage content
   form one coherent workspace.
2. Add an About description, two Highlights, representative visit information
   and two FAQs, then save the draft.
3. Open the public Event URL in a separate tab and confirm the draft did not
   change the live page.
4. Review the authenticated preview, reorder one Highlight or FAQ, save and
   deliberately publish.
5. Refresh the public Event page and confirm the complete version appears with
   working section navigation and booking actions.
6. Check the page at desktop and phone width, including keyboard navigation and
   FAQ disclosure.
7. Follow Book tickets into the Date-first journey and confirm Event branding
   remains consistent.
8. Open the published Event Waiver and confirm its independent flow remains
   available.

## External gates retained

- real Event copy, directions, accessibility claims and contact information
  require organiser approval;
- final production accessibility, privacy, legal and security review;
- managed production secrets, deployed hosting/storage, monitoring and backup
  evidence; and
- representative real-device and network acceptance.

## Closeout state

The organiser walkthrough confirmed that draft/save/publish, the public Event
homepage, booking actions, Event Waiver link and FAQ templates work as planned.

The walkthrough also exposed an existing booking-boundary defect: a four-year-
old participant could be assigned Bathurst's Child Ticket even though that
Ticket is configured for ages 6–17. Booking creation now enforces each Ticket
Type's minimum and maximum age authoritatively for online and walk-up sales, and
the public participant step explains an invalid age immediately. Focused API
tests (30/30), focused web tests (7/7), the API build and web type-check pass.

Bathurst currently has Adult (18–99) and Child (6–17) Ticket Types, but no Young
Child Ticket and no active Event Rules. A four-year-old can therefore no longer
be booked against Child. Supporting that age requires the organiser to add an
appropriate Young Child Ticket and deliberately configure both the Kanga
requirement and adult-accompaniment rule.

The Ticket Types workspace now provides the missing first-class companion
control. An OWNER can require at least one of the selected companion Ticket
Types in the same Booking (for example Young Child requires Adult). Glacier
stores this as an Event-scoped active Rule and the existing shared rule
authority enforces it consistently during public and POS evaluation and again
at reservation creation. The existing Products workspace remains the place to
map one mandatory Kanga per matching Ticket participant. Focused rule-engine
tests prove both rejection without the companion and acceptance when it is
present; the focused organiser workspace tests, lint and web type-check pass.

A future setup-readiness improvement should make uncovered age ranges and
missing dependent-Ticket/Product rules visible before an Event is published.

The acceptance walkthrough also confirmed that paid Kanga Products appeared in
the Booking but had no customer-presentable collection credential. Glacier now
issues one separately signed Product Collection Pass per confirmed, paid
BookingProduct line. Confirmation shows the Product, quantity and dedicated QR;
Event-authorised POS staff can look it up and deliberately record collection.
The action is atomic and attributable, repeats show the already-collected
state, and the presentation explicitly cannot grant admission or alter Session
admission capacity. This adds the 58th Prisma migration and expands the restore
set to 27 critical tables.

Final acceptance-remediation verification completed 17 October 2026:

- API: 98 suites / 730 tests passed;
- web: 53 files / 164 tests passed;
- API and web production builds passed;
- configured database: 58 migrations found and current;
- disposable database: all 58 committed migrations replayed successfully;
- tenant, role, Event-assignment and MFA isolation: 5/5 checks passed;
- isolated PostgreSQL backup/restore: 27 critical tables matched, 0.50 MiB
  archive, 1.08-second backup and 1.99-second restore;
- tracked-secret scan: 744 tracked files / 6 rules passed; and
- complete local release gate passed.

The initial database checks were misleadingly blocked by the execution
sandbox's local-network restriction even though the PostgreSQL launch daemon
remained healthy. Repeating the gates with explicit local connectivity produced
the successful evidence above; no PostgreSQL defect or data recovery action was
required.

During organiser acceptance, a quantity-two Kanga purchase correctly received
one grouped pass labelled `2 × Kanga`. Operationally, however, two physical
Kangas may be handed out separately. New purchases now receive one independently
collectible pass per unit, labelled `Kanga 1 of 2` and `Kanga 2 of 2`. Existing
grouped passes remain valid historical collection evidence and are never
silently duplicated. The POS service wording now explicitly covers Booking,
Ticket and Product Pass lookup. This refinement adds the 59th additive Prisma
migration without changing Product reservation, inventory or admission
capacity authority.

The next acceptance purchase exposed two configuration/journey issues. Viewing
an issued Product Pass replaced the routed Booking journey, so browser-back
remounted an empty journey and correctly returned to Date selection. Issued
Ticket and Product Pass links now open in a separate tab, preserving the paid
confirmation page. Bathurst's local Event data also contained the active Kanga
requirement but no companion-Ticket Rule. Its Young Child Ticket is now
explicitly configured to require at least one Adult Ticket in the same Booking;
the shared rule authority remains responsible for preview and final rejection.

All changes remain local on `main`. Nothing from Sprint 45 has been pushed.
