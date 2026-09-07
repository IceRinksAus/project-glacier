# Sprint 34 Plan — Authentication Reliability and Dependency Hardening

**Status:** Approved 8 September 2026

## Outcome

Make privileged MFA enrolment predictable across repeated sign-ins, improve
secure recovery from setup errors and re-evidence or safely resolve the open
Prisma dependency finding without widening product or infrastructure scope.

## Slice 1 — MFA enrolment continuity

- Reuse the current pending factor only within a short bounded setup window.
- Replace expired or explicitly restarted setup authority atomically.
- Keep one current pending factor and invalidate superseded challenges.
- Add Organisation context and replacement guidance to setup presentation.
- Preserve five-minute challenges, bounded attempts and no early JWT issuance.

## Slice 2 — Authentication feedback

- Explain 30-second code timing without disclosing account/factor state.
- Handle expired setup, duplicate submission and harmless pasted-code spacing.
- Keep server verification at exactly six digits and failure messages generic.
- Verify accessible focus, loading, errors and narrow mobile layouts.

## Slice 3 — Temporary authentication lifecycle

- Remove or supersede expired/consumed challenges during normal auth activity.
- Prevent pending enrolments accumulating indefinitely.
- Preserve independent non-secret MFA audit evidence.
- Do not invent general session/audit or personal-data retention periods.

## Slice 4 — Dependency evidence

- Record exact installed and latest compatible Prisma versions.
- Re-run API/web production audits and check upstream remediation.
- Prefer matched Prisma/client upgrade when compatible.
- Consider a narrow transitive override only with complete generation,
  migration, test and build evidence; never force the proposed major downgrade.
- Retain an explicitly bounded finding if no sufficiently safe fix exists.

## Protected boundaries

No changes to Ticket credentials, Scanner authority, Payment/refund,
capacity/inventory, Flexible Tickets, role/Event assignment semantics, email
recovery, OWNER support bypasses, paid infrastructure or live data.

## Verification and exit

- Focused API/web tests for repeat, expiry, restart, concurrency and UI states.
- OWNER/MANAGER MFA and STAFF/SCANNER behavior remain intact.
- Fictional local browser acceptance covers repeat/restart enrolment.
- API/web full tests and production builds pass.
- All migrations apply locally and from empty state.
- Disposable isolation, complete release, restore and secret gates pass.
- Verified slices are committed locally and not pushed without approval.

## Evidence boundary

Managed production secrets, deployed edge/device behavior, email delivery,
OWNER dual-control recovery and independent security review remain future
evidence and cannot be closed by this Sprint.
