# Sprint 32 — Ticket Possession-Credential Hardening

## Outcome

Sprint 32 closes `SEC-31-009` at the local application and database boundary.
A copied PostgreSQL database no longer contains the bearer value required to
construct a current Ticket link or QR code.

Current credentials use `gt1_<selector>_<mac>`. The random selector supports an
indexed lookup; the HMAC binds the Ticket ID, selector and recorded key ID to a
separately configured 256-bit signing key. Production starts fail closed when
the bounded key ring is absent or invalid. The stable default is development
only.

Existing 64-character local credentials remain temporarily usable through a
SHA-256 hash. The migration populated selectors/key IDs/hashes, cleared all raw
values and added a database check that prevents them being stored again. Every
successful presentation now emits the current format.

OWNER and Event-authorised MANAGER may reissue a credential. The transaction
uses optimistic selector/key/hash matching, installs a fresh selector under the
active key, clears legacy acceptance and records actor, Organisation, Event,
Ticket, old/new key IDs and time. It records no credential, selector, hash,
Ticket number or customer/participant identity. STAFF and SCANNER are denied at
both controller and service boundaries.

## Verification

- API: 89 suites and 622 tests passed.
- Web: 30 files and 88 tests passed.
- API and web production builds passed.
- All 47 migrations are current and replayed successfully from an empty database.
- Disposable authenticated tenant/role isolation passed 5 of 5 checks.
- The tracked-secret scan passed across 613 files and 6 rules.
- The complete local release gate passed.
- Isolated PostgreSQL backup/restore matched all 12 critical tables; the 0.27 MiB archive completed in 2.52 seconds and restored in 1.41 seconds.
- Browser acceptance proved the migrated legacy and current signed links rendered the correct fictional Ticket before rotation; after authorised rotation both former links returned the same safe unavailable response, the newly issued link rendered correctly, and no browser errors were recorded.

## Remaining boundary

This is local cryptographic and application evidence, not proof of production
key custody or independent penetration resistance. Before internet/live use,
Glacier still requires approved managed secret storage, a rehearsed key-rotation
procedure, legacy-hash retirement evidence, deployed-origin/device acceptance,
central monitoring and independent security review. The recommended next
no-spend security Sprint is privileged MFA for OWNER and MANAGER.
