import { endpoint } from "@/server/domain/common";
import { studentTuple } from "@/server/files/permissions";
import { uploadFile } from "@/server/files/service";

export async function POST(
  request: Request,
  context: { params: Promise<{ eventId: string; milestoneId: string }> },
) {
  return endpoint(
    request,
    async (user) => {
      const p = await context.params;
      return uploadFile(
        user,
        studentTuple(user, p.eventId, p.milestoneId),
        request,
      );
    },
    "STUDENT",
    201,
  );
}
