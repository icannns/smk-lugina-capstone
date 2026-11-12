import { requirePrincipal, AuthorizationError } from "@/server/auth/authorization";
import { authError, privateJson } from "@/server/auth/http";
import { getDatabase } from "@/server/db";
export async function GET(_request: Request, context: { params: Promise<{ eventId: string }> }) {
  try {
    const user = await requirePrincipal(); const { eventId } = await context.params;
    const event = await getDatabase().event.findFirst({
      where: { id: eventId, ...(user.role === "TEACHER" ? { ownerTeacherId: user.teacher!.id } : { enrollments: { some: { studentId: user.student!.id } } }) },
      select: { id: true, title: true, status: true },
    });
    if (!event) throw new AuthorizationError(403, "FORBIDDEN");
    return privateJson({ event });
  } catch (error) { return authError(error); }
}
