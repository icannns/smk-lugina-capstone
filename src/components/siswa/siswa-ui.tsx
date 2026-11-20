"use client";
import Link from "next/link";
import { eventCompletionLabels, submissionLabels } from "@/lib/guru/learning-selectors";
import {
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
export function StudentBadge({
  status,
  children,
}: {
  status: keyof typeof submissionLabels | "complete" | "partial" | "working";
  children?: ReactNode;
}) {
  const tone =
    status === "reviewed" || status === "complete"
      ? "bg-green-50 text-green-700"
      : status === "revision"
        ? "bg-amber-50 text-amber-700"
        : ["survey", "pending"].includes(status)
          ? "bg-blue-50 text-primary"
          : status === "working"
            ? "bg-teal-50 text-teal-700"
            : "bg-gray-100 text-gray-600";
  return (
    <span
      className={`inline-flex max-w-full items-center self-start rounded-full px-2 py-0.5 text-[11px] leading-4 ${tone}`}
    >
      {children ?? submissionLabels[status as keyof typeof submissionLabels]}
    </span>
  );
}

export function StudentEventCompletionBadge({ status }: { status: keyof typeof eventCompletionLabels }) {
  const tone = status === "awaitingAssessment" ? "pending" : status === "none" ? "missing" : status;
  return <StudentBadge status={tone}>{eventCompletionLabels[status]}</StudentBadge>;
}

export const studentControl =
  "h-10 w-full min-w-0 rounded-xl border border-line bg-white px-3 text-sm focus:outline-2 focus:outline-primary disabled:bg-gray-50 disabled:text-secondary";
export function SiswaButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "outline" | "plain";
}) {
  return (
    <button
      {...props}
      type={props.type ?? "button"}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 ${variant === "primary" ? "border border-primary bg-primary text-white hover:bg-primary-hover" : variant === "outline" ? "border border-line bg-white hover:bg-gray-50" : "bg-white hover:bg-gray-50"} ${className}`}
    >
      {children}
    </button>
  );
}
export function SiswaLink({
  href,
  children,
  primary = false,
  className = "",
}: {
  href: string;
  children: ReactNode;
  primary?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium ${primary ? "border-primary bg-primary text-white hover:bg-primary-hover" : "border-line bg-white hover:bg-gray-50"} ${className}`}
    >
      {children}
    </Link>
  );
}
export function Breadcrumb({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-2 flex flex-wrap items-center gap-2 text-xs text-secondary"
    >
      {items.map((item, i) => (
        <span key={i} className="contents">
          {i > 0 && <span aria-hidden>›</span>}
          {item.href ? (
            <Link href={item.href} className="hover:text-primary">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
export function StudentNotice({
  children,
  tone = "blue",
}: {
  children: ReactNode;
  tone?: "blue" | "green" | "amber";
}) {
  return (
    <div
      role="status"
      className={`rounded-2xl border p-4 text-sm leading-5 ${tone === "green" ? "border-green-200 bg-green-50 text-emerald-700" : tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-blue-200 bg-blue-50 text-primary"}`}
    >
      {children}
    </div>
  );
}
export function SummaryRows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="mt-3 space-y-3 text-xs">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex flex-wrap justify-between gap-x-3 gap-y-1"
        >
          <dt className="text-secondary">{label}</dt>
          <dd className="font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
export function LearningProgress({
  value,
  label,
  helper,
}: {
  value: number;
  label: string;
  helper?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex flex-wrap justify-between gap-2 text-xs">
        <span className="text-secondary">Progres pribadi</span>
        <span>{label}</span>
      </div>
      <div
        role="progressbar"
        aria-label="Progres pribadi"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        className="h-1.5 overflow-hidden rounded-full bg-gray-100"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-teal-600"
          style={{ width: `${value}%` }}
        />
      </div>
      {helper && <p className="mt-2 text-xs text-secondary">{helper}</p>}
    </div>
  );
}
export function SiswaDialog({
  title,
  label,
  children,
  onClose,
  wide = false,
  blur = false,
  frame,
}: {
  title: string;
  label?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  blur?: boolean;
  frame?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    id = useId();
  useEffect(() => {
    const d = ref.current,
      previous = document.activeElement;
    d?.showModal();
    return () => {
      d?.close();
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      onCancel={onClose}
      data-figma-node={frame}
      className={`fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-32px)] overflow-y-auto rounded-2xl border border-line bg-white p-6 text-foreground shadow-xl backdrop:bg-slate-950/45 ${blur ? "backdrop:backdrop-blur-sm" : ""} ${wide ? "max-w-[540px]" : "max-w-[460px]"}`}
    >
      {label && (
        <p className="mb-3 w-fit rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-primary">
          {label}
        </p>
      )}
      <h2 id={id} className="mb-4 text-lg font-bold">
        {title}
      </h2>
      {children}
    </dialog>
  );
}
export function formatPeriod(period: string) {
  return period
    .split(" – ")
    .map((p) => p.split(",")[0])
    .join(" – ");
}
export function plainHtml(value: string | undefined) {
  if (!value) return "";
  if (typeof window !== "undefined")
    return (
      new DOMParser().parseFromString(value, "text/html").body.textContent ?? ""
    );
  return value.replace(/<[^>]*>/g, "");
}
