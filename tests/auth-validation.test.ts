import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { hashPassword, verifyPassword } from "../src/server/auth/password";
import { loginInput, registrationInput } from "../src/server/auth/validation";
const password = randomBytes(24).toString("base64url") + "Az1!";
test("Argon2id uses distinct salts; correct passwords verify and invalid/missing hashes fail", async () => {
  const a = await hashPassword(password), b = await hashPassword(password);
  assert(a.startsWith("$argon2id$v=19$m=19456,t=2,p=1$")); assert.notEqual(a, b);
  assert(!a.includes(password)); assert(await verifyPassword(password, a));
  assert(!await verifyPassword(password + "wrong", a)); assert(!await verifyPassword(password, null));
  assert(!await verifyPassword(password, "malformed"));
});
test("registration normalizes identity and rejects role/ID injection, invalid fields and confirmation", () => {
  const valid = { name: "  Siswa Fiktif  ", email: "  Tester@Example.com  ", password, confirm: password };
  assert.deepEqual(registrationInput(valid), { name: "Siswa Fiktif", email: "tester@example.com", password });
  for (const value of [null, [], { ...valid, role: "TEACHER" }, { ...valid, studentId: "dimas" },
    { ...valid, isDemo: true }, { ...valid, password: "short", confirm: "short" }, { ...valid, confirm: "wrong" },
    { ...valid, name: "x" }, { ...valid, email: "invalid" }, { ...valid, password: "X".repeat(129) }])
    assert.equal(registrationInput(value), null);
});
test("credentials input is bounded and normalized; remember and role cannot be coerced by client", () => {
  assert.deepEqual(loginInput({ identifier: " RINA.GURU ", password, remember: "true", role: "STUDENT" }), { identifier: "rina.guru", password, remember: true });
  assert.equal(loginInput({ identifier: "dimas", password, remember: true })?.remember, false);
  for (const input of [{}, { identifier: [], password }, { identifier: "x".repeat(321), password }, { identifier: "dimas", password: "x".repeat(129) }]) assert.equal(loginInput(input), null);
});
