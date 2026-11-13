"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { EventAttachment } from "@/lib/guru/event-types";
import { SiswaButton, SiswaDialog } from "../siswa/siswa-ui";

/** Every byte comes from an authenticated endpoint; legacy metadata has no fake fallback. */
export function AttachmentActions({
  file,
  version,
  onRemove,
  busy = false,
}: {
  file: EventAttachment;
  version?: number;
  onRemove?: () => void;
  busy?: boolean;
}) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState(""),
    [preview, setPreview] = useState<string | null>(null),
    url = useRef<string | null>(null);
  useEffect(
    () => () => {
      if (url.current) URL.revokeObjectURL(url.current);
    },
    [],
  );
  function close() {
    if (url.current) URL.revokeObjectURL(url.current);
    url.current = null;
    setPreview(null);
  }
  async function open(download: boolean) {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch(
        `/api/attachments/${encodeURIComponent(file.id)}/${download ? "download" : "preview"}`,
        { credentials: "same-origin", cache: "no-store" },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message ?? "Berkas tidak dapat dibuka.");
      }
      const blob = await response.blob();
      if (!blob.size) throw new Error("Berkas kosong.");
      const objectUrl = URL.createObjectURL(blob);
      if (download) {
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      } else {
        if (url.current) URL.revokeObjectURL(url.current);
        url.current = objectUrl;
        setPreview(objectUrl);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Akses berkas gagal.");
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="min-w-0 rounded-xl border border-line p-3">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <span className="rounded-lg bg-blue-50 p-2 text-xs font-semibold text-primary">
          {file.name.split(".").at(-1)?.toUpperCase().slice(0, 5) || "FILE"}
        </span>
        <div className="min-w-0 flex-1 basis-32">
          <p className="break-all text-sm">{file.name}</p>
          <p className="text-xs text-secondary">
            {file.size < 1024
              ? `${file.size} B`
              : file.size < 1048576
                ? `${(file.size / 1024).toFixed(1)} KB`
                : `${(file.size / 1048576).toFixed(2)} MB`}
            {version !== undefined ? ` · Versi ${version}` : ""} ·{" "}
            {file.uploaded
              ? "Tersimpan privat"
              : "Metadata lama; berkas asli tidak tersedia"}
          </p>
        </div>
        {file.uploaded && (
          <>
            {["application/pdf", "image/png", "image/jpeg"].includes(
              file.type,
            ) && (
              <button
                type="button"
                disabled={pending || busy}
                onClick={() => void open(false)}
                className="text-xs text-primary disabled:opacity-50"
              >
                Pratinjau
              </button>
            )}
            <button
              type="button"
              disabled={pending || busy}
              onClick={() => void open(true)}
              className="text-xs text-primary disabled:opacity-50"
            >
              Unduh
            </button>
          </>
        )}
        {onRemove && (
          <button
            type="button"
            disabled={pending || busy}
            onClick={onRemove}
            className="text-xs text-danger disabled:opacity-50"
          >
            Hapus
          </button>
        )}
      </div>
      {pending && (
        <p role="status" className="mt-2 text-xs text-secondary">
          Mengambil berkas…
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      )}
      {preview && (
        <SiswaDialog title={`Pratinjau · ${file.name}`} onClose={close} wide>
          <div className="min-w-0">
            {file.type === "application/pdf" ? (
              <>
                <iframe
                  sandbox=""
                  title={file.name}
                  src={preview}
                  className="h-[55dvh] w-full rounded-lg border border-line"
                />
                <p className="mt-2 text-xs text-secondary">
                  Jika penampil PDF browser tidak tersedia, gunakan Unduh.
                </p>
              </>
            ) : (
              <Image
                unoptimized
                width={1200}
                height={900}
                alt={`Pratinjau ${file.name}`}
                src={preview}
                className="max-h-[60dvh] w-full object-contain"
              />
            )}
          </div>
          <SiswaButton className="mt-4" onClick={close}>
            Tutup
          </SiswaButton>
        </SiswaDialog>
      )}
    </div>
  );
}
