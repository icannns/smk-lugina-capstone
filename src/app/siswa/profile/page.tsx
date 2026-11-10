import { StudentProfile } from "@/components/siswa/profile/student-profile";
import { RoleGate } from "@/components/auth/role-gate";
export default function Page() {
  return (
    <RoleGate role="student">
      <StudentProfile />
    </RoleGate>
  );
}
