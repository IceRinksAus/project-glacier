# Tenant and role isolation verification

## Purpose

`npm run verify:isolation` proves Glacier's core authenticated access boundaries
through the real Nest application, JWT login flow, guards, services, Prisma
queries, and a newly migrated PostgreSQL database.

The check covers:

- an owner can list both events belonging to their organisation;
- an owner receives the same `404 Event not found` response for another
  organisation's event that they receive for an inaccessible event;
- restricted staff can list and open only explicitly assigned events; and
- scanner credentials receive `403 Forbidden` on ordinary event
  administration routes, even when assigned to that event; and
- repeated login attempts from one trusted source receive a generic `429` after
  the application safety threshold, with retry evidence and no account detail.

## Data safety

The verifier accepts only a PostgreSQL connection on `localhost`, `127.0.0.1`,
or `::1`. It creates a uniquely named `glacier_isolation_*` database, applies
the committed migrations, inserts synthetic `.invalid` test identities, runs
the checks, and drops that exact temporary database in a `finally` block.

It does not seed, truncate, migrate, or otherwise change the configured Glacier
development database. A failed test still triggers removal of the isolated
database.

The API closes its Prisma connection when Nest shuts down, so verification,
container replacement, and controlled application stops do not leave database
connections lingering unnecessarily.

## Running the check

From the repository root, with local PostgreSQL running:

```bash
npm run verify:isolation
```

The command fails closed if the configured database host is not local. A pass
is evidence for the tested boundaries; it does not replace route-by-route
authorisation review, production penetration testing, or database-level row
security should Glacier adopt it later.
