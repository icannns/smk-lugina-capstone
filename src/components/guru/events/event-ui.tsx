import type { ReactNode, SelectHTMLAttributes } from "react";
import { eventAssets } from "@/lib/guru/event-assets";
import { statusLabels } from "@/lib/guru/dashboard-data";
import type { ManagedEvent } from "@/lib/guru/event-types";
import { DashboardIcon } from "../dashboard-ui";

export function EventIcon({ name }: { name: keyof typeof eventAssets }) {
  return <DashboardIcon name={name} asset={eventAssets[name]} />;
}

export function EventSelect({
  label,
  children,
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className={`relative block min-w-0 ${className}`}>
      <span className="sr-only">{label}</span>
      <select
        {...props}
        aria-label={label}
        className="h-10 w-full appearance-none rounded-control border-0 bg-white pl-3 pr-9 text-sm leading-5 focus:outline-2 focus:outline-primary"
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-3 top-3">
        <EventIcon name="chevron" />
      </span>
    </label>
  );
}

export function EventSurface({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-white shadow-[0_0_0_1px_#0000000f,0_1px_2px_#1018280a] ${className}`}
    >
      {children}
    </div>
  );
}

export function EventBadge({ status }: { status: ManagedEvent["status"] }) {
  const colors =
    status === "ongoing"
      ? "bg-primary-soft text-[#1447e6]"
      : status === "upcoming"
        ? "bg-purple-50 text-[#8200db]"
        : "bg-gray-100 text-[#364153]";
  return (
    <span
      className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium leading-4 ${colors}`}
    >
      {status === "draft" ? "Draf" : statusLabels[status]}
    </span>
  );
}
