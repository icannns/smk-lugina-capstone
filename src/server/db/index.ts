import "server-only";
import { createDatabaseClient } from "./client";

const globalDatabase = globalThis as unknown as {
  bojongDatabase?: ReturnType<typeof createDatabaseClient>;
};

/** Lazy: frontend builds need neither database credentials nor a connection. */
export function getDatabase() {
  if (globalDatabase.bojongDatabase) return globalDatabase.bojongDatabase;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured.");
  const database = createDatabaseClient(url);
  globalDatabase.bojongDatabase = database;
  return database;
}
