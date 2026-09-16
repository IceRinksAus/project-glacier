# Sprint 35 Plan — Glacier UX Foundation and Organiser Home

**Status:** Complete 17 September 2026

## Outcome

Give the authenticated organiser platform a recognisable, accessible Glacier
identity; make the existing Organisation dashboard the normal organiser home;
make Events usable as the Organisation grows; strengthen Event Overview; and
repair public Website link/preview presentation without changing core commerce,
Ticket, Payment or operational authority.

The 16 September guided walkthrough confirmed that Glacier's broad workflow is
sound. This Sprint improves identity, hierarchy and discoverability rather than
rebuilding working journeys. Sessions, Products, customer booking and POS each
retain separate follow-up scopes.

## Product principles

- Preserve workflows that already feel intuitive.
- Use purposeful colour and stronger information blocks without making
  operational screens noisy or inaccessible.
- Organise presentation around the operator's task, not persistence concepts.
- Retain backend Rules, pricing, capacity and inventory as final authority.
- Keep organiser configuration separate from dedicated POS/Scanner operation.
- Preserve tenant, role and Event-assignment boundaries in every route and
  component.

## Slice 1 — Visual foundation and product identity

- Introduce an accessible Glacier organiser palette and reusable treatments for
  page headers, metrics, status, action panels and system states.
- Improve sidebar/top-bar hierarchy, active navigation and narrow-screen access.
- Replace framework metadata with Glacier identity and page-title conventions.
- Refresh login/MFA presentation without changing the verified MFA lifecycle.
- Retain visible keyboard focus, sufficient contrast and semantic status cues.

## Slice 2 — Dashboard as organiser landing page

- Redirect successful OWNER, MANAGER and STAFF authentication to `/`.
- Preserve SCANNER redirect to `/staff/scanner`.
- Apply the same role-aware destination after recovery-code acknowledgement.
- Refine the existing tenant-scoped Organisation dashboard around current
  operations and attention items rather than creating a duplicate backend.
- Keep OWNER-only creation actions and existing reporting authority.

## Slice 3 — Searchable, lifecycle-organised Events

- Add Current, Upcoming and Past lifecycle controls with Current selected first.
- Show an explicit useful empty state when no Current Events exist; do not
  silently redefine lifecycle.
- Add accessible search over the already-authorised Organisation report result.
- Preserve lifecycle classification supplied by the reporting service.
- Improve Event-card hierarchy while retaining useful metrics and OWNER-only
  creation.

## Slice 4 — Operational Event Overview

- Add an at-a-glance operational summary using authoritative Event reporting.
- Present Tickets issued, today's Sessions, confirmed Bookings, admissions,
  capacity/utilisation where meaningful and Payment exceptions.
- Keep DRAFT/ACTIVE status and readiness clear without duplicating Reports.
- Use precise reporting definitions; do not call issued Tickets sold unless the
  underlying evidence supports that term.

## Slice 5 — Website link and preview clarity

- Build public links from configured web origin rather than hard-coded local
  port rewriting.
- Show publication status and do not present a DRAFT URL as publicly usable.
- Provide an authenticated organiser preview of DRAFT presentation without
  weakening ACTIVE-only public access.
- Provide explicit Open and Copy actions with copy feedback.

## Protected boundaries and exclusions

No change to Ticket credential authority, Payment/refund behavior, capacity,
inventory, Flexible Ticket authority, Rules outcomes, Scanner admission,
privileged MFA, role/Event-assignment semantics or public ACTIVE-only access.

Excluded from Sprint 35:

- Sessions and customer calendar implementation;
- Products workflow redesign;
- Bookings/Customers operational workspace completion;
- POS kiosk or scanner-connected POS;
- Scanner hardware behavior;
- Reports, Waiver or Settings redesign;
- domains, deployment, email delivery, paid services or live data.

## Verification and exit

- Focused web/API tests for each changed contract, including roles, redirects,
  filtering, search, origin construction and preview/public separation.
- Fictional local browser acceptance at desktop, tablet and mobile widths.
- OWNER/MANAGER/STAFF/SCANNER routing and access denial remain correct.
- Complete API/web suites and production builds pass.
- Migrations remain current and replay from empty state.
- Complete release, disposable isolation, restore and tracked-secret gates pass.
- Verified slices are committed locally; no GitHub push without approval.

## Evidence boundary

This Sprint can prove local application/database/browser behavior only. Managed
production secrets, deployed origins, domains/HTTPS, real POS/Scanner devices,
central monitoring and independent security/accessibility review remain future
evidence.
