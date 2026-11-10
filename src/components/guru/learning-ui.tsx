"use client";
import type { ReactNode } from "react";
import { DesignIcon, controlClass } from "./design-ui";
import type { ManagedEvent } from "@/lib/guru/event-types";
import { submissionLabels } from "@/lib/guru/learning-selectors";
export function FeatureHeading({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[30px] font-semibold leading-[38px] tracking-[-.75px]">
          {title}
        </h1>
        <p className="mt-1 text-sm leading-5 text-secondary">{description}</p>
      </div>
      {children}
    </header>
  );
}
export function EventSelect({
  events,
  value,
  onChange,
}: {
  events: ManagedEvent[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      aria-label="Pilih event"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${controlClass} !w-full sm:!w-72 !border-transparent`}
    >
      {events.map((e) => (
        <option key={e.id} value={e.id}>
          {e.title}
        </option>
      ))}
    </select>
  );
}
export function StudentAvatar({
  name,
  small = false,
}: {
  name: string;
  small?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={`inline-grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#3b82f6] to-[#06b6a4] font-semibold text-white ${small ? "size-7 text-[10px]" : "size-11 text-sm"}`}
    >
      {name
        .split(" ")
        .slice(0, 2)
        .map((s) => s[0])
        .join("")}
    </span>
  );
}
export function StatusBadge({
  status,
  children,
}: {
  status:
    keyof typeof submissionLabels | "complete" | "partial" | "working" | "none";
  children?: ReactNode;
}) {
  const style =
    status === "reviewed" || status === "complete"
      ? "bg-green-50 text-green-700"
      : status === "revision"
        ? "bg-red-50 text-red-600"
        : status === "survey" || status === "partial"
          ? "bg-amber-50 text-amber-700"
          : status === "pending"
            ? "bg-blue-50 text-primary"
            : status === "working"
              ? "bg-teal-50 text-teal-700"
              : "bg-gray-100 text-gray-600";
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-[11px] leading-4 ${style}`}
    >
      {children ?? submissionLabels[status as keyof typeof submissionLabels]}
    </span>
  );
}
export function SearchField({
  value,
  onChange,
  placeholder = "Cari siswa",
  frame = "291:21739",
  icon = "imgIcon",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  frame?: string;
  icon?: string;
}) {
  return (
    <label className="relative block min-w-0 flex-1 sm:max-w-80">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
        <DesignIcon frame={frame} name={icon} />
      </span>
      <input
        aria-label={placeholder}
        className={`${controlClass} pl-9`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
export function Pagination({
  total,
  page,
  size,
  onChange,
}: {
  total: number;
  page: number;
  size: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / size));
  return (
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-4 text-xs text-secondary">
      <span>
        Menampilkan {total ? Math.min(page * size, total) : 0} dari {total}{" "}
        {"siswa"}
      </span>
      {pages > 1 && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onChange(page - 1)}
            className="rounded-lg border border-line px-3 py-2 disabled:opacity-40"
          >
            Sebelumnya
          </button>
          <span>
            {page} / {pages}
          </span>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() => onChange(page + 1)}
            className="rounded-lg border border-line px-3 py-2 disabled:opacity-40"
          >
            Berikutnya
          </button>
        </div>
      )}
    </footer>
  );
}
export function EmptyRows({ children }: { children: ReactNode }) {
  return (
    <div className="p-10 text-center text-sm text-secondary" role="status">
      {children}
    </div>
  );
}
