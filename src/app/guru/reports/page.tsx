import { Suspense } from "react";
import { ProgressReports } from "@/components/guru/reports/progress-reports";
import { RoleGate } from "@/components/auth/role-gate";
export const metadata = { title: "Laporan Perkembangan" };
export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <main className="p-8" aria-busy="true">
          Memuat laporan…
        </main>
      }
    >
      <RoleGate role="teacher">
        <ProgressReports />
      </RoleGate>
    </Suspense>
  );
}
