"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import { logoutDemo } from "@/lib/auth/session";
import assets from "@/lib/siswa/design-assets.json";
import navigation from "@/lib/siswa/design-navigation.json";
import { useStudentIdentity } from "./use-student-identity";
import { useEventDraftStore } from "@/lib/guru/event-draft-store";
import {
  DashboardDialog,
  type DashboardDialogState,
} from "../guru/dashboard-dialog";
const assetMap: Record<string, { src: string; width: number; height: number }> =
  assets;
const navMap: Record<string, Record<string, string>> = navigation;
export function SiswaIcon({ frame, name }: { frame: string; name: string }) {
  const icon = assetMap[`${frame}:${name}`] ?? assetMap[name];
  return icon ? (
    <Image src={icon.src} width={icon.width} height={icon.height} alt="" />
  ) : null;
}
const items = [
  { name: "Jelajah Event", id: "events", href: "/siswa/events" },
  { name: "Dashboard", id: "dashboard", href: "/siswa/dashboard" },
  { name: "Portofolio Pribadi", id: "portfolio", href: "/siswa/portfolio" },
  { name: "Profil", id: "profile", href: "/siswa/profile" },
];
export function SiswaShell({
  children,
  frame,
  active,
}: {
  children: ReactNode;
  frame: string;
  active: "events" | "dashboard" | "portfolio" | "profile";
}) {
  const account = useStudentIdentity(),
    store = useEventDraftStore(),
    pathname = usePathname(),
    mobile = useRef<HTMLDialogElement>(null),
    [dialog, setDialog] = useState<DashboardDialogState | null>(null),
    icons =
      navMap[frame] ?? navMap[active === "events" ? "370:1786" : "370:2522"];
  const name = account?.name ?? "Siswa Demo",
    initials = name
      .split(" ")
      .slice(0, 2)
      .map((p) => p[0])
      .join("");
  function sidebar() {
    return (
      <>
        <Link
          href="/siswa/dashboard"
          aria-label="Lugina PjBL — Dashboard Siswa"
          onClick={() => mobile.current?.close()}
          className="flex h-16 shrink-0 items-center gap-3 border-b border-line px-6"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#155dfc] to-[#009689] text-sm font-bold text-white">
            L
          </span>
          <span>
            <span className="block text-sm font-semibold">Lugina PjBL</span>
            <span className="block text-[11px] text-secondary">
              SMK Lugina Rancaekek
            </span>
          </span>
        </Link>
        <nav aria-label="Navigasi Siswa" className="p-3">
          <h2 className="mb-2 px-3 pt-2 text-[11px] font-medium tracking-widest text-secondary">
            EVENT
          </h2>
          {items.slice(0, 3).map((item) => (
            <Link
              key={item.id}
              href={item.href}
              aria-current={active === item.id ? "page" : undefined}
              onClick={() => mobile.current?.close()}
              className={`mb-1 flex h-10 items-center gap-3 rounded-xl px-3 text-sm ${active === item.id ? "bg-primary-soft font-semibold text-primary" : "text-secondary hover:bg-gray-50"}`}
            >
              <SiswaIcon frame={frame} name={icons[item.id]} />
              {item.name}
            </Link>
          ))}
          <div className="my-5 border-t border-line" />
          <h2 className="mb-2 px-3 text-[11px] font-medium tracking-widest text-secondary">
            AKUN
          </h2>
          <Link
            href="/siswa/profile"
            aria-current={active === "profile" ? "page" : undefined}
            onClick={() => mobile.current?.close()}
            className={`mb-1 flex h-10 items-center gap-3 rounded-xl px-3 text-sm ${active === "profile" ? "bg-primary-soft font-semibold text-primary" : "text-secondary"}`}
          >
            <SiswaIcon frame={frame} name={icons.profile} />
            Profil
          </Link>
          <button
            type="button"
            disabled
            className="flex h-10 cursor-not-allowed items-center gap-3 rounded-xl px-3 text-sm text-secondary opacity-60"
          >
            <SiswaIcon frame={frame} name={icons.settings} />
            Pengaturan
          </button>
        </nav>
        <div className="mx-3 mb-10 mt-auto rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <p className="text-xs font-semibold">Butuh bantuan?</p>
          <p className="my-2 text-[11px] leading-4 text-secondary">
            Pusat bantuan untuk pengerjaan event dan survei pembelajaran.
          </p>
          <button
            type="button"
            onClick={() => {
              mobile.current?.close();
              setDialog({
                title: "Bantuan prototipe",
                description:
                  "Gunakan akun demo untuk menjelajahi event, workspace dan portofolio. Tidak ada layanan bantuan eksternal yang dihubungi.",
              });
            }}
            className="text-[11px] font-medium text-primary"
          >
            Hubungi support ›
          </button>
        </div>
      </>
    );
  }
  return (
    <div className="grid min-h-dvh bg-[#f9fafb] lg:grid-cols-[256px_minmax(0,1fr)]">
      <a
        href="#siswa-main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3"
      >
        Ke konten Siswa
      </a>
      <aside
        aria-label="Sidebar Siswa"
        className="hidden min-h-dvh flex-col rounded-2xl border border-line bg-white lg:flex"
      >
        {sidebar()}
      </aside>
      <div className="min-w-0">
        <header className="flex h-16 items-center justify-between border-b border-line bg-white px-5 sm:px-8">
          <button
            type="button"
            aria-label="Buka navigasi Siswa"
            onClick={() => mobile.current?.showModal()}
            className="grid size-10 place-items-center rounded-lg text-xl lg:invisible"
          >
            ☰
          </button>
          <details key={pathname} className="relative">
            <summary
              aria-label={`Menu akun ${name}`}
              className="flex cursor-pointer list-none items-center gap-3 rounded-lg py-2"
            >
              <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-teal-500 text-xs font-semibold text-white">
                {account.avatar ? (
                  <Image
                    src={account.avatar}
                    width={36}
                    height={36}
                    alt="Foto profil contoh"
                    unoptimized
                  />
                ) : (
                  initials
                )}
              </span>
              <span className="hidden min-[360px]:block">
                <span className="block max-w-36 truncate text-sm font-medium">
                  {name}
                </span>
                <span className="block text-xs text-secondary">Siswa</span>
              </span>
              <SiswaIcon frame={frame} name={icons.chevron} />
            </summary>
            <div className="absolute right-0 z-40 flex w-56 flex-col rounded-xl border border-line bg-white p-2 shadow-lg">
              <p className="p-2 text-xs text-secondary">
                Prototipe · Akun fiktif
              </p>
              <Link
                href="/siswa/profile"
                className="rounded-lg p-2 text-sm hover:bg-gray-50"
              >
                Profil Siswa
              </Link>
              <Link
                href="/login"
                onClick={logoutDemo}
                className="rounded-lg p-2 text-sm text-danger hover:bg-red-50"
              >
                Keluar dari demo
              </Link>
            </div>
          </details>
        </header>
        <main
          id="siswa-main"
          data-figma-node={frame}
          className="mx-auto min-w-0 max-w-[1184px] px-5 py-8 sm:px-8"
        >
          {children}
          {store.storageError && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800"
            >
              {store.storageError}
            </p>
          )}
        </main>
      </div>
      <dialog
        ref={mobile}
        aria-label="Navigasi Siswa"
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-72 max-w-[85vw] border-0 bg-white p-0 text-foreground shadow-xl backdrop:bg-slate-950/35"
      >
        <div className="flex min-h-full flex-col">
          <button
            type="button"
            onClick={() => mobile.current?.close()}
            className="m-3 h-9 rounded-lg border border-line text-sm"
          >
            Tutup navigasi ×
          </button>
          {sidebar()}
        </div>
      </dialog>
      <DashboardDialog
        action={dialog}
        onClose={() => setDialog(null)}
        onDelete={() => setDialog(null)}
      />
    </div>
  );
}
