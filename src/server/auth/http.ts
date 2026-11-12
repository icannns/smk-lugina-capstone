import { AuthorizationError } from "./authorization";
export const privateHeaders = { "Cache-Control": "private, no-store", "Vary": "Cookie" };
export function privateJson(value: unknown, status = 200) { return Response.json(value, { status, headers: privateHeaders }); }
export function authError(error: unknown) {
  if (error instanceof AuthorizationError)
    return privateJson({ error: { code: error.code, message: error.status === 401 ? "Silakan masuk kembali." : "Akses tidak diizinkan." } }, error.status);
  return privateJson({ error: { code: "UNAVAILABLE", message: "Layanan sementara tidak tersedia." } }, 503);
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin === new URL(process.env.AUTH_URL || request.url).origin);
}
export async function readSmallJson(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new Error("Invalid body");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Empty body");
  const chunks: Uint8Array[] = []; let length = 0;
  for (;;) { const { value, done } = await reader.read(); if (done) break;
    length += value.length; if (length > 16384) { await reader.cancel(); throw new Error("Body too large"); } chunks.push(value); }
  return JSON.parse(Buffer.concat(chunks).toString("utf-8"));
}
