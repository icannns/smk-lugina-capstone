import { randomUUID } from "node:crypto";
import { getDatabase } from "@/server/db";
import { hashPassword } from "@/server/auth/password";
import { registrationInput } from "@/server/auth/validation";
import { consumeAuthLimit } from "@/server/auth/rate-limit";
import { privateJson, readSmallJson, sameOrigin } from "@/server/auth/http";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return privateJson({ error: { code: "FORBIDDEN", message: "Asal permintaan tidak diizinkan." } }, 403);
  let body: unknown;
  try { body = await readSmallJson(request); } catch { return privateJson({ error: { code: "INVALID_INPUT", message: "Data pendaftaran tidak valid." } }, 400); }
  const input = registrationInput(body);
  if (!input) return privateJson({ error: { code: "INVALID_INPUT", message: "Periksa nama, email, dan konfirmasi kata sandi. Role tidak dapat dipilih." } }, 400);
  try {
    if (!await consumeAuthLimit("register", input.email, request))
      return privateJson({ error: { code: "RATE_LIMITED", message: "Terlalu banyak percobaan. Coba lagi setelah 15 menit." } }, 429);
    const id = randomUUID(); const passwordHash = await hashPassword(input.password);
    await getDatabase().user.create({ data: {
      id: `registered-user-${id}`, name: input.name, email: input.email, role: "STUDENT", passwordHash,
      passwordChangedAt: new Date(), student: { create: { id: `registered-${id}` } },
    } });
    return privateJson({ created: true }, 201);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002")
      return privateJson({ error: { code: "REGISTRATION_UNAVAILABLE", message: "Pendaftaran tidak dapat diselesaikan dengan email ini." } }, 409);
    return privateJson({ error: { code: "UNAVAILABLE", message: "Pendaftaran sementara tidak tersedia." } }, 503);
  }
}
