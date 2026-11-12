import "server-only";
import { auth } from "@/auth";
import { getDatabase } from "../db";
import { principalSelect, validProfile, type Principal } from "./principal";
export class AuthorizationError extends Error {
  constructor(public status: 401 | 403, public code: "UNAUTHORIZED" | "FORBIDDEN") { super(code); }
}
export async function requirePrincipal(role?: "TEACHER" | "STUDENT"): Promise<Principal> {
  const session = await auth();
  if (!session?.user.id) throw new AuthorizationError(401, "UNAUTHORIZED");
  const user = await getDatabase().user.findUnique({ where: { id: session.user.id, disabledAt: null }, select: principalSelect });
  if (!user || !validProfile(user)) throw new AuthorizationError(401, "UNAUTHORIZED");
  if (role && user.role !== role) throw new AuthorizationError(403, "FORBIDDEN");
  return user;
}
export async function requireOwnedEvent(eventId: string) {
  const user = await requirePrincipal("TEACHER");
  const event = await getDatabase().event.findFirst({ where: { id: eventId, ownerTeacherId: user.teacher!.id } });
  if (!event) throw new AuthorizationError(403, "FORBIDDEN");
  return { user, event };
}
export async function requireOwnedRubric(rubricId: string) {
  const user = await requirePrincipal("TEACHER");
  const rubric = await getDatabase().rubric.findFirst({ where: { id: rubricId, ownerTeacherId: user.teacher!.id } });
  if (!rubric) throw new AuthorizationError(403, "FORBIDDEN");
  return { user, rubric };
}
export async function requireOwnedAssessment(assessmentId: string) {
  const user = await requirePrincipal("TEACHER");
  const assessment = await getDatabase().assessment.findFirst({ where: { id: assessmentId, event: { ownerTeacherId: user.teacher!.id } } });
  if (!assessment) throw new AuthorizationError(403, "FORBIDDEN");
  return { user, assessment };
}
