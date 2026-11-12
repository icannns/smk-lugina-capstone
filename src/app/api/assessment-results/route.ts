import { requirePrincipal, AuthorizationError } from "@/server/auth/authorization";
import { authError, privateJson } from "@/server/auth/http";
import { getDatabase } from "@/server/db";
export async function GET(request: Request) {
  try {
    const user = await requirePrincipal();
    const params = new URL(request.url).searchParams;
    const requested = params.get("studentId");
    if (user.role === "STUDENT" && requested && requested !== user.student!.id) throw new AuthorizationError(403, "FORBIDDEN");
    const records = await getDatabase().externalAssessmentReference.findMany({
      where: user.role === "STUDENT" ? { studentId: user.student!.id } : {
        enrollment: { event: { ownerTeacherId: user.teacher!.id } }, ...(requested ? { studentId: requested } : {}),
      },
      select: { id: true, studentId: true, eventId: true, type: true, status: true, title: true, source: true,
        scoreValue: true, scoreMaximum: true, summary: true, feedback: true, completedAt: true },
      orderBy: { recordedAt: "desc" }, take: 100,
    });
    return privateJson({ records: records.map((r) => ({ ...r, scoreValue: r.scoreValue?.toString() ?? null, scoreMaximum: r.scoreMaximum?.toString() ?? null })) });
  } catch (error) { return authError(error); }
}
