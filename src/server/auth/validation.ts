import { registrationPasswordError } from "../../lib/auth/validation";
export function loginInput(input: Record<string, unknown>) {
  const identifier = typeof input.identifier === "string" ? input.identifier.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  if (!identifier || identifier.length > 320 || !password || password.length > 128) return null;
  return { identifier, password, remember: input.remember === "true" };
}
export function registrationInput(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const body = input as Record<string, unknown>;
  if (Object.keys(body).some((key) => !["name", "email", "password", "confirm"].includes(key))) return null;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (name.length < 2 || name.length > 100 || email.length > 320 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length > 128 ||
      registrationPasswordError(password) || body.confirm !== password) return null;
  return { name, email, password };
}
