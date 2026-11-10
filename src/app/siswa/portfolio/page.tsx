import { Suspense } from "react";
import { StudentPortfolio } from "@/components/siswa/portfolio/student-portfolio";
import { RoleGate } from "@/components/auth/role-gate";
export default function Page() {
  return (
    <Suspense>
      <RoleGate role="student">
        <StudentPortfolio />
      </RoleGate>
    </Suspense>
  );
}
