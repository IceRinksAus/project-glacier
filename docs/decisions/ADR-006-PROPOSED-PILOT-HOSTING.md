# ADR-006 — Proposed Pilot Hosting Architecture

## Status

Proposed during Sprint 31. Provider accounts, paid resources and live deployment are not yet authorised.

## Decision summary

Use Google Cloud as the preferred pilot architecture, subject to organiser approval, current pricing verification and creation of the correct Glacier-owned account after entity advice.

The proposed Australian deployment is:

- Next.js web service on Cloud Run;
- NestJS API service on Cloud Run;
- PostgreSQL on Cloud SQL in Sydney (`australia-southeast1`);
- Cloud Storage for durable branding, waiver and future document assets;
- Secret Manager for deployed credentials;
- Artifact Registry for immutable application images;
- Cloud Build or GitHub Actions for gated image build and deployment;
- Cloud Logging, Error Reporting, Monitoring and alert policies;
- Cloud Scheduler plus a controlled job/endpoint for reservation expiry and payment cleanup; and
- separate Google Cloud projects for staging and production.

Staging must use Stripe test mode. Production resources and live Stripe credentials remain blocked by the entity/account ownership and pilot launch gates.

## Context

Glacier currently contains a Next.js web application, a NestJS API, PostgreSQL/Prisma persistence, Stripe webhooks, durable media requirements and a one-minute reservation expiry/payment cleanup scheduler. The pilot needs Australian-region managed infrastructure, reproducible deployment, strong isolation, recoverability and low administration overhead.

The embedded NestJS cron is a material hosting constraint. Request-driven compute can sleep when idle, while multiple API replicas can each execute the same cron. Before production scaling, this work should become an independently invoked, authenticated and observable scheduled operation with concurrency protection. A staging bridge may keep one API instance active, but that is not the preferred final authority.

## Options considered

| Option | Strengths | Glacier concerns | Position |
|---|---|---|---|
| Google Cloud Run + Cloud SQL | Sydney and Melbourne managed services; container portability; scale-to-zero option; managed scheduler, secrets, storage and observability; relatively small operational surface | Cloud SQL is the principal fixed cost; scheduled work must be separated or continuously allocated; careful IAM/project design required | Preferred |
| AWS App Runner + RDS PostgreSQL | App Runner and mature AWS services available in Sydney; strong VPC, IAM, logging, storage and recovery ecosystem | Greater service/configuration surface; App Runner retains provisioned-memory cost while idle; scheduled operations need EventBridge/job design | Credible alternative |
| Azure Container Apps + Azure Database for PostgreSQL | Australian regions; consumption containers; strong identity, monitoring and enterprise integrations | More Azure-specific deployment vocabulary and resource structure; no present organisational advantage; scheduled work still needs an explicit job design | Credible alternative |
| Split specialist platforms | Often quickest initial deployment and polished web workflow | Australian data-location and cross-provider recovery/ownership become harder to evidence; more vendors, billing identities and failure boundaries | Rejected for pilot foundation |
| Single virtual machine | Low apparent entry cost and full control | Glacier would own patching, database operations, backups, TLS, failover and recovery; poor fit for a small pilot team | Rejected |

## Why Google Cloud is proposed

- Cloud Run supports containerised web applications and APIs without managing servers.
- Cloud SQL for PostgreSQL is available in both Sydney and Melbourne, enabling an Australian primary and a future regional recovery decision.
- Cloud SQL supports backups and point-in-time recovery; Glacier will still require a real isolated restore drill.
- Cloud Run, Scheduler, Storage, Secret Manager and managed monitoring cover the pilot needs without Kubernetes.
- Container images and standard PostgreSQL preserve a practical exit path.

This is a recommendation, not a claim that Google Cloud is intrinsically more secure. Security depends on the configuration, identities, recovery controls and operating practices implemented during this phase.

## Proposed boundaries

### Account and project control

- Create a Glacier-owned Google Cloud organisation/billing arrangement after accountant advice identifies the correct holder.
- Do not build permanent production ownership under Ice Rinks Australia by default.
- Use separate `glacier-staging` and `glacier-production` projects with separate service identities, databases, buckets, secrets and Stripe modes.
- Require MFA for human administrators, at least two recovery owners and no shared daily-use administrator login.
- Apply budgets and alerts; budgets warn but must not be treated as hard security limits.

### Network and data

- Keep PostgreSQL non-public where the chosen Cloud Run connection design permits.
- Permit the API service identity only the database and secret access it requires.
- Keep the web service free of database and Stripe secret credentials.
- Use signed or application-authorised access for non-public objects.
- Store database, objects, routine logs and backups in approved Australian regions unless a documented exception is accepted.

### Release

- Build immutable API and web images from a recorded Git commit.
- Run complete API/web tests and production builds before deployment.
- Run Prisma migrations through one controlled release job, never from every API replica.
- Deploy staging first, run HTTPS/browser/payment smoke tests, then require explicit production approval.
- Record deployed image digests, commit and migration set.

### Recovery

- Enable automated database backups and point-in-time recovery.
- Define object versioning/retention before production uploads.
- Restore into an isolated target and measure recovery rather than trusting configuration alone.
- Initial proposed objectives for organiser review are an RPO of 15 minutes and RTO of four hours during supported pilot operations.

## Cost position

No price is locked by this ADR. Current provider prices vary by Australian region, database size, retained logs/backups, network traffic, minimum instances and currency.

Use a provisional planning allowance of **AUD 250–600 per month for combined staging and modest pilot production infrastructure**, excluding Stripe fees, email/SMS, external security review and support plans. This is deliberately conservative rather than a quote. Before provisioning, save dated calculator estimates for low, expected and event-peak usage and configure billing alerts.

The managed PostgreSQL instances are expected to dominate the fixed pilot cost. Staging may be paused or reduced when not in active acceptance, provided its recovery role and test schedule remain explicit.

## Decisions needed to accept this ADR

1. Approve Google Cloud as the pilot preference or request deeper comparison of one alternative.
2. Approve Australian-region storage as the default.
3. Confirm whether the AUD 250–600 monthly planning range is acceptable.
4. Confirm initial RPO 15 minutes and supported-hours RTO four hours as planning targets.
5. Identify the temporary billing/account holder after accountant advice.
6. Decide whether Sprint 31 may create a staging account/deployment or should stop at reproducible deployment foundations.

## Consequences

Acceptance enables container/deployment files, staged infrastructure definitions, health checks, migration gates and restore evidence to target one coherent platform. It creates Google Cloud operational knowledge and billing dependency, mitigated by standard containers, PostgreSQL and documented export/rebuild procedures.

## Sources reviewed

- [Google Cloud Run overview](https://cloud.google.com/run/docs/overview/what-is-cloud-run) and [pricing](https://cloud.google.com/run/pricing)
- [Google Cloud SQL PostgreSQL region availability](https://cloud.google.com/sql/docs/postgres/region-availability-overview) and [point-in-time recovery](https://cloud.google.com/sql/docs/postgres/backup-recovery/pitr)
- [AWS App Runner Sydney availability](https://docs.aws.amazon.com/apprunner/latest/relnotes/release-2023-03-01-new-regions.html), [service overview](https://docs.aws.amazon.com/apprunner/latest/dg/) and [pricing](https://aws.amazon.com/apprunner/pricing/)
- [Azure Container Apps overview](https://learn.microsoft.com/azure/container-apps/overview) and [pricing](https://azure.microsoft.com/pricing/details/container-apps/)

Provider capability and price must be rechecked immediately before account creation.
