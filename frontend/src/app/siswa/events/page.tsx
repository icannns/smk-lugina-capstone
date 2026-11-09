import { Suspense } from "react";
import { StudentEvents } from "@/components/siswa/events/student-events";
import { RoleGate } from "@/components/auth/role-gate";
export const metadata = { title: "Jelajah Event" };
export default function StudentEventsPage() {
  return (
    <Suspense
      fallback={
        <main className="p-8" aria-busy="true">
          Memuat event…
        </main>
      }
    >
      <RoleGate role="student">
        <StudentEvents />
      </RoleGate>
    </Suspense>
  );
}
