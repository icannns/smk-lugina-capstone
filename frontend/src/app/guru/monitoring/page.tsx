import { Suspense } from "react";
import { Monitoring } from "@/components/guru/monitoring/monitoring";
export const metadata = { title: "Monitoring Progres" };
export default function MonitoringPage() {
  return (
    <Suspense
      fallback={
        <main className="p-8 text-sm" aria-busy="true">
          Memuat monitoring…
        </main>
      }
    >
      <Monitoring />
    </Suspense>
  );
}
