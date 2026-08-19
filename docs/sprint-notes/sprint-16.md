# Sprint 16

## Objective

Deliver Glacier's first native Event Waiver and Digital Acceptance capability while preserving Glacier's existing Booking, Payment and Ticket authority.

Sprint 16 introduces Event-centric digital waivers that can be completed independently of how admission was purchased.

The Waiver system must support:

- online Glacier purchasers
- attendees whose Ticket was purchased by another person
- walk-up / POS customers
- complimentary attendees
- promotional or prize attendees

A Booking, Ticket, Customer account or email address is not required to complete a Waiver.

---

## Core Product Principles

### Event-Centric Waivers

Waivers belong to the Event and the person accepting them rather than to the transaction used to purchase admission.

Waiver completion is not inherently linked to:

- Booking
- Ticket
- BookingParticipant
- Customer
- email address

These relationships may be introduced later if they provide operational value, but they are not Sprint 16 requirements.

### Optional Event Setup Step

`Waiver & Terms` is a standard but optional Event Setup Wizard step.

An organiser may:

- create a Waiver
- skip the Waiver step where it is not relevant

An Event remains valid without a Waiver.

If a Waiver is enabled, Glacier must enforce the complete generation, review, approval and publication workflow.

### Approved Jurisdiction Templates

Glacier must not dynamically invent legal wording.

Waiver content is generated from approved activity- and jurisdiction-specific templates.

Initial activity family:

- Ice Skating

Initial jurisdiction model should support AustraliaInitial jurisdiction mes.

Glacier performs controlled Glacier performs controlled Glacier performs controlled Glacier performs controlled Glacier performs controlVersions


lacier performs controlled Glacier pens are immutable.

Changes toChanges toChanges tatCha new verChanges totoricalChanges toChanges toChanges tatCha new verChanges totoricalChanges toChanges toChanges tatCha new verChanges totoricaloduChanges toChanges toChanges to Changes toChanges toChanges tatCha new verChanges totoricalChar shouldChanges toChangeEveChannd OrganisatioChanges toChanges toChanges tatCha new verChanEveChanges toChanges toChanges tatty
- tradin- tradin- tradin- tradin- tradin- tradin- tradin- tradin- tradin- tradin- tradin- tradin- tradin- tradin- traould be able to:

1. select or confirm Event jurisdiction
2. select/create the appropriate Wai2. select/create the appropriate Wai2. select/create the appropriate Wai2. select/cer
5. o5. o5. o5. o5. o5. o5.c Waiver URL / QR c5. o5. o5. o5. o5. o5. o5.c Waiver URL / QR c5. o5. o5. o5. o5. o5. o5.c Wat 15. o5. o5. o5. o5. o5. o5.c Waiver URL / QR c5. o5. o5. o5. o5. o5. o5.c Waiver URL / QR c5. o5. o5. o5. o5. o5. o5.c Wat 15. o5. o5. o5. o5.  Publ5. o5. o5. o5rney

A published Event Waiver must be acceA published Event Waiver must be acceA published Event Waiver must be acceA published Event Waiver must be acceA published Event Waiver must be acceA published Event Waiver must be acceA published Event Waiver must be acceA published Event Waiver must be acceA published Event Waiver must be acceA published Event Waiver must be acceA published Event Waiver must be acceA published Event Waiver mumatiA published Event Waiver must be acceA published Event Waiver must be acceA published Event Waiver must be acceA published Event Waiimpose the existing CleverWaiver five-minorA published Event Waiver must be acceA published Event Waiver must be acceA published Event Waiver must be acceA publisbliA published Event Waiver must be acceA published Event Waiver must be acceA published Event Waiver must be acceA published Event Waiver must be acceA published Event Waiver must be acceA published Event Waiver must be acceA published Event Waiver must be acceA published Event Waiver mutten.

Glacier remains the authoritative record.

---

## Online Booking Integration

The existing Stripe-confirmed Booking flow remains unchanged.

If the Event has an active published Waiver, the Booking confirmation experience should offer a separate optional call to action such as:

> Get ready for your session

> Each adult skater should complete their own waiver before going onto the ice. A responsible adult can include children in their care.

> Complete waiver now

The action opens the same public Event Waiver URL used by the venue QR code.

It must not:

- link the Waiver submission to the Booking
- block Ticket issuance
- change Booking status
- change Payment state
- require participant invitation workflows

---

## Operator Capability

Authorised operators must have a tenant-safe way to:

- configure the Event Waiver
- preview and publish Waiver Versions
- view the public URL / QR
- search or retrieve Waiver submissions
- inspect basic submission information
- confirm completion

New operator Waiver endpNew operator Waiver endpNew operr security patteNew operator Waiver endpNew ed New operator Waiver endpNew operator Waiver endpNew operrint 16New operator Waiver endpNew operator Waiver endpNew operr security patteNew operator Waiver endpNew ed New operator Waiver endpNew opercateNew operator Waiver er must:


ew operator Waiver endpNew operator Waiver endpNew operr security patteNew operator Waiver endpNew ed New operator Waiver endpNew ope
- - - - - - - -  timestam- - - - - - - -  timestam- - - - - - - -  timestam- - - - - - - -  gnature payloads
- valida- valida- valida- valida- valida- valsizes
---------------------n-enumerable verification credentials
- avoid exposing submission lists publicly
- minimise personal data returned by verification endpoints

The current Nest runtime validation approach must be reviewed durThe current Nest runtime validatand VeThe current Nest runtimepubThe current Nest runtime ve a stable Event Waiver URL rather than a Waiver Version ID.

Changing the Changing the Changing the Changing the Changing the Changing the Changing the Changing the Changing the Changing the Changing the Changing the Changing the Changing the Changing the Changing the Changing the Changing the Changing the Changing the Changing the Changing the Changing the Changing the Changing the Changing the Chang into Changing the Changing the Changing the Changing the Changing the Changing the Changing the Changing the Changing the Changing the CherChanging the Changing the Changing the Changing the Changing the Changing the Changing the Changing the Chae Changing the Changing the Changing the Changing t cChanging the Changing the Changing the Changing the Changes not include:

- mandatory Booking linkage
- Ticket linkage
- BookingParticipant linkage
- Customer link- Customer link- Customer link- Customer link- Customer link- Customer link- Customer link- Customer link- Customer link- Customer link- Customer link- Customer link- Customer link- Customer link- Customer linssion blocking based on Waiver state
- full Staff Scanner redesign
- full Admin application
- CRM
- Reporting
- Memberships
- Gift Cards
- Venue Management
- signed PDF generation unless proven necessary
- object storage unless proven necessary
- broad legacy API security refactor
- Booking capacity concurrency redesign
- Customer tenancy redesign
- AI-generated production legal wording

---

## Operational Waiver Baseline

The current Bathurst Ice Rink Waiver has been reviewed as the real operational reference.

It includes:

- risk acknowledgement
- assumption of risk
- responsibility for children
- first-aid / medical authority
- conditions of admission
- recreational-services wording
- rink rules
- media consent
- signed acceptance
- adult signatory name/da- adult signatory name/ve min- adult signatory name/da- adult signatory name/ve min- adult signatory name/da- adult signatory name/ve min- adult signatory name/da- adult signatory name/ve min- adult signatory name/da- adult signatory name/ve min- adult signatory name/da- adult signatory iv- adult signatory name/da- ar - adult signatored
- under 7 mu- under companied by an adult on the ic- under 7 3 not per- under 7 mu- under companied by an adles use different young-child accompaniment logic.

Sprint 16 must not silently modify eSprint 16 must not silently modify eSperSprint 16 must not silnment.Sprint 16 must not silently modify eSpRule EngSprint 16 must not silently m authoritative domains until the business/legal rule is explicitly confirmed.

---

## Testing## Teirements
## Testing## Teiremen focused tests for:

### Templates / Versions

- Orga- Orga- Orga- Orga- Orga- Orgaion selection
- publication
- immutability
- provenance
- hi- hi- hi- hrs- n preservation- hi- hi- hi- hrs-


 hi- hi- hi- hrs- n preservation- hi- hi- hi- hrs-
ot silently modify eSperSprint 16 must not silnment.Sprint 16 must not silently modify eSpRule EngSprint 16 must not silently m authoritative domains until the business/legal rule is explicitly confirmed.
ot leak
- client cannot select arbitrary version

### Submission

- valid adult acceptance
- agreement requ- agreement requ- agreement requ- agreement requ- agreement requ- agreement requ- agreement requ- agreement requ- agreement requ- agreement requ- agreement ric persistence
- immutable version association

### Operator Security

- authentication required
- Organisation scope enforced
- cross-tenant access denied

### Booking Regression

- existing Stripe flow unchanged
- Ticket issuance unchanged
- Waiver CTA only appear- Waiver CTA only an act- Waiver CTA only appear- Waiver CTA oWaiv- Waiver Cue to book norma- Waiver CTA only appear- Waiver CTA only Scenario- Waiver line Customer

1. cr1ate/configur1. cr1ate/configur1. cr1ate/configur1. cr1ate/complete1. cr1ate/configur1. cr1ate/configur1. ugh Stripe sandbox
5. Booking confirms
6. Tickets issue
7. confirmation shows Waiver CTA
8. complete public Waiver
9. persist exact Version/evidence
10. confirm verification/completion

### Scenario B — No Booking / POS Equ### Scenario B — No Booking / POS Equrectly
2. do not cr2. do not cr2. do not ct 2. do not cr2. do not cr2. do not ct 2. do not cr2. do not cr2. do not ct 2. do not cr2. do not cr2. do not ct 2. do not cr2. do not cr2. do not ct 2. do not cr2. do not cr2. do not ct 2r 2. do not cr2. do not crlid
4. pu4. pu4. pu4. purks
5. n5. n5. n5. n5. n5. n5. n-
5. n5. n5. n5. n5. n5. nSprint5. n5. n5. n5. n5. n5. nSprent5. n5. n5. n5. n5. no Waiver
- enabled Event Waivers have- enabled Event Waiverson/publish lifecycle
- published Event Waiver Versions are immutable
- stable public URL / QR resolves the active published version
- public Waiver works without Booking/Ticket/account/email
- ad- ad- ad- ad- ad- ad- ad- ad- ad- ad- ad- ad- ad- ad- ad- ad- ad- ad- ad- ad- ad- ad- ad- ad- ad- ad- ad- ad- ad- ad- ad- ad- adce evidence is persist- ad- adrator retrieval is authenticated and tenan- ad- ad- ad- a Booking optionally links to the Event Waiver without changing Payment/Ticket authority
- all new focused tests pass
- existing API test suite remains green
- API prod- API prod- API prod- API prod- API prod- API prod- API prod- API prod- API prod- API prod- API prod- API prod- API prod- API prod- API prod- API prod- API prod- API prod- API prod- API prod- API prod- API prod- API prod- API prod- API prod- API proon S- API prod- API pr Sprint 16 scope and roadmap updates
2. inspect exact Organisation/Event integration points
3. finalise additive Prisma desig3. finalise additive Prisma desig3. finalise additive ment optional Even3. finalise additive Prisma desig3. finalise aan3. finalise additive Prisma desig3. finalise additive Pris public Waiver page
9. add online Booking confirmation CTA
10. add verification/QR
11. attempt Wallet stretch if core Sprint remains contained
12. run full regression/build/manual verification
13. update documentation and close Sprint
