import "dotenv/config";
import { createDatabaseClient } from "../src/server/db/client";
import { storageFor } from "../src/server/files/storage";
async function main() {
  const database = createDatabaseClient(process.env.DATABASE_URL ?? "");
  const apply = process.argv.includes("--apply"),
    cutoff = new Date();
  try {
    const candidates = await database.submissionUpload.findMany({
      where: {
        attachments: { none: {} },
        OR: [
          { cleanupNeeded: true },
          { status: { in: ["READY", "UPLOADING"] }, expiresAt: { lt: cutoff } },
        ],
      },
      take: 100,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    let cleaned = 0,
      failed = 0;
    for (const row of candidates) {
      if (!apply) continue;
      try {
        const claimed = await database.$transaction(
          async (tx) => {
            await tx.$queryRaw`SELECT id FROM "Enrollment" WHERE "eventId"=${row.eventId} AND "studentId"=${row.studentId} FOR UPDATE`;
            const current = await tx.submissionUpload.findUnique({
              where: { id: row.id },
              include: { _count: { select: { attachments: true } } },
            });
            if (
              !current ||
              current._count.attachments ||
              (!current.cleanupNeeded && current.expiresAt >= cutoff)
            )
              return false;
            await tx.submissionUpload.update({
              where: { id: row.id },
              data: { status: "DELETING", cleanupNeeded: true },
            });
            const tuple = {
              eventId: row.eventId,
              studentId: row.studentId,
              milestoneId: row.milestoneId,
            };
            const draft = await tx.submissionDraft.findUnique({
              where: { eventId_studentId_milestoneId: tuple },
            });
            if (draft && Array.isArray(draft.files))
              await tx.submissionDraft.update({
                where: { eventId_studentId_milestoneId: tuple },
                data: {
                  files: draft.files.filter(
                    (f) =>
                      f &&
                      typeof f === "object" &&
                      !Array.isArray(f) &&
                      f.id !== row.id,
                  ),
                },
              });
            return true;
          },
          { isolationLevel: "Serializable" },
        );
        if (!claimed) continue;
        const storage = storageFor();
        if (
          storage.backend !== row.storageBackend ||
          storage.namespace !== row.storageNamespace
        )
          throw new Error("Storage namespace differs");
        await storage.remove(row.storageKey);
        await database.submissionUpload.update({
          where: { id: row.id },
          data: { status: "DELETED", cleanupNeeded: false },
        });
        cleaned++;
      } catch {
        failed++;
      }
    }
    console.log(
      JSON.stringify({
        mode: apply ? "apply" : "dry-run",
        candidates: candidates.length,
        cleaned,
        failed,
      }),
    );
    if (failed) process.exitCode = 1;
  } finally {
    await database.$disconnect();
  }
}
main().catch(() => {
  console.error(
    "Cleanup gagal. Periksa konfigurasi privat dan database; tidak ada detail kredensial ditampilkan.",
  );
  process.exitCode = 1;
});
