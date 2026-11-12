import type { ManagedEvent } from "../guru/event-types";
import type { AssessmentChanges, GuruRubric, TeacherProfile } from "../guru/teacher-types";
import type { StudentUIState } from "../siswa/student-types";
import type { StudentSession } from "../guru/student-types";
export type WorkspaceSnapshot = {
  accountId: string;
  serverTime: string;
  working: Record<string, ManagedEvent>;
  saved: Record<string, ManagedEvent>;
  published: Record<string, ManagedEvent>;
  rubrics: Record<string, GuruRubric>;
  learning: AssessmentChanges;
  profile: TeacherProfile;
  studentUI: StudentUIState;
  studentReviews: StudentSession;
  deleted: string[];
  storageError: string;
};
