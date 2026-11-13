import { createHash } from "node:crypto";
import path from "node:path";
import { promises as fs, constants } from "node:fs";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

export interface PrivateStorage {
  backend: "local" | "s3";
  namespace: string;
  put(
    key: string,
    bytes: Buffer,
    type: string,
    checksum: string,
  ): Promise<void>;
  get(key: string): Promise<Buffer>;
  exists(key: string, size: number): Promise<boolean>;
  remove(key: string): Promise<void>;
}
const digest = (v: string) => createHash("sha256").update(v).digest("hex");
function validKey(key: string) {
  if (!/^[a-f0-9]{64}$/.test(key))
    throw new Error("Invalid private object identifier");
}
type StorageEnvironment = Readonly<Record<string, string | undefined>>;
export function localQaOverride(env: StorageEnvironment) {
  if (
    env.FILE_STORAGE_ALLOW_LOCAL_TEST !== "true" ||
    env.ALLOW_DEV_SEED !== "true"
  )
    return false;
  try {
    const u = new URL(env.DATABASE_URL ?? "");
    return (
      ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname) &&
      /^\/bojong_united_test(_[a-z0-9]+)*$/.test(u.pathname)
    );
  } catch {
    return false;
  }
}
export function storageFor(
  env: StorageEnvironment = process.env,
): PrivateStorage {
  if (env.FILE_STORAGE_DRIVER === "local") {
    if (env.NODE_ENV === "production" && !localQaOverride(env))
      throw new Error(
        "Local storage is disabled in production; configure private S3 storage",
      );
    const root = env.FILE_STORAGE_LOCAL_ROOT;
    if (!root || !path.isAbsolute(root))
      throw new Error("An absolute private storage directory is required");
    const resolved = path.resolve(root),
      project = path.resolve(/* turbopackIgnore: true */ process.cwd());
    if (resolved === path.parse(resolved).root || resolved === project)
      throw new Error("Storage must use a dedicated private directory");
    if (
      ["public", ".next", ".git", "node_modules"].some((n) => {
        const relative = path.relative(
          path.join(/* turbopackIgnore: true */ project, n),
          resolved,
        );
        return (
          relative === "" ||
          (!relative.startsWith("..") && !path.isAbsolute(relative))
        );
      })
    )
      throw new Error("Unsafe private storage location");
    const locate = async (key: string) => {
      validKey(key);
      await fs.mkdir(resolved, { recursive: true, mode: 0o700 });
      const rootStat = await fs.lstat(resolved);
      if (rootStat.isSymbolicLink() || !rootStat.isDirectory())
        throw new Error("Unsafe storage directory");
      const canonical = await fs.realpath(resolved),
        projectReal = await fs.realpath(project);
      if (
        ["public", ".next", ".git", "node_modules"].some((n) => {
          const relative = path.relative(
            path.join(/* turbopackIgnore: true */ projectReal, n),
            canonical,
          );
          return (
            relative === "" ||
            (!relative.startsWith("..") && !path.isAbsolute(relative))
          );
        })
      )
        throw new Error(
          "Private storage resolves into a public/managed directory",
        );
      return path.join(canonical, key);
    };
    return {
      backend: "local",
      namespace: digest(resolved),
      async put(key, bytes) {
        const target = await locate(key);
        const handle = await fs.open(
          target,
          constants.O_CREAT |
            constants.O_EXCL |
            constants.O_WRONLY |
            (constants.O_NOFOLLOW ?? 0),
          0o600,
        );
        try {
          await handle.writeFile(bytes);
          await handle.sync();
        } finally {
          await handle.close();
        }
      },
      async get(key) {
        const target = await locate(key),
          handle = await fs.open(
            target,
            constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
          );
        try {
          const stat = await handle.stat();
          if (!stat.isFile() || stat.size > 10485760)
            throw new Error("Invalid object");
          return await handle.readFile();
        } finally {
          await handle.close();
        }
      },
      async exists(key, size) {
        try {
          const stat = await fs.lstat(await locate(key));
          return stat.isFile() && !stat.isSymbolicLink() && stat.size === size;
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
          throw error;
        }
      },
      async remove(key) {
        try {
          await fs.unlink(await locate(key));
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        }
      },
    };
  }
  if (env.FILE_STORAGE_DRIVER === "s3") {
    const bucket = env.FILE_S3_BUCKET,
      region = env.FILE_S3_REGION,
      prefix = env.FILE_S3_PREFIX ?? "bojong-submissions/";
    if (
      !bucket ||
      !region ||
      !/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket) ||
      !/^[a-zA-Z0-9/_-]+\/$/.test(prefix) ||
      prefix.includes("..")
    )
      throw new Error("Explicit private S3 configuration required");
    const endpoint = env.FILE_S3_ENDPOINT;
    if (endpoint) {
      const url = new URL(endpoint);
      if (
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        (url.protocol !== "https:" &&
          !(
            localQaOverride(env) &&
            url.protocol === "http:" &&
            ["localhost", "127.0.0.1"].includes(url.hostname)
          ))
      )
        throw new Error("S3 endpoint must use HTTPS");
    }
    const key = env.FILE_S3_ACCESS_KEY_ID,
      secret = env.FILE_S3_SECRET_ACCESS_KEY;
    if ((!key || !secret) && env.FILE_S3_USE_DEFAULT_CREDENTIALS !== "true")
      throw new Error(
        "Configure S3 credentials or explicitly enable the SDK credential chain",
      );
    const client = new S3Client({
      region,
      endpoint,
      forcePathStyle: env.FILE_S3_FORCE_PATH_STYLE === "true",
      maxAttempts: 2,
      ...(key && secret
        ? { credentials: { accessKeyId: key, secretAccessKey: secret } }
        : {}),
    });
    const object = (key: string) => {
      validKey(key);
      return { Bucket: bucket, Key: prefix + key };
    };
    return {
      backend: "s3",
      namespace: digest([endpoint ?? "aws", region, bucket, prefix].join("|")),
      async put(key, bytes, type, checksum) {
        await client.send(
          new PutObjectCommand({
            ...object(key),
            Body: bytes,
            ContentType: type,
            ChecksumSHA256: Buffer.from(checksum, "hex").toString("base64"),
            IfNoneMatch: "*",
          }),
          { abortSignal: AbortSignal.timeout(60000) },
        );
      },
      async get(key) {
        const r = await client.send(new GetObjectCommand(object(key)), {
          abortSignal: AbortSignal.timeout(60000),
        });
        if (!r.Body || !r.ContentLength || r.ContentLength > 10485760)
          throw new Error("Invalid object length");
        return Buffer.from(await r.Body.transformToByteArray());
      },
      async exists(key, size) {
        try {
          const r = await client.send(new HeadObjectCommand(object(key)), {
            abortSignal: AbortSignal.timeout(15000),
          });
          return r.ContentLength === size;
        } catch (error) {
          if (
            (error as { $metadata?: { httpStatusCode?: number } }).$metadata
              ?.httpStatusCode === 404
          )
            return false;
          throw error;
        }
      },
      async remove(key) {
        await client.send(new DeleteObjectCommand(object(key)), {
          abortSignal: AbortSignal.timeout(30000),
        });
      },
    };
  }
  throw new Error(
    "Configure FILE_STORAGE_DRIVER explicitly; no storage fallback is enabled",
  );
}
