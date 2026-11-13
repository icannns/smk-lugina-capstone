"use client";
import { useState } from "react";
import type {
  TeacherSubmission,
  SubmissionVersion,
} from "@/lib/guru/teacher-types";
import { AttachmentActions } from "../../shared/attachment-actions";
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
  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {files.map(f=><AttachmentActions key={f.id} file={f} version={version.version}/>)}
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
