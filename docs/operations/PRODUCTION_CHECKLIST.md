# Production Checklist

## Security

- Rotate development credentials
- enforce HTTPS/TLS
- configure managed secret storage
- set an explicit production `CORS_ORIGINS` allowlist
- verify production fails closed without the allowlist
- configure deployment-edge login rate limiting and record its rule identifier
- configure abuse limits for public Booking, Payment, Ticket-token and Waiver-submission routes
- test the configured limit response and alert destination
- audit logging
- formal role matrix
- MFA for privileged users
- password reset/recovery and session-revocation decision
- privacy review
- tenant-isolation integration verification against a production-like database
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
- verify reconciliation-attempt and refund audit retention
- alert on repeated provider retrieval, cancellation or refund failures
- verify organiser payment investigation remains OWNER-only and provider references remain masked
- add payment monitoring and alerting
- document payment incident response
- confirm PCI DSS scope and provider responsibilities
- complete production Stripe test plan before customer pilot

## Reliability

- backups and restore testing
- retain successful local restore-drill evidence from `npm run verify:restore`
- complete a separate managed point-in-time restore before live approval; local evidence is not production recovery evidence
- monitoring and alerting
- central logs
- error tracking
- load testing
- webhook observability
- payment-provider outage handling
- reconciliation retry and escalation runbook ownership
- scanner offline/retry strategy
- monitor Organisation and Event report latency and error rate
- alert when reporting query caps are approached so partial pilot-scale projections are not mistaken for complete large-scale results
- reconcile operational net-collected figures against authoritative Payment/refund investigation and Stripe settlement procedures before financial use

## Staff Scanner and Gate Operations

- require HTTPS for production camera access
- verify SCANNER accounts cannot reach Event, Booking, Customer, catalogue or Ticket administration routes
- confirm the correct active Event and Gate Entry/Ticket Lookup mode on every device before opening gates
- confirm Event Settings entry window matches the operating plan
- test one eligible, too-early, closed, cancelled, wrong-Event and already-scanned Ticket
- test automatic Gate admission and confirmed Lookup processing separately
- test simultaneous scans from two devices; only one may grant entry
- verify camera-denied and network-loss states fail closed and retain hardware/manual fallback
- verify append-only scan attempts identify User, Event, mode and result without raw Ticket credentials
- complete the physical-device matrix in `operations/STAFF_SCANNER_RUNBOOK.md`
- document the on-duty escalation owner and procedure for connectivity or scanner failure

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

Sprint 18 web closeout reports zero known npm audit vulnerabilities after a compatible override to patched `nanoid 3.3.18`. Continue auditing both workspaces and do not use forced breaking downgrades merely to clear a report.
