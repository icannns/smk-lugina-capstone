import { Suspense } from "react";
import { StudentWork } from "@/components/guru/work/student-work";
import { RoleGate } from "@/components/auth/role-gate";
export const metadata = { title: "Karya Siswa" };
export default function WorkPage() {
  return (
    <Suspense
      fallback={
        <main className="p-8" aria-busy="true">
          Memuat karya…
        </main>
      }
    >
      <RoleGate role="teacher">
        <StudentWork />
      </RoleGate>
    </Suspense>
  );
}
