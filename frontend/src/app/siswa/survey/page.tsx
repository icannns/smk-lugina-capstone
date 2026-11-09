import { Suspense } from "react";
import { StudentSurvey } from "@/components/siswa/survey/student-survey";
export default function Page() {
  return (
    <Suspense>
      <StudentSurvey />
    </Suspense>
  );
}
