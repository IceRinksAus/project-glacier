# Sprint 33 Plan — Privileged MFA Foundation

## Planning status

Approved by the organiser on 3 September 2026. Implementation may proceed in
small verified local commits. Nothing may be pushed without explicit approval.

## Recommendation and objective

Implement membership-scoped TOTP MFA for OWNER and MANAGER, including
first-login enrolment, password-then-MFA login, single-use recovery codes,
factor rotation, recovery-code regeneration, bounded OWNER reset of a MANAGER,
session revocation and append-only non-secret audit evidence.

TOTP is the no-spend compatibility factor for this Sprint. Passkeys remain the
preferred future phishing-resistant factor. Email password recovery remains
blocked until an approved provider, sending domain and account ownership exist.

## Authority and security design

- MFA belongs to `UserOrganization`, preventing an OWNER in one Organisation
  from changing the same person's authority in another Organisation.
- OWNER and MANAGER sessions require persisted MFA evidence. STAFF and SCANNER
  retain the existing password-only flow.
- Successful password verification creates only a hashed, five-minute,
  single-use pre-authentication challenge. It does not create an authenticated
  session or JWT for a privileged membership.
- TOTP uses RFC 6238, six digits, a 30-second period, a bounded one-period clock
  tolerance and atomic counter-replay prevention.
- TOTP secrets use AES-256-GCM with a random nonce and a configured key ID. The
  production key ring and recovery-code pepper are separate from JWT, Ticket,
  Stripe and database secrets and fail closed when absent or malformed.
- Recovery codes contain at least 128 random bits, are displayed once, stored
  only as individual keyed hashes, consumed once and invalidated together on
  regeneration, rotation or reset.
- A same-Organisation OWNER may reset a MANAGER. No ordinary workflow may reset
  an OWNER, cross Organisations, or grant OWNER authority.

## Workstreams

### A — Cryptographic authority and production configuration

Create one reviewed MFA authority for configuration validation, Base32 secret
generation, `otpauth://` construction, authenticated encryption, TOTP
calculation/verification, replay protection inputs, challenge hashing and
recovery-code generation/hashing. Secret values must never appear in errors,
logs, audit evidence, URLs or browser storage.

### B — Forward-only persistence

Add membership-scoped factor, recovery-code, pre-authentication challenge and
MFA audit records plus MFA evidence on `AuthenticationSession`. Enforce one
active TOTP factor per membership, one-time challenge/code consumption and
retained revoked evidence. Existing privileged memberships begin unenrolled and
must complete the controlled first-login path.

### C — Login challenge and enrolment

Refactor login to return authenticated, MFA-required or enrolment-required
outcomes without creating a privileged JWT early. Enrolment generates and
encrypts a pending secret, presents QR/manual setup information, requires a
valid authenticator code, activates atomically, displays recovery codes once
and only then issues the normal eight-hour session.

### D — Recovery, rotation and account security

Provide an Account Security surface for MFA status, sign out everywhere,
recovery-code regeneration and confirm-before-replace TOTP rotation. Sensitive
self-service changes require password plus current MFA. A privileged membership
cannot disable its only active factor while retaining privileged access.

### E — Reset, role transitions and audit evidence

Permit only an authenticated same-Organisation OWNER to reset a MANAGER. Reset
revokes the target factor, codes, pending challenges and that Organisation's
active sessions, then requires re-enrolment. Promotion to MANAGER must revoke
password-only sessions and the JWT strategy must independently reject any
privileged session without current MFA evidence. Record bounded attributable
events without factor material or personal data.

### F — Abuse, privacy and UI acceptance

Apply database attempt limits plus the local defence-in-depth limiter to MFA
completion routes. Use generic invalid/expired responses. Verify accessible,
responsive login, enrolment, recovery and account-security flows with fictional
local users only.

## Required evidence

- RFC TOTP vectors, clock window, strict input and counter-replay tests.
- Authenticated-encryption tamper tests and fail-closed production configuration.
- OWNER/MANAGER receive no JWT before MFA; STAFF/SCANNER remain compatible.
- First enrolment, returning TOTP, recovery-code login and one-time consumption.
- Expired, consumed, over-attempt and concurrently completed challenges fail.
- Promotion cannot turn an existing password-only session into privileged access.
- Same-Organisation OWNER-to-MANAGER reset succeeds; all other role/tenant
  combinations fail through privacy-safe boundaries.
- Rotation and regeneration invalidate former authority atomically.
- Audit and logging tests prove no secret, code, URI, challenge or hash leakage.
- Full API/web tests and builds, empty-database migration replay, current local
  migration status, tenant/role isolation, backup/restore, release and tracked
  secret gates all pass.

## Protected foundations

Do not change tenant, role or Event-assignment semantics; final-OWNER
protection; Ticket credentials, state, scanning or entry windows; Booking or
Waiver possession authority; Payment, refund or reconciliation behaviour;
capacity or inventory; POS; rescheduling; Flexible Ticket authority; or public
customer journeys.

## Explicit exclusions

- email password recovery or notification delivery;
- passkeys/WebAuthn and SMS MFA;
- customer accounts or customer MFA;
- OWNER lost-factor self-service, ownership transfer or shared emergency access;
- domains, hosting, cloud services or paid managed secret storage;
- central monitoring, production devices, legal retention approval or
  independent security review;
- migration away from JavaScript-readable JWT storage; and
- real staff, customer, Payment or Event data.

## Exit gate

Sprint 33 closes only when every privileged session requires MFA; enrolment,
TOTP, recovery, rotation and bounded reset work locally; secrets and recovery
authority are protected at rest; promotion and reset revoke affected sessions;
tenant/role/Event isolation and all protected product foundations remain green;
all migrations and complete local release/restore/secret gates pass; and the
documentation distinguishes local proof from future managed production secret,
deployed monitoring/device and independent-review evidence.

## Delivery sequence

1. Commit this approved plan.
2. Add cryptographic/configuration tests and implementation.
3. Add the migration and persistence boundary.
4. Implement login challenge, enrolment, recovery and session enforcement.
5. Implement account security, rotation and recovery-code regeneration.
6. Implement OWNER-to-MANAGER reset and promotion revocation.
7. Run browser acceptance and all full local gates.
8. Close the documentation in a final verified local commit.
