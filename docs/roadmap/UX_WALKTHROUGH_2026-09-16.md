# UX and Product Walkthrough — 16 September 2026

## Confirmed direction

- Organisers should land on Dashboard; SCANNER users remain scanner-only.
- Events need Current, Upcoming and Past groupings plus search.
- Glacier needs a distinctive but calm cool-colour identity and stronger blocks.
- Existing journeys should be preserved where they already flow well.

## Event workspace

- Overview should show authoritative Event-level operational metrics, including
  Tickets issued, today's activity and live/Draft status.
- Sessions should later use a date-led calendar with today or next operating date
  selected and a bounded per-date Session list.
- Ticket Type creation may later offer editable Adult/Child/Toddler suggestions.
- Products requires a separate UX redesign: Product creation is primary and
  grouping should be an optional later presentation decision.
- Bookings and Customers need prominent search/results workspaces; Bookings
  default newest first.
- Waiver, Website, Reports and Settings need dedicated later reviews. Settings
  should become grouped and distinguish Organisation from Event configuration.

## Customer booking

- Use a mobile-friendly operating-date calendar.
- Retain Session presentation and add controlled arrival guidance.
- Explain Ticket prerequisites before selection and reject invalid dependent
  Ticket additions immediately, using backend Rules as final authority.
- Replace “Material Terms” with clear, legally accurate customer language.
- Make required add-ons explicit and explain when additional units may be added.
- Details and Review are structurally sound and mainly need visual refinement.

## POS

- Redesign as a touch-first tablet/square-terminal kiosk with large Ticket and
  Product tiles plus a persistent side order panel.
- Ordinary walk-up sales should not require participant names; any Event/Waiver
  exception must be explicit and bounded.
- Intended hardware should support Ticket scanning for lookup and deliberate
  individual-Ticket admission. Lookup must not itself consume a Ticket.
- Preserve shared Rules, pricing, capacity, inventory, Payment and audit
  authority, with tenant/role/Event checks unchanged.

## Scanner

- Organiser surfaces should provide Gate Entry configuration, readiness and
  operating guidance, not promote desktop scanning.
- The organiser-facing Staff Scanner navigation item should retain the standard
  dashboard shell and open a configuration/how-it-works workspace covering
  device onboarding, Event assignment, credential status and operating guidance.
- Zebra/Android/iOS users should sign in directly to the dedicated scanner.
- Dedicated SCANNER credentials should continue to bypass the organiser shell
  and land directly in the full-screen scanner-only interface.
- Current scanner interaction is close to the intended direction; real-device
  evidence remains required for camera/reader behavior, outdoor visibility,
  poor connectivity and rapid/duplicate scans.

## Defects observed

- Browser metadata still uses the framework placeholder.
- Website “Copy public URL” rewrites port 3002 to 3001 and produces a broken
  local link.
- A DRAFT Event offers a public-link action without explaining that public access
  correctly returns Event unavailable; an authorised private preview is needed.

## Directional follow-up

- Sprint 36 completed: organiser Session calendar and authoritative capacity
  presentation. The customer calendar remains a later customer-journey slice.
- Sprint 37 completed: Product-first catalogue, editable Product requirement
  Rules, Product/Ticket Type visuals and Bookings/Customers lookup entry.
- Sprint 38 completed: touch-first POS, participant-name-free walk-up sales,
  scanner-connected Ticket lookup/admission and organiser Scanner readiness.
- Sprint 39: Settings, Reports, Website, Waiver and Gate Entry deep dives.
