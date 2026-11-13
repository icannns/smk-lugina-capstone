import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { storageFor } from "../src/server/files/storage";
const checksum = (b: Buffer) => createHash("sha256").update(b).digest("hex");
test("private local adapter persists bytes across instances, rejects traversal and never overwrites", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "bojong-storage-unit-")),
    env = {
      NODE_ENV: "test",
      FILE_STORAGE_DRIVER: "local",
      FILE_STORAGE_LOCAL_ROOT: root,
    },
    key = "a".repeat(64),
    bytes = Buffer.from("real private bytes");
  try {
    const first = storageFor(env);
    await first.put(key, bytes, "application/pdf", checksum(bytes));
    assert(await first.exists(key, bytes.length));
    assert.deepEqual(await storageFor(env).get(key), bytes);
    assert.deepEqual(await readFile(path.join(root, key)), bytes);
    await assert.rejects(
      first.put(key, bytes, "application/pdf", checksum(bytes)),
    );
    await assert.rejects(first.get("../secret"));
    await assert.rejects(first.remove("../secret"));
    await first.remove(key);
    assert.equal(await first.exists(key, bytes.length), false);
    await first.remove(key);
  } finally {
    assert(
      path.dirname(root) === os.tmpdir() &&
        path.basename(root).startsWith("bojong-storage-unit-"),
    );
    await rm(root, { recursive: true, force: true });
  }
});
test("storage configuration fails closed, including production local fallback", () => {
  assert.throws(() => storageFor({}));
  assert.throws(() =>
    storageFor({
      FILE_STORAGE_DRIVER: "local",
      FILE_STORAGE_LOCAL_ROOT: "relative",
    }),
  );
  assert.throws(() =>
    storageFor({
      NODE_ENV: "production",
      FILE_STORAGE_DRIVER: "local",
      FILE_STORAGE_LOCAL_ROOT: path.join(os.tmpdir(), "private"),
    }),
  );
  assert.throws(() =>
    storageFor({
      FILE_STORAGE_DRIVER: "local",
      FILE_STORAGE_LOCAL_ROOT: path.join(process.cwd(), "public", "private"),
    }),
  );
  assert.throws(() =>
    storageFor({
      FILE_STORAGE_DRIVER: "local",
      FILE_STORAGE_LOCAL_ROOT: process.cwd(),
    }),
  );
  assert.throws(() => storageFor({ FILE_STORAGE_DRIVER: "s3" }));
  assert.throws(() =>
    storageFor({
      FILE_STORAGE_DRIVER: "s3",
      FILE_S3_BUCKET: "private-test",
      FILE_S3_REGION: "test",
      FILE_S3_ACCESS_KEY_ID: "fixture",
      FILE_S3_SECRET_ACCESS_KEY: "fixture",
      FILE_S3_ENDPOINT: "http://remote.example",
    }),
  );
});
