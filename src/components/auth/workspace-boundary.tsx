"use client";
import { useEffect, type ReactNode } from "react";
import { connectWorkspace, refreshWorkspace, useEventDraftStore } from "@/lib/guru/event-draft-store";
import { SharedLoadingScreen } from "./auth-loading";
export function WorkspaceBoundary({ accountId, children }: { accountId: string; children: ReactNode }) {
 const state = useEventDraftStore();
 useEffect(() => {
  const disconnect = connectWorkspace(accountId);
  const reload = () => { if (document.visibilityState === "visible") void refreshWorkspace().catch(() => {}); };
  const timer = setInterval(reload, 5000); window.addEventListener("focus", reload);
  return () => { clearInterval(timer); window.removeEventListener("focus", reload); disconnect(); };
 }, [accountId]);
 if (state.accountId !== accountId) return <SharedLoadingScreen />;
 if (!state.loaded && state.status !== "error") return <SharedLoadingScreen />;
 if (!state.loaded) return <main className="mx-auto max-w-xl p-8"><h1 className="text-xl font-semibold">Data belum dapat dimuat</h1><p role="alert" className="my-4 text-sm text-danger">{state.storageError} Tidak ada data contoh pengganti.</p><button type="button" onClick={() => void refreshWorkspace().catch(() => {})} className="rounded-lg bg-primary px-4 py-2 text-white">Coba lagi</button></main>;
 return <>{state.storageError && <p role="alert" className="sticky top-0 z-50 border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-900">{state.storageError} {state.status === "error" && "Tampilan terakhir belum terverifikasi ulang."} <button type="button" className="underline" onClick={() => void refreshWorkspace().catch(() => {})}>Muat ulang data</button></p>}{children}</>;
}
