# Event Site Content Architecture

## Purpose

Glacier provides one stable public homepage for each ACTIVE Event at
`/event/:eventSlug`. The homepage combines authoritative Event identity and
branding with optional organiser-published information. It remains an entry
point to the existing Date-first booking journey, not a duplicate commerce
engine.

## Content lifecycle

`EventSiteContentVersion` belongs to exactly one Event and has a monotonically
increasing Event-local version number. Its lifecycle is:

- `DRAFT` — mutable through the authenticated OWNER workspace and never public;
- `PUBLISHED` — the single current public version and immutable; or
- `ARCHIVED` — a former published version retained as historical evidence.

Database partial unique indexes permit at most one `DRAFT` and one `PUBLISHED`
version per Event. Publication uses a serializable transaction to archive the
former live version and promote the saved draft as one operation. An Event
without published content continues to use the minimal pre-Sprint 45 page.

## Structured content

The model deliberately supports bounded plain-text fields rather than raw
markup:

- About heading and description;
- arrival information;
- transport and parking;
- accessibility information;
- food and drink;
- what to bring;
- up to eight ordered Experience Highlights; and
- up to twelve ordered FAQs.

All values have DTO length limits. Highlight and FAQ ordering is persisted by
unique version-local sort positions. Raw HTML, CSS, JavaScript, embeds,
external asset URLs and uploaded fonts are not accepted.

## Authorisation and public projection

Authenticated content reads and mutations first prove the Event belongs to the
JWT Organisation. Existing Website mutation policy remains OWNER-only. A
foreign Event is returned as not found.

The anonymous Event-site query requires an ACTIVE Event and selects only the
current `PUBLISHED` version. The public projection contains the page fields and
ordered content values only. It excludes content/version IDs, status,
timestamps, archived/draft text, staff identity, Organisation data and storage
keys.

Brand images continue through the validated Event-site asset endpoint. The
content layer never provides a direct filesystem or storage-provider path.

## Rendering boundary

The customer page renders organiser values as React text, so supplied markup
cannot execute. Optional empty sections are omitted. Semantic headings,
landmarks, skip navigation, keyboard-operable FAQ disclosure, visible focus
styles and reduced-motion variants form the local accessibility baseline.

Core page, card, hero and booking-button colour pairs must meet the server-side
4.5:1 contrast floor before branding can be saved. Production still requires
independent accessibility review and deployed-device evidence.

The page deliberately does not reproduce Session, price, Ticket Type, Product,
Rule, capacity or inventory values. Customers enter the existing booking
authority through `/book/:eventId/date`.
