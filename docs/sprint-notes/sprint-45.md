# Sprint 45 — Public Event Homepage and Content Structure

**Status:** Implementation and complete local verification finished; organiser walkthrough remains

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
The web production build remains to be repeated in the complete release gate;
the isolated verification environment prevented its build worker from binding
the temporary local port it requires.

Bathurst currently has Adult (18–99) and Child (6–17) Ticket Types, but no Young
Child Ticket and no active Event Rules. A four-year-old can therefore no longer
be booked against Child. Supporting that age requires the organiser to add an
appropriate Young Child Ticket and deliberately configure both the Kanga
requirement and adult-accompaniment rule. A future setup-readiness improvement
should make uncovered age ranges and missing dependent-Ticket/Product rules
visible before an Event is published.

All changes remain local on `main`. Nothing from Sprint 45 has been pushed.
