"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
export function useAuthNavigation() {
  const router = useRouter(), running = useRef(false), [busy, setBusy] = useState(false);
  async function run<T>(work: () => Promise<T>): Promise<T | undefined> {
    if (running.current) return;
    running.current = true; setBusy(true);
    try { return await work(); } finally { running.current = false; setBusy(false); }
  }
  function enter() { router.push("/loading"); }
  return { busy, run, enter, google: () => router.push("/register/google") };
}
