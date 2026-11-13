import { endpoint } from "@/server/domain/common";
import {
  submissionTuple,
  uploadFile,
  listSubmissionFiles,
} from "@/server/files/service";

type Context = { params: Promise<{ submissionId: string }> };
export async function POST(request: Request, context: Context) {
  return endpoint(
    request,
    async (user) =>
      uploadFile(
        user,
        await submissionTuple(user, (await context.params).submissionId),
        request,
      ),
    "STUDENT",
    201,
  );
}
export async function GET(request: Request, context: Context) {
  return endpoint(request, async (user) =>
    listSubmissionFiles(user, (await context.params).submissionId),
  );
}
