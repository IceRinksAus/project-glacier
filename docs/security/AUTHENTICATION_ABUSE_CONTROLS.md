# Authentication Abuse Controls

## Decision

Glacier will enforce login rate limiting at the deployment edge before any pilot environment is exposed to the internet. The edge control must apply to `POST /auth/login` per source IP, with monitoring and alerting for sustained rejection volume.

The API now also provides an in-memory defence-in-depth limiter. This local
counter is deliberately not treated as a substitute for the edge control: it
resets on deployment and does not coordinate across multiple API instances.
Its thresholds are safety ceilings, not the final event-capacity or edge-policy
tuning.

## Application Boundary

The API provides the complementary controls that belong in application code:

- strict global request validation with unknown fields rejected;
- a valid email no longer than 254 characters;
- a non-empty password no longer than 128 characters;
- normalised email lookup;
- no password or password hash in successful responses or JWT claims;
- a generic response when credentials are absent or incorrect; and
- short-lived, signed access tokens using the configured JWT secret.

The application safety layer currently covers:

| Policy | Scope | Limit |
| --- | --- | ---: |
| Operator login | `POST /auth/login` | 20 per source address per 15 minutes |
| Public commerce writes | customer/Booking creation, Payment/status requests and Flexible Ticket request mutation | 120 per source address per minute |
| Waiver submission | public Waiver submission | 30 per source address per minute |
| Possession lookup | public Ticket/QR and Waiver verification lookups | 120 per source address per minute |

Limited responses return HTTP `429`, bounded `RateLimit-*` evidence and a
`Retry-After` value. Logs record only the policy and retry interval; they do not
record the source address, token, credential, Booking ID or raw path.

`TRUST_PROXY_HOPS` controls which reverse-proxy hop Express trusts when deriving
the source address. Local development defaults to `0`. Production refuses to
start without an explicit value from `0` to `3`. The deployed value must equal
the verified proxy topology: trusting too many hops may let callers spoof their
address, while trusting too few can group all customers under the edge address.

Inactive accounts currently receive a distinct rejection because that is established product behaviour. Before broader production rollout, review whether this message should also be made generic to reduce account-state disclosure.

## Pilot Gate

The pilot release checklist must not mark internet exposure complete until the hosting configuration records:

1. the chosen edge provider and rule identifier;
2. the request threshold and window;
3. the response returned when the threshold is exceeded;
4. the monitoring or alert destination; and
5. a test result proving repeated login attempts are limited.

The application test suite proves request shape, authentication behaviour,
policy matching, independent source counters, reset behaviour and `429`
responses. The coordinated edge-limit and forwarded-address tests belong to
deployment verification because they cannot be proven by local unit tests.
