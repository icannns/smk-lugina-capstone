import { Suspense } from "react";
import { ProgressReports } from "@/components/guru/reports/progress-reports";
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
      <ProgressReports />
    </Suspense>
  );
}
