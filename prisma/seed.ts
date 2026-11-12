import "dotenv/config";
import { requireDevelopmentDatabase } from "./development-safety";
import { seedDevelopmentData } from "./seed-data";
import { createDatabaseClient } from "../src/server/db/client";

async function main() {
  const { connectionString } = requireDevelopmentDatabase(process.env);
  const database = createDatabaseClient(connectionString);
  try { console.log("Development-only fictional fixtures ready:", await seedDevelopmentData(database)); }
  finally { await database.$disconnect(); }
}

main().catch(() => {
  // Never print Prisma connection errors that may contain connection details.
  console.error("Development seed failed. Check the local opt-in, database target, migrations and fixture ownership. No credentials are logged.");
  process.exitCode = 1;
});
