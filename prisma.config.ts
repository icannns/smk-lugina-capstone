import "dotenv/config";
import { defineConfig } from "prisma/config";

const needsUrl = process.argv.some((value) => ["migrate", "db"].includes(value)) &&
  !process.argv.some((value) => ["--help", "-h"].includes(value));
if (needsUrl && !process.env.DATABASE_URL)
  throw new Error("Set DATABASE_URL explicitly before migration or seed commands. No default database is used.");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // Generation and frontend builds do not require a running database or secret.
  // Migration commands fail without an explicit URL; there is no fallback target.
  datasource: { url: process.env.DATABASE_URL, shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL },
});
