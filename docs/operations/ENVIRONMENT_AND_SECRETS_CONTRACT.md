# Environment and Secrets Contract

## Status

Sprint 31 operational contract. This document names configuration but must never contain real secret values.

## Environment isolation

Glacier uses three logical environments:

| Environment | Purpose | Data and service rule |
|---|---|---|
| Local | Developer work and automated tests | Local or disposable data; Stripe test mode only |
| Staging | Production-like acceptance and recovery exercises | Isolated database, storage, credentials and Stripe test-mode webhook |
| Production | Approved pilot operation | Production-only database, storage, credentials, origins and monitored services |

No database, Stripe secret, webhook secret, object store or authentication secret may be shared between staging and production. Production data must not be copied into local or staging environments without an approved, documented sanitisation process.

## API configuration

| Variable | Secret | Local | Staging/production requirement |
|---|---|---|---|
| `NODE_ENV` | No | `development` | `production` |
| `PORT` | No | Defaults to `3000` | Provider-assigned or explicitly configured |
| `DATABASE_URL` | Yes | Required | Required; environment-specific managed PostgreSQL credential |
| `JWT_SECRET` | Yes | Required | Required; unique, randomly generated and at least 32 characters |
| `STRIPE_SECRET_KEY` | Yes | Required for API startup | Required; test key in staging and live key only after launch approval |
| `STRIPE_WEBHOOK_SECRET` | Yes | Required for webhooks | Required and unique to the environment endpoint |
| `WEB_APP_URL` | No | Defaults to `http://localhost:3001` | Required HTTPS origin; no path or localhost fallback |
| `CORS_ORIGINS` | No | Defaults to approved local ports | Required comma-separated HTTPS origin allowlist |
| `TRUST_PROXY_HOPS` | No | Defaults to `0` | Required integer `0`–`3`, matching the verified reverse-proxy topology |
| `EMAIL_API_KEY` | Yes | Optional until email provider work | Environment-specific when email delivery is enabled |

The API refuses to start in production when required variables are missing, when the JWT secret is too short, or when public/CORS origins are not HTTPS origins.

## Web configuration

| Variable | Secret | Requirement |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | No | API origin for the matching environment |
| `NEXT_DIST_DIR` | No | Optional local build-directory override only |

Values prefixed with `NEXT_PUBLIC_` are included in browser-delivered code and must never contain credentials or private service addresses.

## Secret handling

- Store deployed secrets in the selected provider's secret manager, not in Git, images, documentation or deployment logs.
- Give each environment separate secrets and least-privilege service identities.
- Limit secret visibility to named administrators and the service that consumes it.
- Maintain two controlled recovery owners for production accounts without sharing routine user credentials.
- Rotate a secret immediately after suspected disclosure, personnel/access change or provider incident.
- Record rotation date, owner and affected services without recording the value.
- Redact authentication tokens, cookies, payment data, database URLs and personal data from application and deployment logs.

## Deployment gate

Before a staging or production release:

1. Validate required configuration without printing values.
2. Confirm every resource and credential belongs to the target environment.
3. Confirm the web/API origins and CORS allowlist exactly match approved HTTPS endpoints.
4. Confirm Stripe mode and webhook endpoint match the target environment.
5. Confirm the database migration target before executing migrations.
6. Record the deployed commit and migration set.

Production activation additionally requires the entity/account ownership gate in `docs/business/GLACIER_ENTITY_AND_ASSET_OWNERSHIP_PLAN.md`.
