"use client";

import { useRef, useState } from "react";
import type { EventAttachment } from "@/lib/guru/event-types";
import { WizardIcon } from "./wizard-ui";

export function AttachmentPicker({
  files,
  onChange,
  milestone = false,
}: {
  files: EventAttachment[];
  onChange: (files: EventAttachment[]) => void;
  milestone?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  function choose(selected: FileList | File[]) {
    const incoming = [...selected];
    if (
      !milestone &&
      (files.length + incoming.length > 5 ||
        incoming.some(
          (f) =>
            f.size > 20 * 1024 * 1024 ||
            !(
              /\.(pdf|docx|png|jpe?g|gif|webp|svg|avif|bmp)$/i.test(f.name) ||
              f.type.startsWith("image/")
            ),
        ))
    ) {
      setError(
        "Gunakan PDF, gambar, atau DOCX; maksimal 20 MB per berkas dan 5 berkas.",
      );
      return;
    }
    setError("");
    onChange([
      ...files,
      ...incoming.map((f) => ({
        id: crypto.randomUUID(),
        name: f.name,
        size: f.size,
        type: f.type,
      })),
    ]);
  }
  const label = milestone
    ? "Pilih berkas lampiran milestone"
    : "Pilih berkas lampiran pendukung";
  return (
    <div>
      <input
        ref={input}
        type="file"
        multiple
        accept={milestone ? undefined : ".pdf,.docx,image/*"}
        aria-label={label}
        className="hidden"
        tabIndex={-1}
        onChange={(e) => {
          if (e.target.files) choose(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        aria-label={label}
        onClick={() => input.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          choose(e.dataTransfer.files);
        }}
        className={
          milestone
            ? "flex h-10 w-full items-center gap-2 rounded-control border border-line px-4 text-sm text-secondary hover:bg-gray-50"
            : "flex min-h-[99px] w-full flex-col items-center justify-center gap-2 rounded-2xl border-[1.6px] border-dashed border-gray-300 p-6 text-sm hover:bg-gray-50"
        }
      >
        <WizardIcon name={milestone ? "upload" : "info-upload"} />
        <span className={milestone ? "" : "font-medium text-[#1447e6]"}>
          Pilih berkas
          {!milestone && (
            <span className="font-normal text-secondary">
              {" "}
              atau seret ke sini
            </span>
          )}
        </span>
      </button>
      {files.map((file) => (
        <div
          key={file.id}
          className="mt-2 flex items-center gap-3 rounded-control px-3 py-2 shadow-[0_0_0_1px_#e5e7eb]"
        >
          <WizardIcon name="file" />
          <div className="min-w-0 flex-1">
            <p className="break-words text-sm leading-5">{file.name}</p>
            <p className="text-xs leading-4 text-secondary">
              Selesai ·{" "}
              {(file.size / 1000000).toLocaleString("id-ID", {
                maximumFractionDigits: 1,
              })}{" "}
              MB · simulasi
            </p>
          </div>
          <button
            type="button"
            aria-label={`Hapus ${file.name}`}
            onClick={() => onChange(files.filter((f) => f.id !== file.id))}
            className="grid size-8 shrink-0 place-items-center rounded-lg hover:bg-red-50"
          >
            <WizardIcon name="remove" />
          </button>
        </div>
      ))}
      {!milestone && (
        <p className="mt-1.5 text-xs leading-4 text-secondary">
          PDF, gambar, atau DOCX · maks. 20 MB per berkas · maks. 5 berkas
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-xs leading-4 text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
