"use client";

import { eventCardPageSize } from "@/lib/guru/event-pagination";

export function EventPagination({ total, page, onChange }: {
  total: number;
  page: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / eventCardPageSize));
  return (
    <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 text-xs text-secondary">
      <p>
        Menampilkan {total ? (page - 1) * eventCardPageSize + 1 : 0}–
        {Math.min(page * eventCardPageSize, total)} dari {total} event
      </p>
      <nav aria-label="Halaman daftar event" className="flex flex-wrap items-center gap-2">
        <button type="button" aria-label="Halaman event sebelumnya" disabled={page <= 1}
          onClick={() => onChange(page - 1)} className="rounded-lg border border-line bg-white px-3 py-2 disabled:opacity-40">‹</button>
        {Array.from({ length: pages }, (_, index) => index + 1).map((number) => (
          <button key={number} type="button" aria-label={`Halaman event ${number}`}
            aria-current={page === number ? "page" : undefined} onClick={() => onChange(number)}
            className={`rounded-lg px-3 py-2 ${page === number ? "bg-primary text-white" : "border border-line bg-white"}`}>{number}</button>
        ))}
        <button type="button" aria-label="Halaman event berikutnya" disabled={page >= pages}
          onClick={() => onChange(page + 1)} className="rounded-lg border border-line bg-white px-3 py-2 disabled:opacity-40">›</button>
      </nav>
    </footer>
  );
}
