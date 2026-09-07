# Dependency Audit — 8 September 2026

## Scope

The approved Sprint 34 review sent dependency names and versions from the API
and web lockfiles to the npm registry. It sent no source, environment values,
credentials or customer data. Both applications were audited independently.

## Initial result

The former `deepmerge-ts` advisory remained under Prisma 7.9.1. Updated npm
advisory data also identified affected `fast-uri`, `mysql2` and `qs` versions
through transitive build/runtime paths. Raw npm counts repeated the same
underlying packages through multiple parent paths and were therefore not
treated as distinct Glacier defects.

Glacier uses PostgreSQL and does not configure or connect through `mysql2`.
The affected package was nevertheless patched because Prisma shipped it in the
installed dependency tree. No claim of request-path exploitability or safety
was inferred merely from a package's transitive position.

## Controlled remediation

No direct framework, Prisma or application dependency was downgraded or moved
to a prerelease. Exact root overrides constrain the installed transitive
versions:

| Package | Before | Controlled version |
| --- | --- | --- |
| `deepmerge-ts` | 7.1.5 | 8.0.0 |
| `fast-uri` | 3.1.5 | 3.1.6 |
| `mysql2` | 3.15.3 | 3.23.1 |
| `qs` | 6.15.3 | 6.16.0 |

The web lockfile requires only the `fast-uri` and `qs` overrides. Existing
`nanoid` hardening remains unchanged. Every override must be removed when its
direct parent adopts an equal or newer patched version.

## Verification

- API audit: zero known vulnerabilities across 898 installed packages.
- Web audit: zero known vulnerabilities across 698 installed packages.
- Prisma schema validation and client generation passed at 7.9.1.
- All 48 migrations remained current.
- API: 91 suites / 644 tests passed; production build passed.
- Web: 31 files / 90 tests passed; production build passed.

The complete release, disposable isolation, restore and secret gates remain
required at Sprint closeout. This local result is not an independent supply-
chain review and does not replace continuous rechecking before exposure.

## Decision

`SEC-31-002` is locally resolved for the audited lockfiles. Any lockfile change
must repeat the audits. Internet exposure remains prohibited by the separate
deployment, privacy and independent-review gates.
