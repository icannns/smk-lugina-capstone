import { randomBytes, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { linkSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { execve } from "node:process";

const { registrationPasswordError } = createRequire(import.meta.url)("../src/lib/auth/validation.ts");

const dbPassword = "/run/bojong/db-auth/password";
const authSecret = "/run/bojong/app-auth/session-secret";
const demoPasswordMode = "/run/bojong/app-auth/demo-password-mode";
const accounts = [
  ["rina.guru", "TEST_TEACHER_PASSWORD", "/run/bojong/app-auth/teacher"],
  ["dimas", "TEST_DIMAS_PASSWORD", "/run/bojong/app-auth/dimas"],
  ["aisyah", "TEST_AISYAH_PASSWORD", "/run/bojong/app-auth/aisyah"],
];

function readOptional(file) {
  try {
    return readFileSync(file, "utf8").replace(/\r?\n$/, "");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function readSecret(file) {
  const value = readOptional(file);
  if (!value || !/^[A-Za-z0-9_-]{43,64}$/.test(value) || /REPLACE|CHANGEME/i.test(value)) {
    throw new Error("Invalid local credential file. Check the Docker credential volumes.");
  }
  return value;
}

function createSecret(file, value) {
  const temporary = `${file}.${randomUUID()}.tmp`;
  writeFileSync(temporary, `${value}\n`, { mode: 0o600, flag: "wx" });
  try {
    linkSync(temporary, file);
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  } finally {
    rmSync(temporary);
  }
}

function createRandomSecret(file, prefix = "") {
  if (readOptional(file) === undefined) {
    let value;
    do {
      value = prefix + randomBytes(32).toString("base64url");
    } while (/REPLACE|CHANGEME/i.test(value));
    createSecret(file, value);
  }
  readSecret(file);
}

function validateSharedPassword(password) {
  if (password.length < 12 || password.length > 128 || /[\u0000\r\n]/.test(password) ||
      password !== password.trim() || registrationPasswordError(password)) {
    throw new Error("Use a single demo password of 12–128 characters that satisfies the account password rules.");
  }
}

function getSharedPassword() {
  const value = readOptional(demoPasswordMode);
  if (value === undefined || value === "random") return undefined;
  validateSharedPassword(value);
  return value;
}

function setSharedPassword() {
  const password = readOptional(0) ?? "";
  validateSharedPassword(password);
  if (accounts.some(([, , file]) => readOptional(file) !== undefined)) {
    throw new Error("This Docker project already has demo credentials. Use a new Compose project.");
  }
  createSecret(demoPasswordMode, password);
  if (getSharedPassword() !== password) {
    throw new Error("This Docker project already has demo credentials. Use a new Compose project.");
  }
}

function databaseEnvironment() {
  const url = new URL("postgresql://bojong_local@127.0.0.1:5432/bojong_united_test_docker?schema=public");
  url.password = readSecret(dbPassword);
  return { ...process.env, DATABASE_URL: url.href, ALLOW_DEV_SEED: "true" };
}

switch (process.argv[2]) {
  case "credentials":
    createRandomSecret(dbPassword);
    createRandomSecret(authSecret);
    if (readOptional(demoPasswordMode) === undefined) createSecret(demoPasswordMode, "random");
    if (!getSharedPassword()) {
      for (const [, , file] of accounts) createRandomSecret(file, "Aa1_");
    }
    console.log("Local Docker credentials are ready.");
    break;
  case "shared-credentials":
    setSharedPassword();
    console.log("Shared demo password configured for this Docker project.");
    break;
  case "migrate": {
    const sharedPassword = getSharedPassword();
    const env = {
      ...databaseEnvironment(),
      NODE_ENV: "test",
      ALLOW_DEV_ACCOUNT_PROVISION: "true",
      BOJONG_DOCKER_SHARED_DEMO: sharedPassword ? "true" : "false",
    };
    for (const [, key, file] of accounts) env[key] = sharedPassword ?? readSecret(file);
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
  case "accounts": {
    const sharedPassword = getSharedPassword();
    for (const [username, , file] of accounts) console.log(`${username}\t${sharedPassword ?? readSecret(file)}`);
    break;
  }
  default:
    throw new Error("Choose credentials, shared-credentials, migrate, start, or accounts.");
}
