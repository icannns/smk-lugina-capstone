import type { Metadata } from "next";
import { Suspense } from "react";
import { EventManagement } from "@/components/guru/events/event-management";

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
      <EventManagement />
    </Suspense>
  );
}
