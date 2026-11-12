import { requirePrincipal, AuthorizationError } from "@/server/auth/authorization";
import { authError, privateJson } from "@/server/auth/http";
export async function GET(request: Request) {
  try {
    const user = await requirePrincipal();
    const requested = new URL(request.url).searchParams.get("userId");
    if (requested && requested !== user.id) throw new AuthorizationError(403, "FORBIDDEN");
    return privateJson({ user });
  } catch (error) { return authError(error); }
}
