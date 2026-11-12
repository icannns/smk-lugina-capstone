/** Intentionally strict guard for the seed and destructive/fixture DB tests. */
export function requireDevelopmentDatabase(environment: Readonly<Record<string, string | undefined>>) {
  if (!["development", "test"].includes(environment.NODE_ENV ?? "") || environment.ALLOW_DEV_SEED !== "true")
    throw new Error("Development database operation refused: explicit non-production opt-in required.");
  let url: URL;
  try { url = new URL(environment.DATABASE_URL ?? ""); }
  catch { throw new Error("Development database operation refused: invalid DATABASE_URL."); }
  const name = decodeURIComponent(url.pathname.slice(1));
  const allowedName = /^bojong_united_(dev|test)(_[a-z0-9]+)*$/;
  if (!["postgres:", "postgresql:"].includes(url.protocol) ||
      !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
      !allowedName.test(name) ||
      !url.username || !url.password || url.password.includes("REPLACE") ||
      (url.searchParams.has("schema") && url.searchParams.get("schema") !== "public") ||
      [...url.searchParams.keys()].some((key) => !["schema", "sslmode", "connection_limit", "connect_timeout"].includes(key)))
    throw new Error("Development database operation refused: use an explicitly named local bojong_united_dev/test database.");
  return { connectionString: url.toString(), databaseName: name };
}
