import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const projectRoot = new URL("../", import.meta.url);
const scannerPath = "scripts/verify-tracked-secrets.mjs";
const allowNextLineMarker = "secret-scan: allow-next-line -- ";
const rules = [
  {
    name: "private key material",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  },
  {
    name: "AWS access key",
    pattern: /\bAKIA[0-9A-Z]{16}\b/,
  },
  {
    name: "GitHub access token",
    pattern: /\bgh[pousr]_[A-Za-z0-9]{30,}\b/,
  },
  {
    name: "OpenAI API key",
    pattern: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/,
  },
  {
    name: "Stripe live or webhook secret",
    pattern: /\b(?:sk|rk)_live_[A-Za-z0-9]{16,}\b|\bwhsec_[A-Za-z0-9]{16,}\b/,
  },
  {
    name: "credential-bearing PostgreSQL URL",
    pattern: /postgres(?:ql)?:\/\/[^:\s/]+:[^@\s/]+@/i,
  },
];

const trackedFilesResult = spawnSync("git", ["ls-files", "-z"], {
  cwd: projectRoot,
  encoding: "utf8",
});

if (trackedFilesResult.error) throw trackedFilesResult.error;
if (trackedFilesResult.status !== 0) {
  throw new Error("Unable to enumerate Git-tracked files");
}

const findings = [];
const trackedFiles = trackedFilesResult.stdout.split("\0").filter(Boolean);

for (const relativePath of trackedFiles) {
  // The scanner contains its own detection expressions, so it cannot scan itself.
  if (relativePath === scannerPath) continue;

  let contents;
  try {
    contents = readFileSync(new URL(relativePath, projectRoot), "utf8");
  } catch {
    continue;
  }

  if (contents.includes("\0")) continue;

  let allowNextLine = false;
  contents.split(/\r?\n/).forEach((line, index) => {
    if (line.includes(allowNextLineMarker)) {
      allowNextLine = true;
      return;
    }

    if (allowNextLine) {
      allowNextLine = false;
      return;
    }

    for (const rule of rules) {
      if (rule.pattern.test(line)) {
        findings.push({
          path: relativePath,
          line: index + 1,
          rule: rule.name,
        });
      }
    }
  });
}

if (findings.length > 0) {
  console.error("Potential secret material was found in tracked files:");
  for (const finding of findings) {
    // Report location and rule only. Never reproduce the matching value.
    console.error(`${finding.path}:${finding.line} (${finding.rule})`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `Tracked-secret scan passed (${trackedFiles.length - 1} files checked, ${rules.length} rules)`,
  );
}
