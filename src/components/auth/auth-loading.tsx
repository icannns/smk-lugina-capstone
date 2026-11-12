"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppAuth } from "@/lib/auth/session";
import { accountHome } from "@/lib/auth/accounts";
import { ensureStudentProfile } from "@/lib/siswa/student-actions";
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
  const { account, ready } = useAppAuth(), router = useRouter();
  useEffect(() => {
    if (!ready) return;
    const timer = requestAnimationFrame(() => {
      if (account?.role === "student") ensureStudentProfile(account);
      router.replace(account ? accountHome(account) : "/login");
    });
    return () => cancelAnimationFrame(timer);
  }, [ready, account, router]);
  return <SharedLoadingScreen />;
}
