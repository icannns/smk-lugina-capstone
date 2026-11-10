"use client";
import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useDemoAuth, completeDemoSession } from "@/lib/auth/session";
import { accountHome } from "@/lib/auth/accounts";
import {
  ensureStudentProfile,
  saveStudentProfile,
} from "@/lib/siswa/student-actions";
import { readEventStore } from "@/lib/guru/event-draft-store";
export function SharedLoadingScreen() {
  return (
    <main
      aria-label="Memuat ruang belajar"
      data-figma-node="370:1777"
      className="grid min-h-dvh place-items-center bg-[#fafbfe] px-5"
    >
      <div className="flex w-full max-w-[500px] flex-col items-center gap-6 py-10 text-center">
        <span className="grid size-16 place-items-center rounded-2xl bg-primary text-[34px] font-bold text-white shadow-[0_8px_20px_#2563eb4d]">
          L
        </span>
        <div>
          <h1 className="text-lg font-bold">Memuat Ruang Belajar...</h1>
          <p className="mt-1.5 text-[13px] text-[#6b7280]">
            Menyiapkan event dan progres pembelajaranmu.
          </p>
        </div>
        <div
          role="progressbar"
          aria-label="Menyiapkan halaman tujuan"
          aria-valuetext="Sedang memuat"
          className="h-1.5 w-[260px] max-w-full overflow-hidden rounded-full bg-line"
        >
          <div className="h-full w-[69.23%] animate-pulse rounded-full bg-primary" />
        </div>
      </div>
    </main>
  );
}
export function AuthenticationLoading() {
  const auth = useDemoAuth(),
    pathname = usePathname(),
    router = useRouter(),
    navigating = useRef(false);
  useEffect(() => {
    if (pathname !== "/loading" || !auth.ready || navigating.current) return;
    if (!auth.pending) {
      router.replace(auth.account ? accountHome(auth.account) : "/login");
      return;
    }
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        if (navigating.current) return;
        navigating.current = true;
        const account = completeDemoSession();
        if (account?.role === "student") {
          ensureStudentProfile(account);
          if (account.provider === "google") {
            const profile =
              readEventStore().studentUI.profiles[account.studentId!];
            if (profile)
              saveStudentProfile({
                ...profile,
                name: auth.googleProfile.name,
                phone: auth.googleProfile.phone,
              });
          }
        }
        router.replace(account ? accountHome(account) : "/login");
      });
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [
    auth.ready,
    pathname,
    auth.pending?.id,
    auth.account?.id,
    router,
    auth.pending,
    auth.account,
    auth.googleProfile,
  ]);
  return <SharedLoadingScreen />;
}
