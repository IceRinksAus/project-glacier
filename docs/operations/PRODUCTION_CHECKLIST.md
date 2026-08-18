# Production Checklist

## Security

- Rotate development credentials
- HTTPS
- managed secret storage
- rate limiting
- audit logging
- formal role matrix
- privacy review
- tenant-isolation verification
- dependency vulnerability review
- Security & Privacy Gate

## Payments

- create / verify live Stripe configuration
- store live Stripe secret key in managed secrets
- configure live Stripe publishable key
- register production Stripe webhook endpoint
- configure production webhook signing secret
- verify raw-body webhook signature validation
- verify HTTPS on webhook endpoint
- confirm webhook retry / idempotency behaviour
- verify PaymentIntent creation uses authoritative backend amounts
- verify PaymentIntent cancellation for expired reservations
- verify late-success refund behaviour
- verify refund idempotency
- verify no Ticket issuance before eligible payment confirmation
- verify no Ticket issuance for expired late payments
- verify operator refund permissions before enabling manual refunds
- add payment / refund audit logging
- add payment monitoring and alerting
- document payment incident response
- confirm PCI DSS scope and provider responsibilities
- complete production Stripe test plan before customer pilot

## Reliability

- backups and restore testing
- monitoring and alerting
- central logs
- error tracking
- load testing
- webhook observability
- payment-provider outage handling
- scanner offline/retry strategy

## Quality

- unit tests
- integration tests
- end-to-end tests
- CI pipeline
- migration checks
- API documentation
- release process
- dependency audit review
- payment sandbox regression suite
- production smoke-test plan

## Current Dependency Note

Sprint 15 closeout leaves three high-severity audit findings through Prisma's transitive `deepmerge-ts` dependency.

Do not use `npm audit fix --force` merely to clear the scanner if it requires a breaking Prisma downgrade.

Reassess the finding when a compatible upstream Prisma dependency resolution is available.
