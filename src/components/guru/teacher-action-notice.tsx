import type { ReactNode } from "react";

export function TeacherActionNotice({
  kind,
  message,
  onClose,
  children,
}: {
  kind: "success" | "error";
  message: string;
  onClose: () => void;
  children?: ReactNode;
}) {
  const failed = kind === "error";
  return (
    <div
      role={failed ? "alert" : "status"}
      className={`fixed left-4 right-4 top-20 z-40 flex items-start justify-between gap-3 rounded-2xl border bg-white p-4 text-sm shadow-lg sm:left-auto sm:w-96 ${failed ? "border-red-200 text-red-800" : "border-green-200 text-green-800"}`}
    >
      <div className="min-w-0 break-words">
        <p className="font-medium">{message}</p>
        {children}
      </div>
      <button
        type="button"
        aria-label="Tutup notifikasi"
        onClick={onClose}
        className="grid size-8 shrink-0 place-items-center rounded-lg hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-primary"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}
