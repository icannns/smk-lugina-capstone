import { TeacherProfile } from "@/components/guru/profile/teacher-profile";
import { RoleGate } from "@/components/auth/role-gate";
export const metadata = { title: "Profil Guru" };
export default function ProfilePage() {
  return (
    <RoleGate role="teacher">
      <TeacherProfile />
    </RoleGate>
  );
}
