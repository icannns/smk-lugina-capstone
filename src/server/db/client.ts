import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

/** Factory for CLI/tests and the server-only wrapper; never imported by UI code. */
export function createDatabaseClient(connectionString: string) {
  if (!connectionString) throw new Error("DATABASE_URL is required for database access.");
  // Prisma's pg adapter expects UTC when decoding PostgreSQL timestamptz.
  // Set this on each app connection so session expiry and deadlines use the stored instant.
  const url = new URL(connectionString);
  const startupOptions = url.searchParams.get("options") ?? process.env.PGOPTIONS ?? "";
  url.searchParams.set("options", [startupOptions, "-c timezone=UTC"].filter(Boolean).join(" "));
  const adapter = new PrismaPg({ connectionString: url.toString(), max: 5 });
  return new PrismaClient({ adapter });
}
