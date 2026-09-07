# Privileged Authentication Lifecycle

## Status

Sprint 33 local security foundation. Persisted sessions, immediate revocation
and membership-scoped TOTP MFA for OWNER and MANAGER are implemented locally.
Password recovery remains blocked until approved email delivery and account
ownership exist. Managed production secret custody and independent review are
still required before live access.

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

## Implemented privileged MFA authority

OWNER and MANAGER sessions now require MFA. Successful password verification
creates only a five-minute, hash-at-rest challenge; the normal session and JWT
are created after TOTP or one unused recovery code succeeds. STAFF and SCANNER
retain the password-only flow.

MFA belongs to the `UserOrganization` membership, preserving Organisation
boundaries for users with multiple memberships. TOTP secrets are protected with
AES-256-GCM and a configured key ID. Recovery codes contain 128 random bits,
are keyed-hashed individually, displayed once and consumed once. Regeneration,
rotation and reset invalidate former authority. TOTP counters are updated
atomically to prevent replay, including concurrent use.

Promotion to MANAGER revokes existing password-only sessions. Every protected
request independently requires current factor-generation evidence for OWNER or
MANAGER, so a role change cannot elevate an old session. A same-Organisation
OWNER may reset a MANAGER, which revokes the factor, codes, challenges and
sessions. Ordinary workflows cannot reset an OWNER.

Passkeys/WebAuthn remain the preferred future phishing-resistant factor. SMS is
not approved as a primary privileged factor.

Privileged recovery must not allow an ordinary STAFF account or a single
support action to grant OWNER authority. Lost-factor recovery requires a
documented, attributable process with strong identity verification and
notification to existing trusted channels.

## Remaining gates

- expose **sign out everywhere** in account security settings;
- choose and implement the email provider without committing spend prematurely;
- implement hashed, single-use recovery tokens and notifications;
- place MFA keys/pepper in approved managed production secret storage and prove
  rotation through deployed instances;
- add passkeys/WebAuthn as the preferred phishing-resistant factor;
- define expired/revoked session retention and cleanup after privacy review;
- move browser authentication away from JavaScript-readable storage or prove a
  sufficiently strong XSS/CSP boundary before production;
- alert on suspicious login, recovery and MFA activity; and
- complete independent security testing before live use.
