# Security, Privacy & Compliance

## Purpose

Security, privacy and regulatory compliance are first-class architectural requirements for Project Glacier.

Glacier will process customer, participant, staff, operational, payment-related and potentially sensitive event information at significant scale.

Security and privacy must therefore be designed into the platform rather than added immediately before launch.

---

## Core Principle

Glacier follows a privacy-by-design and security-by-design approach.

Every feature should ask:

- What information is genuinely required?
- Why is it required?
- Who needs access to it?
- How long should it be retained?
- How is access controlled?
- How is it protected in transit and at rest?
- How will inappropriate access be detected?
- How can the information be deleted, anonymised or archived when appropriate?

The backend remains authoritative for access control and tenant isolation.

Frontend controls must never be treated as security boundaries.

---

## Security Objectives

Glacier should provide:

- strong multi-tenant isolation
- least-privilege access
- secure authentication
- protection of customer and participant information
- secure payment boundaries
- secure file and media access
- auditable administrative actions
- resilient backup and recovery
- protection against common web attacks
- appropriate security monitoring
- secure production configuration
- incident detection and response
- privacy-aware data lifecycle management

---

## Data Minimisation

Glacier should collect only information necessary for legitimate product, operational, contractual, safety or legal purposes.

Examples may include:

### Customer

- name
- email
- phone number where required
- Booking history
- payment transaction references
- communications preferences

### Participant

- name
- age or other eligibility information where required
- Ticket Type
- Booking relationship
- waiver status
- participation requirements

### Operational

- maintenance records
- inspection records
- staff actions
- operational notes
- photographs and supporting evidence

### Staff / Users

- name
- email
- Organisation membership
- role
- authentication information
- audit history

Unnecessary personal information should not be collected simply because it may be useful later.

---

## Children and Young Participants

Glacier is expected to process information relating to children.

This requires additional care.

Design principles include:

- minimise information collected about children
- collect age only where required for eligibility, safety or legal purposes
- avoid unnecessary profiling
- clearly identify the responsible adult / guardian relationship where required
- restrict staff access to child information
- avoid displaying unnecessary participant information during scanning/check-in
- establish clear retention rules
- design waiver and consent flows specifically for minors
- maintain an auditable record of guardian acceptance where required

The legal requirements applying to children's information must be reviewed against current Australian law and guidance before production launch.

---

## Multi-Tenant Isolation

Organisation isolation is a critical security boundary.

Every Organisation-owned internal resource must remain scoped to the authenticated Organisation unless an explicitly authorised cross-Organisation capability exists.

This includes, where applicable:

- Events
- Sessions
- Products
- Bookings
- Customers
- Participants
- Tickets
- Waivers
- maintenance records
- uploaded files
- reports
- staff records
- audit logs

A cross-tenant data-access defect should be treated as a critical security issue.

Automated tenant-isolation testing should form part of the pre-pilot security gate.

---

## Authentication

Privileged Glacier users should use strong authentication.

Production requirements should include:

- secure password hashing
- sensible password policy
- secure session/token handling
- login-rate limiting
- account lockout or abuse controls
- secure password-reset workflow
- appropriate token expiry
- revocation capability where required
- Multi-Factor Authentication for privileged users
- stronger controls for OWNER / administrative roles

Customer authentication should be introduced only when required by the Customer Portal phase.

Public booking should not require an operator authentication mechanism.

---

## Authorisation

Glacier follows least privilege.

Users should receive only the permissions necessary to perform their job.

Examples:

### Event Administrator

May require broad Event and Booking management access.

### Customer Service

May require Booking and Customer access but not infrastructure/security administration.

### Gate / Scanner Staff

Should generally require only information necessary to validate entry.

A scanner should not expose complete Customer or Participant records unless operationally necessary.

### Maintenance Staff

Should have access to relevant maintenance tasks and supporting media without automatically gaining access to unrelated Customer information.

Role and permission design should become increasingly granular as the Admin and Staff applications mature.

---

## Public API Security

Public customer APIs must remain separate from broad internal operator APIs where practical.

Public responses should:

- expose only fields required by the customer journey
- avoid internal identifiers where they are unnecessary
- never expose tenant-internal data accidentally
- validate Event / Session availability
- apply server-side business rules
- apply abuse controls and rate limiting
- avoid leaking stack traces or internal implementation details

Sprint 14 established the first dedicated public booking API boundary.

Sprint 17 extended and standardised that pattern:

- all ordinary operator controllers are authenticated;
- OWNER/MEMBER role intent is explicit;
- Organisation authority comes from the JWT and relationship-scoped service queries;
- legacy public Booking, Customer, Rule Evaluation and Payment entry points were removed;
- public Booking mutations use bounded DTOs and reject unknown fields;
- public Ticket presentation is minimised while scan/detail operations are authenticated and tenant-scoped; and
- every route is classified in `docs/security/API_ENDPOINT_REGISTER.md`.

The global request policy transforms DTO input, strips no unknown values silently and rejects non-whitelisted fields. Stripe raw-body signature verification remains a separate external boundary.

Production distributed rate limiting, monitoring and incident response remain deployment controls rather than claims made by the application repository.

---

## Encryption

Production Glacier infrastructure should use encryption in transit and at rest.

### In Transit

Production traffic should use HTTPS / TLS.

Plain HTTP should not be used for production customer, staff or administrative traffic.

### At Rest

Production infrastructure should use managed encryption for:

- PostgreSQL storage
- object/file storage
- backups
- snapshots
- other persistent storage containing Glacier data

Where appropriate, encryption keys should be managed through the selected cloud provider's key-management facilities.

---

## Secrets Management

Production secrets must not be stored in source control.

This includes:

- database passwords
- JWT secrets
- API keys
- payment credentials
- storage credentials
- email credentials
- signing secrets
- webhook secrets
- third-party integration secrets

Production secrets should use a managed secret store or an equivalent secure deployment mechanism.

Secrets should support rotation.

---

## Payment Security

Glacier minimises its payment-card exposure by using Stripe as the current payment provider and Stripe-hosted/tokenised payment collection through the Payment Element.

Current implementation rules:

- raw card numbers are not stored by Glacier
- CVV/CVC values are not stored by Glacier
- Stripe secret keys remain server-side only
- Stripe webhook signing secrets remain server-side only
- the browser receives only the Stripe publishable key and PaymentIntent client secret required for checkout
- Booking totals are calculated and supplied by the backend
- the browser cannot choose the amount sent to Stripe
- signed Stripe webhooks are cryptographically verified against the raw request body
- PaymentIntent creation, cancellation and refunds use idempotency keys
- provider Payment state is persisted independently from Booking summary state
- refunds are persisted as `PaymentRefund` records
- Tickets are issued only after authoritative provider success and successful Booking confirmation
- late successful payments against expired Bookings are automatically refunded rather than fulfilled
- public payment initiation requires the Booking's high-entropy public access token

Production requirements still include:

- live Stripe credential management through managed secrets
- production webhook registration and monitoring
- payment-specific rate limiting and abuse protection
- operator refund permissions and audit logging
- payment incident-response procedures
- PCI DSS scope confirmation before production launch
- Security & Privacy Gate review

Stripe credentials, webhook secrets and client secrets must never be written to logs or committed to source control.

---

## Input and Application Security

Glacier should protect against common web and API attacks.

Requirements include:

- server-side input validation
- parameterised database access
- XSS protection
- appropriate CSRF controls where applicable
- secure HTTP headers
- upload type validation
- upload size limits
- authentication rate limiting
- public endpoint abuse protection
- dependency vulnerability monitoring
- safe error handling
- prevention of sensitive data leakage through logs

Security controls should be reviewed whenever a new public surface is introduced.

---

## Audit Logging

Important security and business actions should eventually generate auditable records.

Examples include:

- user login/security events
- role and permission changes
- Booking modifications
- refunds
- payment-state changes
- waiver completion
- waiver invalidation
- Ticket scanning
- Customer-data changes
- maintenance completion
- high-risk administrative changes

Audit records should identify, where appropriate:

- action
- actor
- Organisation
- affected resource
- timestamp
- relevant before/after state
- request/security metadata where lawful and useful

Audit records should not themselves unnecessarily duplicate sensitive information.

---

## Logging

Application logs must avoid unnecessary personal information.

Glacier should not routinely log:

- passwords
- authentication tokens
- payment-card information
- waiver signatures
- complete customer records
- secrets
- unnecessary child/participant information

Production logs should support security investigation without becoming an uncontrolled secondary repository of personal information.

---

## Data Retention

Glacier requires an explicit data-retention framework.

Different data categories may require different retention periods.

Examples include:

- Customer information
- Booking records
- financial transaction records
- Participant records
- Waiver acceptances
- audit records
- maintenance evidence
- incident records
- uploaded photographs

Retention must consider:

- legitimate operational requirements
- legal requirements
- financial/accounting requirements
- insurance requirements
- safety requirements
- privacy obligations

Where continued identification is unnecessary, deletion or anonymisation should be considered.

Retention periods must be verified against applicable law and business requirements before production launch.

---

## Data Deletion and Anonymisation

Glacier should eventually provide controlled workflows for:

- deleting information where permitted
- anonymising information where full deletion is inappropriate
- retaining records that must legally or operationally remain
- deleting associated files and media
- preserving audit evidence where required

Deletion should account for relationships between:

- Customers
- Bookings
- Participants
- Tickets
- Waivers
- Payments
- uploaded files

Hard deletion must not compromise required financial, legal, safety or audit records.

---

## Backups and Recovery

Production requirements should include:

- automated database backups
- point-in-time database recovery where supported
- object-storage protection/versioning where appropriate
- defined backup retention
- geographic/resilience considerations appropriate to the selected infrastructure
- documented restore process
- periodic restore testing

A backup is not considered operationally proven until a restore has been tested successfully.

---

## Incident Response

Before a live-event pilot, Glacier should have a documented incident-response process.

The process should cover:

- suspected unauthorised access
- compromised credentials
- data leakage
- payment incidents
- infrastructure compromise
- lost or exposed devices
- malicious uploads
- service outages
- potential eligible data breaches

The process should establish:

- who is responsible
- how incidents are triaged
- how systems are contained
- how evidence is preserved
- when legal/privacy advice is obtained
- when customers, regulators, insurers or other parties may need notification

---

## Australian Privacy & Regulatory Review

Glacier is intended for use in Australia and will process personal information.

Before production launch, Glacier's privacy framework should be reviewed against current applicable requirements including, where relevant:

- Privacy Act 1988 (Cth)
- Australian Privacy Principles
- Notifiable Data Breaches requirements
- current OAIC guidance
- requirements affecting children's information
- electronic communications / marketing consent requirements
- applicable record-retention obligations
- payment-security obligations
- relevant State or Territory requirements where applicable

This document is an engineering and product framework, not legal advice.

Because legislation, thresholds, guidance and regulatory expectations may change, the final compliance position must be verified against current authoritative sources and reviewed by appropriately qualified Australian legal/privacy professionals before launch.

---

## Privacy Notices and Consent

Glacier should distinguish between:

- information necessary to perform the booking/service
- risk acknowledgement / waiver acceptance
- guardian consent
- optional marketing consent
- optional photography/media consent
- other optional permissions

Optional consent should not be hidden inside mandatory participation terms.

Customer-facing privacy information should clearly explain:

- what information is collected
- why it is collected
- how it is used
- who it may be disclosed to
- how long it is retained
- how customers can exercise applicable rights
- how privacy questions or complaints can be raised

---

## Waivers

Sprint 16 introduced an Event-centric Waiver domain. It is deliberately independent of Booking, Ticket, Customer account and email.

Implemented controls include:

- immutable Event-specific published wording
- exact accepted-version and hash evidence
- server-authoritative acceptance timestamps
- explicit acceptance and electronic signature
- bounded adult/minor data
- tenant-scoped operator retrieval
- active/published-only public access
- high-entropy verification credentials stored only as hashes
- privacy-minimised public verification

Waiver evidence contains personal information and child data and must be treated as restricted legal/operational evidence.

Before production launch, Glacier still requires approved jurisdiction templates, current Australian legal review, a documented retention and legal-hold policy, operator access policy, abuse/rate controls and final privacy notices.

Booking/Participant linkage, scanner enforcement and reminders remain future product decisions rather than implicit Waiver requirements.

See `architecture/WAIVERS.md` for the implemented domain and boundaries.

---

## File and Media Security

Large documents and photographs should not normally be stored directly in PostgreSQL.

Files should use dedicated private object storage with database metadata references.

File security requirements include:

- private-by-default storage
- authorised signed access
- direct secure uploads where appropriate
- file-size limits
- file-type validation
- malware scanning where appropriate
- encryption
- retention controls
- tenant isolation
- deletion controls
- access auditing where required

Detailed architecture is documented separately in:

`docs/architecture/FILE_AND_MEDIA_STORAGE.md`

---

## Security Testing

Security verification should progressively include:

- automated authorisation tests
- tenant-isolation tests
- public API data-leakage tests
- authentication tests
- rate-limit / abuse testing
- dependency scanning
- secure configuration checks
- payment webhook tests
- file-upload security tests
- backup/restore testing
- manual security review

An independent penetration test should be completed before a public production launch or at the appropriate pre-pilot/pre-launch stage.

---

## Pre-Pilot Security & Privacy Gate

Glacier must pass a formal Security & Privacy Gate before a live customer pilot.

The gate should include at minimum:

- security architecture review
- privacy data-flow review
- personal-data inventory
- tenant-isolation verification
- privileged-access review
- MFA readiness
- public API exposure review
- secrets-management review
- encryption review
- payment-security review
- uploaded-file security review
- audit-logging review
- retention/deletion policy review
- backup/restore test
- incident-response plan
- vulnerability/dependency review
- Australian privacy/compliance review
- external penetration testing at the appropriate stage
- legal/privacy professional review before production launch

Critical findings must be resolved before the platform is approved for live public use.

---

## Development Principle

Security requirements should be considered during feature design, not at the end of implementation.

When a Sprint introduces a feature involving:

- personal information
- payments
- uploads
- authentication
- permissions
- external integrations
- communications
- children
- waivers
- operational evidence

the Sprint plan should explicitly identify its security and privacy implications.
