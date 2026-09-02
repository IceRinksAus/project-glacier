# Sprint 32 Plan — Ticket Possession-Credential Hardening

## Planning status

Proposed on 2 September 2026 as the next no-spend Phase 3 security Sprint after
Sprint 31 closeout. Implementation must not begin until the organiser confirms
this scope.

## Recommendation

Sprint 32 should close `SEC-31-009` by removing directly usable Ticket
possession credentials from PostgreSQL while preserving Glacier's complete
Ticket journey and existing local QR codes during a controlled transition.

The recommended design stores only a random public selector, key identifier and
one-way legacy hash. Glacier reconstructs and verifies the current credential
with a separate HMAC signing key held in application configuration. A database
copy alone therefore cannot produce a usable current Ticket credential.

This is deliberately a focused security Sprint. Mandatory privileged MFA,
password-recovery delivery, legal retention approval, cloud infrastructure,
central monitoring and independent review remain separate gates.

## Objective

Protect Ticket possession authority at rest without weakening issuance,
confirmation, POS, QR presentation, validation, scanning, cancellation,
replacement or tenant/Event access boundaries.

## User outcome

Customers and staff continue to use Ticket links and QR codes normally. Existing
local Tickets remain usable during transition. Behind the interface, a copied
database no longer contains the raw bearer credentials needed to present or
scan Tickets.

## Threat and current behaviour

The current Ticket model stores a 32-byte random credential as 64 hexadecimal
characters in `Ticket.secureToken`. The same value is:

- returned after successful online and walk-up Ticket issuance;
- embedded in the customer Ticket URL;
- rendered in the Ticket QR code;
- used for public Ticket presentation;
- used for organiser access checks and scanner validation; and
- queried during atomic check-in.

The credential has strong entropy and is not copied into scan-attempt evidence,
but anyone obtaining a readable database copy could use active values as bearer
credentials. Booking and Waiver possession credentials already avoid that
specific raw-at-rest weakness through one-way hashes.

## Chosen credential design

### Current format

New/current Ticket credentials use a bounded URL-safe versioned format:

```text
gt1_<selector>_<mac>
```

- `gt1` identifies the credential contract, not an environment.
- `selector` is a server-generated 128-bit random hexadecimal lookup value.
- `mac` is a base64url-encoded HMAC-SHA-256 value.
- The MAC binds the format version, Ticket ID, selector and stored key ID with
  unambiguous domain separation.
- Verification uses constant-time comparison after strict format and length
  checks.

The selector is not an authentication secret. It permits one indexed database
lookup; possession authority comes from the MAC and the separately managed
signing key.

### Stored Ticket fields

The persistence change should introduce:

- unique `credentialSelector`;
- `credentialKeyId` identifying the signing key used for reconstruction;
- optional unique `legacyCredentialHash` for transition-only acceptance; and
- no non-null raw Ticket possession credential.

The legacy `secureToken` column may remain nullable for one forward-compatible
migration boundary, but every value must be cleared and a verification query
must prove zero non-null raw credentials before Sprint closeout. A later cleanup
migration may remove the column only after all code and rollback decisions no
longer depend on it.

### Signing-key contract

Ticket signing keys must be distinct from JWT, Stripe, database and webhook
secrets. Production configuration requires:

- an explicit active Ticket key ID;
- a bounded key ring containing the active and temporarily retained previous
  keys;
- decoded keys with at least 256 bits of random secret material;
- fail-closed startup when the active key is absent, malformed or duplicated;
  and
- no production default or committed key value.

A local/test-only default may preserve the current no-cost developer workflow,
but it must be visibly non-production and rejected when `NODE_ENV=production`.
Logs and error messages may identify a key ID but must never print key material,
MACs or raw credentials.

### Key and Ticket rotation

- New Tickets use the configured active key ID.
- Verification resolves the Ticket by selector and then uses only its recorded
  key ID.
- Re-presentation reconstructs the current credential from the Ticket record
  and matching key.
- Rotation updates selector/key ID transactionally; the prior current
  credential then fails immediately.
- Previous signing keys may be removed only after no Ticket row references
  them.
- Cancelled/replaced Tickets remain non-admissible regardless of credential
  validity.

No endpoint may accept a caller-supplied key ID as authority.

## Legacy transition

Existing 64-character hexadecimal Ticket credentials must not be silently
broken during the local transition.

The migration will:

1. add selector, key-ID and legacy-hash fields;
2. derive a unique non-secret selector for each existing Ticket;
3. store SHA-256 of the existing raw credential as
   `legacyCredentialHash`;
4. assign the configured transition/current key ID through an explicit,
   reviewed data step;
5. verify every Ticket has the new fields and unique indexes;
6. clear every raw `secureToken`; and
7. prove no raw value remains before the application is accepted.

For a bounded compatibility period, an old 64-hex credential is looked up only
through its SHA-256 hash. It can present/scan the corresponding Ticket, but any
new Ticket response or generated QR uses the current `gt1` credential. The
legacy hash cannot reconstruct the old bearer value.

Legacy acceptance remains observable through a privacy-safe event/counter so
it can eventually be retired. The event must not include the credential,
selector, hash, Ticket number or customer/participant identity.

Because Glacier has no production Tickets, this bridge protects useful local
acceptance data without creating a permanent public contract. Retirement of
legacy acceptance requires separate evidence that no intended test/rehearsal
clients still depend on it.

## Workstream A — Credential authority service

Create one injectable Ticket credential authority responsible for:

- configuration parsing and startup validation;
- selector generation;
- current credential construction;
- strict current/legacy parsing;
- HMAC generation and constant-time verification;
- legacy SHA-256 hashing;
- safe Prisma lookup conditions/results; and
- credential rotation primitives.

Ticket, Scanner, Access Control, Payment status, POS and rescheduling services
must use this authority rather than reimplementing token rules.

Raw credentials must exist only at the presentation/verification boundary and
must never be persisted, logged or included in generic ORM objects.

## Workstream B — Forward-only persistence migration

- add the new indexed fields and required constraints;
- migrate existing records without exposing raw values in output;
- reject partial records and unsupported key identifiers;
- retain rollback safety without repopulating raw credentials;
- update Prisma mocks/fixtures to represent stored fields separately from
  presented credentials; and
- add a repeatable verification that raw Ticket credentials equal zero.

The migration must run against a disposable freshly migrated database and the
existing local database. Development reset or destructive seed shortcuts are
prohibited.

## Workstream C — Complete Ticket-path refactor

Update every current path:

1. normal online Ticket issuance;
2. reschedule replacement-Ticket issuance;
3. public Booking status and confirmation;
4. walk-up/POS completion;
5. public Ticket detail;
6. public QR generation;
7. authenticated Ticket detail/QR generation;
8. Access Control Ticket resolution;
9. scanner lookup and Gate Entry;
10. legacy validate/check-in controller routes retained by the endpoint
    register; and
11. tests, DTOs and frontend types currently assuming 64 hexadecimal
    characters.

Database reads should select stored selector/key metadata and explicitly map a
current presentation credential only where the caller is already authorised to
receive it. Generic Ticket/admin responses must not acquire a credential field
by accident.

## Workstream D — Atomic admission and concurrency

Ticket verification must resolve credential authority before mutation, then
preserve the current atomic state transition:

- scope the Ticket through the authenticated Organisation/Event boundary;
- update only an `ACTIVE` Ticket;
- allow only one simultaneous scanner to receive `ENTRY_GRANTED`;
- retain `ALREADY_SCANNED`, `CANCELLED`, wrong-Event and invalid outcomes;
- write append-only scan evidence without credential material; and
- preserve configured entry-window behaviour.

The refactor must not introduce a selector-only admission path.

## Workstream E — Rotation and compromise response

Provide a service-level and protected API operation for authorised credential
rotation. The recommended authority is OWNER or Event-assigned MANAGER; STAFF
and SCANNER may validate/admit but may not reissue bearer authority.

Rotation must:

- require tenant/Event authority;
- create a fresh selector using the active key;
- clear the legacy hash;
- invalidate the prior credential immediately;
- leave Ticket number, participant, Booking, Payment, status and scan history
  unchanged;
- record attributable non-secret audit evidence; and
- return the new credential only once through the controlled response.

The dashboard does not require broad visual redesign. A minimal controlled
reissue action may be added to Booking/Ticket investigation only if it can
clearly warn that an earlier link/QR will stop working.

## Workstream F — Abuse, logging and response safety

- retain public Ticket route abuse limits for both formats;
- normalise current and legacy Ticket paths in request evidence;
- ensure malformed, unknown-selector, bad-MAC, removed-key and wrong-Event
  failures do not disclose which component was valid;
- use the same privacy-safe public not-found response;
- never log a raw credential, MAC, selector, legacy hash or signing key; and
- add secret-scan patterns only if they can identify configured Ticket keys
  without flagging harmless Ticket examples.

## Required automated evidence

### Credential authority

- current token construction and exact bounded grammar;
- distinct Tickets/selectors produce distinct credentials;
- one-character selector/MAC/version changes fail;
- constant-time comparison is used for equal-length MACs;
- missing/short/malformed/unknown-key production configuration fails startup;
- key material never appears in thrown messages; and
- current/previous key references behave under rotation.

### Persistence and migration

- all existing Tickets receive selector, key ID and legacy hash;
- legacy hashes equal SHA-256 of the former value without retaining it;
- no raw `secureToken` remains;
- selector/hash uniqueness and partial-state constraints fail closed;
- all migrations apply from empty state; and
- local migration status is current.

### End-to-end Ticket behaviour

- successful Payment status/confirmation returns a working current Ticket link;
- POS and reschedule replacement Tickets return working current credentials;
- current and migrated legacy URLs render only the correct Ticket;
- current and migrated legacy QR codes scan correctly;
- new QR output encodes only the current format;
- bad MAC, malformed, unknown, cancelled, replaced, wrong-Event and
  already-scanned cases remain correct;
- simultaneous scan still grants entry exactly once;
- credential rotation invalidates both the previous current credential and
  legacy hash while preserving Ticket/Payment/Booking evidence;
- foreign/unassigned users cannot rotate or inspect the Ticket; and
- STAFF/SCANNER cannot invoke credential rotation.

### Regression

- complete API and web suites;
- API and web production builds;
- release, tenant-isolation, tracked-secret and local-restore gates;
- Ticket adjustment/refund and reschedule replacement regressions;
- public Booking confirmation and walk-up POS regressions; and
- browser acceptance of one online Ticket, one migrated legacy Ticket, one
  rotated Ticket and automatic Gate Entry.

## Documentation

Update:

- `docs/security/SECURITY_AND_PRIVACY_FINDINGS.md`;
- `docs/security/API_ENDPOINT_REGISTER.md`;
- `docs/architecture/SECURITY_PRIVACY_AND_COMPLIANCE.md`;
- `docs/architecture/AUTHENTICATION_AND_PERMISSIONS.md` where possession
  authority is described;
- `docs/operations/ENVIRONMENT_AND_SECRETS_CONTRACT.md`;
- `docs/operations/STAFF_SCANNER_RUNBOOK.md`;
- `docs/operations/PRODUCTION_CHECKLIST.md`;
- `docs/privacy/PRIVACY_DATA_FLOW_RETENTION_AND_DELETION_REGISTER.md`;
- `docs/roadmap/PILOT_READINESS_AND_STRATEGIC_ROADMAP.md` only after delivery;
- `docs/CHANGELOG.md`; and
- `docs/sprint-notes/sprint-32.md` at closeout.

## Protected foundations

Sprint 32 must not change:

- Ticket number semantics or participant/Booking ownership;
- Ticket `ACTIVE`, `SCANNED` and `CANCELLED` authority;
- shared Session capacity or Product/Variant inventory;
- Payment confirmation and Ticket-issuance eligibility;
- reschedule replacement and adjustment/refund evidence;
- Gate Entry versus Ticket Lookup operating modes;
- entry-window rules or atomic one-entry behaviour;
- tenant, role and Event-assignment authority;
- Waiver or Booking possession-token formats; or
- the public booking UX beyond accepting the new opaque Ticket link.

## Explicit exclusions

- privileged MFA or password recovery;
- customer accounts or a broad customer portal;
- changes to Waiver/Booking possession credentials;
- offline scanner architecture;
- new scanner/POS visual design;
- cloud key management or paid secret storage;
- production deployment, domain or infrastructure provisioning;
- legal retention implementation;
- independent penetration testing; and
- any real customer, live Payment or live Event data.

## Exit gate

Sprint 32 closes only when:

1. no usable current Ticket credential is stored in PostgreSQL;
2. a database copy without the application signing key cannot construct a
   current credential;
3. all Ticket presentation and admission paths use one reviewed credential
   authority;
4. existing local 64-hex Tickets work through one-way legacy hashes;
5. current and old credentials fail after authorised rotation;
6. atomic scanning, role/tenant/Event boundaries and commerce evidence remain
   green;
7. the complete release, migration, isolation, restore and secret gates pass;
8. `SEC-31-009` has closure evidence; and
9. documentation accurately distinguishes local cryptographic proof from
   future managed-key deployment evidence.

## Recommended sequence

1. Lock this plan and commit it before implementation.
2. Add credential-authority unit tests and production configuration validation.
3. Add the forward-only schema/data migration and raw-value verification.
4. Refactor issuance and response mapping.
5. Refactor public/operator lookup, QR, access control and scanner admission.
6. Add controlled rotation and audit evidence.
7. Run focused, full, release, isolation, restore and browser acceptance.
8. Close the finding, update the roadmap and complete Sprint 32 documentation.

## Next security sequence

After Sprint 32, the recommended dedicated security Sprint is privileged MFA
enrolment/challenge/recovery-code authority for OWNER and MANAGER. Email-based
password recovery should remain blocked until an approved delivery provider and
account ownership exist.
