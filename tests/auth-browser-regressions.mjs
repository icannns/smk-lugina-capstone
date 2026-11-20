import "dotenv/config";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { requireDevelopmentDatabase } from "../prisma/development-safety.ts";
const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.PLAYWRIGHT_MODULE || "@playwright/test");
const { Pool } = require("pg");
const target = requireDevelopmentDatabase(process.env);
assert(target.databaseName.startsWith("bojong_united_test"), "Use a disposable test database.");
const database = new Pool({ connectionString: target.connectionString, max: 2 });
const base = process.env.AUDIT_BASE_URL || "http://localhost:3000";
assert(["localhost", "127.0.0.1"].includes(new URL(base).hostname), "Browser security tests target localhost only.");
const passwords = [process.env.TEST_TEACHER_PASSWORD, process.env.TEST_DIMAS_PASSWORD, process.env.TEST_AISYAH_PASSWORD];
assert(passwords.every(Boolean), "Provision all three accounts and supply tester passwords via environment.");
const output = process.env.AUDIT_OUTPUT_DIR || path.join(os.tmpdir(), "lugina-auth-regressions");
mkdirSync(output, { recursive: true });
const checks = [], runtimeErrors = [], browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || "msedge", headless: true });
const stamp = randomBytes(8).toString("hex"), contexts = [];
const ok = (name) => { checks.push(name); console.log("PASS", name); };
async function context() { const c = await browser.newContext({ viewport: { width: 1440, height: 1000 } }); contexts.push(c); return c; }
async function login(c, identifier, password, remember = true) {
  const page = await c.newPage(); page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await page.goto(base + "/login"); await page.locator("#login-email").fill(identifier);
  await page.locator("#login-password").fill(password);
  if (!remember) await page.getByRole("checkbox", { name: /Ingat saya/ }).uncheck();
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await page.waitForURL(identifier === "rina.guru" ? "**/guru/dashboard" : "**/siswa/dashboard");
  return page;
}
async function json(c, pathname, status = 200) {
  const response = await c.request.get(base + pathname); assert.equal(response.status(), status, pathname);
  assert.match(response.headers()["cache-control"], /no-store/); return response.json();
}
async function credentials(c, identifier, password) {
  const csrf = await (await c.request.get(base + "/api/auth/csrf")).json();
  return c.request.post(base + "/api/auth/callback/credentials", { headers: { "X-Auth-Return-Redirect": "1" },
    form: { csrfToken: csrf.csrfToken, identifier, password, remember: "true", callbackUrl: base + "/loading" } });
}
async function register(c, data, origin = base) {
  return c.request.post(base + "/api/auth/register", { headers: { Origin: origin }, data });
}
try {
  const anonymous = await context();
  for (const route of ["/api/me", "/api/assessment-results", "/api/events/kantin", "/api/rubrics/uiux", "/api/students/dimas", "/api/assessments/kantin:dimas:M1:v1"]) {
    const body = await json(anonymous, route, 401); assert.equal(body.error.code, "UNAUTHORIZED");
  }
  const asset = await anonymous.request.get(base + "/guru/dashboard/full-create.svg");
  assert.equal(asset.status(), 200); assert.match(asset.headers()["content-type"], /image\/svg/);
  const first = await anonymous.newPage(); await first.goto(base + "/guru/dashboard"); await expect(first).toHaveURL(base + "/login");
  await first.locator("#login-email").fill("rina.guru"); await first.locator("#login-password").fill(randomBytes(24).toString("hex"));
  await first.getByRole("button", { name: "Masuk", exact: true }).click(); await expect(first.locator("p[role=alert]")).toContainText("tidak cocok");
  await json(anonymous, "/api/me", 401); ok("Unauthorized API responses, protected route redirect and invalid password");

  const teacher = await context(), student = await context(), aisyah = await context();
  const teacherPage = await login(teacher, "rina.guru", passwords[0]);
  const studentPage = await login(student, "dimas", passwords[1], false);
  const aisyahPage = await login(aisyah, "aisyah", passwords[2]);
  assert.equal((await json(teacher, "/api/me")).user.role, "TEACHER");
  assert.equal((await json(student, "/api/me")).user.student.id, "dimas");
  assert.equal((await json(aisyah, "/api/me")).user.student.id, "aisyah");
  await studentPage.reload(); await expect(studentPage.getByRole("heading", { name: /^Selamat (pagi|siang|sore|malam), Dimas$/, exact: true })).toBeVisible();
  const persisted = await context(); await persisted.addCookies(await teacher.cookies());
  assert.equal((await json(persisted, "/api/me")).user.id, "teacher-rina");
  const cookie = (await teacher.cookies()).find((c) => c.name.endsWith("session-token"));
  assert(cookie?.httpOnly && cookie.sameSite === "Lax");
  const grants = (await database.query('SELECT "userId", EXTRACT(EPOCH FROM ("expiresAt"-"createdAt")) AS duration FROM "LoginSession" WHERE "revokedAt" IS NULL')).rows;
  assert(grants.some((g) => g.userId === "student-dimas" && Number(g.duration) < 3601));
  assert(grants.some((g) => g.userId === "teacher-rina" && Number(g.duration) > 28790));
  ok("Three DB accounts work in separate browser contexts; cookie-only sessions survive refresh and honor 1h/8h lifetimes");
  const persistedStorage = await studentPage.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
  assert(!persistedStorage.session["lugina.auth.demo.v1"]);
  for (const value of Object.values({ ...persistedStorage.local, ...persistedStorage.session }))
    assert(!passwords.some((password) => value.includes(password)) && !value.includes("$argon2id$") && !value.includes("authSessionId"));
  ok("No password/hash/JWT authentication state in browser localStorage/sessionStorage");

  await studentPage.goto(base + "/guru/monitoring"); await expect(studentPage).toHaveURL(base + "/siswa/dashboard");
  await teacherPage.goto(base + "/siswa/portfolio"); await expect(teacherPage).toHaveURL(base + "/guru/dashboard");
  await json(student, "/api/students/dimas", 403); await json(teacher, "/api/me?userId=student-dimas", 403);
  await json(student, "/api/me?userId=student-aisyah", 403);
  const own = (await json(student, "/api/assessment-results")).records;
  assert(own.length > 0 && own.every((r) => r.studentId === "dimas"));
  await json(student, "/api/assessment-results?studentId=aisyah", 403);
  assert((await json(aisyah, "/api/assessment-results")).records.every((r) => r.studentId === "aisyah"));
  await json(aisyah, "/api/assessments/kantin:dimas:M1:v1", 403);
  await json(student, "/api/assessments/kantin:dimas:M1:v1");
  const sharedAsset = await student.request.get(base + "/guru/dashboard/full-create.svg");
  assert.equal(sharedAsset.status(), 200); assert.match(sharedAsset.headers()["content-type"], /image\/svg/);
  ok("Cross-role routes denied; profiles, external results and submission assessments isolated by DB identity");

  const csrf = await (await student.request.get(base + "/api/auth/csrf")).json();
  await student.request.post(base + "/api/auth/session", { data: { csrfToken: csrf.csrfToken, data: { user: { id: "teacher-rina", role: "TEACHER", studentId: "aisyah" } } } });
  assert.equal((await json(student, "/api/me")).user.role, "STUDENT");
  assert.equal((await json(student, "/api/me")).user.student.id, "dimas");
  await studentPage.evaluate(() => sessionStorage.setItem("lugina.auth.demo.v1", JSON.stringify({ version: 1, activeId: "teacher-rina" })));
  await studentPage.goto(base + "/guru/dashboard"); await expect(studentPage).toHaveURL(base + "/siswa/dashboard");
  ok("Client role/user injection and legacy mock-session forgery do not escalate privileges");

  const foreignTeacher = `auth-qa-${stamp}`, foreignEvent = `auth-qa-event-${stamp}`, foreignRubric = `auth-qa-rubric-${stamp}`;
  await database.query('INSERT INTO "User" (id,name,role,"updatedAt") VALUES ($1,$2,\'TEACHER\',now())', [foreignTeacher, "Teacher fixture"]);
  await database.query('INSERT INTO "TeacherProfile" (id,"userId") VALUES ($1,$1)', [foreignTeacher]);
  await database.query('INSERT INTO "Event" (id,"ownerTeacherId",title,"updatedAt") VALUES ($1,$2,$3,now())', [foreignEvent, foreignTeacher, "Foreign fixture"]);
  await database.query('INSERT INTO "Rubric" (id,"ownerTeacherId",title,"updatedAt") VALUES ($1,$2,$3,now())', [foreignRubric, foreignTeacher, "Foreign rubric"]);
  await json(teacher, "/api/events/kantin"); await json(teacher, "/api/events/" + foreignEvent, 403);
  await json(student, "/api/events/kantin"); await json(student, "/api/events/" + foreignEvent, 403);
  await json(teacher, "/api/rubrics/uiux"); await json(teacher, "/api/rubrics/" + foreignRubric, 403);
  await json(teacher, "/api/students/dimas"); await json(teacher, "/api/assessments/kantin:dimas:M1:v1");
  ok("Teacher resource reads enforce event/rubric ownership and participant context; students require enrollment");

  const registrationPassword = randomBytes(24).toString("base64url") + "Az1!";
  const body = { name: "Siswa QA Fiktif", email: `auth-qa-${stamp}@example.com`, password: registrationPassword, confirm: registrationPassword };
  assert.equal((await register(anonymous, { ...body, role: "TEACHER" })).status(), 400);
  assert.equal((await register(anonymous, { ...body, studentId: "dimas" })).status(), 400);
  assert.equal((await register(anonymous, { ...body, password: "short" })).status(), 400);
  assert.equal((await register(anonymous, body, "https://untrusted.example")).status(), 403);
  assert.equal((await register(anonymous, body)).status(), 201);
  assert.equal((await register(anonymous, body)).status(), 409);
  const row = (await database.query('SELECT "passwordHash", role, "isDemo" FROM "User" WHERE email=$1', [body.email])).rows[0];
  assert.equal(row.role, "STUDENT"); assert.equal(row.isDemo, false); assert(row.passwordHash.startsWith("$argon2id$")); assert.notEqual(row.passwordHash, registrationPassword);
  const fresh = await context(), registerPage = await fresh.newPage(); await registerPage.goto(base + "/register");
  for (const [field, value] of Object.entries({ name: "Siswa UI QA", email: `auth-ui-${stamp}@example.com`, password: registrationPassword, confirm: registrationPassword })) await registerPage.locator("#register-" + field).fill(value);
  await registerPage.getByRole("button", { name: "Daftar Sekarang", exact: true }).click(); await registerPage.waitForURL("**/siswa/dashboard");
  const registered = (await json(fresh, "/api/me")).user; assert.equal(registered.role, "STUDENT"); assert.notEqual(registered.student.id, "dimas");
  assert.deepEqual((await json(fresh, "/api/assessment-results")).records, []);
  ok("Public API/UI registration persists hashed Student accounts only; validation, duplicates, CSRF and empty own results verified");

  const google = await context(), googlePage = await google.newPage(); const before = (await database.query('SELECT count(*) FROM "User"')).rows[0].count;
  await googlePage.goto(base + "/register/google"); await googlePage.locator("#google-name").fill("Contoh Google"); await googlePage.getByRole("button", { name: "Selesaikan Pendaftaran", exact: true }).click();
  await expect(googlePage.getByRole("status")).toContainText("Google OAuth belum tersedia");
  assert.equal((await database.query('SELECT count(*) FROM "User"')).rows[0].count, before); await json(google, "/api/me", 401);
  ok("Google preview cannot provision users or create authenticated sessions");

  const stolen = await student.cookies();
  await studentPage.locator("summary[aria-label^='Menu akun']:visible").click(); await studentPage.getByRole("button", { name: "Keluar", exact: true }).click(); await studentPage.waitForURL("**/login");
  await json(student, "/api/me", 401); const replay = await context(); await replay.addCookies(stolen); await json(replay, "/api/me", 401);
  assert.equal((await json(teacher, "/api/me")).user.role, "TEACHER");
  ok("Student logout invalidates cookie replay while preserving other accounts' sessions");
  await teacherPage.locator("summary[aria-label^='Menu akun']:visible").click(); await teacherPage.getByRole("button", { name: "Keluar", exact: true }).click(); await teacherPage.waitForURL("**/login");
  await json(teacher, "/api/me", 401); ok("Teacher logout and protected access denial");

  await database.query('UPDATE "LoginSession" SET "createdAt"=now()-interval \'3 hours\', "expiresAt"=now()-interval \'2 hours\' WHERE "userId"=\'student-aisyah\' AND "revokedAt" IS NULL');
  await json(aisyah, "/api/me", 401); await aisyahPage.goto(base + "/siswa/dashboard"); await expect(aisyahPage).toHaveURL(base + "/login");
  ok("Server rejects expired sessions independently of client state and redirects protected navigation");

  const disabled = await context(); const disabledPage = await login(disabled, "dimas", passwords[1]);
  await database.query('UPDATE "User" SET "disabledAt"=now() WHERE id=\'student-dimas\'');
  try { await json(disabled, "/api/me", 401); }
  finally { await database.query('UPDATE "User" SET "disabledAt"=NULL WHERE id=\'student-dimas\''); }
  await json(disabled, "/api/me", 401); await disabledPage.close();
  ok("Disabling a DB account rejects and revokes its session even after re-enable");

  const forged = await context(); await forged.addCookies([{ name: "authjs.session-token", value: "not-a-valid-signed-token", url: base, httpOnly: true, sameSite: "Lax" }]);
  await json(forged, "/api/me", 401);
  const noCsrf = await anonymous.request.post(base + "/api/auth/callback/credentials", { headers: { "X-Auth-Return-Redirect": "1" }, form: { identifier: "rina.guru", password: passwords[0] } });
  assert.notEqual(new URL((await noCsrf.json()).url).pathname, "/loading"); await json(anonymous, "/api/me", 401);
  const oversized = await anonymous.request.post(base + "/api/auth/callback/credentials", { headers: { "Content-Type": "application/x-www-form-urlencoded" }, data: "x=" + "x".repeat(17000) });
  assert.equal(oversized.status(), 413);
  ok("Invalid signed cookies, missing login CSRF and oversized credential bodies are rejected");

  const visual = await context(), visualPage = await visual.newPage();
  for (const width of [320, 768, 1440]) {
    await visualPage.setViewportSize({ width, height: 1000 });
    for (const route of ["login", "register", "register/google", "loading"]) {
      await visualPage.goto(base + "/" + route);
      if (route === "loading") await expect(visualPage).toHaveURL(base + "/login");
      await visualPage.evaluate(() => document.fonts.ready);
      assert(await visualPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await visualPage.screenshot({ path: path.join(output, `auth-${route.replaceAll("/", "-")}-${width}.png`), fullPage: true });
    }
  }
  ok("S01-S04 navigation and auth screens have no horizontal overflow at 320/768/1440 px");

  const invalid = await context(), unknown = `not-an-account-${stamp}@example.com`;
  for (let index = 0; index < 11; index++) {
    const response = await credentials(invalid, unknown, registrationPassword); const result = await response.json();
    assert.equal(response.status(), 200); assert.equal(new URL(result.url).searchParams.get("error"), "CredentialsSignin"); const code = new URL(result.url).searchParams.get("code");
    assert.equal(code, index === 10 ? "rate_limited" : "credentials");
  }
  assert((await database.query('SELECT key FROM "AuthRateLimit"')).rows.every((r) => /^[a-f0-9]{64}$/.test(r.key)));
  ok("Persistent login limit blocks attempt 11; database stores HMAC bucket keys, not raw identifiers/IPs");
  assert.deepEqual(runtimeErrors, []);
  writeFileSync(path.join(output, "results.json"), JSON.stringify({ checks, runtimeErrors, database: target.databaseName }, null, 2));
  console.log(JSON.stringify({ passed: checks.length, runtimeErrors }));
} catch (error) {
  let message = String(error); for (const password of passwords) message = message.replaceAll(password, "[redacted]");
  writeFileSync(path.join(output, "failure.json"), JSON.stringify({ checks, message, runtimeErrors }, null, 2));
  console.error(message); process.exitCode = 1;
} finally { for (const c of contexts) await c.close(); await browser.close(); await database.end(); }
