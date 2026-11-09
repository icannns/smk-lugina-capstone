import type { ReactNode } from "react";
import assets from "@/lib/guru/design-assets.json";
import navigation from "@/lib/guru/design-navigation.json";
import { DashboardIcon, type GuruIconAsset } from "./dashboard-ui";
const assetMap: Record<string, GuruIconAsset> = assets;
const navMap: Record<string, Record<string, string>> = navigation;
export function DesignIcon({ frame, name }: { frame: string; name: string }) {
  const asset = assetMap[`${frame}:${name}`];
  if (!asset) return null;
  return <DashboardIcon name={name} asset={asset} />;
}
export function designNavigation(frame: string) {
  return Object.fromEntries(
    Object.entries(navMap[frame] ?? {}).map(([name, key]) => [
      name,
      assetMap[key],
    ]),
  );
}
export function Surface({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={`min-w-0 rounded-2xl bg-white ${padded ? "p-6" : ""} shadow-[0_0_0_1px_#0000000f,0_1px_2px_#1018280a] ${className}`}
    >
      {children}
    </section>
  );
}
export const controlClass =
  "h-10 w-full min-w-0 rounded-control border border-line bg-white px-3 text-sm focus:outline-2 focus:outline-primary disabled:bg-gray-50";
