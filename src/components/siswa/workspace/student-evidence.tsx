"use client";
import { useState } from "react";
import type {
  TeacherSubmission,
  SubmissionVersion,
} from "@/lib/guru/teacher-types";
import { downloadText } from "@/lib/guru/client-export";
import { SiswaButton, SiswaDialog } from "../siswa-ui";
import { SiswaIcon } from "../siswa-shell";
export function StudentEvidence({
  submission,
  version,
  compact = false,
}: {
  submission: TeacherSubmission;
  version: SubmissionVersion;
  compact?: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(null),
    files = version.files ?? [
      { id: version.file, name: version.file, size: 0, type: "" },
    ],
    note = version.note ?? submission.note,
    link = version.link ?? submission.link;
  function sample(name: string) {
    return `CONTOH PROTOTIPE — BUKAN FILE SISWA ASLI\nLampiran: ${name}\nEvent: ${submission.eventId}\nMilestone: ${submission.milestoneId}\nVersi: ${version.version}\n\n${note ?? "Contoh dokumentasi pembelajaran."}\n\nHanya metadata yang disimpan. Berkas asli tidak diunggah.`;
  }
  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {files.map((f) => (
        <div
          key={f.id}
          className="flex min-w-0 flex-wrap items-center gap-3 rounded-xl border border-line p-3"
        >
          <span className="rounded-lg bg-blue-50 px-2 py-2 text-xs font-semibold text-primary">
            {compact ? (
              <SiswaIcon frame="370:4068" name="imgIcon4" />
            ) : (
              f.name.split(".").at(-1)?.toUpperCase().slice(0, 5) || "FILE"
            )}
          </span>
          <div className="min-w-0 flex-1 basis-32">
            <p className="break-all text-sm">{f.name}</p>
            <p className="text-xs text-secondary">
              {f.size ? `${(f.size / 1024 / 1024).toFixed(2)} MB · ` : ""}
              Metadata contoh · Versi {version.version}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPreview(sample(f.name))}
            className="inline-flex items-center gap-1.5 text-xs text-secondary"
          >
            {compact && <SiswaIcon frame="370:4068" name="imgIcon5" />}
            Buka
          </button>
          <button
            type="button"
            onClick={() => downloadText(`${f.name}.demo.txt`, sample(f.name))}
            className="inline-flex items-center gap-1.5 text-xs text-secondary"
          >
            {compact && <SiswaIcon frame="370:4068" name="imgIcon6" />}
            Unduh contoh
          </button>
        </div>
      ))}
      {link && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3 text-xs">
          {compact && (
            <span className="shrink-0 rounded-lg bg-blue-50 p-2">
              <SiswaIcon frame="370:4068" name="imgIcon9" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <span
              className={`break-all ${compact ? "text-sm" : "text-primary"}`}
            >
              {link}
            </span>
            {compact && (
              <p className="text-xs text-secondary">Tautan eksternal contoh</p>
            )}
          </div>
          <button
            type="button"
            onClick={() =>
              setPreview(
                `Tautan contoh: ${link}\n\nTautan tidak dibuka ke layanan eksternal pada prototipe ini.`,
              )
            }
            className="inline-flex items-center gap-1 text-primary"
          >
            {compact && <SiswaIcon frame="370:4068" name="imgIcon10" />}
            Buka tautan contoh
          </button>
        </div>
      )}
      {note && (
        <div
          className={
            compact
              ? "flex items-start gap-3 rounded-xl border border-line p-3"
              : "pt-2"
          }
        >
          {compact && (
            <span className="shrink-0 rounded-lg bg-blue-50 p-2">
              <SiswaIcon frame="370:4068" name="imgIcon7" />
            </span>
          )}
          <div className="min-w-0">
            <h3
              className={
                compact ? "text-sm font-medium" : "mb-2 text-sm font-medium"
              }
            >
              {compact ? "Catatan" : "Teks jawaban"}
            </h3>
            <p
              className={`whitespace-pre-wrap break-words leading-5 text-secondary ${compact ? "text-xs" : "text-sm"}`}
            >
              {note}
            </p>
          </div>
        </div>
      )}
      {preview && (
        <SiswaDialog
          title={`Pratinjau contoh · Versi ${version.version}`}
          onClose={() => setPreview(null)}
        >
          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-secondary">
            {preview}
          </p>
          <SiswaButton className="mt-5" onClick={() => setPreview(null)}>
            Tutup
          </SiswaButton>
        </SiswaDialog>
      )}
    </div>
  );
}
