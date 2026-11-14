import "dotenv/config";
import { requireDevelopmentDatabase } from "./development-safety";
import { DEVELOPMENT_SEED_ID, seedDevelopmentData } from "./seed-data";
import { createDatabaseClient } from "../src/server/db/client";
import { demoEvents } from "../src/lib/guru/demo-events";
import { legacyDemoTitle } from "./demo-event-content";

async function main() {
  const target = requireDevelopmentDatabase(process.env);
  const database = createDatabaseClient(target.connectionString);
  const apply = process.argv.includes("--apply");
  try {
    if (!await database.developmentSeed.findUnique({ where: { id: DEVELOPMENT_SEED_ID } }))
      throw new Error("Existing development fixture marker required.");
    const teacher = await database.teacherProfile.findUnique({ where: { id: "rina" }, include: { user: true } });
    if (!teacher?.user.isDemo || teacher.userId !== "teacher-rina") throw new Error("Reserved demo owner mismatch.");
    const events = await database.event.findMany({ where: { ownerTeacherId: teacher.id } });
    const changes = events.flatMap((event) => {
      const title = legacyDemoTitle(event);
      return title ? [{ id: event.id, before: event.title, title }] : [];
    });
    console.log(JSON.stringify({ apply, missingDemoEvents: demoEvents.filter((event) => !events.some((existing) => existing.id === event.id)).map((event) => event.title), changes }, null, 2));
    if (!apply) return;
    await database.$transaction(async (tx) => {
      for (const change of changes) {
        // Compare-and-set preserves content edited after the preview was collected.
        const result = await tx.event.updateMany({ where: { id: change.id, ownerTeacherId: teacher.id, title: change.before }, data: { title: change.title } });
        if (result.count !== 1) throw new Error("Demo content changed concurrently; retry after review.");
      }
    });
    await seedDevelopmentData(database);
    console.log("Demo content ready. Existing event IDs, enrollments, submissions and assessments retained.");
  } finally { await database.$disconnect(); }
}

main().catch(() => {
  console.error("Demo content refresh refused/failed. Check local development opt-ins and fixture ownership. No credentials are logged.");
  process.exitCode = 1;
});
