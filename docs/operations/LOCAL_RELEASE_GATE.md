# Local Release Gate

## Purpose

Sprint 31 uses a no-material-spend development gate. Glacier therefore requires a repeatable local release check that proves the repository baseline without claiming that local evidence is equivalent to paid staging or production evidence.

From the project root, run:

```bash
npm run verify:release
```

## Checks performed

The gate stops at the first failure and verifies:

1. all API Jest suites in one deterministic process;
2. the NestJS production build;
3. all web Vitest suites;
4. the Next.js production build using the supported Webpack build mode and `.next-release`, isolated from the normal `.next` directory; and
5. Prisma migration status against the database configured by `apps/api/.env`.

The database must be running and reachable. The migration check is intentionally not skipped when the database is unavailable: an unknown migration state cannot pass a release gate.

Where `pg_isready` is available, the gate first reports a clear stopped-database failure for `localhost:5432` rather than continuing into Prisma's schema engine.

The release gate deliberately selects Next.js's supported `--webpack` build mode. In this local environment the default Turbopack build has been observed to stall while browser development processes are active. Normal development remains on the Next.js default; this release fallback must remain covered by the same production build and browser acceptance evidence.

The web build uses local/system font stacks and must not download fonts or other presentation assets while compiling. Runtime Event media remains governed separately by the future storage and availability controls.

## What passing proves

- the committed application compiles for production;
- the current automated API/web behaviour passes;
- the configured local database recognises the committed migration history; and
- release verification does not overwrite the normal web development build directory.

## What passing does not prove

- HTTPS, DNS, edge controls or real external origins;
- managed-cloud identity, networking or secret configuration;
- production database performance, backup or point-in-time recovery;
- external log, uptime or alert delivery;
- physical scanner/POS/mobile-device reliability;
- a successful independent security or penetration test; or
- legal, privacy, insurance, entity or live-payment approval.

Those remain explicit funded pre-live gates under `docs/decisions/ADR-007-NO-SPEND-DEVELOPMENT-GATE.md`.

## Failure handling

- Do not ignore, bypass or weaken a failed check to obtain a green result.
- Record the failing command and first actionable error.
- Correct the underlying code, test, build, environment or migration issue.
- Rerun the focused failing check, then rerun the entire release gate.
- Never use a development migration, reset or seed operation against an unidentified database.

## Future automation

The same commands should become the basis of continuous integration and staged deployment gates. External automation is deferred until its account ownership, included usage and possible charges are approved. A future CI system must use an isolated disposable PostgreSQL database and must not depend on developer-local secrets.
