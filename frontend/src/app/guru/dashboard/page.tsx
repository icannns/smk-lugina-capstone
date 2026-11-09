import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardEntry } from "@/components/guru/dashboard";
import { RoleGate } from "@/components/auth/role-gate";

export const metadata: Metadata = { title: "Dashboard Guru" };

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <main
          aria-busy="true"
          className="grid min-h-dvh place-items-center bg-gray-50 text-sm text-secondary"
        >
          Memuat Dashboard Guru…
        </main>
      }
    >
      <RoleGate role="teacher">
        <DashboardEntry />
      </RoleGate>
    </Suspense>
  );
}
