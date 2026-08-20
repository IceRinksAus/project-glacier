# Sprint 20 Plan — Public Event Site, Branding & Customer Booking Journey

## Planning Status

Approved on 21 August 2026. Implementation may proceed within this locked scope.

## Recommendation

Sprint 20 should productise Glacier's public customer experience without redesigning its proven transactional engines.

The Sprint has two connected delivery slices:

1. **Public Event Site and Branding Foundation**
2. **Page-by-page Customer Booking Journey**

The public Event site establishes the Event identity and entry point. The booking journey then carries the same identity through Session selection, Tickets, participant details, Add-ons, review, payment and confirmation.

## Objective

Deliver a coherent mobile-first customer journey:

Public Event page → Choose Session → Choose Tickets → Participant details → Add-ons → Customer details → Review → Reserve → Payment → Authoritative confirmation

Every Event uses the same safe, accessible Glacier information architecture while applying its own controlled colours, fonts, logo and hero treatment.

## Existing Foundations to Preserve

Sprint 20 must consume rather than replace:

- Organisation-scoped Event creation and activation;
- shared Session admission capacity across all Ticket Types;
- Ticket Type pricing and participant context;
- Rule Engine validation and required Product minimums;
- optional Session Products;
- reusable per-Session Product capacity;
- global Product and Product Variant inventory;
- serializable reservation creation and conflict retry;
- reservation expiry and inventory release;
- Stripe PaymentIntent creation and webhook authority;
- Ticket issue and QR generation;
- optional Event Waiver discovery;
- privacy-minimised public APIs.

The original 45-suite / 236-test API baseline remains a permanent regression floor.

## Product Principles

### One customer decision per page

Each page has one primary subject, a clear Continue action, a Back action where safe, a concise order summary and visible progress.

### Event identity with Glacier consistency

Branding changes presentation, not core interaction contracts. Buttons, fields, validation, focus states, price presentation and accessibility remain recognisably Glacier.

### Server authority

The browser may preview Rules and availability, but reservation creation re-evaluates current Session capacity, Product assignment, Rule minimums, Product capacity and Variant inventory.

### Truthful payment state

Successful Stripe client submission does not itself mean a Glacier Booking is confirmed. The customer sees `Payment processing` until Glacier's webhook-authoritative state reports PAID/CONFIRMED. Only then may the Confirmation page claim that Tickets were issued.

### Privacy by design

Customer and participant personal information must not appear in URLs, query strings, analytics labels or persistent general-purpose browser storage.

### Safe restart

Before reservation creation, a hard refresh may safely restart the incomplete checkout rather than persisting personal data insecurely. After reservation creation, the high-entropy public Booking credential supports controlled payment-status recovery for the current browser session.

### Accessible branding

Event owners may choose identity within validated boundaries. Branding may not make text unreadable, remove focus visibility, disguise payment controls or inject executable styling.

## Public Information Architecture

### Public Event route

Introduce a stable public Event route using the Event slug:

`/event/:eventSlug`

The route resolves only an ACTIVE Event through a privacy-minimised public endpoint. DRAFT and INACTIVE Events return the same public not-found outcome.

The current `/book/:eventId` route remains temporarily compatible during migration, but the public Event page becomes the normal entry point.

### Public Event page

The page includes:

- Event logo and name;
- branded hero treatment;
- Event description;
- Event dates in the configured timezone;
- venue name and customer-appropriate location summary;
- primary `Book tickets` action;
- optional Waiver link when a published Waiver exists;
- accessible default presentation when no custom branding exists.

No organiser-only IDs, Organisation metadata, internal readiness state, Rule JSON or operational configuration may be exposed.

## Event Branding Domain

### Persistence

Add one optional Event-owned branding record, conceptually `EventBranding`, with a one-to-one Event relationship.

The initial controlled fields are:

- `primaryColor`;
- `secondaryColor`;
- `accentColor`;
- `backgroundColor`;
- `surfaceColor`;
- `textColor`;
- `headingFont`;
- `bodyFont`;
- optional `logoAssetId`;
- optional `heroAssetId`;
- optional hero headline and supporting copy;
- created/updated timestamps.

Absence of an EventBranding record means Glacier's default public theme. Branding is optional and does not block Event activation.

### Controlled fonts

Fonts use a server-validated allowlist of bundled or approved families. Sprint 20 does not accept arbitrary font URLs, uploaded font files, CSS declarations or script tags.

The initial list should be deliberately small and cover several useful identities, for example:

- modern sans;
- friendly rounded sans;
- editorial serif heading with neutral body;
- strong display heading with accessible body.

The final list is confirmed during implementation against installed/licensed assets and performance requirements.

### Controlled colours

Colours accept canonical six-digit hexadecimal values only. The API normalises casing and validates bounds.

The organiser preview must calculate meaningful contrast combinations and block publication of a theme that fails the required text/background contrast. Decorative combinations may warn without blocking when they are not used for essential text.

Public components consume semantic CSS variables derived from validated branding values. Raw organiser CSS is never rendered.

### Brand presets

The Create Event experience begins with a Glacier default and offers a small set of curated presets. Presets populate the same editable controlled fields; they are not separate rendering implementations.

### Asset ownership and storage

Logo and hero images trigger the first implementation of Glacier's documented File & Media Storage architecture.

Sprint 20 introduces the minimum reusable `FileAsset` metadata and storage-provider boundary required for public Event branding:

- Organisation and Event ownership;
- original filename and display name;
- MIME type and byte size;
- content checksum;
- storage provider/key;
- asset purpose (`EVENT_LOGO` or `EVENT_HERO`);
- status and timestamps;
- creator attribution.

Accepted formats are a strict allowlist of safe raster image types. SVG is excluded initially unless a robust sanitisation pipeline is separately approved. File sizes and image dimensions are bounded. File signatures are checked rather than trusting filename extensions.

Development may use a local storage-provider implementation behind the same interface. Production remains blocked until a managed object-storage provider, Australian-region decision, signed upload/delivery controls, encryption, monitoring and lifecycle policy are configured and verified.

Public Event branding assets are explicitly published assets; unrelated Glacier files remain private by default. Knowing a storage key must not expose a private asset.

## Create Event Branding Step

Add **Branding** to the Event creation journey after Event basics and before final review.

The step provides:

- default/preset selection;
- controlled colour inputs;
- heading and body font selection;
- optional logo and hero image selection/upload;
- hero text inputs;
- live responsive preview;
- accessible contrast feedback;
- a `Use Glacier defaults` path.

Event creation remains one intentional final action. Structured branding fields should be created transactionally with the Event where practical. Binary asset upload may occur before final Event creation through an owner-scoped temporary asset workflow or immediately after Event persistence through an explicit resumable step; implementation must not create unowned orphan assets.

The Review step includes a visual branding summary. Successful creation continues to the Event Workspace exactly as Sprint 19 established.

## Website / Branding Workspace

Complete the existing Event **Website** tab as the durable branding editor.

- OWNER may edit and publish Event branding.
- MEMBER may view the current configuration and preview but cannot mutate it.
- SCANNER has no access.
- edits preserve the last valid public theme until a new valid update succeeds;
- changing branding never changes Booking, Payment, Ticket, inventory or Waiver evidence;
- the public Event URL is visible and copyable;
- live preview uses the same public components and theme resolver as the real site.

## Routed Booking Journey

The customer journey uses dedicated route segments or an equivalent nested routing structure that produces a real page transition for each step:

1. Session
2. Tickets
3. Participants
4. Add-ons
5. Customer details
6. Review
7. Payment
8. Confirmation

The implementation should use a shared booking-flow layout/provider so client navigation retains in-progress non-authoritative selections without query-string encoding.

### Step 1 — Session

- group Sessions by local Event date;
- display Event-timezone dates and times;
- provide clear selected state and remaining/sold-out messaging;
- do not expose internal schedule IDs;
- Continue only after one eligible Session is selected.

### Step 2 — Tickets

- show active Ticket Types and customer descriptions;
- use simple increment/decrement controls;
- show running quantity and Ticket subtotal;
- explain that availability is shared at Session level without exposing internal capacity mechanics;
- Continue only when at least one Ticket is selected.

### Step 3 — Participants

- collect the current minimum participant data required by authoritative Rules;
- associate each participant with the selected Ticket Type;
- use contextual validation and customer language;
- evaluate public Rules only after valid participant inputs;
- do not persist participant data in URLs or general browser storage.

### Step 4 — Add-ons

- apply required Product minimums automatically;
- explain required items plainly;
- prevent decrement below the required minimum;
- show optional Products separately;
- show Product Variants as distinct customer choices;
- show remaining quantities where finite;
- omit exhausted optional choices;
- block progression when an authoritative required Product is unavailable.

### Step 5 — Customer details

- collect bounded first name, last name, email and optional phone;
- provide consent/privacy links or placeholders only where approved content exists;
- no unrelated marketing consent is bundled into booking acceptance.

### Step 6 — Review and reserve

Show a single comprehensible order summary:

- Event and Session;
- Tickets and participant association;
- required and optional Products/Variants;
- Ticket subtotal;
- Product subtotal;
- total payable;
- applicable warning/information messages.

The primary action creates the customer and reservation using the existing public APIs. Duplicate clicks are prevented. Any concurrency rejection returns the customer to the affected step with selections preserved in memory and a plain explanation.

### Step 7 — Payment

- show Booking number, reservation expiry and amount due;
- create the PaymentIntent only from the reservation's authoritative total;
- render Stripe Payment Element;
- never accept a browser-supplied authoritative amount;
- after Stripe submission, display `Payment processing` and poll a credential-protected public status endpoint;
- stop polling on confirmed, expired, cancelled, refunded or bounded timeout states;
- do not show confirmed merely because Stripe.js returned `processing` or `succeeded` locally.

### Step 8 — Confirmation

Only webhook-authoritative PAID/CONFIRMED state may render confirmation.

Show:

- confirmed Booking number and total;
- Event and Session summary;
- issued Ticket information or a clear Ticket retrieval action;
- optional published Waiver action;
- payment reference where appropriate and privacy-safe;
- next-step operational guidance.

## Public Booking Status Recovery

Add a privacy-minimised public Booking status operation protected by the existing high-entropy public access credential.

The credential must be supplied outside the URL. The response includes only data necessary for payment progress and confirmation, such as:

- Booking status;
- payment status;
- reservation expiry;
- confirmation readiness;
- privacy-minimised Ticket availability;
- Waiver public slug when applicable.

It must not become a general unauthenticated Booking-detail API.

## Canonical Local Preview Contract

- `http://localhost:3001` opens the current public Event/customer experience.
- `http://localhost:3002` opens the organiser dashboard.
- both use the same current API and database.
- stable production previews are rebuilt after each meaningful implementation slice while macOS file-watcher limits make hot reload unreliable.
- temporary ports are used only for isolated verification and are not handed off as the normal user experience.

## Security and Validation

- Event branding mutations require authenticated OWNER authority.
- Event and FileAsset ownership derives from trusted Organisation context and authoritative relationships.
- public Event lookup exposes ACTIVE Events only.
- all branding inputs use strict allowlists and bounds.
- asset upload checks MIME signature, size, dimensions, purpose and ownership.
- no arbitrary CSS, HTML, JavaScript, font URL or external image URL input.
- public Booking status requires the hash-verified access credential.
- public error behaviour avoids Event, Booking and tenant enumeration.
- Stripe webhook remains authoritative.
- payment fields remain inside Stripe Elements.
- public routes retain current strict DTO validation and minimised responses.

## Accessibility and Responsive Requirements

- mobile-first layout from 320px upward;
- keyboard-complete booking and branding workflows;
- visible focus states;
- correctly associated labels and error summaries;
- semantic progress navigation with current-step indication;
- contrast-compliant default and accepted custom themes;
- no colour-only error, selection or required-state meaning;
- screen-reader announcements for Rule, availability, reservation and payment-state changes;
- reduced-motion support for transitions;
- tablet and desktop smoke verification.

## Testing Strategy

### API

- EventBranding create/read/update tenant and OWNER boundaries;
- strict colour/font/hero-field DTO validation;
- atomic Event plus branding creation where selected;
- default branding absence behaviour;
- public ACTIVE-by-slug discovery and DRAFT/INACTIVE denial;
- FileAsset ownership, purpose, MIME, signature, size and status controls;
- public branding response minimisation;
- public Booking status credential success/failure and response minimisation;
- webhook-authoritative confirmation transitions;
- stable Booking, Payment, Ticket, Waiver, Rule and capacity regression.

### Web

- Create Event Branding step validation and defaults;
- OWNER edit and MEMBER read-only Website Workspace;
- semantic theme application;
- Event landing page CTA and safe fallback theme;
- route-by-route progress and Back/Continue behaviour;
- no personal data in route state;
- Rule-required Product minimums;
- Variant selection and finite availability;
- separate Ticket/Product/total presentation;
- concurrency and expired-reservation recovery;
- payment processing does not claim confirmation early;
- confirmation only after authoritative status;
- Waiver continuation where configured.

### Browser Acceptance

- OWNER creates a fictional branded Event;
- branding appears consistently on the public Event and every booking step;
- customer books Adult/Young Child Tickets with automatic Kanga requirement;
- customer selects finite merchandise Variant;
- Review shows correct Ticket, Product and grand totals;
- reservation reduces visible remaining inventory;
- Stripe test payment passes through processing to webhook confirmation;
- Ticket/confirmation and optional Waiver route appear;
- abandoned reservation expiry releases inventory;
- narrow mobile, tablet and desktop smoke;
- no browser console errors;
- no deployment.

## Documentation Deliverables

- Sprint 20 closeout notes;
- Event Branding and Public Site architecture;
- FileAsset/storage-provider implementation note and production limitations;
- updated Booking Engine payment-state description;
- updated authentication/permissions and endpoint register;
- updated local Stripe and canonical-preview runbook;
- updated roadmap and changelog;
- explicit remaining storage, legal, privacy, security and production gates.

## Deliberate Non-Goals

- arbitrary CSS, HTML, JavaScript or theme plugins;
- custom uploaded fonts;
- animated page-builder functionality;
- custom domains or DNS automation;
- full CMS/blog/news system;
- broad media library;
- final production object-storage deployment;
- organiser Events portfolio redesign;
- POS, reporting, refunds or customer-service tools;
- rewriting the Booking, Rule, inventory, Payment, Ticket or Waiver engines;
- real payments or production deployment.

## Implementation Sequence

1. Commit this approved Sprint contract independently.
2. Add EventBranding persistence, DTOs, tenant-safe services and tests.
3. Extend Event creation transaction and web service types for optional branding.
4. Add the Create Event Branding step and accessible live preview.
5. Add minimum FileAsset metadata/provider boundary and safe logo/hero workflow.
6. Complete the Website/Branding Workspace editor.
7. Add the privacy-minimised public Event-by-slug contract and branded Event page.
8. Extract the existing booking logic into shared routed-flow state and step components.
9. Implement dedicated Session through Review pages without changing server authority.
10. Add protected public Booking status and truthful payment-processing flow.
11. Implement authoritative Confirmation and Ticket/Waiver continuation.
12. Run full regression, builds, lint and dependency audits.
13. Run branded fictional browser acceptance, including Stripe webhook and inventory release.
14. Complete detailed documentation, commit, push and verify clean synchronized `main`.

## Baseline

Sprint 20 begins from:

- 58 API suites and 378 API tests passing;
- 9 web suites and 38 web tests passing;
- API and web production builds passing;
- full web lint passing;
- web production audit reporting zero known vulnerabilities;
- original 45-suite / 236-test baseline preserved;
- clean synchronized application code at `9ca283e`;
- an unrelated user-owned roadmap edit present and explicitly excluded from Sprint commits;
- no deployment.

## Definition of Done

Sprint 20 is complete when an OWNER can create and later edit a controlled accessible Event brand; an ACTIVE Event has a branded public slug-based landing page; a customer can progress through dedicated Session, Ticket, Participant, Add-on, Customer, Review, Payment and Confirmation pages; required Products, finite inventory and totals remain authoritative; payment is never called confirmed before webhook-authoritative state; confirmation exposes appropriate Ticket and optional Waiver continuation; OWNER/MEMBER/public boundaries remain safe; the full regression baseline remains green; canonical `3001` and `3002` previews show the final current build; required architecture and residual-risk documentation is complete; and no deployment occurs.
