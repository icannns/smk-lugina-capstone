import { requireOwnedRubric } from "@/server/auth/authorization";
import { authError, privateJson } from "@/server/auth/http";
export async function GET(_request: Request, context: { params: Promise<{ rubricId: string }> }) {
  try { const { rubricId } = await context.params; const { rubric } = await requireOwnedRubric(rubricId); return privateJson({ rubric: { id: rubric.id, title: rubric.title } }); }
  catch (error) { return authError(error); }
}
