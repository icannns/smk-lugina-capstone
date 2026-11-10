import Link from "next/link";
import type { ManagedEvent } from "@/lib/guru/event-types";
import { DashboardShell } from "../../dashboard-shell";
import { designNavigation, DesignIcon } from "../../design-ui";
import {
  DashboardDialog,
  type DashboardDialogState,
} from "../../dashboard-dialog";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { monitoringHref } from "@/lib/guru/learning-selectors";
export function EventComplete({
  event,
  storageError,
}: {
  event: ManagedEvent;
  storageError: string;
}) {
  const router = useRouter();
  const [action, setAction] = useState<DashboardDialogState | null>(null);
  return (
    <>
      <DashboardShell
        empty
        activePage="events"
        iconOverrides={designNavigation("291:20395")}
        onAction={setAction}
        mainId="complete-main"
      >
        <main
          id="complete-main"
          data-figma-node="291:20395"
          className="flex min-h-[calc(100dvh-64px)] flex-col items-center justify-center px-5 py-16 text-center"
        >
          <div className="mb-6 grid size-16 place-items-center rounded-full bg-green-50">
            <DesignIcon frame="291:20395" name="imgFrame" />
          </div>
          <h1 className="text-[30px] font-semibold leading-10">Event terbit</h1>
          <p className="mt-4 max-w-[540px] text-base leading-5 text-secondary">
            {event.title} berhasil diterbitkan sebagai event contoh. Survei
            belum terhubung dan tidak diterbitkan oleh demo ini.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <Link
              href={`/guru/events?event=${encodeURIComponent(event.id)}`}
              className="inline-flex h-10 items-center rounded-control bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
            >
              Lihat Detail Event
            </Link>
            <button
              type="button"
              onClick={() => router.push(monitoringHref(event.id))}
              className="flex h-10 items-center gap-2 rounded-control border border-line bg-white px-4 text-sm font-medium"
            >
              <DesignIcon frame="291:20395" name="imgFrame1" />
              Buka Monitoring
            </button>
          </div>
          {storageError && (
            <p role="alert" className="mt-4 max-w-lg text-sm text-amber-800">
              {storageError}
            </p>
          )}
          <p className="mt-4 text-xs text-muted">
            Prototipe · Tidak ada publikasi server atau sertifikat resmi.
          </p>
        </main>
      </DashboardShell>
      <DashboardDialog
        action={action}
        onClose={() => setAction(null)}
        onDelete={() => setAction(null)}
      />
    </>
  );
}
