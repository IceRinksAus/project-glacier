# Deployment and Migration Runbook

## Status

Sprint 31 portable local foundation. No cloud resource, public origin, production database or paid service is provisioned by this runbook.

## Immutable application images

Glacier has separate OCI/Docker images for:

- the NestJS API and controlled Prisma migration executor; and
- the Next.js standalone web server.

Both images use an exact Node.js release and verified base-image digest, deterministic `npm ci` installation and a non-root runtime user. The Git commit supplied through `RELEASE_COMMIT` is stored as both an OCI revision label and runtime environment value. No `.env` file, local build output, runtime storage or developer dependency directory is included in the build context.

From the project root, locally verify both image builds with:

```bash
npm run verify:containers
```

This uses non-routable/test browser values and does not start a service, connect to Stripe or mutate a database.

Base-image digest changes must be deliberate dependency updates. Resolve the replacement from the official Node image, review its platform and security position, rebuild both images and repeat the full release/runtime verification rather than silently changing the tag.

## Environment-specific web builds

`NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` are browser-visible build arguments. They must identify the target environment and must never contain secret material. Because Next.js embeds public values at build time, staging and production require separate reviewed image builds even when they use the same source commit.

The web image uses Next.js standalone output. Local development remains `npm run dev`; containers do not replace the existing fast Mac development workflow.

## Required release evidence

For every future staging or production candidate, record:

| Evidence              | Required value                                     |
| --------------------- | -------------------------------------------------- |
| Environment           | `staging` or `production`                          |
| Git commit            | Full immutable commit SHA                          |
| API image             | Registry reference plus immutable digest           |
| Web image             | Registry reference plus immutable digest           |
| Web public API origin | Approved HTTPS origin                              |
| Stripe mode           | Test for staging; live only after launch approval  |
| Migration set         | Latest applied Prisma migration directory name     |
| Migration executor    | Named operator/release identity and timestamp      |
| Approval              | Named go/no-go approver and decision time          |
| Smoke evidence        | Correlated request identifiers and bounded results |

Mutable tags such as `latest` may aid discovery but must never be the recorded deployment identity.

## Controlled migration sequence

Only one release job or named operator may execute migrations. API replicas must not automatically migrate on startup.

1. Confirm the exact environment, database host/name and release commit without printing credentials.
2. Confirm a current backup/point-in-time recovery boundary and successful restore evidence appropriate to that environment.
3. Run the complete release gate against the candidate source.
4. Build both images and record their digests.
5. From the API image, check migration status against the intended target.
6. Stop if the database identity, migration history or backup evidence is unexpected.
7. Run exactly one migration executor using:

   ```bash
   npx prisma migrate deploy
   ```

8. Record the executor, start/end time, result and applied migration set.
9. Deploy the API image, verify `/health/live`, then `/health/ready`.
10. Deploy the matching environment-specific web image.
11. Complete smoke tests before traffic promotion.

Never run `prisma migrate dev`, `prisma db push`, reset or seed operations against staging or production.

## Smoke-test order

Future staging acceptance must verify:

1. API liveness succeeds without claiming dependency readiness.
2. API readiness succeeds against the intended database.
3. Web landing/login routes load through HTTPS with the expected API origin.
4. An OWNER can authenticate and access only the expected Organisation/Event.
5. representative MANAGER, STAFF and SCANNER denials remain enforced;
6. a public Event and booking read succeeds without mixed-content or CORS failure;
7. Stripe test-mode PaymentIntent and signed webhook reconciliation succeed;
8. Ticket and Waiver presentation load without exposing raw credentials in logs; and
9. server evidence contains the request identifier used by the browser check.

Do not perform a real charge, refund or admission merely to prove deployment plumbing.

## Failure and rollback decision

### Before migration

If build, configuration, backup, migration-status or approval evidence fails, do not deploy. Correct the candidate and restart the gate.

### Code-only failure after deployment

When the schema remains compatible, route traffic back to the last recorded image digests. Preserve the failed image, request identifiers and incident evidence. Do not rebuild an old commit and assume it is identical.

### Migration failure

Stop traffic promotion and new migration attempts. Preserve the exact Prisma output and database state. Do not edit `_prisma_migrations`, manually reverse SQL or restore over the target without an approved recovery decision.

Prisma migrations are forward-only operational history. Prefer a reviewed forward-fix migration when data integrity is intact. Use point-in-time restore only when the incident owner determines that forward repair is unsafe and the accepted data-loss window is understood.

### Application failure after a successful migration

Do not roll application code back unless the prior image is demonstrably compatible with the new schema. Prefer a forward-fixed application image. If compatibility is uncertain, fail closed, preserve evidence and escalate.

## Current limitations

- Container build success is not cloud deployment evidence.
- Local `.glacier-storage` is ephemeral inside a container and is not acceptable for durable production Event/Waiver assets; managed object storage remains required.
- External HTTPS, CORS, rate limits, managed secrets, central logs, alerts, managed backups and least-privilege identities remain unproven.
- The open Prisma dependency advisory remains subject to `docs/security/DEPENDENCY_AUDIT_2026-09-01.md`.
- No image may be published to an external registry until account ownership and any cost are approved.

## Recorded Sprint 31 local evidence

On 1 September 2026:

- the API image completed deterministic production dependency installation, Prisma Client generation and the NestJS production build;
- the web image completed deterministic dependency installation and a Next.js 16 standalone Webpack production build;
- both images ran as the non-root `node` user and carried the expected Git revision label;
- the API first refused startup when production HTTPS origin variables were absent, proving the existing fail-closed environment contract;
- with explicit non-routable HTTPS smoke origins, API liveness/readiness succeeded against the existing local PostgreSQL database through Docker's host bridge;
- the standalone web container returned a successful response; and
- both temporary smoke containers were removed.

This evidence must be repeated after the container-definition commit so the recorded image revision equals the commit containing the definitions. It remains local evidence only and does not close any funded staging or production gate.
