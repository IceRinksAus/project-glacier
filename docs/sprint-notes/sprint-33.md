# Sprint 33 — Privileged MFA Foundation

## Outcome

Sprint 33 completes Glacier's locally actionable privileged MFA boundary.
OWNER and MANAGER password verification now produces only a five-minute,
hash-at-rest challenge. A normal eight-hour authenticated session is created
only after an enrolled TOTP factor or one unused recovery code succeeds.

MFA authority is scoped to `UserOrganization`, so one Organisation cannot reset
the same person's factor in another Organisation. Encrypted TOTP material uses
AES-256-GCM with a recorded key ID. Recovery codes are high entropy,
individually keyed-hashed, displayed once and consumed once. Current TOTP
counters update atomically to reject replay.

Account Security supports recovery-code regeneration and confirm-before-replace
factor rotation. Rotation revokes former factor authority and sessions. An
OWNER may reset only a MANAGER in the same Organisation; the operation revokes
the target factor, codes, challenges and sessions and records bounded audit
evidence. OWNER recovery cannot use this ordinary workflow.

Promotion from STAFF/SCANNER to MANAGER revokes existing sessions. The JWT
strategy independently requires current factor-generation evidence for every
privileged request, preventing a password-only session from gaining authority
through a live role change.

## Browser acceptance

A temporary fictional OWNER completed first-login QR/manual enrolment in the
local production preview, received ten recovery codes, signed in with one code
and was denied when attempting to reuse it. The challenge remained contained at
390 × 844 (`scrollWidth` 390, `innerWidth` 390) and browser error/warning logs
were empty. The exact fictional fixture was removed afterward.

## Verification

- API: 91 suites / 641 tests passed; production build passed.
- Web: 30 files / 88 tests passed; production build passed.
- All 48 migrations applied to the local database and replayed from empty state.
- Disposable authenticated tenant/role/MFA isolation passed 5 of 5 checks.
- The complete local release gate passed.
- The tracked-secret scan passed across 624 files and 6 rules.
- Isolated PostgreSQL backup/restore matched all 16 critical tables; the 0.29
  MiB archive completed in 0.65 seconds and restored in 1.12 seconds.
- Local production-preview browser acceptance passed with fictional data only.

## Remaining boundary

This is local application/database/browser evidence. It is not proof of managed
production key custody, deployed edge limits/alerts, real-device behavior or
independent penetration resistance. Email password recovery remains blocked
until an approved provider, sending domain and accountable ownership exist.
Passkeys remain the preferred future phishing-resistant factor. OWNER
lost-factor recovery still requires an approved dual-control identity process.
