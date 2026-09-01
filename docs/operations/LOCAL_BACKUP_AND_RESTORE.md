# Local Backup and Restore Drill

## Purpose

Sprint 31 requires evidence that Glacier's PostgreSQL data can be backed up and restored without risking the working local database or claiming that a local drill proves future managed-cloud recovery.

From the project root, with local PostgreSQL running, execute:

```bash
npm run verify:restore
```

## Safety boundary

The drill:

- refuses any database host other than `localhost`, `127.0.0.1` or `::1`;
- reads `DATABASE_URL` from the process or `apps/api/.env` without printing its credential;
- creates a uniquely named `glacier_restore_*` database;
- never drops, resets, seeds or writes to the configured source database;
- restores a custom-format archive without source ownership or privileges;
- removes only the uniquely named restore target and temporary archive; and
- exits on the first backup, restore, query or integrity failure.

Do not rename or weaken the local-host and temporary-target checks. Do not run development migrations or seed operations as part of a recovery drill.

## Integrity evidence

After restore, the drill compares row counts between the source and restored databases for:

- Organisations and Events;
- Bookings, Payments and Payment Refunds;
- Tickets;
- Products and Product Variants;
- Event Waivers and Waiver Submissions; and
- Prisma migration history.

Matching counts are a bounded structural check, not full semantic verification or corruption detection. A funded staging exercise must add application smoke tests, object-storage recovery and provider-managed backup evidence.

## Recovery measurements

The command reports the UTC snapshot start, archive size, backup duration, restore duration and number of matched critical tables. These are local development measurements only. They do not establish the proposed production RPO of 15 minutes or RTO of four supported hours.

## Recorded Sprint 31 evidence

The first controlled drill passed on 1 September 2026 (Australia/Melbourne):

| Evidence                              |                                      Result |
| ------------------------------------- | ------------------------------------------: |
| Source                                | Local `project_glacier` PostgreSQL database |
| Snapshot start                        |                  `2026-08-31T23:54:43.109Z` |
| Custom archive size                   |                                    0.26 MiB |
| Backup duration                       |                                0.81 seconds |
| Restore duration                      |                                3.52 seconds |
| Critical tables compared              |                                  11 matched |
| Temporary restore databases remaining |                                           0 |
| Non-local-host refusal check          |                                      Passed |

The restored database was used only for integrity comparison and then removed. This evidence confirms that the repository procedure worked against the current local dataset; it is not carried forward as evidence for a later staging or production dataset.

## Future managed recovery gate

Before live use, Glacier must separately prove:

1. encrypted automated database backups in the approved Australian region;
2. configured retention and point-in-time recovery;
3. an isolated managed restore using a named recovery operator;
4. recovered application and migration compatibility;
5. object-storage versioning and recovery for required Event/Waiver assets;
6. measured recovery against approved RPO/RTO values; and
7. recorded evidence, incident escalation and destructive-action approval.
