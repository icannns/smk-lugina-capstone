"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import {
  navigationGroups,
  teacher,
  type DashboardAction,
} from "@/lib/guru/dashboard-data";
import { DashboardIcon, type GuruIconAsset } from "./dashboard-ui";

type ShellProps = {
  children: ReactNode;
  empty: boolean;
  onAction: (action: DashboardAction) => void;
  activePage?: "dashboard" | "students";
  iconOverrides?: Record<string, GuruIconAsset>;
};

function SidebarContent({
  empty,
  onAction,
  closeMobile,
  activePage = "dashboard",
  iconOverrides,
}: Omit<ShellProps, "children"> & { closeMobile?: () => void }) {
  function select(label: string, figmaNode: string | null) {
    closeMobile?.();
    onAction({
      title: label,
      description:
        activePage === "students"
          ? `Halaman ${label} belum tersedia pada fase ini. Anda tetap berada di Pengelolaan Data Siswa.`
          : `Halaman ${label} belum tersedia pada fase Dashboard Guru. Anda tetap berada di Dashboard.`,
      figmaNode: figmaNode ?? undefined,
    });
  }
  return (
    <>
      <div className="flex h-16 shrink-0 items-center border-b border-line px-6">
        <Link
          href="/guru/dashboard"
          onClick={closeMobile}
          aria-label="Lugina PjBL — Dashboard Guru"
          className="flex items-center gap-3"
        >
          <span className="grid size-9 place-items-center rounded-control bg-[linear-gradient(135deg,#155dfc,#009689)] text-base font-bold text-white">
            L
          </span>
          <span>
            <span className="block text-sm font-semibold leading-5">
              Lugina PjBL
            </span>
            <span className="block text-xs leading-4 text-secondary">
              SMK Lugina Rancaekek
            </span>
          </span>
        </Link>
      </div>
      <nav
        aria-label="Navigasi utama Guru"
        className="flex flex-col gap-3.5 px-3 py-4"
      >
        {navigationGroups.map((group, index) => (
          <div key={group.title}>
            {index > 0 && <div className="mb-3.5 h-px bg-line" />}
            <div className="flex flex-col gap-1">
              <h2
                className={
                  group.title === "Akun"
                    ? "sr-only"
                    : "flex h-6 items-center px-3 text-[11px] font-semibold tracking-[0.8px] text-gray-500"
                }
              >
                {group.title}
              </h2>
              {group.items.map((item) =>
                item.icon === "dashboard" || item.icon === "students" ? (
                  <Link
                    key={item.label}
                    href={
                      item.icon === "dashboard"
                        ? "/guru/dashboard"
                        : "/guru/students"
                    }
                    aria-current={activePage === item.icon ? "page" : undefined}
                    onClick={closeMobile}
                    className={`flex h-10 items-center gap-3 rounded-control px-3 text-sm ${activePage === item.icon ? (activePage === "students" ? "bg-primary-soft font-medium text-primary" : "bg-primary-soft font-semibold text-[#1447e6]") : `${activePage === "students" ? "font-semibold" : empty ? "font-medium" : "font-normal"} text-secondary hover:bg-gray-50`}`}
                  >
                    <DashboardIcon
                      name={item.icon}
                      empty={empty}
                      asset={iconOverrides?.[item.icon]}
                    />
                    {item.label}
                  </Link>
                ) : (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => select(item.label, item.figmaNode)}
                    className={`flex h-10 items-center rounded-control px-3 text-left text-sm text-secondary hover:bg-gray-50 ${index === 1 ? "gap-2.5" : "gap-3"} ${empty || item.icon === "privacy" ? "font-medium" : "font-normal"}`}
                  >
                    <DashboardIcon
                      name={item.icon}
                      empty={empty}
                      asset={iconOverrides?.[item.icon]}
                    />
                    <span>{item.label}</span>
                  </button>
                ),
              )}
            </div>
          </div>
        ))}
      </nav>
      <div className="mt-auto flex shrink-0 flex-col items-center gap-3 px-3 pb-4 pt-6">
        <div className="flex w-full flex-col gap-1.5 rounded-control border border-slate-200 bg-slate-50 p-3.5">
          <p className="text-xs font-semibold">Butuh bantuan?</p>
          <p className="text-[11px] leading-4 text-gray-500">
            Pusat bantuan untuk pengelolaan event dan survei pembelajaran.
          </p>
          <button
            type="button"
            className="self-start text-left text-[11px] font-medium text-primary hover:underline"
            onClick={() => {
              closeMobile?.();
              onAction({
                title: "Bantuan Dashboard",
                description:
                  "Ini adalah prototipe frontend. Gunakan filter dan pencarian untuk menjelajahi event contoh. Skenario kosong tersedia melalui menu akun. Belum ada layanan support yang terhubung.",
              });
            }}
          >
            Hubungi support ›
          </button>
        </div>
        <p className="text-[11px] text-muted">Lugina PjBL · v1.0</p>
      </div>
    </>
  );
}

export function DashboardShell({
  children,
  empty,
  onAction,
  activePage = "dashboard",
  iconOverrides,
}: ShellProps) {
  const mobile = useRef<HTMLDialogElement>(null);
  const account = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    function outside(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !account.current?.contains(event.target) &&
        account.current
      )
        account.current.open = false;
    }
    function resized() {
      if (window.innerWidth >= 1024) mobile.current?.close();
    }
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", resized);
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("resize", resized);
    };
  }, []);
  function closeAccount() {
    if (account.current) account.current.open = false;
  }

  return (
    <div
      className={`grid min-h-dvh min-w-0 lg:grid-cols-[256px_minmax(0,1fr)] ${empty ? "bg-gray-50" : "bg-[#f5f6f8]"}`}
    >
      <a
        href={activePage === "students" ? "#students-main" : "#dashboard-main"}
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3"
      >
        {activePage === "students"
          ? "Ke konten Pengelolaan Data Siswa"
          : "Ke konten Dashboard"}
      </a>
      <aside
        aria-label="Sidebar Guru"
        className={`hidden flex-col border border-line bg-white lg:flex ${empty ? "rounded-2xl" : ""}`}
      >
        <SidebarContent
          empty={empty}
          onAction={onAction}
          activePage={activePage}
          iconOverrides={iconOverrides}
        />
      </aside>
      <div className="min-w-0">
        <header className="relative z-20 flex h-16 items-center justify-between border-b border-line bg-white/80 px-5 backdrop-blur-xl sm:px-8 lg:justify-end">
          <button
            type="button"
            aria-label="Buka navigasi"
            onClick={() => mobile.current?.showModal()}
            className="flex size-10 flex-col items-center justify-center gap-1 rounded-lg hover:bg-gray-100 lg:hidden"
          >
            <span className="h-0.5 w-5 bg-secondary" />
            <span className="h-0.5 w-5 bg-secondary" />
            <span className="h-0.5 w-5 bg-secondary" />
          </button>
          <details
            ref={account}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                closeAccount();
                e.currentTarget.querySelector("summary")?.focus();
              }
            }}
            className="relative"
          >
            <summary
              aria-label="Menu akun Rina Marlina"
              className="flex cursor-pointer list-none items-center gap-3 rounded-control py-1 pl-1 pr-2 [&::-webkit-details-marker]:hidden"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#2b7fff,#00bba7)] text-[13.68px] font-semibold leading-[20.52px] text-white">
                {teacher.initials}
              </span>
              <span className="hidden w-[137.825px] text-left min-[360px]:block">
                <span className="block text-sm font-medium leading-5">
                  {teacher.name}
                </span>
                <span className="block text-xs leading-4 text-secondary">
                  {teacher.role}
                </span>
              </span>
              <DashboardIcon
                name="chevron"
                empty={empty}
                asset={iconOverrides?.chevron}
              />
            </summary>
            <div className="absolute right-0 top-[calc(100%+8px)] flex w-64 flex-col rounded-2xl border border-line bg-white p-2 shadow-lg">
              <p className="px-3 py-2 text-xs leading-5 text-secondary">
                Prototipe · Data contoh Figma
                <br />
                Tidak terhubung ke backend.
              </p>
              <button
                type="button"
                onClick={() => {
                  closeAccount();
                  onAction({
                    title: "Profil Guru",
                    description:
                      "Halaman profil akan tersedia pada fase berikutnya.",
                    figmaNode: "291:28235",
                  });
                }}
                className="rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                Profil Guru
              </button>
              <Link
                href={empty ? "/guru/dashboard" : "/guru/dashboard?state=empty"}
                onClick={closeAccount}
                className="rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
              >
                {empty ? "Tampilkan data contoh" : "Lihat empty state"}
              </Link>
              <Link
                href="/login"
                onClick={closeAccount}
                className="rounded-lg px-3 py-2 text-sm text-danger hover:bg-red-50"
              >
                Keluar dari demo
              </Link>
            </div>
          </details>
        </header>
        {children}
      </div>
      <dialog
        ref={mobile}
        aria-label="Navigasi Guru"
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-72 max-w-[85vw] border-0 bg-white p-0 text-foreground shadow-xl backdrop:bg-slate-950/35"
      >
        <div className="flex min-h-full flex-col">
          <button
            type="button"
            onClick={() => mobile.current?.close()}
            className="m-3 flex h-9 items-center justify-center rounded-lg border border-line text-sm text-secondary"
          >
            Tutup navigasi ×
          </button>
          <SidebarContent
            empty={empty}
            onAction={onAction}
            closeMobile={() => mobile.current?.close()}
            activePage={activePage}
            iconOverrides={iconOverrides}
          />
        </div>
      </dialog>
    </div>
  );
}
