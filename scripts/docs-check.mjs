import { access } from "node:fs/promises";
import { constants } from "node:fs";

const requiredDocs = [
  "docs/deployment-guide.md",
  "docs/database-migration-strategy.md",
  "docs/backup-strategy.md",
  "docs/logging-monitoring-error-tracking.md",
  "docs/security-hardening.md",
  "docs/performance-optimization.md",
  "docs/testing-checklist.md",
  "docs/api-documentation.md",
  "docs/release-notes-v1.0.0.md",
];

async function main() {
  const missing = [];

  for (const filePath of requiredDocs) {
    try {
      await access(filePath, constants.F_OK);
    } catch {
      missing.push(filePath);
    }
  }

  if (missing.length > 0) {
    console.error("Missing required documentation files:");
    for (const item of missing) {
      console.error(`- ${item}`);
    }
    process.exit(1);
  }

  console.log("Documentation check passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
