import { Suspense } from "react";
import { StudentWorkspace } from "@/components/siswa/workspace/student-workspace";
import { RoleGate } from "@/components/auth/role-gate";
export default function Page() {
  return (
    <Suspense>
      <RoleGate role="student">
        <StudentWorkspace />
      </RoleGate>
    </Suspense>
  );
}
