import { createHmac } from "node:crypto";
import { getDatabase } from "../db";

export async function consumeAuthLimit(action: "login" | "register", identifier: string, request: Request) {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("Authentication configuration is unavailable.");
  // Forwarded headers are accepted only behind an explicitly configured sanitizing proxy.
  const ip = process.env.AUTH_TRUST_PROXY_HEADERS === "true"
    ? (request.headers.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 128) || "unknown") : "untrusted-network";
  const buckets = [
    { value: `${action}:identifier:${identifier}`, maximum: action === "login" ? 10 : 5 },
    { value: `${action}:network:${ip}`, maximum: ip === "untrusted-network" ? 200 : 50 },
  ];
  const database = getDatabase();
  let allowed = true;
  for (const bucket of buckets) {
    const key = createHmac("sha256", secret).update(bucket.value).digest("hex");
    const rows = await database.$queryRaw<{ attempts: number }[]>`
      INSERT INTO "AuthRateLimit" ("key", "attempts", "windowEndsAt")
      VALUES (${key}, 1, CURRENT_TIMESTAMP + INTERVAL '15 minutes')
      ON CONFLICT ("key") DO UPDATE SET
        "attempts" = CASE WHEN "AuthRateLimit"."windowEndsAt" <= CURRENT_TIMESTAMP THEN 1 ELSE "AuthRateLimit"."attempts" + 1 END,
        "windowEndsAt" = CASE WHEN "AuthRateLimit"."windowEndsAt" <= CURRENT_TIMESTAMP THEN CURRENT_TIMESTAMP + INTERVAL '15 minutes' ELSE "AuthRateLimit"."windowEndsAt" END
      RETURNING "attempts"`;
    if (rows[0].attempts > bucket.maximum) allowed = false;
  }
  return allowed;
}

export async function clearSuccessfulLoginLimit(identifier: string) {
  const key = createHmac("sha256", process.env.AUTH_SECRET!).update(`login:identifier:${identifier}`).digest("hex");
  await getDatabase().authRateLimit.deleteMany({ where: { key } });
}
