# Sprint 20 — Public Event Site, Branding and Customer Booking Journey

## Status

Complete and locally verified on 24 August 2026. The application has not been deployed.

## Outcome

Sprint 20 productises Glacier's customer-facing Event and booking experience without rewriting its established Booking, Rule, inventory, Payment, Ticket or Waiver engines.

An OWNER can configure a controlled Event identity during creation and edit it later in the Website workspace. An ACTIVE Event has a customer-safe slug route. Customers progress through dedicated Date, Session, Ticket, Participant, Add-on, Details, Review, Payment and authoritative Confirmation pages. Branding continues across those pages while Glacier's capacity, Rule, inventory and payment boundaries remain server-authoritative.

## Public Event and Branding

The public entry route is `/event/:eventSlug`. It resolves ACTIVE Events only and returns a privacy-minimised Event-site response. DRAFT, INACTIVE, unknown and cross-tenant information do not become public.

Controlled branding supports:

- canonical six-digit colours;
- allowlisted heading and body fonts;
- bounded hero headline and description;
- optional Event logo and hero image;
- Glacier defaults when no custom record exists; and
- server-validated contrast before publication.

The public Event page and booking journey share the same theme defaults and font mappings. Raw CSS, HTML, JavaScript, uploaded fonts, SVG and external image URLs remain excluded.

## Branding Assets and Storage

Sprint 20 adds `FileAsset` metadata and a `FileStorageProvider` boundary for Event logos and hero images. PostgreSQL stores ownership and metadata rather than large binary content. The development provider writes to a configured local storage root.

Upload and delivery controls include:

- OWNER-only mutation;
- Event → Organisation ownership checks;
- PNG, JPEG and WebP signature validation;
- 5 MiB request limit and bounded dimensions;
- SHA-256 checksum and safe metadata;
- tenant-scoped OWNER/MEMBER private preview;
- ACTIVE Event plus explicit logo/hero reference for public delivery; and
- authoritative MIME type, ETag and `nosniff` responses.

Production object storage remains a gate. Australian-region provider selection, private bucket policy, encryption, signed/direct uploads, lifecycle, malware controls, monitoring, backup/restore treatment and delivery policy require separate implementation and evidence.

## Date-first Routed Booking

The Event CTA opens `/book/:eventId/date`. The nine customer pages are:

1. Date
2. Session
3. Tickets
4. Participants
5. Add-ons
6. Your details
7. Review
8. Payment
9. Confirmation

Date keys derive from eligible Session start times in the Event timezone. The Session page shows only times on the selected date, preventing a multi-day Event with many daily Sessions from presenting one overwhelming list. Changing Date clears the incompatible Session and all dependent commerce state. Customer contact fields are not needlessly discarded because they do not depend on Date.

The shared provider retains checkout state only in memory. Personal details, participant ages and Booking credentials are not placed in URLs or general persistent browser storage. A hard refresh before reservation creation safely restarts the incomplete checkout.

## Preserved Commerce Authority

- Session capacity remains the shared rink admission pool across all Ticket Types.
- Ticket Types remain participant categories and prices, not separate capacity pools.
- Rule evaluation is previewed in the browser and repeated authoritatively at reservation creation.
- Young Child Tickets still require an accompanying Adult and the configured Kanga minimum.
- Required Products cannot be reduced below the authoritative minimum.
- Reusable Products retain per-Session capacity, including Session overrides.
- Product Variants retain independent global finite inventory and price snapshots.
- Reservation creation remains serializable and holds active capacity/inventory for 15 minutes.
- Expired or cancelled reservations release capacity through status-aware availability queries.

## Payment and Confirmation

The browser never treats Stripe client submission as confirmation. After submission it displays a processing state and polls `POST /public/bookings/:bookingId/status` with the high-entropy Booking credential in the request body. The server stores only the SHA-256 credential hash and returns `Cache-Control: no-store`.

Ticket possession credentials are withheld until Booking status is `CONFIRMED` and payment status is `PAID`. Each issued Ticket then has a private presentation and QR route using a separate high-entropy credential. Public presentation never checks in a Ticket; admission remains an authenticated Staff action.

Signed Stripe webhook success remains authoritative. Duplicate success is idempotent. A success arriving after reservation expiry cannot resurrect the Booking and is refunded through the existing compensating path without Ticket issuance.

## Automated Verification

- API: 61 of 61 suites and 399 of 399 tests passed.
- Web: 15 of 15 suites and 49 of 49 tests passed.
- Focused Payment/webhook/expiry/inventory set: 6 suites and 88 tests passed.
- API production build: passed.
- Web webpack production build: passed, including all nine routed pages.
- Full web lint: passed with one existing internal-login navigation warning.
- Sprint-touched web lint: passed.
- `git diff --check`: passed at each checkpoint.
- Original 45-suite / 236-test API floor: preserved.

The repository-wide API lint command still reports a longstanding backlog of 2,840 errors and 4 warnings, predominantly historical Prettier differences and unsafe test-mock typing. Sprint 20 does not silently rewrite thousands of unrelated API lines. Builds, all tests and focused changed-file checks remain green; the lint backlog should receive a dedicated mechanical cleanup with its own baseline and review.

## Dependency Audit

- Web production dependencies: zero known vulnerabilities.
- API production dependencies: four high-severity findings from `deepmerge-ts` through Prisma's dependency chain.
- npm reports no fix available.
- Sprint 20 does not introduce application-owned recursive merging of untrusted object graphs.
- The advisory remains a monitored upstream production gate.

## Browser Acceptance

The canonical `3001` public preview and `3002` dashboard use the same rebuilt application, API and local database.

Verified behavior includes:

- public Event identity and CTA;
- Date → filtered Session → Tickets navigation;
- nine-step semantic progress;
- Event branding continuation and safe default theme;
- Rule failure and required Kanga behavior;
- Product Variant availability and separate totals;
- truthful reservation/payment-processing copy;
- guarded Confirmation and private Ticket/QR design;
- no page-level overflow at 390 × 844;
- intentional progress-only horizontal scrolling; and
- no browser warnings or errors during the final Date/Session route acceptance.

A real Stripe test-mode payment was completed after explicit approval:

- Booking `PG-1787557409087-1501`;
- one Adult Ticket at $24 and one Small Hoodie Variant at $50;
- authoritative total $74;
- live reservation countdown and inventory hold;
- Stripe `payment_intent.created` and `payment_intent.succeeded` delivered through the signed local listener;
- webhook responses returned HTTP 201;
- Booking reached PAID/CONFIRMED only after the successful signed event;
- Ticket `TKT-1787557475861-B41BC9` was issued;
- published Waiver continuation appeared;
- the private Ticket route rendered its 511 × 511 QR; and
- Small Hoodie remaining inventory moved from 50 to 49.

The browser recorded no application errors. Stripe emitted the expected warning that localhost test integration uses HTTP while live Stripe.js requires HTTPS.

The API log review also found two older expired local acceptance Bookings whose local Payment rows remain PENDING while Stripe reports their PaymentIntents as succeeded. The expiry scheduler therefore retries an impossible cancellation every minute. This did not affect the successful Sprint 20 transaction, and automated coverage already proves the intended late-success refund path. Production still needs monitored provider/local reconciliation so missed or historical webhook divergence becomes a resolved incident rather than an indefinite retry loop.

## Security and Privacy Boundaries

- Branding mutations require JWT-authenticated OWNER authority.
- MEMBER may view branding and preview owned assets but cannot mutate.
- SCANNER remains excluded from Event administration.
- Public Event and asset discovery is ACTIVE-only and minimised.
- Booking status and Ticket presentation require distinct possession credentials.
- Credentials are not placed in URLs except the purpose-built Ticket presentation token.
- Payment fields remain within Stripe Elements.
- Stripe signature verification and raw request-body handling remain unchanged.

## Deliberate Non-goals

- no deployment;
- no production object-storage rollout;
- no arbitrary themes, uploaded fonts or page-builder code;
- no custom domains;
- no rewrite of Booking, capacity, inventory, Rule, Payment, Ticket or Waiver engines;
- no organiser Events portfolio redesign; and
- no Product grouping/order persistence in this Sprint.

## Recorded Future Product UX

The next suitable Product-catalogue/UX slice should add persisted customer-facing Product groups and organiser-controlled display order. It should support group and Product reordering through drag-and-drop plus a keyboard-accessible alternative. Public Add-ons must consume the same order while Rule-required minimums, Session assignment, reusable capacity and Product Variant inventory remain authoritative.

## Remaining Production and Pilot Gates

- monitored reconciliation for provider/local Payment-state divergence and missed historical webhooks;
- managed Australian-region object storage and full media-control evidence;
- deployment-edge rate limiting, monitoring and abuse evidence;
- managed secrets, TLS, logs, alerting, backups and restore proof;
- password recovery, privileged-user MFA and granular Staff permissions;
- production-like tenant-isolation integration and independent security testing;
- physical iPhone Safari and Android Chrome acceptance; and
- final legal/privacy/retention review for Waivers and customer/participant data.
