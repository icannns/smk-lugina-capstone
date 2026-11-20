import { randomBytes, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { linkSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execve } from "node:process";

const dbPassword = "/run/bojong/db-auth/password";
const authSecret = "/run/bojong/app-auth/session-secret";
const accounts = [
  ["rina.guru", "TEST_TEACHER_PASSWORD", "/run/bojong/app-auth/teacher"],
  ["dimas", "TEST_DIMAS_PASSWORD", "/run/bojong/app-auth/dimas"],
  ["aisyah", "TEST_AISYAH_PASSWORD", "/run/bojong/app-auth/aisyah"],
];

function readSecret(file) {
  const value = readFileSync(file, "utf8").trim();
  if (!/^[A-Za-z0-9_-]{43,64}$/.test(value) || /REPLACE|CHANGEME/i.test(value)) {
    throw new Error("Invalid local credential file. Check the Docker credential volumes.");
  }
  return value;
}

function createSecret(file, prefix = "") {
  try {
    readSecret(file);
    return;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const temporary = `${file}.${randomUUID()}.tmp`;
  let value;
  do {
    value = prefix + randomBytes(32).toString("base64url");
  } while (/REPLACE|CHANGEME/i.test(value));
  writeFileSync(temporary, `${value}\n`, { mode: 0o600, flag: "wx" });
  try {
    linkSync(temporary, file);
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    readSecret(file);
  } finally {
    rmSync(temporary);
  }
}

function databaseEnvironment() {
  const url = new URL("postgresql://bojong_local@127.0.0.1:5432/bojong_united_test_docker?schema=public");
  url.password = readSecret(dbPassword);
  return { ...process.env, DATABASE_URL: url.href, ALLOW_DEV_SEED: "true" };
}

switch (process.argv[2]) {
  case "credentials":
    createSecret(dbPassword);
    createSecret(authSecret);
    for (const [, , file] of accounts) createSecret(file, "Aa1_");
    console.log("Local Docker credentials are ready.");
    break;
  case "migrate": {
    const env = { ...databaseEnvironment(), NODE_ENV: "test", ALLOW_DEV_ACCOUNT_PROVISION: "true" };
    for (const [, key, file] of accounts) env[key] = readSecret(file);
    execFileSync("npm", ["run", "db:migrate:deploy"], { stdio: "inherit", env });
    execFileSync("npm", ["run", "auth:provision"], { stdio: "inherit", env });
    break;
  }
  case "start":
    execve(process.execPath, [process.execPath, "node_modules/next/dist/bin/next", "start", "--hostname", "0.0.0.0", "--port", "3000"], {
      ...databaseEnvironment(),
      AUTH_SECRET: readSecret(authSecret),
      AUTH_TRUST_PROXY_HEADERS: "false",
      NODE_ENV: "production",
      FILE_STORAGE_ALLOW_LOCAL_TEST: "true",
    });
    break;
  case "accounts":
    for (const [username, , file] of accounts) console.log(`${username}\t${readSecret(file)}`);
    break;
  default:
    throw new Error("Choose credentials, migrate, start, or accounts.");
}
