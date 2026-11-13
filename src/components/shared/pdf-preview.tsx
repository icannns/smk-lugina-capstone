"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";

/** Rasterize authenticated bytes only; no PDF scripts, links, forms or native plugins. */
export function PdfPreview({ url, name }: { url: string; name: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [rendered, setRendered] = useState(0);
  const [width, setWidth] = useState(320);
  const [error, setError] = useState("");

  useEffect(() => {
    let disposed = false;
    let destroy: (() => void) | undefined;
    const abort = new AbortController();
    async function load() {
      const pdfjs = await import("pdfjs-dist");
      if (disposed) return;
      const worker = new Worker(
        new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url),
        { type: "module" },
      );
      const pdfWorker = pdfjs.PDFWorker.create({ port: worker });
      destroy = () => { pdfWorker.destroy(); worker.terminate(); };
      const response = await fetch(url, { signal: abort.signal });
      if (!response.ok) throw new Error("PDF unavailable");
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (disposed) return;
      const task = pdfjs.getDocument({
        data: bytes,
        worker: pdfWorker,
        isEvalSupported: false,
        useSystemFonts: true,
        maxImageSize: 16_000_000,
      });
      destroy = () => {
        void task.destroy().catch(() => { /* Closing cancels in-flight rendering. */ });
        pdfWorker.destroy();
        worker.terminate();
      };
      const document = await task.promise;
      if (!disposed) setPdf(document);
    }
    void load().catch(() => {
      if (!disposed) setError("PDF tidak dapat ditampilkan. Gunakan Unduh PDF untuk membukanya.");
    });
    return () => { disposed = true; abort.abort(); destroy?.(); };
  }, [url]);

  useEffect(() => {
    if (!host.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(1, Math.floor(entry.contentRect.width)));
    });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!pdf) return;
    let disposed = false;
    let task: RenderTask | undefined;
    const canvas = document.createElement("canvas");
    async function render() {
      const pdfPage = await pdf!.getPage(page);
      if (disposed) return;
      const base = pdfPage.getViewport({ scale: 1 });
      const scale = Math.min(Math.max(1, width - 24) / base.width, 2, 4096 / base.height);
      if (!Number.isFinite(scale) || scale <= 0) throw new Error("Invalid PDF dimensions");
      const viewport = pdfPage.getViewport({ scale });
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(viewport.width * ratio));
      canvas.height = Math.max(1, Math.floor(viewport.height * ratio));
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      canvas.className = "mx-auto max-w-full";
      canvas.setAttribute("role", "img");
      canvas.setAttribute("aria-label", `${name}, halaman ${page} dari ${pdf!.numPages}`);
      task = pdfPage.render({
        canvas,
        viewport,
        transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0],
      });
      await task.promise;
      if (!disposed) {
        host.current?.replaceChildren(canvas);
        setRendered(page);
      }
    }
    void render().catch(() => {
      if (!disposed) setError("Halaman PDF tidak dapat ditampilkan. Gunakan Unduh PDF.");
    });
    return () => { disposed = true; task?.cancel(); canvas.remove(); };
  }, [pdf, page, width, name]);

  return (
    <section aria-label={`Penampil PDF ${name}`}>
      {error ? <p role="alert" className="mb-3 text-sm text-danger">{error}</p> : (
        <>
          {(!pdf || rendered !== page) && <p role="status" className="mb-2 text-sm text-secondary">Memuat halaman PDF…</p>}
          {pdf && (
            <nav aria-label="Halaman PDF" className="mb-3 flex flex-wrap items-center justify-center gap-3 text-sm">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-line px-3 py-2 disabled:opacity-40">Sebelumnya</button>
              <span aria-live="polite">Halaman {page} dari {pdf.numPages}</span>
              <button type="button" disabled={page >= pdf.numPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-line px-3 py-2 disabled:opacity-40">Berikutnya</button>
            </nav>
          )}
        </>
      )}
      <div ref={host} hidden={Boolean(error)} className="max-h-[55dvh] min-h-24 w-full overflow-auto rounded-lg border border-line bg-gray-50 p-3" />
      <p className="mt-2 text-xs text-secondary">Pratinjau gambar halaman PDF. Untuk membaca dengan aplikasi PDF atau fitur aksesibilitas dokumen, gunakan Unduh PDF.</p>
    </section>
  );
}
