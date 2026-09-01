# Dependency Audit — 1 September 2026

## Scope and authorisation

The organiser explicitly approved sending dependency names and versions from both application lockfiles to the official npm registry. No source code, environment file, credential or customer data was included in the audit request.

Commands were run independently in `apps/api` and `apps/web`:

```bash
npm audit --json
```

No automatic fix, forced upgrade, package override or dependency mutation was performed.

## Results

| Application | Dependency records assessed | Critical |              High | Moderate | Low | Result                                                    |
| ----------- | --------------------------: | -------: | ----------------: | -------: | --: | --------------------------------------------------------- |
| API         |                         924 |        0 | 4 package entries |        0 |   0 | One underlying High advisory through the Prisma toolchain |
| Web         |                         800 |        0 |                 0 |        0 |   0 | No known npm audit vulnerabilities                        |

The API's four reported package entries (`deepmerge-ts`, `@prisma/config`, `prisma` and `@prisma/client`) trace to one underlying advisory: [GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx), also identified as CVE-2026-40345.

## Installed dependency path

```text
@prisma/client 7.9.0
└── prisma 7.9.1
    └── @prisma/config 7.9.1
        └── deepmerge-ts 7.1.5
```

The advisory affects `deepmerge-ts` versions before 8.0.0. The patched 8.0.0 release is a major version. npm reports no compatible automatic fix for Glacier's dependency path. Registry metadata checked on the audit date showed that the newer Prisma configuration package 7.10.0 still declared `deepmerge-ts` 7.1.5.

## Reachability and impact assessment

The flaw can exhaust the JavaScript call stack when two merged inputs contain recursive self-references at the same property path. Plain JSON alone cannot create the required recursive graph.

Within Glacier's installed Prisma package, `deepmerge-ts` is imported by `@prisma/config` and supplied as the merger while Prisma loads `prisma.config.ts`. Glacier's configuration is developer-controlled repository code containing schema, migration path and database environment reference. The public NestJS API does not pass request bodies, query parameters, customer data, Ticket credentials or Waiver data into this configuration loader.

Therefore:

- the upstream severity remains High and is not relabelled;
- current Glacier runtime reachability from an unauthenticated request is not evidenced;
- confidentiality and data-integrity impact are not evidenced for the current path;
- a compromised developer/configuration boundary could still trigger the availability failure; and
- the finding must remain open until a compatible upstream patch is installed and verified, or a later security review produces different evidence.

## Disposition

1. Do not override Prisma's exact transitive dependency with `deepmerge-ts` 8 merely to clear the audit; that could introduce an unreviewed major-version compatibility failure in migration/configuration tooling.
2. Keep paid staging and internet exposure prohibited under ADR-007 and the open production security gates.
3. Recheck Prisma and the audit at least weekly during active development and immediately before any exposed environment.
4. When Prisma publishes a compatible patched dependency, update Prisma packages together, regenerate/install the lockfile deterministically, then run Prisma generation, migration status, full API tests, API build, web tests and the local release gate.
5. If exposure is proposed before a compatible fix exists, require a specific security review and written go/no-go decision; this document alone is not acceptance.

## Gate conclusion

The approved audit is complete. The web dependency gate is currently clear. The API has no Critical finding, but SEC-31-002 remains an open High upstream dependency finding with bounded current reachability and an explicit internet-exposure block.
