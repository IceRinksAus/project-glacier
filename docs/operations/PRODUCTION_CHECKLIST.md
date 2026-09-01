# Production Checklist

## Security

- [ ] Run `npm run verify:isolation` and retain the passing tenant/role boundary evidence.
- [ ] Set and verify `TRUST_PROXY_HOPS` against the real edge topology; test that distinct clients remain distinct and spoofed forwarding headers are ignored.
- [ ] Configure a coordinated edge abuse limit and alert destination; retain repeated-login `429` evidence.

- Rotate development credentials
- enforce HTTPS/TLS
- verify API and web security headers through the real HTTPS edge
- stage web Content Security Policy in report-only mode before enforcement
- enable HSTS only after every covered hostname supports HTTPS
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
- current tracked-secret scan passes with `npm run verify:secrets`
- reviewed Git-history secret scan and provider credential rotation evidence
- configure private managed object storage, isolated image decoding/re-encoding, malware scanning and lifecycle/cleanup evidence
- verify branding objects cannot be fetched directly without an authorised Glacier/public Event path
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

The 1 September 2026 audit reports zero known web vulnerabilities and one underlying High API advisory propagated through four Prisma-related package entries. See `docs/security/DEPENDENCY_AUDIT_2026-09-01.md`. A compatible upstream fix is not currently available; recheck weekly and before exposure. Do not force breaking transitive overrides merely to clear a report.
