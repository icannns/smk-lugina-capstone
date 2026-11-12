import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

/** Factory for CLI/tests and the server-only wrapper; never imported by UI code. */
export function createDatabaseClient(connectionString: string) {
  if (!connectionString) throw new Error("DATABASE_URL is required for database access.");
  const adapter = new PrismaPg({ connectionString, max: 5 });
  return new PrismaClient({ adapter });
}
