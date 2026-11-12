import { test } from "node:test";
import assert from "node:assert/strict";
import { requireDevelopmentDatabase } from "../prisma/development-safety";

// Fictional parser fixture, not a real credential or reachable service.
const valid = { NODE_ENV: "test", ALLOW_DEV_SEED: "true", DATABASE_URL: "postgresql://fixture:parser-only@127.0.0.1:59999/bojong_united_test_parser?schema=public" };

test("development/test opt-in and an explicitly named local database are required", () => {
  assert.equal(requireDevelopmentDatabase(valid).databaseName, "bojong_united_test_parser");
  for (const env of ["production", "staging", "", undefined])
    assert.throws(() => requireDevelopmentDatabase({ ...valid, NODE_ENV: env }));
  for (const flag of ["false", "", undefined])
    assert.throws(() => requireDevelopmentDatabase({ ...valid, ALLOW_DEV_SEED: flag }));
});

test("remote, generic, production-like, schema override, and placeholder targets are refused", () => {
  for (const value of [
    valid.DATABASE_URL.replace("127.0.0.1", "db.example.com"),
    valid.DATABASE_URL.replace("bojong_united_test_parser", "production"),
    valid.DATABASE_URL.replace("bojong_united_test_parser", "bojong_united_prod"),
    valid.DATABASE_URL.replace("bojong_united_test_parser", "postgres"),
    valid.DATABASE_URL.replace("schema=public", "schema=private"),
    valid.DATABASE_URL + "&host=remote.example.com",
    valid.DATABASE_URL.replace("parser-only", "REPLACE_ME"),
    "not-a-url",
  ]) assert.throws(() => requireDevelopmentDatabase({ ...valid, DATABASE_URL: value }));
});

test("guard failures never expose URL credentials", () => {
  try { requireDevelopmentDatabase({ ...valid, DATABASE_URL: valid.DATABASE_URL.replace("127.0.0.1", "remote.example.com") }); }
  catch (error) {
    const message = String(error);
    assert(!message.includes("parser-only"));
    assert(!message.includes("postgresql://"));
    return;
  }
  assert.fail("Expected unsafe database refusal");
});
