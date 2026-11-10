import { Suspense } from "react";
import { Monitoring } from "@/components/guru/monitoring/monitoring";
import { RoleGate } from "@/components/auth/role-gate";
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
      <RoleGate role="teacher">
        <Monitoring />
      </RoleGate>
    </Suspense>
  );
}
