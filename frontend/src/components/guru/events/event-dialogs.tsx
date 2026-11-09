"use client";

import { useEffect, useId, useRef } from "react";
import type { EventMilestone, ManagedEvent } from "@/lib/guru/event-types";

type Props = { onClose: () => void } & (
  | { kind: "delete"; event: ManagedEvent; onDelete: () => void }
  | {
      kind: "deadline";
      milestone: EventMilestone;
      onSave: (value: string) => void;
    }
);

export function EventDialog(props: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const title = useId();
  const description = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
      else document.getElementById("events-main")?.focus();
    };
  }, []);
  const deleting = props.kind === "delete";
  return (
    <dialog
      ref={ref}
      aria-labelledby={title}
      aria-describedby={description}
      onCancel={props.onClose}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = event.currentTarget.querySelectorAll<HTMLElement>(
          "button:not([disabled]), input:not([disabled])",
        );
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      data-figma-node={deleting ? "291:18301" : undefined}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-40px)] max-w-[440px] overflow-y-auto rounded-xl border border-line bg-white p-6 text-foreground backdrop:bg-[rgba(15,23,41,0.5)]"
    >
      <div className="flex flex-col items-start gap-4">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold leading-4 ${deleting ? "bg-red-50 text-danger" : "bg-primary-soft text-primary"}`}
        >
          {deleting ? "Konfirmasi Penghapusan" : "Prototipe · Perubahan lokal"}
        </span>
        <h2 id={title} className="text-lg font-bold leading-[22px]">
          {deleting ? "Hapus Draf Event?" : "Ubah deadline"}
        </h2>
        {props.kind === "delete" ? (
          <>
            <p id={description} className="text-sm leading-5 text-secondary">
              Draf event &quot;{props.event.title || "Draf tanpa judul"}&quot;
              beserta seluruh pengaturan milestone yang tersimpan akan dihapus
              secara permanen. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex w-full flex-wrap justify-end gap-3">
              <button
                autoFocus
                type="button"
                onClick={props.onClose}
                className="h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={props.onDelete}
                className="h-10 rounded-lg bg-danger px-4 text-sm font-semibold text-white hover:bg-red-700"
              >
                Ya, Hapus Draf
              </button>
            </div>
          </>
        ) : (
          <form
            className="w-full"
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              props.onSave(String(data.get("deadline")));
            }}
          >
            <p id={description} className="text-sm leading-5 text-secondary">
              {props.milestone.title}. Waktu dalam WIB. Perubahan hanya berlaku
              pada sesi demo ini dan digunakan juga oleh Monitoring. Tidak ada
              perubahan server.
            </p>
            <label className="mt-4 block text-sm font-medium">
              Deadline (WIB)
              <input
                type="datetime-local"
                name="deadline"
                required
                defaultValue={props.milestone.deadline}
                className="mt-2 h-11 w-full min-w-0 rounded-control border border-line bg-white px-3 text-sm focus:outline-2 focus:outline-primary"
              />
            </label>
            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                autoFocus
                type="button"
                onClick={props.onClose}
                className="h-10 rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-700"
              >
                Batal
              </button>
              <button
                type="submit"
                className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover"
              >
                Simpan deadline
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}
