# Project Glacier Principles

1. Security before convenience.

Security controls must not be weakened simply to make implementation easier.

Sensitive operations require appropriate authentication, authorisation, validation and auditability.

2. Never trust client-supplied organisation context.

Organisation and tenant context must be derived from trusted authenticated server-side state.

Client-supplied Organisation identifiers must never be treated as sufficient authorisation.

3. Business rules are enforced in the backend.

Frontend validation improves user experience.

It does not replace authoritative backend validation.

This applies to:

- Ticket eligibility
- Booking rules
- Capacity
- Inventory
- required products
- payments
- waivers
- permissions
- operational rules

4. Multi-tenant by design.

Organisation isolation is a core Glacier security boundary.

Every Organisation-owned resource must remain appropriately scoped.

Cross-tenant access must be treated as a critical security defect.

5. Configuration over event-specific hard-coding.

Glacier should solve reusable business problems through configurable models rather than Event-specific application logic.

6. Prefer consistency over cleverness.

Common patterns should be implemented consistently across the platform.

A predictable architecture is preferable to individually clever implementations.

7. Build for maintainability and live-event reliability.

Glacier will operate in environments where failures directly affect Customers, staff and live Events.

Reliability, observability and recoverability matter.

8. Every critical feature must be testable.

Critical business logic should have automated coverage where practical.

Important customer and operational workflows should also receive browser or end-to-end verification.

9. Documentation is part of the deliverable.

No significant technical, product, commercial, privacy, security or operational decision should exist only in chat.

Important decisions must be recorded in Glacier documentation and committed with the project.

10. Features should reduce operational work.

Glacier should automate repetitive administration and make Event operations simpler.

Technology should not create unnecessary manual process.

11. Build the simplest thing that scales.

Avoid unnecessary configuration until there is a genuine business need.

Do not prematurely implement infrastructure or abstractions that are not yet required.

However, avoid shortcuts that create known scaling, security or data-integrity problems.

12. Configure at the highest logical level.

Override only when required.

Examples:

Event

Session

Product

Organisation

Global platform configuration

Configuration should flow downward where appropriate rather than requiring repetitive manual setup.

13. Separate concerns.

Capacity is not inventory.

Reservations are not payments.

Validation is not Booking creation.

Structured transactional data is not file storage.

Public customer APIs are not internal operator APIs.

Authentication is not authorisation.

Audit logging is not application logging.

14. Review the current codebase before starting a new Sprint.

Each Sprint should begin from a known, committed state.

Preferred Sprint-start workflow:

Previous Sprint complete

↓

Code committed and pushed

↓

Documentation updated

↓

Working tree clean

↓

Create committed repository snapshot

↓

Review relevant backend, frontend, schema, tests and architecture

↓

Identify reusable logic and existing constraints

↓

Finalise Sprint implementation plan

↓

Begin coding

This reduces duplicated functionality, inconsistent validation and unnecessary architectural rework.

A repository snapshot may be created using:

`git archive --format=zip --output=sprint-XX-project-review.zip HEAD`

The snapshot is temporary working material and should not be committed to the repository.

15. Regression testing protects completed Sprints.

New Sprint work must not silently break previously completed platform capabilities.

Where relevant, existing critical test suites should be rerun before a Sprint is closed.

16. Privacy by design.

Glacier should collect only the personal information genuinely required for legitimate operational, contractual, safety or legal purposes.

Every feature involving personal information should consider:

- why the information is required
- who can access it
- how long it should be retained
- how it is protected
- whether it can be anonymised or deleted
- whether the same outcome can be achieved using less information

Privacy should be considered during feature design rather than immediately before launch.

17. Children's information requires additional care.

Glacier will process information relating to children and young participants.

The platform should:

- minimise information collected about minors
- limit staff exposure to participant information
- clearly model responsible adult / guardian relationships where required
- avoid unnecessary profiling
- design waiver and consent workflows specifically for minors
- establish appropriate retention controls

Applicable Australian legal and privacy requirements must be verified before production launch.

18. Least privilege.

Users should receive only the permissions required to perform their role.

Examples:

Gate staff should not automatically see complete Customer records.

Maintenance staff should not automatically see unrelated Booking information.

Customer-service staff should not automatically receive infrastructure-administration permissions.

Privileges should become increasingly granular as Glacier's staff and administrative applications mature.

19. Public APIs expose the minimum necessary data.

Customer-facing APIs should be deliberately narrow.

Public API responses must not expose internal data merely because it is convenient.

Public endpoints should:

- validate resource availability
- expose only required fields
- enforce backend rules
- avoid information leakage
- apply appropriate abuse controls

Internal operator APIs and public customer APIs should remain separated where practical.

20. Payments should minimise Glacier's payment-data exposure.

Glacier should use reputable PCI-compliant payment providers.

The preferred architecture should:

- avoid storing raw card numbers
- never store CVV/CVC values
- use provider-hosted or tokenised payment collection
- store only necessary transaction references and state
- validate provider webhooks securely
- process payment events idempotently

Reducing PCI scope is preferable to building unnecessary payment-data infrastructure.

21. Large files do not belong in the transactional database.

PostgreSQL is the source of truth for structured business data and file metadata.

Large binary content should use dedicated object storage.

Examples include:

- photographs
- PDFs
- waiver evidence
- maintenance attachments
- incident evidence
- generated documents

This protects Booking and operational database performance as Glacier grows.

22. Files are private by default.

Uploaded Glacier files must inherit appropriate Organisation ownership and access controls.

Knowing or guessing a file path or storage key must never grant access.

File delivery should use authorised mechanisms such as short-lived signed URLs or equivalent controlled access.

23. Performance must scale with data volume.

Glacier screens should not become slower simply because an Organisation has years of historical data.

Large datasets should use appropriate techniques such as:

- pagination
- filtering
- database indexes
- lazy loading
- thumbnails
- background processing
- direct object-storage uploads
- CDN delivery where appropriate

Unbounded queries and unnecessary bulk downloads should be avoided.

24. Retention is a design decision.

Data and files should not be retained forever by default.

Different information categories may require different retention periods.

Retention decisions should consider:

- operational requirements
- legal requirements
- financial requirements
- safety
- insurance
- privacy
- audit needs

Where continued identification is unnecessary, deletion or anonymisation should be considered.

25. Backups must be recoverable.

Automated backups are necessary but insufficient.

Production Glacier should support documented recovery procedures and periodic restore testing.

A backup strategy should not be considered proven until restoration has been successfully tested.

26. Security and privacy are pre-pilot gates.

Glacier must not move into live public use simply because feature development is complete.

Before a live pilot, the platform should pass a formal Security & Privacy Gate covering, at minimum:

- tenant isolation
- privileged access
- public API exposure
- encryption
- secrets management
- payment security
- file-upload security
- retention and deletion
- backups and restoration
- incident response
- vulnerability review
- Australian privacy/compliance review
- external security testing at the appropriate stage

Critical findings must be resolved before production approval.

27. Compliance must be verified against current authoritative sources.

Architecture documentation may define the expected compliance framework.

It must not assume that historical legal or regulatory information remains current.

Before production launch, relevant requirements must be checked against current authoritative Australian sources and reviewed by appropriately qualified legal/privacy professionals where required.

This includes, where relevant:

- Privacy Act 1988 (Cth)
- Australian Privacy Principles
- Notifiable Data Breaches requirements
- OAIC guidance
- requirements affecting children's information
- electronic communications / marketing requirements
- payment-security obligations
- applicable State or Territory requirements

28. Optional consent must remain optional.

Marketing consent, promotional photography consent and other optional permissions should not be hidden inside mandatory Booking or participation terms.

Mandatory service terms, waivers, privacy notices and optional consent should be clearly distinguished.

29. Preserve immutable evidence where required.

Completed legal, safety or compliance records should not be silently overwritten.

Examples may include:

- accepted waiver versions
- signed documents
- final incident evidence
- payment events
- important audit records

Where history matters, Glacier should create new versions or records rather than altering the evidence originally relied upon.

30. Customer experience should hide system complexity.

Glacier may contain sophisticated Rules, Products, eligibility logic and operational configuration.

Customers should not have to understand that complexity.

Customer-facing workflows should use:

- progressive disclosure
- clear language
- obvious next actions
- one primary decision at a time
- useful validation close to the relevant field
- mobile-first design

The system should automatically handle mandatory requirements wherever practical.

These principles explain and govern the architectural decisions made across Project Glacier.