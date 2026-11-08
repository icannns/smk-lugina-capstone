import type { Metadata } from "next";
import { Suspense } from "react";
import { EventWizard } from "@/components/guru/events/wizard/event-wizard";

export const metadata: Metadata = { title: "Buat Event" };
export default function CreateEventPage() {
  return (
    <Suspense
      fallback={
        <main
          className="grid min-h-dvh place-items-center text-sm text-secondary"
          aria-busy="true"
        >
          Memuat wizard…
        </main>
      }
    >
      <EventWizard />
    </Suspense>
  );
}
