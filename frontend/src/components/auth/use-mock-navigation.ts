"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function useMockNavigation() {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [busy, setBusy] = useState<"submit" | "google" | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      setBusy(null);
    },
    [],
  );
  function navigate(
    path: string,
    kind: "submit" | "google",
    beforeNavigate?: () => void,
  ) {
    if (timer.current) return;
    setBusy(kind);
    // Local delay demonstrates loading. Nothing is transmitted or persisted.
    timer.current = setTimeout(() => {
      beforeNavigate?.();
      timer.current = null;
      setBusy(null);
      router.push(path);
    }, 650);
  }
  return { busy, navigate };
}
