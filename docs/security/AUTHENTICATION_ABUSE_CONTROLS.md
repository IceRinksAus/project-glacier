# Authentication Abuse Controls

## Decision

Glacier will enforce login rate limiting at the deployment edge before any pilot environment is exposed to the internet. The edge control must apply to `POST /auth/login` per source IP, with monitoring and alerting for sustained rejection volume.

This is deliberately an infrastructure control rather than an in-memory application counter. An in-memory counter would reset on every deployment, would not coordinate across multiple API instances and could create inconsistent protection as the platform scales.

## Application Boundary

The API provides the complementary controls that belong in application code:

- strict global request validation with unknown fields rejected;
- a valid email no longer than 254 characters;
- a non-empty password no longer than 128 characters;
- normalised email lookup;
- no password or password hash in successful responses or JWT claims;
- a generic response when credentials are absent or incorrect; and
- short-lived, signed access tokens using the configured JWT secret.

Inactive accounts currently receive a distinct rejection because that is established product behaviour. Before broader production rollout, review whether this message should also be made generic to reduce account-state disclosure.

## Pilot Gate

The pilot release checklist must not mark internet exposure complete until the hosting configuration records:

1. the chosen edge provider and rule identifier;
2. the request threshold and window;
3. the response returned when the threshold is exceeded;
4. the monitoring or alert destination; and
5. a test result proving repeated login attempts are limited.

The application test suite proves request shape and authentication behaviour. The edge-limit test belongs to deployment verification because it cannot be proven by unit tests in this repository.
