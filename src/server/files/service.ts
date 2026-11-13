import "server-only";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { z } from "zod";
import type { Principal } from "../auth/principal";
import type { SubmissionUpload } from "../../generated/prisma/client";
import { getDatabase } from "../db";
import { AuthorizationError } from "../auth/authorization";
import {
  transaction,
  fail,
  id,
  asJson,
  type Transaction,
} from "../domain/common";
import {
  assertEditable,
  lockEnrollment,
  studentTuple,
  type LearningTuple,
} from "./permissions";
import { storageFor } from "./storage";
import { validateFile, uploadForm, allowedByMilestone } from "./validation";
import type { EventAttachment } from "../../lib/guru/event-types";

export function uploadDto(
  row: Pick<
    SubmissionUpload,
    "id" | "originalName" | "contentType" | "sizeBytes" | "checksum"
  >,
): EventAttachment {
  return {
    id: row.id,
    name: row.originalName,
    type: row.contentType,
    size: Number(row.sizeBytes),
    checksum: row.checksum,
    uploaded: true,
    downloadUrl: `/api/attachments/${encodeURIComponent(row.id)}/download`,
    ...(["application/pdf", "image/png", "image/jpeg"].includes(row.contentType)
      ? { previewUrl: `/api/attachments/${encodeURIComponent(row.id)}/preview` }
      : {}),
  };
}
async function rateLimit(userId: string, action: "upload" | "download") {
  const maximum = Number(
    process.env[
      action === "upload"
        ? "FILE_UPLOADS_PER_MINUTE"
        : "FILE_DOWNLOADS_PER_MINUTE"
    ] ?? (action === "upload" ? 30 : 60),
  );
  if (!Number.isSafeInteger(maximum) || maximum < 1 || maximum > 1000)
    throw new Error("Invalid file request limit");
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("Missing authentication configuration");
  const key = createHmac("sha256", secret)
    .update(`file:${action}:${userId}`)
    .digest("hex");
  const rows = await getDatabase().$queryRaw<
    { attempts: number }[]
  >`INSERT INTO "AuthRateLimit" (key,attempts,"windowEndsAt") VALUES (${key},1,CURRENT_TIMESTAMP+INTERVAL '1 minute') ON CONFLICT (key) DO UPDATE SET attempts=CASE WHEN "AuthRateLimit"."windowEndsAt"<=CURRENT_TIMESTAMP THEN 1 ELSE "AuthRateLimit".attempts+1 END,"windowEndsAt"=CASE WHEN "AuthRateLimit"."windowEndsAt"<=CURRENT_TIMESTAMP THEN CURRENT_TIMESTAMP+INTERVAL '1 minute' ELSE "AuthRateLimit"."windowEndsAt" END RETURNING attempts`;
  if (rows[0].attempts > maximum)
    fail(
      "Terlalu banyak permintaan file. Coba lagi sebentar.",
      429,
      "FILE_RATE_LIMIT",
    );
}
function matchingStorage(row: SubmissionUpload) {
  const store = storageFor();
  if (
    store.backend !== row.storageBackend ||
    store.namespace !== row.storageNamespace
  )
    throw new Error("Storage configuration differs from object namespace");
  return store;
}
export async function submissionTuple(user: Principal, submissionId: string) {
  id.parse(submissionId);
  const s = await getDatabase().submission.findUnique({
    where: { id: submissionId },
  });
  if (!s) fail("Pengumpulan tidak ditemukan.", 404, "NOT_FOUND");
  if (user.role !== "STUDENT" || s.studentId !== user.student!.id)
    throw new AuthorizationError(403, "FORBIDDEN");
  return studentTuple(user, s.eventId, s.milestoneId);
}
export async function uploadFile(
  user: Principal,
  tuple: LearningTuple,
  request: Request,
) {
  await transaction(async (tx) => {
    await lockEnrollment(tx, tuple);
    await assertEditable(tx, tuple);
  });
  await rateLimit(user.id, "upload");
  const form = await uploadForm(request);
  const input = z
    .object({
      expectedVersion: z.coerce.number().int().nonnegative(),
      requestId: id,
    })
    .strict()
    .parse({
      expectedVersion: form.expectedVersion,
      requestId: form.requestId,
    });
  const file = await validateFile(form.file),
    store = storageFor(),
    requestKey = createHash("sha256")
      .update(JSON.stringify([user.id, tuple, input.requestId]))
      .digest("hex");
  const row = await transaction(async (tx) => {
    await lockEnrollment(tx, tuple);
    const { milestone } = await assertEditable(
      tx,
      tuple,
      input.expectedVersion,
    );
    if (!allowedByMilestone(file.type, milestone.acceptedFormats))
      fail(
        "Format file tidak diterima milestone ini.",
        415,
        "MILESTONE_FILE_TYPE",
      );
    const old = await tx.submissionUpload.findUnique({ where: { requestKey } });
    if (old) {
      if (
        old.checksum !== file.checksum ||
        old.originalName !== file.name ||
        old.expectedVersion !== input.expectedVersion
      )
        fail(
          "requestId sudah dipakai untuk file lain.",
          409,
          "IDEMPOTENCY_CONFLICT",
        );
      if (old.status === "READY") return old;
      fail(
        "Upload sebelumnya belum selesai/gagal. Muat ulang atau pilih ulang file.",
        409,
        "UPLOAD_IN_PROGRESS",
      );
    }
    const identical = await tx.submissionUpload.findFirst({
      where: {
        ...tuple,
        expectedVersion: input.expectedVersion,
        checksum: file.checksum,
        originalName: file.name,
        status: { in: ["READY", "UPLOADING"] },
      },
    });
    if (identical) {
      if (identical.status === "READY") return identical;
      fail("File yang sama sedang diunggah.", 409, "UPLOAD_IN_PROGRESS");
    }
    const pending = await tx.submissionUpload.count({
      where: {
        ...tuple,
        expectedVersion: input.expectedVersion,
        status: { in: ["READY", "UPLOADING"] },
        attachments: { none: {} },
      },
    });
    const draft = await tx.submissionDraft.findUnique({
      where: { eventId_studentId_milestoneId: tuple },
    });
    const listed = Array.isArray(draft?.files) ? draft.files.length : 0;
    if (Math.max(pending, listed) >= 5)
      fail(
        "Maksimal lima file per pengumpulan. Hapus file draf yang tidak diperlukan.",
        409,
        "FILE_COUNT",
      );
    const daily = await tx.submissionUpload.aggregate({
      where: {
        uploaderUserId: user.id,
        createdAt: { gte: new Date(Date.now() - 86400000) },
      },
      _sum: { sizeBytes: true },
    });
    const quota = Number(process.env.FILE_DAILY_BYTES ?? 209715200);
    if (!Number.isSafeInteger(quota) || quota < 1024)
      throw new Error("Invalid file quota");
    if (Number(daily._sum.sizeBytes ?? BigInt(0)) + file.size > quota)
      fail("Kuota unggahan harian tercapai.", 429, "FILE_QUOTA");
    return tx.submissionUpload.create({
      data: {
        ...tuple,
        uploaderUserId: user.id,
        expectedVersion: input.expectedVersion,
        originalName: file.name,
        contentType: file.type,
        sizeBytes: BigInt(file.size),
        checksum: file.checksum,
        storageKey: randomBytes(32).toString("hex"),
        storageBackend: store.backend,
        storageNamespace: store.namespace,
        requestKey,
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
  });
  if (row.status === "READY") {
    if (row.expiresAt <= new Date())
      fail(
        "Lampiran draf kedaluwarsa. Hapus lampiran ini lalu unggah ulang.",
        409,
        "UPLOAD_EXPIRED",
      );
    if (
      !(await matchingStorage(row).exists(
        row.storageKey,
        Number(row.sizeBytes),
      ))
    )
      fail(
        "File draf tidak ditemukan. Hapus lampiran ini lalu unggah ulang.",
        409,
        "FILE_MISSING",
      );
    return { attachment: uploadDto(row), replay: true };
  }
  try {
    await store.put(row.storageKey, file.bytes, file.type, file.checksum);
    const ready = await transaction(async (tx) => {
      await lockEnrollment(tx, tuple);
      const { milestone } = await assertEditable(
        tx,
        tuple,
        input.expectedVersion,
      );
      if (!allowedByMilestone(file.type, milestone.acceptedFormats))
        fail("Format milestone berubah. File belum disimpan.", 409);
      const current = await tx.submissionUpload.findUniqueOrThrow({
        where: { id: row.id },
      });
      if (current.status !== "UPLOADING")
        fail("Upload kedaluwarsa atau telah dibatalkan.", 409);
      if (!(await store.exists(row.storageKey, file.size)))
        fail(
          "Penyimpanan file belum terkonfirmasi.",
          503,
          "STORAGE_UNAVAILABLE",
        );
      const updated = await tx.submissionUpload.update({
        where: { id: row.id },
        data: { status: "READY" },
      });
      const draft = await tx.submissionDraft.findUnique({
          where: { eventId_studentId_milestoneId: tuple },
        }),
        files = Array.isArray(draft?.files) ? draft.files : [];
      if (files.length >= 5)
        fail("Maksimal lima file per pengumpulan.", 409, "FILE_COUNT");
      const meta = {
        id: updated.id,
        name: updated.originalName,
        size: Number(updated.sizeBytes),
        type: updated.contentType,
      };
      await tx.submissionDraft.upsert({
        where: { eventId_studentId_milestoneId: tuple },
        create: { ...tuple, files: asJson([meta]) },
        update: { files: asJson([...files, meta]) },
      });
      return updated;
    });
    return { attachment: uploadDto(ready), replay: false };
  } catch (error) {
    // Claim cleanup under the same enrollment lock. Never erase an object if a version references it.
    try {
      const removable = await transaction(async (tx) => {
        await lockEnrollment(tx, tuple);
        if (
          await tx.submissionAttachment.count({ where: { uploadId: row.id } })
        )
          return false;
        await tx.submissionUpload.update({
          where: { id: row.id },
          data: { status: "FAILED", cleanupNeeded: true },
        });
        return true;
      });
      if (removable) {
        await store.remove(row.storageKey);
        await getDatabase().submissionUpload.update({
          where: { id: row.id },
          data: { cleanupNeeded: false },
        });
      }
    } catch {
      /* Retained row/key allows safe cleanup retry after storage/DB recovery. */
    }
    throw error;
  }
}
export async function canonicalFiles(
  tx: Transaction,
  tuple: LearningTuple,
  files: EventAttachment[],
) {
  const current = await tx.submission.findUnique({
    where: { eventId_studentId_milestoneId: tuple },
    include: { versions: { orderBy: { version: "desc" }, take: 1 } },
  });
  const milestone = await tx.milestone.findUniqueOrThrow({
    where: { eventId_id: { eventId: tuple.eventId, id: tuple.milestoneId } },
  });
  if (new Set(files.map((f) => f.id)).size !== files.length)
    fail("ID lampiran duplikat.");
  const result = [];
  for (const file of files) {
    const row = await tx.submissionUpload.findUnique({
      where: { id: file.id },
      include: { _count: { select: { attachments: true } } },
    });
    if (
      !row ||
      row.studentId !== tuple.studentId ||
      row.eventId !== tuple.eventId ||
      row.milestoneId !== tuple.milestoneId ||
      row.status !== "READY"
    )
      fail(
        "Gunakan file yang sudah berhasil diunggah pada milestone ini.",
        400,
        "INVALID_ATTACHMENT",
      );
    if (!allowedByMilestone(row.contentType, milestone.acceptedFormats))
      fail("Format file tidak diterima milestone.", 415, "MILESTONE_FILE_TYPE");
    if (
      !row._count.attachments &&
      row.expectedVersion !== (current?.versions[0]?.version ?? 0)
    )
      fail(
        "Lampiran berasal dari draf versi lain. Unggah ulang.",
        409,
        "FILE_VERSION",
      );
    if (!row._count.attachments && row.expiresAt <= new Date())
      fail("File draf kedaluwarsa. Unggah ulang.", 409, "UPLOAD_EXPIRED");
    if (
      !(await matchingStorage(row).exists(
        row.storageKey,
        Number(row.sizeBytes),
      ))
    )
      fail(
        "Berkas lampiran tidak tersedia; pengumpulan tidak disimpan.",
        409,
        "FILE_MISSING",
      );
    result.push({
      id: row.id,
      name: row.originalName,
      size: Number(row.sizeBytes),
      type: row.contentType,
    });
  }
  return result;
}
export async function listSubmissionFiles(
  user: Principal,
  submissionId: string,
) {
  id.parse(submissionId);
  return transaction(async (tx) => {
    const submission = await tx.submission.findUnique({
      where: { id: submissionId },
    });
    if (!submission) fail("Pengumpulan tidak ditemukan.", 404, "NOT_FOUND");
    if (user.role === "STUDENT") {
      if (user.student!.id !== submission.studentId)
        throw new AuthorizationError(403, "FORBIDDEN");
    } else if (
      !(await tx.event.count({
        where: { id: submission.eventId, ownerTeacherId: user.teacher!.id },
      }))
    )
      throw new AuthorizationError(403, "FORBIDDEN");
    const versions = await tx.submissionVersion.findMany({
      where: { submissionId },
      orderBy: { version: "asc" },
      include: { attachments: { include: { upload: true } } },
    });
    return {
      versions: versions.map((v) => ({
        version: v.version,
        attachments: v.attachments.map((f) =>
          f.upload?.status === "READY"
            ? uploadDto(f.upload)
            : {
                id: f.id,
                name: f.name,
                size: Number(f.sizeBytes),
                type: f.contentType,
                uploaded: false,
              },
        ),
      })),
    };
  });
}
export async function authorizedUpload(user: Principal, attachmentId: string) {
  id.parse(attachmentId);
  const row = await getDatabase().submissionUpload.findUnique({
    where: { id: attachmentId },
    include: { _count: { select: { attachments: true } } },
  });
  if (!row) fail("Lampiran tidak ditemukan.", 404, "NOT_FOUND");
  if (user.role === "STUDENT") {
    if (row.studentId !== user.student!.id)
      throw new AuthorizationError(403, "FORBIDDEN");
  } else if (
    !row._count.attachments ||
    !(await getDatabase().event.count({
      where: { id: row.eventId, ownerTeacherId: user.teacher!.id },
    }))
  )
    throw new AuthorizationError(403, "FORBIDDEN");
  if (row.status !== "READY") fail("File belum tersedia.", 404, "NOT_FOUND");
  return row;
}
export async function removeUpload(
  user: Principal,
  attachmentId: string,
  expectedVersion: number,
) {
  const row = await authorizedUpload(user, attachmentId);
  if (user.role !== "STUDENT") throw new AuthorizationError(403, "FORBIDDEN");
  const tuple = {
    eventId: row.eventId,
    studentId: row.studentId,
    milestoneId: row.milestoneId,
  };
  await transaction(async (tx) => {
    await lockEnrollment(tx, tuple);
    await assertEditable(tx, tuple, expectedVersion);
    if (await tx.submissionAttachment.count({ where: { uploadId: row.id } }))
      fail(
        "Lampiran versi terdahulu tidak dapat dihapus.",
        409,
        "HISTORY_IMMUTABLE",
      );
    await tx.submissionUpload.update({
      where: { id: row.id },
      data: { status: "DELETING", cleanupNeeded: true },
    });
    const draft = await tx.submissionDraft.findUnique({
      where: { eventId_studentId_milestoneId: tuple },
    });
    if (draft && Array.isArray(draft.files))
      await tx.submissionDraft.update({
        where: { eventId_studentId_milestoneId: tuple },
        data: {
          files: asJson(
            draft.files.filter(
              (f) =>
                f &&
                typeof f === "object" &&
                !Array.isArray(f) &&
                f.id !== row.id,
            ),
          ),
        },
      });
  });
  await matchingStorage(row).remove(row.storageKey);
  await getDatabase().submissionUpload.update({
    where: { id: row.id },
    data: { status: "DELETED", cleanupNeeded: false },
  });
  return { deleted: true };
}
export async function serveUpload(
  user: Principal,
  attachmentId: string,
  request: Request,
  preview: boolean,
) {
  const row = await authorizedUpload(user, attachmentId);
  await rateLimit(user.id, "download");
  if (
    preview &&
    !["image/png", "image/jpeg", "application/pdf"].includes(row.contentType)
  )
    fail("Format ini hanya mendukung unduhan.", 415, "PREVIEW_UNAVAILABLE");
  const store = matchingStorage(row);
  if (!(await store.exists(row.storageKey, Number(row.sizeBytes))))
    fail("Berkas tidak ditemukan di penyimpanan.", 404, "FILE_MISSING");
  const bytes = await store.get(row.storageKey);
  if (
    bytes.length !== Number(row.sizeBytes) ||
    createHash("sha256").update(bytes).digest("hex") !== row.checksum
  )
    fail(
      "Integritas file tidak sesuai. Hubungi pengelola.",
      409,
      "FILE_INTEGRITY",
    );
  let start = 0,
    end = bytes.length - 1,
    status = 200;
  const range = request.headers.get("range");
  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!m || (!m[1] && !m[2])) fail("Range tidak didukung.", 416);
    if (m[1]) {
      start = Number(m[1]);
      end = m[2] ? Math.min(Number(m[2]), end) : end;
    } else start = Math.max(0, bytes.length - Number(m[2]));
    if (
      !Number.isSafeInteger(start) ||
      !Number.isSafeInteger(end) ||
      start > end ||
      start >= bytes.length
    )
      fail("Range tidak tersedia.", 416);
    status = 206;
  }
  const body = bytes.subarray(start, end + 1),
    ascii = row.originalName
      .replace(/[^a-zA-Z0-9._ -]/g, "_")
      .replace(/["\\]/g, "_");
  const headers: Record<string, string> = {
    "Content-Type": row.contentType,
    "Content-Disposition": `${preview ? "inline" : "attachment"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(row.originalName).replace(/['()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase())}`,
    "Content-Length": String(body.length),
    "Cache-Control": "private, no-store",
    Vary: "Cookie",
    "X-Content-Type-Options": "nosniff",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Content-Security-Policy":
      "default-src 'none'; sandbox; frame-ancestors 'self'",
    "X-Checksum-SHA256": row.checksum,
    "Accept-Ranges": "bytes",
  };
  if (status === 206)
    headers["Content-Range"] = `bytes ${start}-${end}/${bytes.length}`;
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (let offset = 0; offset < body.length; offset += 65536)
          controller.enqueue(
            new Uint8Array(body.subarray(offset, offset + 65536)),
          );
        controller.close();
      },
    }),
    { status, headers },
  );
}
