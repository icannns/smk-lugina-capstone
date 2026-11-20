"use client";

import { useSyncExternalStore } from "react";

const minute = 60_000;
const jakartaHour = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  hour: "2-digit",
  hourCycle: "h23",
});

export function getJakartaGreeting(time: number | null) {
  if (time === null) return "Halo";
  const hour = Number(jakartaHour.format(time));
  if (hour < 5 || hour >= 18) return "Selamat malam";
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  return "Selamat sore";
}

function getSnapshot() {
  return Math.floor(Date.now() / minute) * minute;
}

function subscribe(onChange: () => void) {
  let timeout: number;

  function schedule() {
    timeout = window.setTimeout(refresh, minute - (Date.now() % minute));
  }

  function refresh() {
    window.clearTimeout(timeout);
    schedule();
    onChange();
  }

  schedule();
  window.addEventListener("focus", refresh);
  document.addEventListener("visibilitychange", refresh);
  return () => {
    window.clearTimeout(timeout);
    window.removeEventListener("focus", refresh);
    document.removeEventListener("visibilitychange", refresh);
  };
}

export function useDashboardTime() {
  // Hydrate with the same timeless fallback as the server.
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
