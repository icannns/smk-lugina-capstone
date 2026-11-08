import Image from "next/image";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { AuthButton } from "@/components/auth/auth-ui";

const iconSizes: Record<string, number> = {
  draft: 16,
  search: 16,
  chevron: 16,
  plus: 16,
  layers: 22,
  "survey-dashboard": 20,
  surveys: 20,
  templates: 20,
  results: 20,
  privacy: 20,
};

export type GuruIconAsset = { src: string; width: number; height: number };

export function DashboardIcon({
  name,
  empty = false,
  asset,
}: {
  name: string;
  empty?: boolean;
  asset?: GuruIconAsset;
}) {
  const width = iconSizes[name] ?? 18;
  const height = name === "privacy" ? 20.13 : width;
  return (
    <Image
      className="shrink-0"
      src={
        asset?.src ?? `/guru/dashboard/${empty ? "empty" : "full"}-${name}.svg`
      }
      alt=""
      width={asset?.width ?? width}
      height={asset?.height ?? height}
    />
  );
}

export function DashboardPrimaryButton({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <AuthButton {...props} type="button" compact className="whitespace-nowrap">
      {children}
    </AuthButton>
  );
}

export function DashboardButton({
  children,
  variant = "soft",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "soft" | "outline" | "danger";
}) {
  const styles =
    variant === "danger"
      ? "border border-red-300 bg-red-50 text-danger hover:bg-red-100"
      : variant === "outline"
        ? "border border-[#d1def5] bg-white text-primary hover:bg-primary-soft"
        : "bg-[#edf2ff] text-primary hover:bg-blue-100";
  return (
    <button
      {...props}
      type="button"
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-control px-4 text-sm font-medium leading-5 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}
