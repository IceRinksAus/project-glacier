# Event Waiver Architecture

## Purpose

Glacier's Waiver domain records Event-specific legal acceptance independently of the commerce channel used to acquire admission.

The domain is Event-centric. A Waiver Submission does not require a Booking, Ticket, BookingParticipant, Customer account or email address.

## Domain Shape

```text
Organisation
  └─ Event (optional activity and jurisdiction)
       └─ EventWaiver (optional, one per Event, stable public slug)
            ├─ WaiverVersion (versioned Event-specific snapshot)
            │    └─ WaiverSubmission (accepted evidence)
            │         └─ WaiverMinor (zero to many)
            └─ WaiverSubmission

WaiverTemplate (activity + jurisdiction + revision)
  └─ source of WaiverVersion
```

Absence of `EventWaiver` means the Event has no Waiver. Glacier deliberately does not maintain a redundant `waiverRequired` Boolean.

## Template and Publication Lifecycle

1. An Event must have the required activity, jurisdiction and legal substitution values.
2. Glacier selects the highest-revision approved template for that activity and jurisdiction.
3. Controlled placeholders are replaced using trusted Event and Organisation data.
4. Missing values or unsupported placeholders reject generation.
5. Glacier stores an Event-specific draft with template provenance and content hash.
6. An authorised OWNER reviews and publishes the draft.
7. Publication supersedes the previous published version in the same transaction.
8. Published snapshots are not edited; changes require a new version.
9. The stable Event public slug always resolves the current published version.

Templates are curated legal content. Glacier must not invent or silently rewrite production legal wording.

## Public Acceptance Boundary

Public access is intentionally narrow:

- only active Events
- only a published Waiver
- latest published version chosen by the server
- no arbitrary version parameter
- no draft or internal provenance exposure
- no authentication, Booking, Ticket, account or email requirement

Submission input contains:

- signatory full name
- explicit `accepted: true`
- electronic signature payload
- optional minor names and dates of birth

The server supplies:

- accepted version relationship
- accepted timestamp
- Waiver content hash
- acceptance-statement hash
- high-entropy verification credential

Submission and nested minors are created atomically.

## Evidence and Verification

Each submission records the exact immutable Waiver Version, server acceptance time, signature, content hash and acceptance-statement hash.

Verification credentials use 32 bytes from `crypto.randomBytes`, encoded as hexadecimal. The raw credential is returned once. Only its SHA-256 hash is stored.

The public verification endpoint returns only:

- verified status
- Event name
- Waiver title
- Waiver version
- accepted time

It does not return signatory identity, minors, signature or internal identifiers.

## Operator Boundary

Operator routes use `JwtAuthGuard` and `RolesGuard`. Organisation scope comes from `request.user.organizationId` through `@CurrentUser()`.

Read operations are tenant-scoped. Draft generation and publication require the `OWNER` role. Public submission lists and evidence endpoints do not exist.

## QR Architecture

The Event Waiver QR contains the stable public Event Waiver URL, not a version ID or submission credential.

QR generation is server-side using the existing `qrcode` package:

- PNG data URL
- 512 px
- error correction H
- margin 2

`WEB_APP_URL` defines the canonical public web origin. Production must set it to the deployed HTTPS origin before QR assets are generated.

## Booking Relationship

Booking confirmation may show a shortcut to the same stable Event Waiver URL when an active published Waiver exists.

This is navigation only. It does not:

- link a submission to a Booking
- change Booking or Payment state
- block Ticket issuance
- make the purchaser authoritative for other adults

## Privacy and Retention

Waiver evidence contains personal information and, for minors, child data. It must be treated as restricted operational/legal evidence.

Current controls include tenant-scoped retrieval, narrow public responses, bounded input and hashed verification credentials.

Before production launch, Glacier still needs an approved retention schedule, deletion/legal-hold policy, operational access policy, rate limiting/abuse monitoring, and a final privacy/legal assessment.

## Current Storage Decision

Sprint 16 stores the bounded electronic signature payload in PostgreSQL text. This avoids prematurely introducing object storage and document generation.

If Glacier later adds signed PDFs, photographs or larger evidence artifacts, those files should use private object storage with authorised signed access. The database should retain metadata, hashes and authoritative relationships.

## Non-Goals for Sprint 16

- mandatory Booking or Ticket linkage
- Customer Portal integration
- participant invitations or reminders
- scanner admission blocking
- automatic identity matching
- signed PDF generation
- Digital Waiver Pass / Apple Wallet
- AI-authored production legal wording

## Source of Truth

- Locked pre-Sprint control: `docs/PROJECT_BASELINE_PRE_SPRINT_16.md`
- Delivered closeout: `docs/sprint-notes/sprint-16.md`
- Security context: `docs/architecture/SECURITY_PRIVACY_AND_COMPLIANCE.md`
- Storage context: `docs/architecture/FILE_AND_MEDIA_STORAGE.md`
