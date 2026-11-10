import Image from "next/image";
import type { ReactNode, SelectHTMLAttributes } from "react";
import { studentAssets } from "@/lib/guru/student-assets";

export function StudentIcon({ name }: { name: keyof typeof studentAssets }) {
  const asset = studentAssets[name];
  return (
    <Image
      src={asset.src}
      width={asset.width}
      height={asset.height}
      alt=""
      className="shrink-0"
    />
  );
}

export function StudentSelect({
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
        <StudentIcon name="initial-chevron" />
      </span>
    </label>
  );
}

export function StudentCard({
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
