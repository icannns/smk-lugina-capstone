import { Suspense } from "react";
import { StudentSurvey } from "@/components/siswa/survey/student-survey";
import { RoleGate } from "@/components/auth/role-gate";
export default function Page() {
  return (
    <Suspense>
      <RoleGate role="student">
        <StudentSurvey />
      </RoleGate>
    </Suspense>
  );
}
