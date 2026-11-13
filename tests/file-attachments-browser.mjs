import "dotenv/config";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import os from "node:os";
import { requireDevelopmentDatabase } from "../prisma/development-safety.ts";
const target = requireDevelopmentDatabase(process.env);
assert(target.databaseName.startsWith("bojong_united_test"));
const require = createRequire(import.meta.url),
  { chromium, expect } = require(
    process.env.PLAYWRIGHT_MODULE || "@playwright/test",
  ),
  base = process.env.AUDIT_BASE_URL || "http://localhost:3000";
assert(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const output =
  process.env.AUDIT_OUTPUT_DIR || path.join(os.tmpdir(), "lugina-file-browser");
mkdirSync(output, { recursive: true });
const flow = JSON.parse(
    readFileSync(
      path.join(
        path.dirname(output),
        "file-attachments-regressions",
        "flow.json",
      ),
    ),
  ),
  fixture = path.resolve("tests/fixtures/submission-files"),
  sha = (b) => createHash("sha256").update(b).digest("hex");
const browser = await chromium.launch({
    channel: process.env.PLAYWRIGHT_CHANNEL || "msedge",
    headless: true,
  }),
  contexts = [],
  checks = [],
  errors = [];
let sp, tp;
function ok(name) {
  checks.push(name);
  console.log("PASS", name);
}
async function login(identifier, password) {
  const c = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    acceptDownloads: true,
  });
  contexts.push(c);
  const p = await c.newPage();
  p.setDefaultTimeout(20000);
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(base + "/login");
  await p.locator("#login-email").fill(identifier);
  await p.locator("#login-password").fill(password);
  await p.getByRole("button", { name: "Masuk", exact: true }).click();
  await p.waitForURL(
    identifier === "rina.guru" ? "**/guru/dashboard" : "**/siswa/dashboard",
  );
  return p;
}
const button = (p, name) => p.getByRole("button", { name, exact: true }),
  main = (p) => p.locator("main:visible").last();
async function shot(p, name) {
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({
    path: path.join(output, name + ".png"),
    fullPage: true,
  });
}
try {
  sp = await login("dimas", process.env.TEST_DIMAS_PASSWORD);
  tp = await login("rina.guru", process.env.TEST_TEACHER_PASSWORD);
  const workspace =
    base + `/siswa/workspace?event=${flow.eventId}&milestone=M2`;
  await sp.goto(workspace);
  await expect(sp.locator("#student-files")).toBeAttached();
  await sp
    .locator("#student-files")
    .setInputFiles({
      name: "not-a-pdf.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("not a PDF"),
    });
  await expect(main(sp).getByRole("alert")).toContainText("signature");
  await expect(main(sp)).not.toContainText("berhasil disimpan");
  ok("Failed real upload shows server error and never claims success");
  await sp
    .locator("#student-files")
    .setInputFiles(path.join(fixture, "sample.png"));
  await expect(main(sp)).toContainText("sample.png berhasil disimpan");
  await expect(main(sp)).toContainText("Tersimpan privat");
  await sp
    .locator("#student-work-text")
    .fill("Jawaban browser dengan lampiran asli");
  await button(sp, "Simpan Draf").click();
  await expect(main(sp)).toContainText("Draf tersimpan di server.");
  await expect(button(sp, "Kumpulkan Milestone 2")).toBeEnabled();
  await sp.reload();
  await expect(sp.locator("#student-work-text")).toHaveValue(
    "Jawaban browser dengan lampiran asli",
  );
  await expect(main(sp)).toContainText("sample.png");
  ok(
    "Confirmed upload and Save Draft preserve real attachment and text after reload",
  );
  await button(sp, "Pratinjau").click();
  const dialog = sp.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("img")).toBeVisible();
  assert(
    await dialog.getByRole("img").evaluate((img) => img.naturalWidth === 32),
  );
  await button(dialog, "Tutup").click();
  const download = sp.waitForEvent("download");
  await button(sp, "Unduh").click();
  const result = await download;
  await result.saveAs(path.join(output, "student-actual.png"));
  assert.equal(
    sha(readFileSync(path.join(output, "student-actual.png"))),
    sha(readFileSync(path.join(fixture, "sample.png"))),
  );
  ok(
    "Student preview decodes real image pixels; downloaded bytes match the fixture",
  );
  for (const width of [320, 768, 1440]) {
    await sp.setViewportSize({ width, height: 1000 });
    await expect(main(sp)).toContainText("sample.png");
    assert(
      await sp.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await shot(sp, `student-files-${width}`);
  }
  ok(
    "Upload controls and attachment rows fit 320/768/1440 without document overflow",
  );
  await button(sp, "Hapus").click();
  await expect(main(sp).getByText("sample.png", { exact: true })).toHaveCount(
    0,
  );
  await expect(button(sp, "Pilih File")).toBeEnabled();
  await sp
    .locator("#student-files")
    .setInputFiles(path.join(fixture, "sample.pdf"));
  await expect(main(sp)).toContainText("sample.pdf berhasil disimpan");
  await button(sp, "Kumpulkan Milestone 2").click();
  await sp.waitForURL("**/siswa/dashboard");
  ok(
    "Staged remove, new actual file upload and final Student submission work through browser controls",
  );
  await tp.goto(
    base + `/guru/monitoring?event=${flow.eventId}&student=dimas&milestone=M2`,
  );
  await expect(main(tp)).toContainText("sample.pdf");
  await expect(main(tp)).toContainText("Versi 1");
  const actualDownload = tp.waitForEvent("download");
  await button(tp, "Unduh").first().click();
  await (await actualDownload).saveAs(path.join(output, "teacher-actual.pdf"));
  assert.equal(
    sha(readFileSync(path.join(output, "teacher-actual.pdf"))),
    sha(readFileSync(path.join(fixture, "sample.pdf"))),
  );
  await button(tp, "Pratinjau").first().click();
  await expect(tp.getByRole("dialog").locator("iframe")).toHaveAttribute(
    "src",
    /^blob:/,
  );
  await button(tp.getByRole("dialog"), "Tutup").click();
  ok(
    "Teacher Monitoring shows version metadata, fetches authorized PDF preview and downloads original bytes",
  );
  await button(tp, "Kualitas skor 5").click();
  await button(tp, "Simpan Penilaian").click();
  await expect(button(tp, "Nilai sudah tersimpan")).toBeDisabled();
  await tp
    .getByRole("textbox", { name: "Pesan feedback", exact: true })
    .fill("Berkas asli sudah ditinjau.");
  await button(tp, "Kirim Feedback").click();
  await expect(main(tp)).toContainText("Feedback tersimpan di server.");
  await sp.goto(base + `/siswa/portfolio?event=${flow.eventId}`);
  await expect(main(sp)).toContainText("Berkas asli sudah ditinjau.");
  await tp.goto(base + `/guru/reports?event=${flow.eventId}`);
  await expect(main(tp).locator("tbody tr").first()).toContainText("100");
  ok(
    "Attachment-backed assessment/feedback propagates to Student Portfolio and Teacher Report",
  );
  await tp.goto(
    base + `/guru/monitoring?event=${flow.eventId}&student=dimas&milestone=M2`,
  );
  for (const width of [320, 768, 1440]) {
    await tp.setViewportSize({ width, height: 1000 });
    await expect(main(tp)).toContainText("sample.pdf");
    assert(
      await tp.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await shot(tp, `teacher-files-${width}`);
  }
  ok("Teacher attachment and assessment layouts fit 320/768/1440");
  assert.deepEqual(errors, []);
  ok("No React/browser runtime exceptions in real attachment flow");
  writeFileSync(
    path.join(output, "results.json"),
    JSON.stringify({ checks, errors }, null, 2),
  );
  console.log(JSON.stringify({ passed: checks.length }));
} catch (e) {
  let message = String(e);
  for (const v of [
    process.env.TEST_TEACHER_PASSWORD,
    process.env.TEST_DIMAS_PASSWORD,
  ].filter(Boolean))
    message = message.replaceAll(v, "[redacted]");
  writeFileSync(
    path.join(output, "failure.json"),
    JSON.stringify({ checks, message, errors }),
  );
  if (sp) await shot(sp, "failure-student");
  if (tp) await shot(tp, "failure-teacher");
  console.error(message);
  process.exitCode = 1;
} finally {
  for (const c of contexts) await c.close();
  await browser.close();
}
