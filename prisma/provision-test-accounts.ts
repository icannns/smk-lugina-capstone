import "dotenv/config";
import { requireDevelopmentDatabase } from "./development-safety";
import { seedDevelopmentData } from "./seed-data";
import { createDatabaseClient } from "../src/server/db/client";
import { hashPassword } from "../src/server/auth/password";
import { registrationPasswordError } from "../src/lib/auth/validation";
async function main() {
  const target = requireDevelopmentDatabase(process.env);
  if (process.env.ALLOW_DEV_ACCOUNT_PROVISION !== "true") throw new Error("Explicit account provisioning opt-in required.");
  const definitions = [
    ["teacher-rina", "TEACHER", process.env.TEST_TEACHER_PASSWORD],
    ["student-dimas", "STUDENT", process.env.TEST_DIMAS_PASSWORD],
    ["student-aisyah", "STUDENT", process.env.TEST_AISYAH_PASSWORD],
  ] as const;
  for (const [, , password] of definitions)
    if (!password || password.length < 12 || password.length > 128 || registrationPasswordError(password))
      throw new Error("All three tester passwords must meet the documented requirements.");
  const passwordCount = new Set(definitions.map((entry) => entry[2])).size;
  const connection = new URL(target.connectionString);
  const allowSharedDockerPassword = process.env.BOJONG_DOCKER_SHARED_DEMO === "true" &&
    process.env.NODE_ENV === "test" && target.databaseName === "bojong_united_test_docker" &&
    connection.hostname === "127.0.0.1" && connection.port === "5432" && connection.username === "bojong_local";
  if (passwordCount !== 3 && !(allowSharedDockerPassword && passwordCount === 1)) {
    throw new Error("Tester passwords must differ outside shared Docker demo mode.");
  }
  const database = createDatabaseClient(target.connectionString);
  try {
    await seedDevelopmentData(database);
    for (const [id, role, password] of definitions) {
      const user = await database.user.findUniqueOrThrow({ where: { id } });
      if (!user.isDemo || user.role !== role || user.disabledAt) throw new Error("Reserved account ownership is invalid.");
      if (user.passwordHash) continue; // Idempotent; never rotate existing tester credentials implicitly.
      const passwordHash = await hashPassword(password!);
      await database.user.updateMany({ where: { id, isDemo: true, role, passwordHash: null, disabledAt: null }, data: { passwordHash, passwordChangedAt: new Date() } });
    }
    console.log("Development test accounts provisioned or preserved. No passwords are logged.");
  } finally { await database.$disconnect(); }
}
main().catch(() => {
  console.error("Test account provisioning refused/failed. Check development opt-ins, password requirements, local DB and fixture ownership. No credentials are logged.");
  process.exitCode = 1;
});
