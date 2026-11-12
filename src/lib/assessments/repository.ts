import { mockAssessmentRecords } from "./mock-data";
import { scopedAssessments } from "./selectors";
import type { AssessmentRepository } from "./types";

/** Local adapter only: no fetch, endpoint, storage, or external service. */
export const mockAssessmentRepository: AssessmentRepository = {
  async list(scope, signal) {
    signal.throwIfAborted();
    const records = scopedAssessments(mockAssessmentRecords, scope);
    // Keep the asynchronous boundary replaceable by a future REST adapter.
    await Promise.resolve();
    signal.throwIfAborted();
    return records;
  },
};
