"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LoginGraphic, RegistrationGraphic } from "./auth-graphic";

export function AuthShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/loading") return children;
  const login = pathname === "/login";
  return (
    <div
      className={`grid min-h-dvh bg-white ${login ? "lg:grid-cols-2" : "lg:grid-cols-[minmax(0,760fr)_minmax(0,680fr)]"}`}
    >
      <a
        href="#auth-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-20 focus:bg-white focus:p-3"
      >
        Lewati ke formulir
      </a>
      <div className="relative flex min-h-dvh min-w-0 flex-col px-6 sm:px-10 lg:min-h-[1024px] lg:px-6">
        {login ? (
          <div className="my-9 flex items-center gap-3 lg:absolute lg:left-20 lg:top-[60px] lg:my-0">
            <span className="grid size-10 place-items-center rounded-[10px] bg-primary text-[22px] font-bold text-white">
              L
            </span>
            <div>
              <p className="text-[17px] font-bold">Lugina PjBL</p>
              <p className="text-xs text-[#6b7280]">SMK Lugina Rancaekek</p>
            </div>
          </div>
        ) : (
          <nav
            aria-label="Navigasi autentikasi"
            className="my-8 flex items-center justify-between gap-4 lg:absolute lg:left-[10.526%] lg:right-[10.526%] lg:top-[50px] lg:my-0"
          >
            <Link
              href="/login"
              aria-label="Kembali ke halaman masuk"
              className="grid size-[38px] shrink-0 place-items-center rounded-full border border-line bg-[#f6f8fc] font-semibold"
            >
              ←
            </Link>
            <p className="text-sm text-[#6b7280]">
              Sudah punya akun?{" "}
              <Link href="/login" className="font-bold text-primary">
                Masuk
              </Link>
            </p>
          </nav>
        )}
        <main
          id="auth-content"
          className={`mx-auto w-full min-w-0 ${login ? "max-w-[440px] lg:mt-[175px]" : "max-w-[480px] lg:mt-[140px]"}`}
        >
          {children}
        </main>
        <footer className={`mx-auto mb-9 mt-auto w-full ${login?"max-w-[440px]":"max-w-[480px]"} pt-12 text-xs text-[#9ca3af] lg:mb-[70px]`}>
          {login
            ? "© 2026 SMK Lugina Rancaekek. Hak cipta dilindungi."
            : "🇮🇩 Indonesia · © 2026 SMK Lugina Rancaekek"}
        </footer>
      </div>
      {login ? <LoginGraphic /> : <RegistrationGraphic />}
    </div>
  );
}
