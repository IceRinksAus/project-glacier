# Privileged Authentication Lifecycle

## Status

Sprint 31 security foundation. Persisted authentication sessions and immediate
revocation are implemented locally. Password recovery and privileged MFA are
specified here but remain blocked from live operator access until their delivery,
storage and recovery controls are implemented and tested.

## Implemented session authority

Successful password verification now creates an `AuthenticationSession` with:

- a random UUID identifier carried in the signed JWT as `sid`;
- authoritative User and Organisation ownership;
- an eight-hour expiry matching the JWT lifetime;
- optional revocation time and bounded reason; and
- immutable creation time.

Every protected request checks JWT signature/expiry, the persisted session,
current User status, current Organisation status and current membership role and
scope. A missing, expired, revoked, wrong-User or wrong-Organisation session is
rejected. Role changes and Event-assignment changes therefore remain immediate,
and session revocation no longer requires waiting for JWT expiry.

`POST /auth/logout` revokes the current session. `POST /auth/logout-all` revokes
every unexpired session for the authenticated User across Organisations. Both
retain the session record and reason rather than deleting evidence. The web
dashboard and Staff Scanner call current-session logout before clearing their
local token. If the API is unreachable they still clear the device; any copied
server token remains bounded by its original eight-hour expiry, and the operator
should use **sign out everywhere** from a trusted device once service returns.

The migration intentionally invalidates older JWTs that have no persisted
session identifier. Local users must sign in again after the migration.

## Password recovery contract

Password recovery must not be exposed until Glacier has an approved email
provider, sending-domain controls and operational ownership. The implementation
must then:

1. accept a bounded email address and always return the same generic response;
2. generate at least 32 random bytes and deliver the raw token only by the
   approved email channel;
3. store only a SHA-256 token hash, requested time, expiry, used time and safe
   request evidence;
4. expire the token within 30 minutes and permit one successful use;
5. atomically consume the token, update the bcrypt password hash and revoke all
   active authentication sessions;
6. notify the account through an independent informational email; and
7. rate-limit and alert on recovery requests and repeated invalid completions.

Glacier must not return a development recovery token through the public API,
write it to logs or reveal whether an email address has an account.

## Privileged MFA decision

OWNER and MANAGER access requires MFA before live operator use. The preferred
primary factor is WebAuthn/passkeys because it is phishing resistant. TOTP may
be supported as a controlled compatibility fallback; SMS is not an approved
primary privileged factor.

The future login flow must verify password first but must not issue the normal
access JWT until the MFA challenge completes. Enrolment and factor removal
require recent authentication. TOTP secrets and WebAuthn credential material
must use managed encryption/secret controls appropriate to the factor. Recovery
codes must be high entropy, individually hashed, displayed once and consumed
once; regeneration invalidates every older code.

Privileged recovery must not allow an ordinary STAFF account or a single
support action to grant OWNER authority. Lost-factor recovery requires a
documented, attributable process with strong identity verification and
notification to existing trusted channels.

## Remaining gates

- expose **sign out everywhere** in account security settings;
- choose and implement the email provider without committing spend prematurely;
- implement hashed, single-use recovery tokens and notifications;
- implement and test passkey/TOTP enrolment, challenge and recovery-code flows;
- define expired/revoked session retention and cleanup after privacy review;
- move browser authentication away from JavaScript-readable storage or prove a
  sufficiently strong XSS/CSP boundary before production;
- alert on suspicious login, recovery and MFA activity; and
- complete independent security testing before live use.
