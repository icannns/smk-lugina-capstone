import { auth } from "@/auth";
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";
export async function proxy(request: NextRequest, event: NextFetchEvent) {
  // Lazy Auth.js initialization returns an async wrapper; await it before invoking.
  const run = await auth((_request: NextRequest, _event: NextFetchEvent) => {
    void _request; void _event;
    return NextResponse.next();
  });
  const response = await run(request, event);
  if (response) response.headers.set("Cache-Control", "private, no-store");
  return response;
}
// Existing Figma assets live under public/guru and are shared by Student UI.
// Match pages, never those static image/font URLs (otherwise role redirects break images).
export const config = { matcher: [
  "/guru/((?!.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico|avif|woff|woff2)$).*)",
  "/siswa/((?!.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico|avif|woff|woff2)$).*)",
] };
