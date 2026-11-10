"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { beginDemoSession } from "@/lib/auth/session";
import type { DemoAccount } from "@/lib/auth/accounts";
export function useMockNavigation() {
  const router = useRouter(),
    running = useRef(false),
    [busy, setBusy] = useState(false);
  async function run<T>(work: () => Promise<T>): Promise<T | undefined> {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    try {
      return await work();
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  function enter(account: DemoAccount, remember = true, clear?: () => void) {
    if (!beginDemoSession(account, remember)) return;
    clear?.();
    router.push("/loading");
  }
  return { busy, run, enter, google: () => router.push("/register/google") };
}
