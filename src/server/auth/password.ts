import { hash, verify, argon2id } from "argon2";
import { randomBytes } from "node:crypto";
const options = { type: argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;
export function hashPassword(password: string) { return hash(password, options); }
let dummy: Promise<string> | undefined;
export async function verifyPassword(password: string, encoded: string | null) {
  // Unknown users still incur an Argon2 verification, without a fixed demo password.
  dummy ??= hashPassword(randomBytes(32).toString("base64url"));
  try { return await verify(encoded ?? await dummy, password) && encoded !== null; }
  catch { return false; }
}
