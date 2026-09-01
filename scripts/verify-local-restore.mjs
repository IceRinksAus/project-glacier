import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = new URL("../", import.meta.url);
const envPath = new URL("apps/api/.env", projectRoot);
const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
const criticalTables = [
  "Organization",
  "Event",
  "Booking",
  "Payment",
  "PaymentRefund",
  "Ticket",
  "Product",
  "ProductVariant",
  "EventWaiver",
  "WaiverSubmission",
  "_prisma_migrations",
];

function readDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const line = readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith("DATABASE_URL="));

  if (!line) {
    throw new Error(
      "DATABASE_URL is not set and was not found in apps/api/.env",
    );
  }

  return line
    .slice(line.indexOf("=") + 1)
    .trim()
    .replace(/^(['"])(.*)\1$/, "$2");
}

function run(binary, args, environment, capture = false) {
  const result = spawnSync(binary, args, {
    env: environment,
    encoding: "utf8",
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    const detail = capture ? result.stderr.trim() : "";
    throw new Error(
      `${binary} exited with status ${result.status}${detail ? `: ${detail}` : ""}`,
    );
  }

  return capture ? result.stdout.trim() : "";
}

function countsFor(database, connectionArgs, environment, psql) {
  const query = criticalTables
    .map(
      (table) =>
        `SELECT '${table}' AS table_name, COUNT(*)::text AS row_count FROM "${table}"`,
    )
    .join(" UNION ALL ");
  const output = run(
    psql,
    [
      ...connectionArgs,
      "-d",
      database,
      "-v",
      "ON_ERROR_STOP=1",
      "-At",
      "-F",
      "|",
      "-c",
      query,
    ],
    environment,
    true,
  );

  return new Map(
    output
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [table, count] = line.split("|");
        return [table, Number(count)];
      }),
  );
}

const databaseUrl = new URL(readDatabaseUrl());
if (
  databaseUrl.protocol !== "postgresql:" &&
  databaseUrl.protocol !== "postgres:"
) {
  throw new Error("The restore drill requires a PostgreSQL DATABASE_URL");
}
if (!localHosts.has(databaseUrl.hostname)) {
  throw new Error(
    "Refusing to run the local restore drill against a non-local database host",
  );
}

const sourceDatabase = decodeURIComponent(databaseUrl.pathname.slice(1));
if (!/^[A-Za-z0-9_-]+$/.test(sourceDatabase)) {
  throw new Error(
    "The configured local database name contains unsupported characters",
  );
}

const pgBin = process.env.PG_BIN ?? "/Library/PostgreSQL/18/bin";
const pgDump = join(pgBin, "pg_dump");
const pgRestore = join(pgBin, "pg_restore");
const createDb = join(pgBin, "createdb");
const dropDb = join(pgBin, "dropdb");
const psql = join(pgBin, "psql");
const connectionArgs = [
  "-h",
  databaseUrl.hostname,
  "-p",
  databaseUrl.port || "5432",
  "-U",
  decodeURIComponent(databaseUrl.username),
];
const environment = {
  ...process.env,
  PGPASSWORD: decodeURIComponent(databaseUrl.password),
};
const temporaryDatabase = `glacier_restore_${process.pid}_${Date.now()}`.slice(
  0,
  63,
);
const temporaryDirectory = mkdtempSync(join(tmpdir(), "glacier-restore-"));
const archivePath = join(temporaryDirectory, "glacier.dump");
let temporaryDatabaseCreated = false;

try {
  console.log(`Creating a local backup of ${sourceDatabase}`);
  const backupStartedAt = new Date();
  const backupStart = performance.now();
  run(
    pgDump,
    [
      ...connectionArgs,
      "-d",
      sourceDatabase,
      "--format=custom",
      "--no-owner",
      "--no-privileges",
      "-f",
      archivePath,
    ],
    environment,
  );
  const backupSeconds = (performance.now() - backupStart) / 1000;

  console.log(`Creating isolated restore target ${temporaryDatabase}`);
  run(
    createDb,
    [...connectionArgs, "--maintenance-db=postgres", temporaryDatabase],
    environment,
  );
  temporaryDatabaseCreated = true;

  const restoreStart = performance.now();
  run(
    pgRestore,
    [
      ...connectionArgs,
      "-d",
      temporaryDatabase,
      "--no-owner",
      "--no-privileges",
      "--exit-on-error",
      archivePath,
    ],
    environment,
  );
  const restoreSeconds = (performance.now() - restoreStart) / 1000;

  const sourceCounts = countsFor(
    sourceDatabase,
    connectionArgs,
    environment,
    psql,
  );
  const restoredCounts = countsFor(
    temporaryDatabase,
    connectionArgs,
    environment,
    psql,
  );
  const mismatches = criticalTables.filter(
    (table) => sourceCounts.get(table) !== restoredCounts.get(table),
  );

  if (mismatches.length > 0) {
    throw new Error(
      `Critical-table count mismatch after restore: ${mismatches.join(", ")}`,
    );
  }

  console.log("Local backup and isolated restore passed");
  console.log(`Snapshot started: ${backupStartedAt.toISOString()}`);
  console.log(
    `Backup archive: ${(statSync(archivePath).size / 1024 / 1024).toFixed(2)} MiB`,
  );
  console.log(`Backup duration: ${backupSeconds.toFixed(2)} seconds`);
  console.log(`Restore duration: ${restoreSeconds.toFixed(2)} seconds`);
  console.log(
    `Integrity comparison: ${criticalTables.length} critical tables matched`,
  );
} finally {
  if (temporaryDatabaseCreated) {
    console.log(`Removing isolated restore target ${temporaryDatabase}`);
    run(
      dropDb,
      [
        ...connectionArgs,
        "--maintenance-db=postgres",
        "--if-exists",
        temporaryDatabase,
      ],
      environment,
    );
  }
  if (!temporaryDirectory.startsWith(join(tmpdir(), "glacier-restore-"))) {
    throw new Error("Refusing to remove an unexpected temporary path");
  }
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
