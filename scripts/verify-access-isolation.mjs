import { readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = new URL("../", import.meta.url);
const apiDirectory = new URL("apps/api/", projectRoot);
const envPath = new URL("apps/api/.env", projectRoot);
const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);

function readDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const line = readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith("DATABASE_URL="));
  if (!line) throw new Error("DATABASE_URL was not found in apps/api/.env");

  return line
    .slice(line.indexOf("=") + 1)
    .trim()
    .replace(/^(['"])(.*)\1$/, "$2");
}

function run(binary, args, environment) {
  const result = spawnSync(binary, args, {
    cwd: apiDirectory,
    env: environment,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${binary} exited with status ${result.status}`);
  }
}

const sourceUrl = new URL(readDatabaseUrl());
if (!localHosts.has(sourceUrl.hostname)) {
  throw new Error("Refusing to run isolation verification on a non-local host");
}

const temporaryDatabase = `glacier_isolation_${process.pid}_${Date.now()}`.slice(
  0,
  63,
);
if (!/^glacier_isolation_[0-9_]+$/.test(temporaryDatabase)) {
  throw new Error("Refusing to use an unexpected temporary database name");
}

const pgBin = process.env.PG_BIN ?? "/Library/PostgreSQL/18/bin";
const connectionArgs = [
  "-h",
  sourceUrl.hostname,
  "-p",
  sourceUrl.port || "5432",
  "-U",
  decodeURIComponent(sourceUrl.username),
];
const environment = {
  ...process.env,
  PGPASSWORD: decodeURIComponent(sourceUrl.password),
};
const isolatedUrl = new URL(sourceUrl);
isolatedUrl.pathname = `/${temporaryDatabase}`;
const testEnvironment = {
  ...environment,
  DATABASE_URL: isolatedUrl.toString(),
  JWT_SECRET: "glacier-local-isolation-test-secret-31",
  NODE_ENV: "test",
};
let created = false;

try {
  console.log(`Creating isolated access-control database ${temporaryDatabase}`);
  run(
    join(pgBin, "createdb"),
    [...connectionArgs, "--maintenance-db=postgres", temporaryDatabase],
    environment,
  );
  created = true;

  console.log("Applying the committed database migrations");
  run("npx", ["prisma", "migrate", "deploy"], testEnvironment);

  console.log("Exercising login, tenant boundaries, and role boundaries");
  run(
    "npm",
    [
      "test",
      "--",
      "--config",
      "./test/jest-e2e.json",
      "access-isolation.e2e-spec.ts",
      "--runInBand",
    ],
    testEnvironment,
  );

  console.log("Tenant and role isolation verification passed");
} finally {
  if (created) {
    console.log(`Removing isolated access-control database ${temporaryDatabase}`);
    run(
      join(pgBin, "dropdb"),
      [
        ...connectionArgs,
        "--maintenance-db=postgres",
        "--if-exists",
        temporaryDatabase,
      ],
      environment,
    );
  }
}
