import { NextRequest } from "next/server";
import { handlers } from "@/auth";
export const GET = handlers.GET;
export async function POST(request: NextRequest) {
  const reader = request.body?.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  if (reader) for (;;) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.length;
    if (size > 16384) { await reader.cancel(); return Response.json({ error: "REQUEST_TOO_LARGE" }, { status: 413 }); }
    chunks.push(value);
  }
  return handlers.POST(new NextRequest(request.url, { method: "POST", headers: request.headers, body: Buffer.concat(chunks) }));
}
