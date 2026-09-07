# Sprint 34 — Authentication Reliability and Dependency Hardening

## Outcome

Sprint 34 removes the repeated-enrolment ambiguity found during direct Sprint
33 use. A privileged member now resumes the same pending authenticator factor
for ten minutes after password verification. A deliberate restart or expired
window revokes the former pending factor and creates replacement authority.
The existing database constraint continues to allow only one pending factor per
membership.

The login UI explains code timing and replacement behavior, accepts harmless
whitespace in pasted codes, prevents duplicate submission and exposes an
explicit restart control. Authenticator labels include Organisation context.
Expired and consumed MFA challenges are removed during subsequent membership
authentication while independent `MfaAudit` evidence remains intact.

The current dependency review retained stable Prisma 7.9.1 and used exact
patched transitive overrides rather than a forced downgrade or prerelease.
Both API and web npm audits report zero known vulnerabilities. Details and
override-removal conditions are in
`docs/security/DEPENDENCY_AUDIT_2026-09-08.md`.

## Browser acceptance

A temporary fictional OWNER completed the local production-preview flow.
Immediate repeated password sign-in returned the same setup secret. Explicit
restart produced replacement authority; a code from the former secret was
rejected and a current code pasted with whitespace was accepted. Ten recovery
codes were then issued. At 390 × 844, page width remained 390 pixels with no
horizontal overflow, and browser warning/error logs were empty. The exact
fictional User, membership, factor, challenge, recovery, session and audit
evidence was removed afterward.

## Verification

- API: 91 suites / 644 tests passed; production build passed.
- Web: 31 files / 90 tests passed; production build passed.
- Prisma validation/client generation passed at 7.9.1.
- API and web npm audits reported zero known vulnerabilities.
- All 48 migrations remained current and replayed from empty state.
- Disposable authenticated tenant/role/MFA isolation passed 5 of 5 checks.
- The complete local release gate passed.
- The tracked-secret scan passed across 628 files and 6 rules.
- Isolated PostgreSQL restore matched all 16 critical tables; the 0.29 MiB
  archive completed in 0.70 seconds and restored in 1.61 seconds.

One intermediate release rerun returned a single 401 during the first
cross-tenant OWNER login. The disposable database was removed normally; an
immediate standalone isolation rerun passed 5 of 5 and the subsequent complete
release gate also passed 5 of 5. The failure did not reproduce and caused no
production claim, but recurrence should be investigated rather than ignored.

## Remaining boundary

This is local application/database/browser and lockfile evidence. Managed
production keys, deployed edge/device behavior, central monitoring, email
password recovery, OWNER dual-control recovery, privacy/legal approval and
independent security/supply-chain review remain pre-live evidence. No paid
infrastructure, live data or real Payment was used.
