import { requirePrincipal, AuthorizationError } from "@/server/auth/authorization";
import { getDatabase } from "@/server/db";
import { authError, privateJson } from "@/server/auth/http";
export async function GET(_request: Request, context: { params: Promise<{ assessmentId: string }> }) {
  try {
    const { assessmentId } = await context.params; const user = await requirePrincipal();
    const assessment = await getDatabase().assessment.findFirst({ where: { id: assessmentId,
      ...(user.role === "TEACHER" ? { event: { ownerTeacherId: user.teacher!.id } } : { submissionVersion: { submission: { studentId: user.student!.id } } }),
    }, select: { id: true, eventId: true, submissionVersionId: true, assessedAt: true } });
    if (!assessment) throw new AuthorizationError(403, "FORBIDDEN");
    return privateJson({ assessment });
  } catch (error) { return authError(error); }
}
