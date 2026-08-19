# Project Glacier — Pilot Readiness & Strategic Roadmap
**Prepared:** 19 August 2026  
**Status:** Strategic control document  
**Purpose:** Define Glacier's current position, the path to pilot, and the broader product direction so roadmap decisions do not depend on chat history.

---

# 1. Strategic Purpose

Project Glacier is being developed as a multi-tenant event operating platform.

Its initial implementation has been driven by session-based attractions and Ice Rinks Australia use cases, but the intended product is broader than a ticket-selling system.

The strategic product direction is:

> **Glacier should become an integrated event-management platform with ticketing, booking, payment and admission as core transactional capabilities, surrounded by organiser, customer and staff operating tools.**

The immediate objective is not to build every future module.

The immediate objective is:

> **Move Glacier from its current end-to-end booking foundation to a genuinely pilot-ready product that Ice Rinks Australia can operate at a real event without relying on developer intervention or critical external/manual workarounds.**

---

# 2. Current Product Architecture

Glacier should be understood as four product surfaces around one shared core platform.

## 2.1 Organiser Platform

Authenticated Organisation-facing software used to create, configure and operate Events.

Long-term responsibilities include:

- Organisation dashboard
- Event creation wizard
- Event workspace
- Sessions
- Operational schedules
- Products
- Product variants
- Ticket Types
- Rules
- Bookings
- Customers
- Waivers
- Reports
- Settings
- Event operations
- later broader event-management modules

Current status:
A rudimentary Organiser Platform exists. The Event list and Event Workspace exist, with Overview and Sessions currently the most developed user-facing operator areas. Several Event Workspace sections remain placeholders.

---

## 2.2 Customer Event Websites

Public-facing Event websites generated and powered by Glacier.

Long-term responsibilities include:

- Event landing page
- Event branding
- venue and Event information
- session browsing
- ticket selection
- participant capture
- add-ons
- booking
- payment
- confirmation
- waiver prompt
- later customer booking management

Current status:
A rudimentary but functional public Event booking experience exists and now supports real Stripe payment and Ticket issuance.

The experience is functionally ahead of its final product design and requires later UX/productisation work.

---

## 2.3 Staff / Event Operations

Operational interface used by on-site staff.

Long-term responsibilities include:

- staff authentication
- Event/session selection
- Ticket scanning
- check-in
- admission status
- operational lookup
- later waiver verification
- staff-specific permissions and workflows

Current status:
Ticket validation, QR and scan/check-in primitives exist in the API, but there is not yet a complete staff-facing operational product.

---

## 2.4 Glacier B2B Website

A future public commercial website, likely at `glacier.com`, whose purpose is to sell Glacier to other event operators.

This is not the event-management software itself.

Its purpose is commercial:

- product positioning
- feature explanation
- customer types / use cases
- pricing or enquiry flow
- demo requests
- contact / sales
- case studies
- later onboarding and commercial conversion

Current status:
Not a near-term engineering priority.

It should be developed when Glacier has a demonstrably usable pilot product so the marketing site can describe real delivered capabilities rather than future promises.

---

# 3. Current Glacier Status

## 3.1 Overall Position

Glacier has now moved beyond an early prototype.

The core transactional and operational foundation includes:

- Organisations
- Users and Organisation memberships
- JWT authentication
- Event ownership
- Events
- Sessions
- Operational Schedule Builder
- Session exceptions
- Products
- Product Variants
- Session Products
- Ticket Types
- Customers
- Bookings
- Booking Items
- Participants
- Rules / Rule Engine
- Reservations
- Stripe Payments
- Payment Refunds
- Tickets
- QR generation
- Ticket validation
- Ticket scanning/check-in primitives

Sprint 15 completed the real payment architecture and should be treated as the point at which Glacier reached a genuine end-to-end booking foundation.

---

## 3.2 Current Strategic Milestone

Glacier is best considered approximately:

> **v0.5 — End-to-end booking foundation**

The next target is:

> **v0.8 — Internal pilot-ready**

followed by:

> **v0.9 — Live-event pilot**

and then:

> **v1.0 — Production release**

The next few months should therefore be organised around reaching pilot readiness rather than simply adding whichever feature appears next on a roadmap list.

---

# 4. What Glacier Does Well Today

## 4.1 Booking Engine

The backend is authoritative for:

- Event / Session relationships
- Ticket Type validity
- Product configuration
- participant rules
- required add-ons
- capacity checks
- server-side totals
- reservation state

This is a strong foundation for future operator, staff and customer interfaces.

---

## 4.2 Rule Engine

Glacier already supports configurable Event rules and backend-authoritative enforcement.

This provides a strong basis for session attractions and other event types with age, product or participation rules.

---

## 4.3 Operational Scheduling

Operational Schedule Builder and Session exception handling are mature capabilities and align with Glacier's broader event-operations vision.

They are more than generic ticketing features and should remain a core product differentiator.

---

## 4.4 Payments

Sprint 15 delivered:

- real Stripe PaymentIntents
- Payment Element
- signed webhooks
- persistent Payment attempts
- persistent PaymentRefunds
- idempotency
- reservation-expiry PaymentIntent cancellation
- automatic late-success refund
- Ticket issuance protection

Payment and fulfilment architecture should now be treated as a stable foundation unless a future product requirement genuinely requires changes.

---

# 5. Current Gaps Before Pilot

The core engines are now more mature than the product surfaces around them.

The most important gaps are:

## 5.1 Organiser onboarding and Event setup

A complete Event creation/setup wizard does not yet exist.

The Organiser Platform must become usable without developer intervention.

---

## 5.2 Staff / gate operations

Ticket scan primitives exist, but a proper staff-facing scanner/check-in product is still required.

---

## 5.3 Operator booking and customer-service tools

Real event operations require staff to locate and understand Bookings and Customers without database access.

Minimum pilot capability will likely include:

- Booking lookup
- Customer lookup
- Session / Ticket information
- payment status
- basic customer-service actions

Exact change/refund/reschedule functionality should be scoped from Ice Rinks Australia's actual operating requirements.

---

## 5.4 On-site sales / POS

If walk-up sales are operationally important, Glacier needs a supported on-site sales workflow before pilot.

This does not necessarily require a fully mature retail POS platform.

The pre-pilot goal should be the smallest reliable POS/on-site sales capability needed to operate an Event.

---

## 5.5 Basic reporting and reconciliation

A pilot Event cannot reasonably be operated without basic operational and commercial visibility.

Minimum pre-pilot reporting should likely include:

- Event sales
- revenue
- Tickets sold
- attendance / check-ins
- Session utilisation
- refunds
- payment/reconciliation status

Advanced BI/report-builder capability can follow later.

---

## 5.6 Security consistency

Several older API areas remain less consistently protected than newer tenant-scoped modules.

A targeted API/security hardening milestone is required before live pilot.

This should include:

- clear Public / Operator / Staff endpoint boundaries
- JWT/role enforcement
- Organisation scoping
- input validation policy
- Ticket scan authorisation
- cross-tenant denial testing

---

## 5.7 Production readiness

Before live pilot Glacier also requires:

- production environment configuration
- deployment process
- secret management
- rate limiting / abuse controls
- logging / monitoring
- backup / restore verification
- error handling
- auditability
- privacy/security review
- pre-pilot Security & Privacy Gate

---

# 6. Sprint 16 — Current Next Sprint

## Sprint 16 — Event Waivers & Digital Acceptance

Sprint 16 is the currently agreed next Sprint.

Core principles:

- Waivers are Event-centric.
- Waivers are independent of Booking, Ticket, Customer account and email.
- Walk-up / POS customers must be able to complete a waiver.
- The public waiver is accessible through a stable Event URL / physical QR code.
- Online Booking confirmation may offer the same waiver as an optional shortcut.
- Each adult completes their own acceptance.
- A responsible adult may include multiple minors.
- Published Event-specific Waiver Versions are immutable.
- Glacier uses approved jurisdiction-specific legal templates and controlled Event/Organisation variable substitution.
- The Event Setup Wizard includes `Waiver & Terms` as a standard **optional** step.
- An Event may be valid with no Waiver.
- If a Waiver is enabled, its generation / preview / approval / publication lifecycle is strict.
- Digital Waiver Pass architecture should be considered.
- Apple Wallet is a stretch goal and must not block Sprint 16 completion.

Sprint 16 must preserve Sprint 15 payment and Ticket authority.

---

# 7. UX / Productisation Strategy

Glacier's Organiser Platform and Customer Event Websites both currently exist in rudimentary form.

UX improvement is not considered cosmetic work to leave until v1.0.

It is a pre-pilot workstream.

## 7.1 Incremental rule

From Sprint 16 onward:

> **Any new UI should be built in the direction of the intended production product, not as temporary developer UI.**

Reusable patterns should be established for:

- navigation
- page headers
- forms
- wizard steps
- cards
- tables
- status indicators
- empty states
- confirmation states
- error handling
- mobile layouts

---

## 7.2 Dedicated productisation milestone

Before internal pilot there should be a deliberate Organiser & Customer Experience Productisation milestone.

Likely focus:

### Organiser
- Organisation dashboard
- Event cards
- Event Wizard
- Event setup progress
- Event Workspace consistency
- usable Products / Ticket Types / Bookings / Customers workflows
- clear statuses and empty states
- tablet/desktop usability

### Customer
- Event landing page
- Event branding
- mobile-first booking
- Session selection
- Ticket presentation
- booking-step progression
- Add-ons
- payment transition
- confirmation
- waiver CTA
- accessibility and error recovery

---

# 8. Pilot Capability Test

A capability should be considered pre-pilot if the answer to this question is **No**:

> **Could Ice Rinks Australia run a real event using Glacier as the primary operating system without this capability?**

This test should override arbitrary software-category labels such as "Phase 1" or "Phase 2".

---

# 9. Pilot Capability Matrix

| Capability | Pre-Pilot Status | Reason |
|---|---|---|
| Core Event model | Complete foundation | Required |
| Sessions | Complete foundation | Required |
| Operational scheduling | Complete foundation | Required |
| Products / Ticket Types | Complete foundation | Required |
| Rule Engine | Complete foundation | Required |
| Public Booking | Complete foundation | Required |
| Stripe Payments | Complete foundation | Required |
| Ticket issuance | Complete foundation | Required |
| Event Waivers | **Required before pilot** | Real participation/check-in operation |
| Event Setup Wizard | **Required before pilot** | Organiser must create Events without developer intervention |
| Organiser UX productisation | **Required before pilot** | Platform must be operationally usable |
| Customer UX productisation | **Required before pilot** | Real customers must use it reliably |
| Staff Scanner / Check-in | **Required before pilot** | Gate operation |
| API / tenant hardening | **Required before pilot** | Security boundary |
| Booking lookup | **Required before pilot** | Customer service |
| Customer lookup | **Required before pilot** | Customer service |
| Booking changes / rescheduling | **Likely required before pilot** | Existing operational requirement; exact scope to confirm |
| Refund operations | **Likely required before pilot** | Customer service; exact scope to confirm |
| Minimum on-site sales / POS | **Likely required before pilot** | Walk-up sales |
| Basic Event reporting | **Required before pilot** | Event management |
| Payment reconciliation | **Required before pilot** | Commercial control |
| Minimum venue data | **Required before pilot** | Event setup / operational context |
| Production deployment | **Required before pilot** | Live use |
| Logging / monitoring | **Required before pilot** | Operational reliability |
| Backup / restore | **Required before pilot** | Production safety |
| Rate limiting / abuse protection | **Required before pilot** | Public production safety |
| Security & Privacy Gate | **Required before live pilot** | Release gate |
| Customer Portal | Post-pilot unless operational evidence promotes it | Not essential to first operator pilot |
| CRM campaigns | Post-pilot | Growth capability |
| Memberships | Post-pilot | Commercial expansion |
| Gift Cards | Post-pilot | Commercial expansion |
| Advanced Venue Management | Post-pilot | Broader event-management expansion |
| Asset Management | Post-pilot | Broader event-management expansion |
| Staff rostering | Post-pilot unless required operationally | Broader operations |
| Sponsorship management | Post-pilot | Commercial event-management expansion |
| Marketing automation | Post-pilot | Growth |
| glacier.com B2B website | Commercialisation stage | Sells Glacier rather than operating Events |
| SaaS self-service billing | Commercialisation stage | External operator scale |

Items marked "Likely required" should be confirmed against actual Ice Rinks Australia event-day operations before their Sprint is scoped.

---

# 10. Proposed Roadmap to Pilot

Exact Sprint numbers after Sprint 16 are provisional.

Capability order is more important than numbering.

## Sprint 16 — Event Waivers & Digital Acceptance

Goal:
Complete Glacier-native Event waiver creation, publication, public acceptance and evidence.

---

## Next Milestone — API Boundary & Security Hardening

Goal:

> Establish consistently safe Operator, Staff and Public API boundaries before building more privileged UI.

Likely areas:

- Organization
- Booking
- Customer
- Category
- Ticket Type
- Rule
- Ticket
- internal Payment routes
- input validation policy

This milestone should remain targeted rather than becoming an open-ended security rewrite.

---

## Next Milestone — Staff Scanner & Gate Operations

Goal:

> Allow real staff to perform reliable authenticated check-in at the Event.

Core flow:

staff login
→ select Event / operational context
→ scan
→ VALID / ALREADY SCANNED / INVALID
→ check in
→ continue

---

## Next Milestone — Organiser & Customer Experience Productisation

Goal:

> Turn Glacier's existing functional surfaces into coherent product experiences.

Includes:

- Organisation dashboard
- Event Wizard
- Event Workspace
- public Event site
- booking UX
- Event branding / Website configuration
- consistent design system

---

## Next Milestone — Operator Service Tools

Goal:

> Let event staff resolve real customer issues through Glacier.

Likely scope:

- Booking lookup
- Customer lookup
- Booking details
- payment/ticket state
- minimum session-change capability
- minimum refund/cancellation workflow

Exact scope should be based on real event-day workflows.

---

## Next Milestone — Minimum Viable POS / On-Site Sales

Goal:

> Support the walk-up customer journey required by a real Event.

Avoid building a broad retail POS platform unless the pilot requires it.

---

## Next Milestone — Core Reporting & Reconciliation

Goal:

> Give organisers sufficient operational and financial visibility to run the Event.

Minimum reports:

- Event sales
- revenue
- Tickets
- attendance
- Session utilisation
- refunds
- payments / reconciliation

---

## Next Milestone — Pilot Production Hardening

Goal:

> Turn the development system into a controlled pilot platform.

Includes:

- deployment
- production environments
- secrets
- CORS/configuration
- rate limiting
- logs
- monitoring
- backup / restore
- auditability
- security review
- privacy review
- operational procedures

---

# 11. v0.8 — Internal Pilot Ready

The internal-pilot milestone should mean:

> **Ice Rinks Australia can operate a complete Event through Glacier without developer shortcuts for normal Event operations.**

Target operational chain:

Organisation
→ Event creation
→ Event configuration
→ Sessions
→ Products / Ticket Types
→ Rules
→ optional Waiver
→ public Event website
→ customer Booking
→ Stripe Payment
→ Ticket issuance
→ on-site sales
→ staff check-in
→ Booking/customer support
→ reporting / reconciliation

Real operational staff should be able to use the product.

---

# 12. v0.9 — Live Event Pilot

After internal operation is stable:

> Run a controlled live Event where Glacier is genuinely responsible for customer and operational workflows.

Live pilot should deliberately test:

- customer behaviour
- queues
- poor network conditions
- duplicate scans
- late arrivals
- walk-up sales
- staff mistakes
- refunds / changes
- device issues
- mobile usability
- operational support
- payment reconciliation

Pilot findings should drive the final v1.0 priorities.

---

# 13. Post-Pilot — Event Management Expansion

Once the core platform and pilot foundation work, Glacier should expand beyond ticketing into a broader Event Operating System.

Ticketing remains a major module, not the whole product.

Potential expansion domains:

## 13.1 Event operations
- Event run sheets
- operating checklists
- tasks
- incidents
- maintenance
- operational documents
- suppliers
- contractors

## 13.2 Venue management
- venue records
- spaces / zones
- capacities
- utilities
- maps
- infrastructure
- reusable venue configurations

## 13.3 Workforce
- staff
- roles
- shifts
- accreditation
- training
- contractor access

## 13.4 Assets
- equipment
- asset allocation
- maintenance state
- Event assignment

## 13.5 Customer / CRM
- customer history
- segmentation
- campaigns
- memberships
- loyalty
- group / corporate sales

## 13.6 Commercial
- Gift Cards
- promotions
- sponsorship
- vendors / concessions
- merchandise
- budgets
- settlement

## 13.7 Reporting / Intelligence
- Event performance
- revenue
- attendance
- utilisation
- operational KPIs
- customer analytics

---

# 14. Product Expansion Principle

Do not attempt to build a generic enterprise ERP in advance.

Use real operational needs first.

Example:

Instead of:
"Build generic asset management."

Start from:
"Ice Rinks Australia needs to know which equipment is assigned to which Event and whether it is operational."

Then generalise the resulting capability carefully.

The same approach should apply to:

- Venue Management
- CRM
- Staff
- Assets
- Reporting
- commercial modules

---

# 15. Commercialisation Phase

Once pilot evidence demonstrates that Glacier works as an event platform, prepare it for other operators.

Commercialisation workstream may include:

- `glacier.com`
- product positioning
- pricing / packaging
- sales/demo flow
- case studies
- commercial onboarding
- self-service Organisation onboarding
- subscription/SaaS billing
- support model
- documentation
- external customer configuration

The B2B website should sell proven capability rather than future plans.

---

# 16. Major Strategic Risks

## 16.1 Backend capability outrunning product usability

Glacier's backend/domain foundation is currently more mature than the Organiser and Staff experiences.

From this point, development should rebalance toward productisation and pilot operations.

---

## 16.2 Scope breadth

The long-term vision is intentionally broad.

The risk is trying to support every future event type before the initial platform has operated a real event.

Use pilot needs to control sequencing.

---

## 16.3 Security maturity inconsistency

Newer modules use stronger tenant/role architecture than older modules.

Do not continue expanding privileged operator/staff capability before normalising the relevant security boundaries.

---

## 16.4 Delaying production hardening

Deployment, monitoring, backup, security and operational procedures must be scheduled before pilot rather than treated as last-minute launch tasks.

---

# 17. Development Balance Going Forward

Development to date has necessarily concentrated heavily on backend/platform capability.

Going forward, effort should increasingly balance:

- backend / security / reliability
with
- Organiser UX
- Customer UX
- Staff UX
- operational workflows

The immediate milestone is no longer simply proving that Glacier can perform an operation.

It is:

> **Making Glacier usable as a coherent event platform.**

---

# 18. Sprint / Roadmap Decision Test

At the end of each Sprint, ask:

1. Did this move Glacier materially closer to operating a real Event?
2. Did it reuse the existing Glacier capability architecture?
3. Did it reduce or increase operational risk?
4. Did it add unnecessary breadth before the pilot needs it?
5. Can a real organiser or staff member now do something meaningful they could not do before?
6. Is backend authority preserved?
7. Are tenant/security boundaries preserved?
8. Are decisions committed to documentation rather than left only in chat?

---

# 19. Pilot Scope Decision Rule

Before adding a capability to the pre-pilot roadmap, ask:

> **If this feature did not exist, could Ice Rinks Australia still operate the pilot Event successfully and safely using Glacier as its primary system?**

If **No**:
It belongs pre-pilot.

If **Yes**:
It should normally remain post-pilot unless there is another compelling strategic reason.

---

# 20. Current Strategic Conclusion

Glacier remains aligned with its original vision.

The last several Sprints have built the underlying machinery needed for:

- session-based events
- booking
- operational scheduling
- rules
- payments
- Tickets
- entry

The next development phase should deliberately shift toward:

1. completing pilot-critical domains;
2. making the Organiser, Customer and Staff surfaces coherent and usable;
3. securing and hardening the product;
4. operating Glacier internally at a real Event;
5. conducting a controlled live pilot;
6. expanding into broader Event Management;
7. commercialising Glacier to external operators.

The strategic priority for the next few months is:

> **Move Glacier from a strong v0.5 transaction engine to a v0.8 internal pilot-ready event operating platform.**
