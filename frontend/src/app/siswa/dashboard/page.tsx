import { StudentDashboard } from "@/components/siswa/student-dashboard";
import { RoleGate } from "@/components/auth/role-gate";
export const metadata = { title: "Dashboard Siswa" };
export default function StudentDashboardPage() {
  return (
    <RoleGate role="student">
      <StudentDashboard />
    </RoleGate>
  );
}
