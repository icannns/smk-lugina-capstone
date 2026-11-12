import { requirePrincipal, AuthorizationError } from "@/server/auth/authorization";
import { getDatabase } from "@/server/db";
import { authError, privateJson } from "@/server/auth/http";
export async function GET(_request: Request, context: { params: Promise<{ studentId: string }> }) {
  try {
    const { studentId } = await context.params; const user = await requirePrincipal("TEACHER");
    const student = await getDatabase().studentProfile.findFirst({ where: { id: studentId, enrollments: { some: { event: { ownerTeacherId: user.teacher!.id } } } }, select: { id: true, user: { select: { name: true } } } });
    if (!student) throw new AuthorizationError(403, "FORBIDDEN");
    return privateJson({ student });
  } catch (error) { return authError(error); }
}
