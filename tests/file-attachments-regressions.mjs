import "dotenv/config";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { randomBytes, createHash, createHmac } from "node:crypto";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  renameSync,
  unlinkSync,
  existsSync,
} from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { requireDevelopmentDatabase } from "../prisma/development-safety.ts";
const require = createRequire(import.meta.url),
  { chromium } = require(process.env.PLAYWRIGHT_MODULE || "@playwright/test"),
  { Pool } = require("pg"),
  { hash, argon2id } = require("argon2");
const target = requireDevelopmentDatabase(process.env);
assert(target.databaseName.startsWith("bojong_united_test"));
const base = process.env.AUDIT_BASE_URL || "http://localhost:3000";
assert(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const output =
  process.env.AUDIT_OUTPUT_DIR || path.join(os.tmpdir(), "lugina-file-tests");
mkdirSync(output, { recursive: true });
const database = new Pool({
    connectionString: target.connectionString,
    max: 4,
  }),
  browser = await chromium.launch({
    channel: process.env.PLAYWRIGHT_CHANNEL || "msedge",
    headless: true,
  }),
  contexts = [],
  checks = [];
const stamp = randomBytes(6).toString("hex"),
  eventId = `files-${stamp}`,
  rubricId = `files-rubric-${stamp}`,
  fixture = path.resolve("tests/fixtures/submission-files"),
  checkpoint = path.join(output, "restart.json");
const types = {
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  bytes = (ext) => readFileSync(path.join(fixture, `sample.${ext}`)),
  sha = (b) => createHash("sha256").update(b).digest("hex"),
  ok = (name) => {
    checks.push(name);
    console.log("PASS", name);
  };
async function context(identifier, password) {
  const c = await browser.newContext({ acceptDownloads: true });
  contexts.push(c);
  if (identifier) {
    const csrf = await (await c.request.get(base + "/api/auth/csrf")).json();
    await c.request.post(base + "/api/auth/callback/credentials", {
      headers: { "X-Auth-Return-Redirect": "1" },
      form: {
        csrfToken: csrf.csrfToken,
        identifier,
        password,
        remember: "true",
      },
    });
    assert.equal((await c.request.get(base + "/api/me")).status(), 200);
  }
  return c;
}
async function api(c, method, url, data, status = 200) {
  const r = await c.request.fetch(base + url, {
    method,
    headers: { Origin: base },
    ...(data === undefined ? {} : { data }),
  });
  const value = await r.json();
  assert.equal(
    r.status(),
    status,
    `${method} ${url}: ${JSON.stringify(value)}`,
  );
  return value;
}
async function upload(
  c,
  {
    ext = "pdf",
    name = `sample.${ext}`,
    mime = types[ext],
    buffer = bytes(ext),
    nonce = randomBytes(12).toString("hex"),
    version = 0,
    milestone = "M1",
    url,
  } = {},
  status = 201,
) {
  const r = await c.request.post(
    base +
      (url || `/api/events/${eventId}/milestones/${milestone}/attachments`),
    {
      headers: { Origin: base },
      multipart: {
        file: { name, mimeType: mime, buffer },
        expectedVersion: String(version),
        requestId: nonce,
      },
    },
  );
  const value = await r.json();
  assert.equal(r.status(), status, JSON.stringify(value));
  assert(
    !/storageKey|storageNamespace|uploaderUserId|passwordHash|FILE_S3/.test(
      JSON.stringify(value),
    ),
  );
  return value;
}
const work = (files) => ({
  files: files.map(({ id, name, size, type }) => ({ id, name, size, type })),
  text: "Pekerjaan fiktif dengan berkas asli",
  link: "",
});
try {
  // Reset only test-file counters for fixture identities, never production/session counters.
  const users = await database.query(
    "SELECT id FROM \"User\" WHERE username IN ('rina.guru','dimas','aisyah')",
  );
  for (const { id } of users.rows)
    for (const action of ["upload", "download"]) {
      const key = createHmac("sha256", process.env.AUTH_SECRET)
        .update(`file:${action}:${id}`)
        .digest("hex");
      await database.query('DELETE FROM "AuthRateLimit" WHERE key=$1', [key]);
    }
  const student = await context("dimas", process.env.TEST_DIMAS_PASSWORD);
  if (process.argv.includes("restart")) {
    const saved = JSON.parse(readFileSync(checkpoint));
    const r = await student.request.get(
      base + `/api/attachments/${saved.attachmentId}/download`,
    );
    assert.equal(r.status(), 200);
    assert.equal(sha(await r.body()), saved.checksum);
    ok("Stored bytes and database identity survive application restart");
  } else {
    const teacher = await context(
        "rina.guru",
        process.env.TEST_TEACHER_PASSWORD,
      ),
      other = await context("aisyah", process.env.TEST_AISYAH_PASSWORD),
      anonymous = await context();
    const foreign = `file-teacher-${stamp}`,
      password = randomBytes(24).toString("base64url") + "Az1!",
      encoded = await hash(password, {
        type: argon2id,
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1,
      });
    await database.query(
      'INSERT INTO "User" (id,name,username,role,"passwordHash","updatedAt") VALUES ($1,$1,$1,\'TEACHER\',$2,now())',
      [foreign, encoded],
    );
    await database.query(
      'INSERT INTO "TeacherProfile" (id,"userId") VALUES ($1,$1)',
      [foreign],
    );
    const foreignTeacher = await context(foreign, password);
    await api(
      teacher,
      "POST",
      "/api/rubrics",
      {
        id: rubricId,
        title: "Rubrik file",
        description: "Latihan",
        updated: "2026-11-13",
        inUse: false,
        criteria: [
          { id: "quality", title: "Kualitas", description: "", min: 0, max: 5 },
        ],
      },
      201,
    );
    let event = {
      id: eventId,
      title: `Berkas Nyata ${stamp}`,
      status: "draft",
      mode: "Penyelesaian",
      updated: "2026-11-13",
      period: "Belum diatur",
      startAt: "2026-01-01T08:00",
      endAt: "2030-12-31T23:59",
      caseStudyHtml: "<p>Latihan fiktif</p>",
      directionsHtml: "Unggah karya latihan.",
      rubricId,
      milestones: [
        {
          id: "M1",
          title: "Berkas",
          instructions: "Unggah karya fiktif.",
          formats: "Teks, PDF, Gambar, DOCX",
          deadline: "2030-12-01T23:59",
        },
        {
          id: "M2",
          title: "Berkas lanjut",
          formats: "PDF, Gambar, DOCX",
          deadline: "2030-12-02T23:59",
        },
      ],
      certificateConfig: {
        mode: "template",
        threshold: "75",
        name: "Dokumen latihan",
        organizer: "Pengujian",
        issuedAt: "",
        signer: "",
        signerRole: "",
        description: "Prototype",
        template: { name: "template.pdf", size: 100, type: "application/pdf" },
        positions: {
          student: { x: 50, y: 45 },
          event: { x: 50, y: 58 },
          date: { x: 17, y: 78 },
          score: { x: 83, y: 78 },
        },
      },
    };
    await api(teacher, "POST", "/api/events", { event }, 201);
    event = (await api(teacher, "GET", `/api/events/${eventId}`)).event;
    await api(teacher, "POST", `/api/events/${eventId}/publish`, { event });
    await api(student, "POST", `/api/events/${eventId}/enrollments`, {});
    await upload(anonymous, {}, 401);
    await upload(other, {}, 403);
    await upload(teacher, {}, 403);
    await upload(student, { milestone: "M2" }, 409);
    ok(
      "Authentication, Student ownership, role and milestone prerequisites enforced before upload",
    );
    await upload(
      student,
      {
        name: "bad.exe",
        mime: "application/octet-stream",
        buffer: Buffer.from("MZ fake executable"),
      },
      415,
    );
    await upload(student, { mime: "image/png" }, 415);
    await upload(student, { buffer: Buffer.from("not a PDF") }, 415);
    await upload(student, { buffer: Buffer.alloc(10485761) }, 413);
    await upload(student, { buffer: Buffer.alloc(0) }, 413);
    await upload(student, { ext: "docx", buffer: bytes("pdf") }, 415);
    await upload(
      student,
      { ext: "docx", buffer: bytes("docx").subarray(0, 80) },
      415,
    );
    const traversal = Buffer.from(
      bytes("docx")
        .toString("latin1")
        .replaceAll("word/document.xml", "../x/document.xml"),
      "latin1",
    );
    await upload(student, { ext: "docx", buffer: traversal }, 415);
    const encrypted = Buffer.from(bytes("docx"));
    encrypted.writeUInt16LE(encrypted.readUInt16LE(6) | 1, 6);
    const central = encrypted.indexOf(Buffer.from("504b0102", "hex"));
    encrypted.writeUInt16LE(
      encrypted.readUInt16LE(central + 8) | 1,
      central + 8,
    );
    await upload(student, { ext: "docx", buffer: encrypted }, 415);
    const forged = await student.request.post(
      base + `/api/events/${eventId}/milestones/M1/attachments`,
      {
        headers: { Origin: "https://untrusted.example" },
        multipart: {
          file: {
            name: "sample.pdf",
            mimeType: types.pdf,
            buffer: bytes("pdf"),
          },
          expectedVersion: "0",
          requestId: `csrf-${stamp}`,
        },
      },
    );
    assert.equal(forged.status(), 403);
    ok(
      "Unsupported type, oversized/empty files, MIME mismatch, fake signatures and invalid DOCX rejected",
    );
    const nonce = randomBytes(12).toString("hex"),
      first = await upload(student, { nonce }),
      attachment = first.attachment;
    assert(attachment.uploaded);
    assert.equal(attachment.checksum, sha(bytes("pdf")));
    assert.equal(
      (await upload(student, { nonce })).attachment.id,
      attachment.id,
    );
    assert.equal((await upload(student, {})).attachment.id, attachment.id);
    const download = await student.request.get(base + attachment.downloadUrl);
    assert.equal(download.status(), 200);
    assert.equal(sha(await download.body()), sha(bytes("pdf")));
    assert.equal(download.headers()["cache-control"], "private, no-store");
    assert.equal(download.headers()["x-content-type-options"], "nosniff");
    assert(download.headers()["content-disposition"].startsWith("attachment;"));
    const range = await student.request.get(base + attachment.downloadUrl, {
      headers: { Range: "bytes=0-7" },
    });
    assert.equal(range.status(), 206);
    assert.equal((await range.body()).toString(), "%PDF-1.4");
    assert.equal(
      (
        await student.request.get(base + attachment.downloadUrl, {
          headers: { Range: "bytes=999999-" },
        })
      ).status(),
      416,
    );
    assert.equal(
      (await student.request.get(base + attachment.previewUrl)).headers()[
        "content-type"
      ],
      "application/pdf",
    );
    await api(teacher, "GET", attachment.downloadUrl, undefined, 403);
    await api(other, "GET", attachment.previewUrl, undefined, 403);
    await api(anonymous, "GET", attachment.downloadUrl, undefined, 401);
    ok(
      "Real PDF bytes, checksum, range and safe private headers; idempotent uploads; Teacher cannot see unsubmitted files",
    );
    const others = [];
    for (const ext of ["png", "jpg", "docx"]) {
      const f = (await upload(student, { ext })).attachment;
      others.push(f);
      const r = await student.request.get(base + f.downloadUrl);
      assert.equal(sha(await r.body()), sha(bytes(ext)));
      if (ext === "docx")
        await api(
          student,
          "GET",
          `/api/attachments/${f.id}/preview`,
          undefined,
          415,
        );
      else
        assert.equal(
          (await student.request.get(base + f.previewUrl)).headers()[
            "content-type"
          ],
          types[ext],
        );
    }
    ok(
      "Real PNG, JPEG and DOCX persisted and downloaded byte-for-byte; image preview works, DOCX preview explicitly unsupported",
    );
    const fifth = (
      await upload(student, { name: '..\\..\\unsafe";filename=bad.pdf' })
    ).attachment;
    assert(!/[\\/\r\n]/.test(fifth.name));
    const header = (
      await student.request.get(base + fifth.downloadUrl)
    ).headers()["content-disposition"];
    assert(!/[\r\n]/.test(header));
    await upload(student, { name: "sixth.pdf" }, 409);
    await api(student, "DELETE", `/api/attachments/${fifth.id}`, {
      expectedVersion: 0,
    });
    await api(student, "GET", fifth.downloadUrl, undefined, 404);
    ok("Filename sanitization, five-file limit and confirmed staged removal");
    const concurrent = await Promise.all(
      [1, 2].map(() =>
        student.request.post(
          base + `/api/events/${eventId}/milestones/M1/attachments`,
          {
            headers: { Origin: base },
            multipart: {
              file: {
                name: "parallel.pdf",
                mimeType: types.pdf,
                buffer: bytes("pdf"),
              },
              expectedVersion: "0",
              requestId: randomBytes(12).toString("hex"),
            },
          },
        ),
      ),
    );
    for (const r of concurrent) assert([201, 409].includes(r.status()));
    const successful = await Promise.all(
      concurrent.filter((r) => r.status() === 201).map((r) => r.json()),
    );
    assert(successful.length >= 1);
    const count = await database.query(
      'SELECT count(*)::int AS n FROM "SubmissionUpload" WHERE "eventId"=$1 AND "originalName"=\'parallel.pdf\' AND status=\'READY\'',
      [eventId],
    );
    assert.equal(count.rows[0].n, 1);
    const parallel = successful[0].attachment;
    await api(student, "DELETE", `/api/attachments/${parallel.id}`, {
      expectedVersion: 0,
    });
    ok(
      "Concurrent duplicate upload creates one ready object; other request is replay or explicit conflict",
    );
    await api(
      student,
      "POST",
      `/api/events/${eventId}/milestones/M1/submissions`,
      {
        work: work([
          { id: "forged-file", name: "fake.pdf", type: types.pdf, size: 10 },
        ]),
        expectedVersion: 0,
        requestId: `fake-${stamp}`,
      },
      400,
    );
    await api(other, "POST", `/api/events/${eventId}/enrollments`, {});
    const otherFile = (await upload(other, { ext: "png" })).attachment;
    await api(
      student,
      "POST",
      `/api/events/${eventId}/milestones/M1/submissions`,
      {
        work: work([otherFile]),
        expectedVersion: 0,
        requestId: `cross-${stamp}`,
      },
      400,
    );
    const submit = await api(
        student,
        "POST",
        `/api/events/${eventId}/milestones/M1/submissions`,
        {
          work: work([attachment, ...others]),
          expectedVersion: 0,
          requestId: `submit-${stamp}`,
        },
        201,
      ),
      submissionId = submit.submissionId;
    const list = await api(
      teacher,
      "GET",
      `/api/submissions/${submissionId}/attachments`,
    );
    assert.equal(list.versions[0].attachments.length, 4);
    assert.equal(
      (await teacher.request.get(base + attachment.downloadUrl)).status(),
      200,
    );
    await api(
      other,
      "GET",
      `/api/submissions/${submissionId}/attachments`,
      undefined,
      403,
    );
    await api(foreignTeacher, "GET", attachment.downloadUrl, undefined, 403);
    await api(foreignTeacher, "GET", attachment.previewUrl, undefined, 403);
    await api(
      foreignTeacher,
      "GET",
      `/api/submissions/${submissionId}/attachments`,
      undefined,
      403,
    );
    await upload(
      other,
      { url: `/api/submissions/${submissionId}/attachments` },
      403,
    );
    await upload(student, {}, 409);
    await api(
      student,
      "DELETE",
      `/api/attachments/${attachment.id}`,
      { expectedVersion: 1 },
      409,
    );
    ok(
      "Canonical upload IDs required at submission; Teacher event-scoped list/download; cross-Student/Teacher access and finalized deletion blocked",
    );
    await api(
      teacher,
      "POST",
      `/api/submissions/${submissionId}/feedback`,
      {
        id: `revision-${stamp}`,
        message: "Unggah revisi karya fiktif.",
        revision: true,
        deadline: "2031-01-01T23:59",
        version: 1,
      },
      201,
    );
    const replacement = (
      await upload(student, {
        name: "revised.pdf",
        version: 1,
        url: `/api/submissions/${submissionId}/attachments`,
      })
    ).attachment;
    await api(
      student,
      "POST",
      `/api/events/${eventId}/milestones/M1/submissions`,
      {
        work: work([replacement]),
        expectedVersion: 1,
        requestId: `submit-v2-${stamp}`,
      },
      201,
    );
    await assert.rejects(
      database.query(
        'UPDATE "SubmissionAttachment" SET name=\'changed.pdf\' WHERE "uploadId"=$1',
        [attachment.id],
      ),
      (e) => e.code === "23514",
    );
    await assert.rejects(
      database.query(
        "UPDATE \"SubmissionUpload\" SET status='DELETED' WHERE id=$1",
        [attachment.id],
      ),
      (e) => e.code === "23514",
    );
    await assert.rejects(
      database.query(
        'UPDATE "SubmissionUpload" SET "studentId"=\'aisyah\' WHERE id=$1',
        [attachment.id],
      ),
      (e) => e.code === "23514",
    );
    const history = await api(
      teacher,
      "GET",
      `/api/submissions/${submissionId}/attachments`,
    );
    assert.equal(history.versions.length, 2);
    assert.equal(
      history.versions[0].attachments[0].checksum,
      attachment.checksum,
    );
    assert.equal(history.versions[1].attachments[0].id, replacement.id);
    assert.notEqual(replacement.id, attachment.id);
    assert.equal(
      sha(
        await (await teacher.request.get(base + attachment.downloadUrl)).body(),
      ),
      attachment.checksum,
    );
    await api(
      student,
      "DELETE",
      `/api/attachments/${attachment.id}`,
      { expectedVersion: 2 },
      409,
    );
    ok(
      "Revision creates an independent immutable object/version; original file bytes and authorized access preserved",
    );
    await api(teacher, "PUT", `/api/submissions/${submissionId}/assessment`, {
      version: 2,
      expectedRevision: 0,
      scores: { quality: 5 },
      requestId: `score-${stamp}`,
    });
    assert(
      (
        await api(student, "GET", `/api/submissions/${submissionId}`)
      ).assessments.some((a) => a.version === 2),
    );
    assert.equal(
      (
        await teacher.request.get(base + `/api/reports?event=${eventId}`)
      ).status(),
      200,
    );
    ok("Real attachments preserve rubric assessment and reporting flow");
    // Negative storage tests touch ONLY the explicitly configured disposable local test directory.
    const root = process.env.FILE_STORAGE_LOCAL_ROOT;
    assert(
      root &&
        path.isAbsolute(root) &&
        path.relative(os.tmpdir(), root) &&
        !path.relative(os.tmpdir(), root).startsWith(".."),
    );
    const row = (
        await database.query(
          'SELECT "storageKey" FROM "SubmissionUpload" WHERE id=$1',
          [attachment.id],
        )
      ).rows[0],
      object = path.join(root, row.storageKey);
    assert(/^[a-f0-9]{64}$/.test(row.storageKey));
    const original = readFileSync(object);
    writeFileSync(object, Buffer.alloc(original.length, 65));
    await api(student, "GET", attachment.downloadUrl, undefined, 409);
    writeFileSync(object, original);
    renameSync(object, object + ".held");
    try {
      await api(student, "GET", attachment.downloadUrl, undefined, 404);
    } finally {
      renameSync(object + ".held", object);
    }
    ok(
      "Missing/corrupted objects return explicit errors without generated file fallback",
    );
    const failRoot = root + ".held";
    assert(!existsSync(failRoot));
    renameSync(root, failRoot);
    writeFileSync(root, "intentional isolated storage fault");
    try {
      await upload(
        student,
        { name: "failed-storage.pdf", milestone: "M2" },
        503,
      );
    } finally {
      unlinkSync(root);
      renameSync(failRoot, root);
    }
    const failed = await database.query(
      'SELECT id,status,"cleanupNeeded" FROM "SubmissionUpload" WHERE "eventId"=$1 AND "originalName"=\'failed-storage.pdf\'',
      [eventId],
    );
    assert.equal(failed.rows[0].status, "FAILED");
    assert(failed.rows[0].cleanupNeeded);
    const clean = (args) => {
      const r = spawnSync(
        process.execPath,
        [
          "node_modules/tsx/dist/cli.mjs",
          "prisma/cleanup-submission-files.ts",
          ...args,
        ],
        { env: process.env, encoding: "utf8" },
      );
      assert.equal(r.status, 0, r.stderr);
      return JSON.parse(r.stdout.trim().split("\n").at(-1));
    };
    assert(clean([]).candidates >= 1);
    assert(
      (
        await database.query(
          'SELECT status FROM "SubmissionUpload" WHERE id=$1',
          [failed.rows[0].id],
        )
      ).rows[0].status === "FAILED",
    );
    assert(clean(["--apply"]).cleaned >= 1);
    assert.equal(
      (
        await database.query(
          'SELECT status FROM "SubmissionUpload" WHERE id=$1',
          [failed.rows[0].id],
        )
      ).rows[0].status,
      "DELETED",
    );
    assert.equal(
      (await teacher.request.get(base + attachment.downloadUrl)).status(),
      200,
    );
    ok(
      "Physical upload failure never becomes READY; dry-run preserves data; compensating cleanup safely retries without deleting history",
    );
    const expired = (
      await upload(student, { name: "expired.pdf", milestone: "M2" })
    ).attachment;
    // Preserve immutable creation time; shorten expiry for this disposable staged object.
    await database.query(
      'UPDATE "SubmissionUpload" SET "expiresAt"="createdAt"+interval \'1 millisecond\' WHERE id=$1',
      [expired.id],
    );
    assert(clean(["--apply"]).cleaned >= 1);
    assert.equal(
      (await student.request.get(base + expired.downloadUrl)).status(),
      404,
    );
    ok(
      "Expired unsubmitted files can be cleaned while historical attachments remain intact",
    );
    const studentUser = (
        await database.query(
          'SELECT "userId" FROM "StudentProfile" WHERE id=\'dimas\'',
        )
      ).rows[0].userId,
      rate = createHmac("sha256", process.env.AUTH_SECRET)
        .update(`file:upload:${studentUser}`)
        .digest("hex");
    await database.query(
      'UPDATE "AuthRateLimit" SET attempts=1000,"windowEndsAt"=now()+interval \'1 minute\' WHERE key=$1',
      [rate],
    );
    await upload(student, { name: "rate.pdf", milestone: "M2" }, 429);
    await database.query('DELETE FROM "AuthRateLimit" WHERE key=$1', [rate]);
    ok("Database-backed per-user upload abuse limit returns 429");
    writeFileSync(
      checkpoint,
      JSON.stringify({
        attachmentId: attachment.id,
        checksum: attachment.checksum,
        eventId,
        submissionId,
      }),
    );
    writeFileSync(
      path.join(output, "flow.json"),
      JSON.stringify({ eventId, submissionId, attachmentId: attachment.id }),
    );
  }
  writeFileSync(
    path.join(
      output,
      process.argv.includes("restart")
        ? "restart-results.json"
        : "results.json",
    ),
    JSON.stringify({ checks }, null, 2),
  );
  console.log(JSON.stringify({ passed: checks.length }));
} catch (e) {
  let message =
    (e instanceof Error ? e.stack : String(e)) || "Unknown file test error";
  for (const v of [
    process.env.DATABASE_URL,
    process.env.TEST_TEACHER_PASSWORD,
    process.env.TEST_DIMAS_PASSWORD,
    process.env.TEST_AISYAH_PASSWORD,
  ].filter(Boolean))
    message = message.replaceAll(v, "[redacted]");
  writeFileSync(
    path.join(output, "failure.json"),
    JSON.stringify({ checks, message }),
  );
  console.error(message);
  process.exitCode = 1;
} finally {
  await database.end();
  for (const c of contexts) await c.close();
  await browser.close();
}
