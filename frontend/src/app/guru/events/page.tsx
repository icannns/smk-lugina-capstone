import type { Metadata } from "next";
import { Suspense } from "react";
import { EventManagement } from "@/components/guru/events/event-management";
import { RoleGate } from "@/components/auth/role-gate";

export const metadata: Metadata = { title: "Create Event" };

export default function EventsPage() {
  return (
    <Suspense
      fallback={
        <main
          aria-busy="true"
          className="grid min-h-dvh place-items-center bg-gray-50 text-sm text-secondary"
        >
          Memuat Event Management…
        </main>
      }
    >
      <RoleGate role="teacher">
        <EventManagement />
      </RoleGate>
    </Suspense>
  );
}
