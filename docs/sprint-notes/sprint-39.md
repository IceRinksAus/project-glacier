# Sprint 39 — Configuration and Publishing Clarity

## Outcome

Sprint 39 makes configuration easier to understand without creating duplicate
business logic. Organisers can now distinguish their own security, Team access,
Organisation policies and Event-specific configuration. Each authorised Event
has a grouped operational settings workspace, while Website actions accurately
distinguish a private design preview from a live customer website.

## Glacier settings

- `My account and security` contains the signed-in operator's existing password,
  session and MFA lifecycle controls.
- `Team and access` retains OWNER-governed role, Event assignment and
  attributable Manager MFA-reset behavior.
- `Organisation policies` retains the Organisation Flexible Ticket authority
  and clearly labels its scope.
- `Event configuration` lists only Events the current operator is authorised to
  access and links to each Event's settings rather than duplicating its forms.

The information architecture changes presentation only. Existing OWNER,
MANAGER, STAFF and SCANNER permissions remain server-authoritative.

## Event configuration and Gate Entry

The Event `Settings` tab now groups navigation and status by operating concern:
Tickets and sales, Website and publishing, Waiver, Data and reporting, Flexible
Tickets and Gate Entry. Existing mutation controls remain in their established
components.

Gate Entry shows the Event timezone and configured opening/closing window,
links to the organiser Scanner readiness workspace and explains the bounded
device paths: dedicated SCANNER operation, read-only Ticket lookup followed by
confirmation, and POS lookup followed by deliberate admission. It does not
expose Ticket credentials, device secrets or a second admission authority.

## Website publishing

- A DRAFT Event offers `Preview design` and states that customers cannot access
  the Event until it is active.
- An ACTIVE Event offers `Open live website` and `Copy public URL`.
- Canonical links use the current web origin and no longer substitute the API
  port in local development.
- Logo, hero image and hero-copy readiness are visible while existing safe
  branding fallbacks remain available.
- Glacier browser metadata was already present in the verified baseline and did
  not require a duplicate implementation.

## Deliberate boundaries

Reports calculations, hierarchy and exports were not redesigned. Waiver legal
wording, guardian/consent rules, retention and submission behavior were also
not changed. Those are substantial reviews with different evidence needs and
remain separate future Sprints.

No schema migration or dependency change was required. No domain, hosting,
email, cloud media, hardware or other paid service was purchased or provisioned.

## Verification

- Focused Settings tests: 1 file / 4 tests passed.
- Focused Event Settings and Website tests: 2 files / 5 tests passed.
- API: 92 suites / 660 tests passed; production build passed.
- Web: 37 files / 111 tests passed; production build passed.
- All 49 Prisma migrations remained current and replayed from empty state.
- Disposable authenticated tenant/role/Event/MFA isolation passed 5 of 5 checks.
- Isolated PostgreSQL backup/restore matched all 16 critical tables; the 0.29
  MiB archive completed in 0.48 seconds and restored in 1.28 seconds.
- The tracked-secret scan passed across 660 files and 6 rules.
- The complete local release gate passed.

Automated component interaction tests and isolated production builds are the
Sprint's UI evidence. A fresh authenticated desktop/tablet/mobile browser pass
was not performed during closeout and is not claimed as evidence.

## Protected foundations and future evidence

Tenant, role and Event-assignment checks remain in place. Ticket credentials and
admission, Rules, pricing, reservations, capacity, inventory, Payments/refunds,
rescheduling, Flexible Tickets, POS and Scanner foundations were not weakened.

Managed production secrets, deployed infrastructure, monitoring, media
delivery, real Zebra/Android/iOS/POS device validation and independent
accessibility, legal, privacy and security review remain future evidence.

## Post-closeout POS age correction — 18 September 2026

Operator review identified that walk-up POS assigned age 18 to every Ticket
Type. Ticket Types did not previously persist an age range, so this could make
an age-sensitive required-Product Rule evaluate against an unsuitable default.

Ticket Types now support optional OWNER-managed minimum and maximum ages with
API and database validation. POS selects a valid representative age when a tile
is tapped: it uses the configured maximum where present (for example Toddler
0–4 becomes 4 and Child 5–14 becomes 14), otherwise the configured minimum
(Adult 18+ becomes 18). Staff can still correct the age before reservation when
the actual age matters. Unconfigured legacy Ticket Types retain the compatible
age-18 fallback rather than inferring policy from their names.

The follow-up release gate passed with 50 migrations, 92 API suites / 663 tests,
37 web files / 112 tests, both production builds and 5 of 5 disposable
tenant/role/Event/MFA isolation checks.
