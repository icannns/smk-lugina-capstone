"use client";

import { useEffect, useId, useRef } from "react";
import { DashboardButton } from "./dashboard-ui";
import type { DashboardAction } from "@/lib/guru/dashboard-data";

export type DashboardDialogState = DashboardAction & { deleteDraft?: boolean };

export function DashboardDialog({
  action,
  onClose,
  onDelete,
}: {
  action: DashboardDialogState | null;
  onClose: () => void;
  onDelete: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!action || !dialog) return;
    const previous = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, [action]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={onClose}
      className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-48px)] max-w-lg overflow-y-auto rounded-2xl border border-line bg-white p-6 text-foreground shadow-xl backdrop:bg-slate-950/35 sm:p-8"
    >
      <p className="mb-2 text-xs font-semibold text-primary">
        PROTOTIPE · DATA CONTOH
      </p>
      <h2 id={titleId} className="text-xl font-semibold leading-7">
        {action?.title}
      </h2>
      <p id={descriptionId} className="mt-3 text-sm leading-6 text-secondary">
        {action?.description}
      </p>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <DashboardButton variant="outline" onClick={onClose} autoFocus>
          {action?.deleteDraft ? "Batal" : "Tutup"}
        </DashboardButton>
        {action?.deleteDraft && (
          <DashboardButton variant="danger" onClick={onDelete}>
            Ya, Hapus Draf
          </DashboardButton>
        )}
      </div>
    </dialog>
  );
}
