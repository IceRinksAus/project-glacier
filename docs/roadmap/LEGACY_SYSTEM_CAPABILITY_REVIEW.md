# Legacy Ticketing System Capability Review

**Reviewed:** 26 August 2026

**Status:** Approved product-planning input

**Purpose:** Preserve the useful operational lessons identified in a private legacy-system screen recording and map them into Glacier without copying its implementation, visual design or personal data.

## Evidence and Privacy Boundary

The source was a privately supplied approximately 14.5-minute recording of a legacy ticketing administration system. It showed real staff and customer information. The recording and extracted frames must not be committed, shared or used as Glacier fixtures. This document records only functional observations and Glacier decisions; it deliberately excludes names, email addresses, phone numbers and identifiable screenshots.

The legacy system is reference evidence, not a specification. Glacier retains its existing tenant, Booking, capacity, inventory, Payment, role and reporting authorities.

## Primary Product Decision

Glacier's authenticated landing page should become an operational portfolio dashboard. It should answer, immediately after login:

- where current and upcoming Events are;
- how they are performing;
- what is happening today;
- which exceptions require attention; and
- where the operator should act next.

The legacy system's information density is useful, but Glacier should present headline outcomes first, trends second and expandable operational detail third.

## Capability Comparison

| Capability observed | Glacier position after Sprint 25 | Decision | Classification |
|---|---|---|---|
| Portfolio dashboard immediately after login | Introductory dashboard exists | Replace with a live operational overview | Pilot-useful |
| Event and location performance summary | Event and Event Group reporting foundations exist | Show tickets, revenue, Products and capacity utilisation across active Events | Pilot-useful |
| Date-range sales and Ticket charts | Authoritative report endpoints and date concepts exist | Add clear headline figures and comparative trends | Pilot-useful |
| Session-level sales reporting | Implemented foundation | Improve presentation of Tickets, Products, revenue, capacity and attendance | Pilot-useful |
| Ticket Type reporting | Implemented foundation | Present quantity, revenue and sales mix by Event date and Session | Pilot-useful |
| Product/add-on reporting | Implemented foundation | Add quantity, revenue, remaining stock and reusable Session capacity | Pilot-useful |
| Cross-Event/location comparison | Event Groups implemented | Surface Group/season comparison from the landing dashboard | Pilot-useful |
| Online versus walk-up sales | Booking source and POS implemented | Add channel comparison and reconciliation views | Pilot-critical for reconciliation |
| Capacity utilisation | Shared Session capacity implemented | Show sold, reserved, admitted and remaining without fragmenting capacity by Ticket Type | Pilot-critical |
| Entry and attendance progress | Ticket scanning foundation exists | Show issued, scanned and remaining for today's Sessions after authoritative validation | Pilot-useful |
| Operational alerts | Basic product patterns exist; consolidated view absent | Highlight near-capacity Sessions, inventory risk, Payment exceptions, Waiver gaps and scan anomalies | Pilot-useful |
| Customer and Booking search | Implemented | Continue improving filters and controlled operational actions | Pilot-critical |
| CSV/Excel/PDF export | CSV and browser Print/Save PDF implemented | Keep current baseline; promote generated XLSX/PDF only with proven operational need | Pilot-useful / advanced deferred |
| Saved or scheduled reports | Not implemented | Consider after real reporting workflows are observed | Post-pilot |
| Previous Event/season comparison | Event Group foundation exists | Add year-on-year and previous-season comparison after baseline reconciliation | Pilot-useful |
| Running/cumulative sales totals | Booking pace foundation exists | Add cumulative pace comparison where it supports decisions | Pilot-useful |
| Revenue by transaction type | Payment methods now distinguish online card, Cash and standalone EFTPOS | Add reconciled channel/method totals | Pilot-critical |
| Payment reconciliation | Investigation foundation exists | Add operator, method, discrepancy and settlement-oriented views | Pilot-critical |
| Refund reporting | Refund persistence exists; controlled partial workflow remains | Report amount, Ticket, reason, approver and net effect after workflow authority is delivered | Pilot-critical after mutation workflow |
| Event status and activity summary | Event lifecycle exists | Present draft, on-sale, active, completed and archived Events with relevant actions | Pilot-useful |
| Inventory summary | Finite Variant and reusable Product capacity implemented | Consolidate stock, Variants and Session-capacity Products such as Kangas | Pilot-critical |
| Event-page CMS | Branding/media foundation exists | Keep a bounded Event content model for branding, FAQs, sponsors, banners and promotions | Post-foundation, evidence-led |
| Event-specific branding | Implemented foundation | Preserve a common accessible journey with Event-specific colours, fonts, logos and imagery | Pilot-useful |
| Email-template management | Not complete | Add controlled templates, approved variables, preview and safe defaults | Pilot-useful before scaled operation |
| Sponsor/promotion management | Not implemented | Add only when a confirmed Event requires it | Post-pilot unless promoted |
| Social and analytics configuration | Not implemented | Add controlled links/instrumentation only after privacy and analytics decisions | Post-pilot |
| User administration | OWNER, MANAGER, STAFF and SCANNER foundations implemented | Retain Event assignment, least privilege and audit evidence | Pilot-critical |
| Fine-grained permission/job management | Role/assignment model exists | Extend only where operational evidence exceeds current roles | Post-pilot unless promoted |
| POS configuration and order processing | Walk-up Ticket POS implemented | Continue merchandise-only commerce, reconciliation and till UX without duplicating core commerce | Pilot-critical |
| Booking email and Ticket communications | Partial foundation | Add resend, delivery state and communication history before scaled support | Pilot-useful |
| Dense pivot-style tables | Not used as the default Glacier presentation | Preserve analytical depth through accessible filters, expandable tables and exports | Design principle |
| Persistent season/Event/location selectors | Organisation and Event filters exist in separate surfaces | Create a consistent dashboard context that carries into reports | Pilot-useful |

## Approved Dashboard Composition

| Section | Organiser decision supported | Minimum content |
|---|---|---|
| Headline performance | Are Events tracking as expected? | Gross/net sales where authoritative, Tickets sold, Product sales and capacity utilisation |
| Active Events | Where are Events and what state are they in? | Event, location, dates, status, headline performance and direct action |
| Sales trend | Is sales pace strengthening or weakening? | Daily Tickets/revenue and optional prior Event/season comparison |
| Today's operations | What needs attention now? | Current/next Sessions, expected attendance, scans, remaining capacity and walk-up sales |
| Event comparison | Which locations or Events differ materially? | Event Group scorecard with consistent metrics |
| Sales channels | How was revenue collected? | Online card, POS Cash and POS EFTPOS totals |
| Product position | What will sell out or constrain operations? | Popular Products, low Variant stock and reusable Session capacity |
| Alerts | What requires intervention? | Capacity, inventory, Payment, Waiver and scanning exceptions with safe links |
| Quick actions | Where should the operator go next? | Event, Bookings, POS, Scanner and Reports |

## Dashboard Rules

- Metrics must reuse authoritative reporting and commerce services; the dashboard must not introduce alternative calculations.
- Filters should support Organisation-authorised Event Group, Event, location and date-range context.
- Filter context should carry into detailed reports where safe and intelligible.
- Every headline value should link to its supporting detail or clearly explain its definition.
- Alerts must be actionable, prioritised and tenant/Event scoped; they must not become an unbounded notification engine.
- Capacity remains shared at Session level across Ticket Types.
- Product reporting must distinguish finite global/Variant inventory from reusable per-Session capacity.
- Online card, Cash and standalone EFTPOS remain distinct Payment methods.
- Default presentation must be accessible and readable; dense pivot tables belong in detailed reporting or export views.

## Roadmap Placement

1. Finish pilot-critical transaction foundations: merchandise-only POS commerce, controlled partial refunds/cancellations, Ticket changes and reconciliation.
2. Build the operational dashboard from those stable, authoritative sources.
3. Expand decision-support reporting, comparisons and exports from real operator feedback.
4. Add broader CMS, marketing and communication tooling only when confirmed by pilot operations.

No already locked Sprint is expanded by this review. A future Sprint plan must define the smallest dashboard slice, calculations, permissions, performance limits and acceptance evidence before implementation begins.

## Scope Control

Each capability remains labelled as one of:

- **Pilot-critical:** required for safe commerce, admission, reconciliation or support;
- **Pilot-useful:** materially improves operator awareness or decision-making but cannot displace a critical gate;
- **Post-pilot:** valuable after pilot evidence and operational stability; or
- **Deferred:** explicitly excluded until new evidence promotes it.

The screen recording does not authorise copying proprietary presentation, code, data structures or content. Glacier will implement its own accessible design around its protected architecture.
