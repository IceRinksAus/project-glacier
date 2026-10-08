# Sprint 45 Plan — Public Event Homepage and Content Structure

**Status:** Proposed for organiser approval; implementation has not started

## Objective

Turn Glacier's current branded booking entry page into a useful, credible
public Event homepage. Customers should be able to understand the Event,
prepare for their visit, find common answers and move into ticket purchase
without the organiser needing a separate website.

This Sprint extends the existing Event website and branding authority. It does
not replace the routed booking journey, weaken commerce rules or become a
general-purpose website builder.

## Evidence informing the scope

The current public Event page already provides:

- the published Event logo and hero image;
- controlled colours and fonts;
- headline, supporting copy and Book tickets action;
- Event dates, venue/suburb and secure-booking explanation;
- a short Event description and published Waiver link; and
- the same visual identity throughout booking and Waiver journeys.

The organiser walkthrough found that this is still primarily a ticket-purchase
gateway. It does not yet provide enough Event information to function like a
real customer website. Earlier supplied concepts also established the desired
direction: strong hero presentation, simple customer navigation, "what's on"
or experience highlights, visit-planning information and prominent booking
actions.

## Decisions locked for Sprint 45

1. **One authoritative public Event homepage.** The stable `/event/:slug`
   route remains the customer entry point. No parallel microsite or external
   CMS is introduced.
2. **Structured content, not arbitrary HTML.** Organisers receive bounded
   fields and ordered records. Raw HTML, JavaScript, CSS, embeds, iframes,
   uploaded fonts and external asset URLs remain prohibited.
3. **Draft before publish.** Organisers can save and preview incomplete content
   without changing the live site. Publication deliberately promotes one
   complete version; an existing live version remains available until its
   replacement is published.
4. **Safe fallback.** An ACTIVE Event without a published content version keeps
   the existing minimal homepage. Existing public Events cannot be broken by
   this migration.
5. **Booking remains authoritative elsewhere.** The homepage links into the
   existing Date-first booking journey. It does not duplicate Session,
   capacity, price, Product, Rule or payment calculations.
6. **Useful on phones first.** Navigation, content and actions must work on the
   phones customers use at home and at the venue, as well as desktop.
7. **No production claims from fictional content.** Local examples remain
   clearly fictional. Real Event copy, accessibility claims, contact details,
   legal wording and directions require organiser review before publication.

## Proposed homepage information architecture

The public page will use a consistent Glacier structure with Event branding:

1. Header with Event identity, section navigation and Book tickets action.
2. Hero with headline, summary, dates/location and primary booking action.
3. Event essentials with dates, venue and a safe Waiver action when published.
4. About the Event.
5. Experience highlights (for example skating, ice slide or family activity),
   using concise ordered cards.
6. Plan your visit, with bounded information for arrival, transport/parking,
   accessibility, food and drink, and what to bring. Empty items are omitted.
7. Frequently asked questions using ordered question-and-answer entries.
8. Final booking call to action and simple Glacier-powered footer.

The page must not advertise a Session, price, Product or availability figure
that can become stale independently of the booking authority.

## Slice 1 — Versioned Event-site content authority

- Add an Event-scoped website content/version model with exactly one current
  draft and at most one published version.
- Store bounded plain-text fields for About and Plan your visit content.
- Add ordered Experience Highlight and FAQ child records owned by the same
  Event/version.
- Apply practical maximum lengths, item-count limits and normalisation at DTO
  and service boundaries.
- Enforce Organisation/Event ownership and prevent records or publication from
  moving between Events.
- Keep historical published versions immutable so the content visible at a
  point in time is reconstructable.
- Add an additive Prisma migration and replay it from an empty database.

**Acceptance:** An authorised Event cannot read, edit, reorder or publish
another Event's content; publication produces one internally consistent public
version and all existing Events retain their current page.

## Slice 2 — Organiser Website content studio

- Extend the existing Website & branding workspace rather than creating a
  disconnected setup area.
- Separate **Brand identity** from **Homepage content** with a clear readiness
  summary.
- Provide accessible forms for About, Experience Highlights, Plan your visit
  and FAQs.
- Allow bounded add, edit, remove and reorder actions for Highlights and FAQs.
- Provide Save draft, Preview and Publish actions with clear live/draft status,
  unsaved-change feedback and validation explanations.
- Preview the complete homepage using the Event's current branding while
  remaining unavailable to anonymous customers until the Event/content is
  published.
- Preserve the existing website mutation authority; this Sprint does not
  broaden role access as an incidental UX change.

**Acceptance:** The organiser can prepare a useful homepage in one coherent
workspace, preview it without affecting customers and knowingly publish it.

## Slice 3 — Customer-facing Event homepage

- Refactor the current public page into small tested sections using the
  published content version and existing branding contract.
- Add a responsive header with in-page links only for sections that exist and
  a persistent, prominent Book tickets action.
- Present the Event identity, dates and venue once clearly without repeating
  or contradicting the booking journey.
- Render Highlights, visit information and FAQs only when published content is
  available; omit empty cards and headings.
- Keep the published Waiver discoverable without presenting it as the
  commercial Ticketing Terms.
- Repeat a clear booking action after long-form content so customers need not
  scroll back to the hero.
- Retain a useful Event-unavailable state without leaking draft Event details.

**Acceptance:** A customer can understand what the Event is, where and when it
runs, how to prepare, find common answers and start booking from desktop or
mobile.

## Slice 4 — Navigation, accessibility and resilience

- Use semantic landmarks and heading order, keyboard-operable navigation,
  visible focus states and appropriately labelled links/controls.
- Keep text readable across organiser-selected colour combinations. Reject or
  clearly flag unsafe contrast combinations rather than publishing illegible
  content.
- Respect reduced-motion preferences and avoid essential information that
  exists only in colour or imagery.
- Ensure decorative hero imagery has safe alternative treatment and Event
  logos retain meaningful alternative text.
- Add explicit loading, failure and minimal-fallback states.
- Verify common mobile, tablet and desktop widths without page-level
  horizontal overflow.

**Acceptance:** The public homepage remains understandable and bookable with
keyboard navigation, missing optional content, missing imagery and a failed
optional branding request.

## Slice 5 — Privacy, security and performance boundaries

- Return only the current published content for ACTIVE Events through the
  privacy-minimised public contract.
- Do not expose draft text, version administration data, staff identity,
  storage keys, internal Event fields or organiser-only contact records.
- Continue serving images only through Glacier's validated public Event asset
  route; no public filesystem or storage-provider paths are added.
- Preserve output encoding and treat all organiser content as text, never
  executable markup.
- Bound public query shape and child-record counts to prevent an unbounded CMS
  payload.
- Add focused tests for draft/public separation, cross-tenant denial, inactive
  Events, encoding, fallback and content ordering.

**Acceptance:** Anonymous customers receive only the bounded published Event
site projection, and no content action changes Ticket, Payment, capacity,
inventory, Scanner, Waiver or Flexible Ticket authority.

## Slice 6 — Organiser acceptance and closeout

- Create or update one fictional local Event homepage with representative About,
  Highlights, visit information and FAQs.
- Confirm saving a draft does not alter the public page.
- Confirm authenticated preview matches the intended draft.
- Publish deliberately and confirm the public page updates as one version.
- Walk the public page at desktop and phone widths, use header/final booking
  actions and confirm the existing Date-first journey retains its state and
  branding.
- Confirm published Waiver discovery still works and Ticketing Terms remain at
  checkout rather than being conflated with the Waiver.
- Record supplied feedback outside this scope in the backlog instead of
  applying unrelated patches during closeout.
- Update architecture, endpoint register, roadmap, changelog and Sprint notes.

## Verification and exit gate

- Focused API and web tests pass after each slice.
- Complete API and web suites and production builds pass.
- All migrations are current and replay successfully from empty state.
- Disposable tenant/role/Event/MFA isolation passes all checks.
- Isolated PostgreSQL backup/restore matches every critical table.
- Tracked-secret scanning and the complete local release gate pass.
- Organiser acceptance confirms draft isolation, preview, publication, mobile
  usability and the uninterrupted booking/Waiver journeys.
- Verified slices are committed locally; nothing is pushed without explicit
  organiser approval.

## Explicitly outside Sprint 45

- a drag-and-drop or arbitrary-block website builder;
- custom HTML/CSS/JavaScript, embeds, analytics pixels or external media URLs;
- secondary image galleries, video, sponsor advertising or per-highlight image
  upload;
- customer accounts, news/blog publishing, promotional codes or mailing-list
  signup;
- live chat, maps, weather, social feeds or third-party integrations;
- Session, Ticket, Product or availability duplication on the homepage;
- public marketing unsubscribe delivery, which remains tied to an approved
  email sender/provider and account ownership;
- domain purchase, hosting, cloud storage or other paid infrastructure;
- real Event content approval, managed production secrets, deployed-device
  testing, monitoring evidence; and
- independent accessibility, privacy, legal or security review.

## Scope confirmation required

Sprint 45 implementation begins only after the organiser approves this plan.
New website ideas discovered during acceptance will be recorded for later
triage unless they expose a security, privacy or authoritative-commerce defect.
