# Privacy Data-Flow, Retention and Deletion Register

## Status and authority

Sprint 31 engineering register, prepared from the current Prisma schema, API
boundaries and operational documentation on 2 September 2026.

This register describes what Glacier currently stores and establishes the
control decisions that must be completed before real customer data is used. It
is not a privacy policy, legal advice, an approved statutory retention schedule
or authority to delete production records. Every proposed period below remains
subject to Australian legal/privacy, accounting, insurance and operational
approval.

## Current conclusions

- Glacier does not yet provide a customer erasure, correction, export,
  anonymisation, legal-hold or scheduled-retention workflow.
- Commerce and safety evidence is deliberately difficult to delete through
  `Restrict` relationships. That protects audit integrity but is not a complete
  privacy lifecycle.
- Events with Sessions, Bookings or Ticket Types cannot be hard deleted.
  Sessions with any Booking cannot be hard deleted. Operational cancellation
  is the current safe lifecycle for those records.
- Customer, participant and Waiver identity currently remains for as long as
  the database remains. There is no approved time limit or minimisation job.
- Authentication sessions expire after eight hours and can be revoked, but
  expired/revoked rows are not yet cleaned up.
- Public Booking access, Waiver verification and Ticket presentation use
  possession credentials. Booking and Waiver credentials are stored as hashes;
  the current Ticket `secureToken` is stored as a raw unique value and therefore
  requires strict database protection and future credential-storage review.
- Glacier records provider references and authoritative amounts, but does not
  intentionally store card numbers, CVC values or online card credentials.
- Merchandise-only POS deliberately avoids creating a placeholder Customer.
- Application logs are designed to exclude request bodies, query strings, raw
  credentials and complete customer/participant records. Central log retention
  is not configured.

## Data-flow map

| Flow                          | Collection/source                                                                   | Authoritative processing and storage                                                                                          | Intended recipients/disclosures                                                                    | Current boundary                                                                                                                  |
| ----------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Operator access               | User supplies email/password; OWNER manages membership and Event access             | Password hash, membership, role, Event assignment, authentication session and access-change evidence in PostgreSQL            | Authorised Glacier operator; future identity/email suppliers only when approved                    | JWT Organisation context, live membership checks, role/Event guards, revocable eight-hour session                                 |
| Public Event discovery        | Organiser publishes Event, Session, Ticket Type, Product and branding data          | PostgreSQL plus local development branding objects                                                                            | General public for ACTIVE Events                                                                   | Privacy-minimised public DTOs; DRAFT/INACTIVE and foreign records fail closed                                                     |
| Online Booking                | Purchaser supplies customer and participant details and selects Tickets/Products    | Customer, Booking, participant, line, reservation and hashed Booking-possession credential in PostgreSQL                      | Relevant organiser staff; Stripe receives payment data directly under its approved integration     | Server-authoritative price, capacity and inventory; bounded possession-token APIs                                                 |
| Payment and refund            | Browser/provider returns provider status; authorised operators initiate adjustments | Amount, currency, method, status, provider references, failures, reconciliation, refund and adjustment evidence in PostgreSQL | Stripe/payment provider, authorised financial operators and future accounting process              | No raw card data intended in Glacier; idempotency and append-only evidence retained                                               |
| POS                           | Staff selects walk-up Tickets/Products and records supported payment method         | Booking/participant records for Ticket sales; Retail Sale and item snapshots for merchandise-only sales                       | Authorised Event/POS staff and payment provider where integrated                                   | Merchandise-only sale does not collect purchaser identity; operator attribution retained                                          |
| Ticket presentation and entry | Customer presents possession credential; staff selects Event and scanner mode       | Ticket state and append-only scan attempt with operator, result, mode and time                                                | Credential holder and assigned gate/POS staff                                                      | Scanner response is privacy-minimised; no raw credential is copied into scan evidence                                             |
| Waiver                        | Signatory supplies name, signature representation and minor name/date of birth      | Immutable published wording/hash, acceptance evidence, verification-token hash and minor records in PostgreSQL                | Credential holder and authorised organiser staff; legal/insurer access only under approved process | High sensitivity; public verification is possession-bound and minimised                                                           |
| Flexible Ticket/support       | Customer submits bounded reason/note; authorised operator decides                   | Entitlement, request, participant/Ticket snapshots, decisions, adjustments and reschedule evidence                            | Customer through possession-bound view and authorised support operators                            | Notes prohibit card/bank/credential/detailed-health data; financial and Ticket authority remains server-side                      |
| Branding files                | OWNER uploads logo/hero image                                                       | Metadata/checksum in PostgreSQL and object in local development storage                                                       | Public only when selected for an ACTIVE Event; authorised organiser otherwise                      | Image type/structure/size validation and tenant selection; managed private storage remains pre-live                               |
| Reporting                     | Glacier aggregates operational and commerce records                                 | Derived at request time from PostgreSQL                                                                                       | Authenticated, authorised organiser staff                                                          | No temporary export retention beyond request processing is intended; exported copies become an operational control responsibility |
| Observability and recovery    | Application emits bounded operational evidence; backup process copies database      | Local privacy-safe structured logs and encrypted/controlled future backup targets                                             | Restricted technical/incident responders                                                           | External log retention, managed backup ageing and access evidence remain pre-live controls                                        |

## Data register and proposed disposition

The `Proposed lifecycle` column is a design proposal, not an approved legal
period. `Approval required` must be resolved before the associated production
workflow is activated.

| Class and current records                                                                            | Personal/sensitive examples                                                                                    | Purpose                                                                              | Current lifecycle                                                                                               | Proposed lifecycle                                                                                                                                                                                            | Approval required                                                           |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| A. Organisation and operator identity (`Organization`, `User`, membership/Event access)              | Name, work email, phone/address/ABN where entered, role and assignments                                        | Tenant operation, authority and accountability                                       | No self-service deletion; access can be removed/deactivated; audit relations may restrict deletion              | Retain active identity while access exists; deactivate rather than erase where attribution is required; minimise contact fields after the approved post-access period                                         | Privacy and employment/contractor policy; owner for inactive-account review |
| B. Authentication and access evidence (`AuthenticationSession`, `OrganizationAccessAudit`)           | Session identifier, expiry/revocation, actor/target, before/after role state                                   | Access enforcement, incident investigation and accountability                        | Sessions expire/revoke but rows persist; access audit is restricted from cascade deletion                       | Automate short, defined session cleanup after the security investigation window; retain access-change evidence for the approved audit window, then delete or pseudonymise where lawful                        | Security/privacy approval and incident-evidence requirement                 |
| C. Customer and Booking identity (`Customer`, `Booking`)                                             | Name, email, phone, booking number and service history                                                         | Contract/service delivery, support, communications and reconciliation                | Persists indefinitely; Customer may be shared by multiple Bookings                                              | Preserve Booking/financial evidence; after the approved operational/legal window, remove or pseudonymise direct contact identity when no hold or unresolved matter applies                                    | Legal/privacy/accounting approval and customer-rights procedure             |
| D. Participant and child data (`BookingParticipant`)                                                 | Name and integer age; Ticket relationship                                                                      | Eligibility, product rules, fulfilment, admission and support                        | Persists indefinitely; some commerce/support evidence stores participant-name snapshots                         | Collect only fields required by the Event; minimise identity after operational, incident, refund and legal windows; ensure every denormalised snapshot is included                                            | Children's privacy/legal and insurer approval                               |
| E. Ticket and scan evidence (`Ticket`, `TicketScanAttempt`)                                          | Ticket number/token, participant link, attendance time, operator and scan result                               | Admission, fraud prevention, support and event-day evidence                          | Persists indefinitely; scan record retains attribution and can survive Ticket deletion with `ticketId` set null | Retain credential/state while usable; invalidate after lifecycle; retain minimised scan evidence only for approved incident/operational window                                                                | Security, privacy, insurer and event-operations approval                    |
| F. Payments, refunds and reconciliation (`Payment`, `PaymentRefund`, `PaymentReconciliationAttempt`) | Amount, method/status, provider reference, failure details, operator                                           | Payment fulfilment, accounting, dispute/fraud handling and reconciliation            | Persists with Booking/Retail Sale; adjustment relationships deliberately restrict deletion                      | Preserve financial ledger and provider references for the approved statutory/dispute period; minimise free-text failure detail and customer linkage when permitted                                            | Accountant, payment provider and legal/privacy approval                     |
| G. Adjustments, reschedules and Flexible Tickets                                                     | Participant/Ticket snapshots, operator notes/reasons, refund and entitlement history                           | Authoritative support decisions, inventory/capacity restoration and dispute evidence | Append-only/restrict relationships intentionally prevent casual deletion                                        | Retain with underlying Booking/financial evidence; redact prohibited note content; pseudonymise identity only through a designed transaction that preserves monetary and operational truth                    | Legal/privacy/accounting and support-policy approval                        |
| H. Waiver evidence (`EventWaiver`, `WaiverVersion`, `WaiverSubmission`, `WaiverMinor`)               | Signatory name, signature data, acceptance time, minor full name/date of birth                                 | Evidence of disclosed wording and acceptance                                         | Persists indefinitely; minor rows cascade only with submission; no legal hold field                             | Apply the longest approved jurisdiction/insurance/claim period; legal hold overrides ordinary expiry; at expiry securely remove signature and identity while retaining only approved non-identifying evidence | Australian lawyer, insurer and privacy adviser; approved Waiver wording     |
| I. Event catalogue, Sessions, Products and rules                                                     | Usually non-personal; operator-created content and schedules                                                   | Event operation and historical interpretation of commerce                            | Draft empty records can be deleted; records linked to Bookings/evidence are protected                           | Archive/cancel operational records; retain snapshots needed to interpret sales; remove abandoned test/draft content under a controlled environment policy                                                     | Operations/accounting decision; test-data policy                            |
| J. Branding assets (`FileAsset` and object)                                                          | Original filename may contain a person's name; creator attribution                                             | Public Event presentation and asset provenance                                       | Replaced local object is removed after metadata update; metadata persists; Event deletion cascades metadata     | Sanitize names at collection, delete replaced/orphan objects after a recovery window, age metadata under Event lifecycle, honour legal hold                                                                   | Managed-storage lifecycle and privacy approval                              |
| K. Retail Sale                                                                                       | Operator identity and sale/payment evidence; intentionally no purchaser identity                               | Merchandise POS, inventory, GST/accounting and reconciliation                        | Persists indefinitely with restricted Event/User relations                                                      | Preserve financial/item snapshots for approved accounting/dispute period, then delete or minimise non-required operator linkage where lawful                                                                  | Accountant/legal/privacy approval                                           |
| L. Logs, incidents and backups                                                                       | User/Organisation/Event IDs, request correlation, bounded error metadata; database backup contains all classes | Reliability, security investigation and recovery                                     | Local logs have no central retention; local backup drill creates and removes isolated evidence as documented    | Set class-specific central log period, access and deletion; encrypt backups and let deleted live data age out on an approved immutable backup schedule; restrict restoration use                              | Security/privacy owner, infrastructure owner and incident plan              |
| M. Exports                                                                                           | Booking/report information selected by operator                                                                | Organiser analysis and event operation                                               | Generated for the request; Glacier does not intentionally retain a server copy                                  | No server retention by default; label exports as sensitive, restrict roles, record export audit where risk warrants, and define organiser device disposal                                                     | Privacy/operations policy and role matrix                                   |

## Retention schedule decision template

No numeric period is approved by this engineering review. Before staging with
representative personal data, the accountable owner must complete this table
with advisers and convert it into configured policy rather than prose alone.

| Data class | Active-use trigger | Retention clock starts | Approved period | Hold/extension | End action | Approver/evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Operator identity and access audit | Account/membership active | Access ends or audit action occurs | **TBD** | Incident, dispute or investigation | Deactivate; delete/pseudonymise eligible fields | **TBD** |
| Authentication sessions | Session active/revocable | Expiry or revocation | **TBD** | Active security investigation | Delete session row after evidence window | **TBD** |
| Customer/Booking/participant | Service/refund/support active | Event or transaction completes | **TBD** | Chargeback, complaint, claim, legal/insurer hold | Transactional pseudonymisation/deletion | **TBD** |
| Payment/refund/adjustment/retail sale | Accounting/dispute active | Financial period/transaction completes | **TBD** | Tax, audit, fraud or dispute hold | Retain ledger; minimise eligible identity | **TBD** |
| Ticket/scan | Ticket active/event operation | Event concludes | **TBD** | Incident, fraud or safety claim | Invalidate credential; delete/minimise eligible evidence | **TBD** |
| Waiver/signature/minors | Claim evidence potentially required | Acceptance/event conclusion as advised | **TBD** | Legal/insurer hold | Securely delete identity/signature at approved expiry | **TBD** |
| Branding object/metadata | Asset selected/recoverable | Replacement/Event archive | **TBD** | Dispute/brand evidence | Delete object and then eligible metadata | **TBD** |
| Central logs/incidents | Operational investigation | Log/incident closure | **TBD** | Security/legal hold | Delete or archive under restricted access | **TBD** |
| Backups | Recovery coverage | Backup created | **TBD** | Security/legal hold under approved process | Cryptographic/physical expiry; prevent routine access | **TBD** |

## Controlled privacy-request workflow

Glacier must not implement a generic cascading `DELETE Customer` operation.
The approved workflow should be an OWNER/privacy-officer operation with these
stages:

1. Record the request without copying unnecessary identity or credentials into
   notes.
2. Verify the requester's identity through an approved method and resolve every
   relevant Customer, Booking, participant, Waiver and possession credential
   within the correct Organisation.
3. Classify the request as access, correction, deletion, objection/complaint or
   another approved category; record the response deadline and accountable
   owner.
4. Check unresolved Payments, refunds, chargebacks, support matters, incidents,
   insurance claims and legal holds. A hold pauses destruction but does not
   grant broader access.
5. Produce a reviewed export/correction plan or a transactionally consistent
   deletion/pseudonymisation plan. Preserve monetary totals, immutable policy
   versions and necessary audit evidence without retaining avoidable identity.
6. Revoke Booking/Ticket access credentials and active authentication sessions
   where applicable before changing identity.
7. Apply the action across primary fields and every denormalised snapshot,
   object, search index, analytics destination and approved supplier—not only
   the `Customer` row.
8. Record non-sensitive completion evidence, affected systems, exceptions,
   authoriser and time. Do not store the erased values in the completion log.
9. Allow ordinary backup expiry to remove historical copies. Restoration into
   production must replay completed privacy actions before normal access is
   enabled.
10. Communicate the outcome and any lawful/approved exception through the
    approved contact process.

## Legal hold requirements

Before any automated deletion exists, Glacier needs a hold record with:

- Organisation and narrowly scoped subject/record identifiers;
- reason category without unnecessary case detail;
- issuing authority and accountable owner;
- creation, review and release dates;
- protected data classes/systems;
- immutable audit of creation, renewal and release; and
- a retention job that fails closed when hold status cannot be determined.

Only authorised OWNER/privacy/legal roles should manage holds. Holding data must
not make it visible to ordinary operators who could not otherwise access it.

## Engineering controls required before activation

1. Obtain an approved retention schedule and customer-facing privacy material.
2. Name the privacy-request, security-incident and legal-hold owners.
3. Add an explicit archive/deactivation lifecycle before expanding hard-delete
   routes.
4. Design and test tenant-scoped access/correction/export and transactional
   pseudonymisation workflows, including every snapshot field.
5. Add legal-hold storage, authorisation, audit and deletion-job enforcement.
6. Add configured cleanup for expired/revoked authentication sessions,
   abandoned reservations and eligible temporary data.
7. Review Ticket credential storage and replace raw-at-rest possession material
   with a rotation/hash design where the presentation workflow permits it.
8. Configure managed object, log and backup lifecycle rules and prove object
   deletion plus backup ageing.
9. Inventory approved subprocessors, regions, purposes, contract terms,
   deletion/export capabilities and incident contacts.
10. Test deletion/restoration in an isolated environment and demonstrate that a
    restored backup cannot silently resurrect completed privacy actions.

## Explicit prohibitions

- Do not use production/customer data in local development or test fixtures.
- Do not collect marketing, analytics, detailed health, identity-document or
  payment-card data merely because it may be useful later.
- Do not place raw credentials, signatures, card/bank details, full customer
  records or unnecessary child data in logs or operator notes.
- Do not treat cascade deletion as a privacy-request implementation.
- Do not promise deletion where financial, safety, Waiver, dispute or legal-hold
  requirements have not been assessed.
- Do not retain everything indefinitely because an approved period is missing.
  Missing approval is a production blocker, not an unlimited-retention policy.

## Evidence boundary

This register closes the missing engineering inventory and decision framework.
It does not close the legal/privacy gate. Production activation remains blocked
until approved periods, notices, subprocessors, roles and workflows are
implemented and tested against the deployed storage, logs and backups.
