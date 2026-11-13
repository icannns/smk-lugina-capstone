"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import {
  listedEvents,
  refreshWorkspace,
  useEventDraftStore,
} from "@/lib/guru/event-draft-store";
import {
  assessmentForVersion,
  submissionComplete,
  certificateThreshold,
  enrollmentProgress,
  feedbackFor,
  rubricScore,
  submissionLabels,
  submissionStatus,
} from "@/lib/guru/learning-selectors";
import { formatEventDate } from "@/lib/guru/event-selectors";
import { submissionId } from "@/lib/guru/learning-data";
import { AttachmentActions } from "../../shared/attachment-actions";
import type { EventAttachment, ManagedEvent } from "@/lib/guru/event-types";
import {
  isEnrolled,
  milestoneUnlocked,
  surveyHref,
  workHref,
} from "@/lib/siswa/selectors";
import { saveWorkDraft, submitStudentWork } from "@/lib/siswa/student-actions";
import type { WorkDraft } from "@/lib/siswa/student-types";
import { Surface } from "../../guru/design-ui";
import { EmptyRows } from "../../guru/learning-ui";
import { StudentBadge as StatusBadge } from "../siswa-ui";
import { SiswaShell } from "../siswa-shell";
import { useStudentIdentity } from "../use-student-identity";
import {
  Breadcrumb,
  LearningProgress,
  SiswaButton,
  SiswaLink,
  StudentNotice,
  SummaryRows,
  studentControl,
  formatPeriod,
} from "../siswa-ui";
import { StudentEvidence } from "./student-evidence";
const empty: WorkDraft = { files: [], text: "", link: "" };
export function StudentWorkspace() {
  const params = useSearchParams(),
    state = useEventDraftStore(),
    identity = useStudentIdentity(),
    event = listedEvents(state).find(
      (e) => e.id === params.get("event") && e.status !== "draft",
    );
  if (!event || !isEnrolled(event.id, identity.studentId ?? "", state.learning))
    return (
      <SiswaShell frame="370:2708" active="dashboard">
        <EmptyRows>
          Ruang kerja belum tersedia. Ikuti event melalui{" "}
          <Link href="/siswa/events" className="text-primary">
            Jelajah Event
          </Link>
          .
        </EmptyRows>
      </SiswaShell>
    );
  const index = params.has("milestone")
    ? event.milestones.findIndex((m) => m.id === params.get("milestone"))
    : 0;
  return <Workspace key={`${event.id}:${index}`} event={event} index={index} />;
}
function Workspace({ event, index }: { event: ManagedEvent; index: number }) {
  const state = useEventDraftStore(),
    identity = useStudentIdentity(),
    router = useRouter(),
    studentId = identity.studentId ?? "",
    rubric = state.rubrics[event.rubricId ?? ""],
    row = enrollmentProgress(event, studentId, state.learning, rubric),
    milestone = event.milestones[index],
    submission = row.submissions[index],
    status = submissionStatus(submission, state.learning),
    revision = status === "revision",
    unlocked = milestoneUnlocked(event, studentId, index, state.learning),
    next = event.milestones[index + 1],
    key = submissionId(event.id, studentId, milestone?.id ?? ""),
    [work, setWork] = useState<WorkDraft>(
      state.studentUI.workDrafts[key] ?? empty,
    ),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    input = useRef<HTMLInputElement>(null),
    frame = revision ? "370:2885" : submission ? "370:3058" : "370:2708",
    feedback = submission ? feedbackFor(submission.id, state.learning) : [],
    latest = submission?.versions.at(-1),
    lastFeedback = feedback.filter((f) => f.revision).at(-1);
  const [uploading, setUploading] = useState(false),
    [progress, setProgress] = useState(""),
    working = useRef(false);
  async function files(values: FileList | null) {
    if (!values || working.current || !milestone) return;
    const additions = Array.from(values);
    if (
      work.files.length + additions.length > 5 ||
      additions.some((f) => f.size > 10485760)
    ) {
      setError("Maksimal 5 file, masing-masing 10 MB.");
      return;
    }
    working.current = true;
    setUploading(true);
    setError("");
    setNotice("");
    try {
      for (const file of additions) {
        const form = new FormData();
        form.set("file", file);
        form.set("expectedVersion", String(latest?.version ?? 0));
        form.set("requestId", crypto.randomUUID());
        const attachment = await new Promise<EventAttachment>(
          (resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open(
              "POST",
              `/api/events/${encodeURIComponent(event.id)}/milestones/${encodeURIComponent(milestone.id)}/attachments`,
            );
            xhr.timeout = 120000;
            xhr.upload.onprogress = (e) =>
              setProgress(
                `${file.name}: ${e.lengthComputable ? Math.round((e.loaded / e.total) * 100) + "% terkirim" : "mengirim"} · menunggu konfirmasi penyimpanan`,
              );
            xhr.onerror = () =>
              reject(
                new Error(
                  "Koneksi upload gagal. Muat ulang untuk memeriksa draf sebelum mencoba lagi.",
                ),
              );
            xhr.ontimeout = () =>
              reject(
                new Error(
                  "Upload melewati batas waktu. Periksa draf sebelum mencoba lagi.",
                ),
              );
            xhr.onload = () => {
              let data;
              try {
                data = JSON.parse(xhr.responseText);
              } catch {
                reject(new Error("Respons upload tidak valid."));
                return;
              }
              if (xhr.status < 200 || xhr.status >= 300)
                reject(new Error(data.error?.message ?? "Upload gagal."));
              else if (!data.attachment?.uploaded)
                reject(new Error("Penyimpanan belum dikonfirmasi."));
              else resolve(data.attachment);
            };
            xhr.send(form);
          },
        );
        setWork((w) => ({
          ...w,
          files: w.files.some((f) => f.id === attachment.id)
            ? w.files
            : [...w.files, attachment],
        }));
        setNotice(
          `${attachment.name} berhasil disimpan di penyimpanan privat.`,
        );
      }
      await refreshWorkspace();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload gagal.");
    } finally {
      working.current = false;
      setUploading(false);
      setProgress("");
    }
  }
  async function removeFile(file: EventAttachment) {
    if (working.current) return;
    working.current = true;
    setUploading(true);
    setError("");
    try {
      if (file.uploaded) {
        const response = await fetch(
          `/api/attachments/${encodeURIComponent(file.id)}`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ expectedVersion: latest?.version ?? 0 }),
          },
        );
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error?.message ?? "File tidak dapat dihapus.");
      }
      setWork((w) => ({
        ...w,
        files: w.files.filter((f) => f.id !== file.id),
      }));
      await refreshWorkspace();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Penghapusan gagal.");
    } finally {
      working.current = false;
      setUploading(false);
    }
  }
  if (!milestone)
    return (
      <SiswaShell frame={frame} active="dashboard">
        <EmptyRows>
          Milestone tidak ditemukan.{" "}
          <Link href="/siswa/dashboard" className="text-primary">
            Kembali ke Dashboard
          </Link>
        </EmptyRows>
      </SiswaShell>
    );
  return (
    <SiswaShell frame={frame} active="dashboard">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/siswa/dashboard" },
          { label: event.title },
        ]}
      />
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[28px] font-semibold leading-[34px]">
            {event.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <StatusBadge
              status={row.completed === row.total ? "complete" : "pending"}
            >
              {row.completed === row.total
                ? "Tugas & survei selesai"
                : "Dalam pengerjaan"}
            </StatusBadge>
            <p className="text-xs text-secondary">
              {formatPeriod(event.period)} · Mode {event.mode} ·{" "}
              {event.teacherName ?? "—"}
            </p>
          </div>
        </div>
        <div className="w-full max-w-[294px] rounded-2xl border border-line bg-white p-4">
          <LearningProgress
            value={
              row.total ? Math.round((row.completed / row.total) * 100) : 0
            }
            label={`${row.completed} dari ${row.total} · ${row.total ? Math.round((row.completed / row.total) * 100) : 0}%`}
          />
        </div>
      </header>
      <nav
        aria-label="Milestone event"
        className="mb-6 grid gap-3 rounded-2xl border border-line bg-white p-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {event.milestones.map((m, i) => {
          const open = milestoneUnlocked(event, studentId, i, state.learning),
            s = submissionStatus(row.submissions[i], state.learning);
          return (
            <Link
              aria-current={i === index ? "step" : undefined}
              aria-disabled={!open}
              href={open ? workHref(event.id, m.id) : "#"}
              onClick={(e) => {
                if (!open) {
                  e.preventDefault();
                  setNotice(
                    "Selesaikan tugas dan survei milestone sebelumnya untuk membuka tahap ini.",
                  );
                }
              }}
              key={m.id}
              className={`flex min-w-0 items-center gap-3 rounded-xl border p-3 ${s === "revision" ? "border-amber-300 bg-amber-50 text-amber-900" : i === index ? "border-primary bg-blue-50" : "border-line bg-white"}`}
            >
              <span
                className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${s === "revision" ? "bg-amber-500 text-white" : i === index ? "bg-primary text-white" : "bg-gray-100 text-secondary"}`}
              >
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-medium">{m.title}</span>
                <span className="mt-1 block text-[11px] text-secondary">
                  {!open
                    ? "Terkunci"
                    : s === "missing"
                      ? "Sedang dikerjakan"
                      : submissionLabels[s]}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>
      {notice && (
        <div className="mb-4">
          <StudentNotice>{notice}</StudentNotice>
        </div>
      )}
      {!unlocked ? (
        <StudentNotice tone="amber">
          Milestone masih terkunci. Selesaikan tugas dan Form Survei tahap
          sebelumnya.
        </StudentNotice>
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2.067fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            {revision && lastFeedback && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <div className="mb-3 flex flex-wrap justify-between gap-2">
                  <h2 className="font-semibold">
                    Feedback Guru · Milestone {index + 1}
                  </h2>
                  <StatusBadge status="revision">Revisi diminta</StatusBadge>
                </div>
                <p className="mb-3 text-xs text-secondary">
                  {event.teacherName ?? "—"} ·{" "}
                  {formatEventDate(lastFeedback.createdAt, true)}
                </p>
                <p className="whitespace-pre-wrap text-sm leading-6">
                  {lastFeedback.message}
                </p>
                <p className="mt-3 text-xs text-amber-800">
                  {lastFeedback.deadline
                    ? `Batas revisi ${formatEventDate(lastFeedback.deadline, true)} · `
                    : ""}
                  Nilai sebelumnya tidak berlaku sampai revisi dinilai.
                </p>
              </div>
            )}
            {submission &&
              submission.surveyRequired !== false &&
              !submission.surveyComplete &&
              !revision && (
                <StudentNotice>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-0 flex-1 basis-64">
                      <p className="font-semibold">
                        Tugas Milestone {index + 1} sudah terkumpul
                      </p>
                      <p className="mt-1">
                        {milestone.surveyActive
                          ? `Isi Form Survei Pembelajaran ${next ? `untuk membuka Milestone ${index + 2} · ${next.title}` : "untuk menyelesaikan tahap ini"}.`
                          : "Tidak ada survei wajib yang dikonfigurasi untuk milestone ini. Konfigurasi survei Guru berada di luar prototipe ini."}
                      </p>
                    </div>
                    {milestone.surveyActive && (
                      <SiswaLink
                        href={surveyHref(event.id, milestone.id)}
                        primary
                        className="shrink-0"
                      >
                        Isi Form Survei
                      </SiswaLink>
                    )}
                  </div>
                </StudentNotice>
              )}
            <Surface>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold">
                    {revision
                      ? `Unggah Revisi · Versi ${(latest?.version ?? 0) + 1}`
                      : `Milestone ${index + 1} · ${milestone.title}`}
                  </h2>
                  {latest && !revision && (
                    <p className="mt-1 text-xs text-secondary">
                      Dikumpulkan {formatEventDate(latest.submittedAt, true)} ·
                      Versi {latest.version}
                    </p>
                  )}
                </div>
                <StatusBadge status={status === "missing" ? "pending" : status}>
                  {status === "missing"
                    ? "Sedang dikerjakan"
                    : submissionLabels[status]}
                </StatusBadge>
              </div>
              {!submission || revision ? (
                <form
                  noValidate
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (working.current) return;
                    working.current = true;
                    setUploading(true);
                    setNotice("");
                    const problem = await submitStudentWork(
                      event.id,
                      milestone.id,
                      work,
                    );
                    setError(problem);
                    working.current = false;
                    setUploading(false);
                    if (!problem)
                      router.push(
                        revision
                          ? workHref(event.id, milestone.id)
                          : "/siswa/dashboard",
                      );
                  }}
                >
                  {!revision && (
                    <>
                      <h3 className="mb-2 text-sm font-medium">
                        Instruksi guru
                      </h3>
                      <p className="whitespace-pre-wrap text-sm leading-5 text-secondary">
                        {milestone.instructions ||
                          "Instruksi belum disediakan pada data contoh."}
                      </p>
                      <div className="my-4 flex flex-wrap gap-3 text-xs text-secondary">
                        <span>
                          Deadline{" "}
                          {milestone.deadline
                            ? formatEventDate(milestone.deadline, true)
                            : "belum ditentukan"}
                        </span>
                        <span>
                          Format: {milestone.formats || "Belum ditentukan"}
                        </span>
                        <span>Maks. 5 file · 10 MB</span>
                      </div>
                    </>
                  )}
                  <label
                    className="mb-2 block text-[13px] font-medium"
                    htmlFor="student-files"
                  >
                    File {revision ? "revisi" : "tugas"}
                  </label>
                  <div className="space-y-2">
                    {work.files.map((f) => (
                      <AttachmentActions
                        key={f.id}
                        file={f}
                        onRemove={() => void removeFile(f)}
                        busy={uploading}
                      />
                    ))}
                  </div>
                  <div
                    className="mt-2 rounded-xl border border-dashed border-line p-5 text-center text-sm text-secondary"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      files(e.dataTransfer.files);
                    }}
                  >
                    <input
                      ref={input}
                      id="student-files"
                      type="file"
                      multiple
                      disabled={uploading}
                      accept={`${!milestone.formats || milestone.formats.includes("PDF") ? ".pdf," : ""}${!milestone.formats || milestone.formats.includes("Gambar") ? ".png,.jpg,.jpeg," : ""}${!milestone.formats || milestone.formats.includes("DOCX") ? ".docx" : ""}`}
                      className="sr-only"
                      onChange={(e) => {
                        files(e.target.files);
                        e.currentTarget.value = "";
                      }}
                    />
                    Tarik file ke sini atau{" "}
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => input.current?.click()}
                      className="font-medium text-primary"
                    >
                      Pilih File
                    </button>
                    <p className="mt-2 text-xs">
                      {milestone.formats} · maks. 10 MB per file · maks. 5 file
                    </p>
                  </div>
                  {milestone.formats?.includes("Hyperlink") && (
                    <label className="mt-4 block text-[13px] font-medium">
                      Tautan project (opsional)
                      <input
                        className={`${studentControl} mt-2`}
                        value={work.link}
                        onChange={(e) =>
                          setWork((w) => ({ ...w, link: e.target.value }))
                        }
                        placeholder="https://example.com/project-demo"
                      />
                    </label>
                  )}
                  <label
                    htmlFor="student-work-text"
                    className="mt-4 block text-[13px] font-medium"
                  >
                    {revision
                      ? "Catatan revisi (opsional)"
                      : "Teks jawaban (opsional)"}
                    <textarea
                      id="student-work-text"
                      className={`${studentControl} mt-2 !h-[88px] resize-y py-3 font-normal`}
                      value={work.text}
                      onChange={(e) =>
                        setWork((w) => ({ ...w, text: e.target.value }))
                      }
                      placeholder="Tulis ringkasan temuan atau tautan dokumen pendukung..."
                      maxLength={8000}
                    />
                  </label>
                  <p className="mt-3 text-[11px] text-secondary">
                    Berkas benar-benar diunggah dan disimpan privat. Gunakan
                    berkas latihan; jangan unggah data sensitif. Validasi format
                    bukan pemindaian malware.
                  </p>
                  {progress && (
                    <p
                      role="status"
                      className="mt-3 break-all text-xs text-primary"
                    >
                      {progress}
                    </p>
                  )}
                  {error && (
                    <p role="alert" className="mt-3 text-sm text-danger">
                      {error}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap justify-end gap-3">
                    {revision && (
                      <SiswaLink href="/siswa/dashboard">Batal</SiswaLink>
                    )}
                    <SiswaButton
                      disabled={uploading}
                      variant="outline"
                      onClick={async () => {
                        if (working.current) return;
                        working.current = true;
                        setUploading(true);
                        setNotice("");
                        if (await saveWorkDraft(event.id, milestone.id, work))
                          setNotice("Draf tersimpan di server.");
                        else setError("Draf belum tersimpan. Coba lagi.");
                        working.current = false;
                        setUploading(false);
                      }}
                    >
                      Simpan Draf
                    </SiswaButton>
                    <SiswaButton type="submit" disabled={uploading}>
                      {revision
                        ? "Kirim Revisi"
                        : `Kumpulkan Milestone ${index + 1}`}
                    </SiswaButton>
                  </div>
                </form>
              ) : (
                latest && (
                  <StudentEvidence submission={submission} version={latest} />
                )
              )}
            </Surface>
            {next && submission && !revision && (
              <Surface>
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold">
                      Milestone {index + 2} · {next.title}
                    </h2>
                    <p className="mt-2 text-xs text-secondary">
                      {milestoneUnlocked(
                        event,
                        studentId,
                        index + 1,
                        state.learning,
                      )
                        ? "Tugas dan survei tahap sebelumnya telah selesai."
                        : `Terbuka setelah Form Survei Milestone ${index + 1} dikirim.`}
                    </p>
                  </div>
                  {milestoneUnlocked(
                    event,
                    studentId,
                    index + 1,
                    state.learning,
                  ) ? (
                    <SiswaLink primary href={workHref(event.id, next.id)}>
                      Buka Milestone {index + 2}
                    </SiswaLink>
                  ) : (
                    <StatusBadge status="missing">Terkunci</StatusBadge>
                  )}
                </div>
              </Surface>
            )}
          </div>
          <aside className="space-y-6">
            {revision && submission ? (
              <>
                <Surface>
                  <h2 className="mb-4 text-[15px] font-semibold">
                    Riwayat Pengumpulan · {submission.versions.length} versi
                  </h2>
                  <div className="space-y-5">
                    {submission.versions.map((v) => (
                      <div key={v.version}>
                        <p className="mb-2 text-xs text-secondary">
                          Versi {v.version} ·{" "}
                          {formatEventDate(v.submittedAt, true)}
                        </p>
                        <StudentEvidence submission={submission} version={v} />
                      </div>
                    ))}
                  </div>
                </Surface>
                {latest && (
                  <Surface>
                    <h2 className="mb-4 text-[15px] font-semibold">
                      Skor Rubrik Versi {latest.version}
                    </h2>
                    {rubric &&
                    rubricScore(
                      assessmentForVersion(
                        submission,
                        latest.version,
                        state.learning,
                      ),
                      rubric,
                    ) ? (
                      <>
                        <SummaryRows
                          rows={rubric.criteria.map((c) => [
                            c.title,
                            `${assessmentForVersion(submission, latest.version, state.learning)?.[c.id]} / ${c.max}`,
                          ])}
                        />
                        <p className="mt-4 rounded-lg bg-gray-50 p-3 text-xs">
                          Nilai sebelumnya:{" "}
                          {
                            rubricScore(
                              assessmentForVersion(
                                submission,
                                latest.version,
                                state.learning,
                              ),
                              rubric,
                            )?.percent
                          }{" "}
                          · Perlu dinilai ulang setelah revisi.
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-secondary">
                        Versi ini belum memiliki nilai tersimpan.
                      </p>
                    )}
                  </Surface>
                )}
              </>
            ) : (
              <>
                {submission && (
                  <Surface>
                    <h2 className="mb-4 text-[15px] font-semibold">
                      Langkah Berikutnya
                    </h2>
                    <ol className="space-y-3 text-xs">
                      {[
                        [
                          `Kumpulkan tugas Milestone ${index + 1}`,
                          true,
                          "Selesai",
                        ],
                        [
                          `Isi Form Survei Milestone ${index + 1}`,
                          submissionComplete(submission),
                          submission.surveyRequired === false
                            ? "Tidak diwajibkan"
                            : submission.surveyComplete
                              ? "Selesai"
                              : "Belum diisi",
                        ],
                        [
                          next
                            ? `Milestone ${index + 2} terbuka`
                            : "Pengerjaan milestone selesai",
                          submissionComplete(submission),
                          submissionComplete(submission)
                            ? "Terbuka"
                            : "Menunggu",
                        ],
                      ].map(([label, done, text], n) => (
                        <li
                          key={String(label)}
                          className="flex items-start gap-2"
                        >
                          <span className="grid size-5 shrink-0 place-items-center rounded-full bg-gray-100 text-[10px] text-secondary">
                            {n + 1}
                          </span>
                          <span className="min-w-0 flex-1">{label}</span>
                          <StatusBadge
                            status={
                              done ? "complete" : n === 1 ? "survey" : "missing"
                            }
                          >
                            {text}
                          </StatusBadge>
                        </li>
                      ))}
                    </ol>
                    {!submission.surveyComplete && milestone.surveyActive ? (
                      <SiswaLink
                        primary
                        href={surveyHref(event.id, milestone.id)}
                        className="mt-4 w-full"
                      >
                        Isi Form Survei Sekarang
                      </SiswaLink>
                    ) : !milestone.surveyActive &&
                      !submission.surveyComplete ? (
                      <p className="mt-4 text-xs text-secondary">
                        Tidak ada survei wajib yang dikonfigurasi untuk
                        milestone ini.
                      </p>
                    ) : null}
                  </Surface>
                )}
                <Surface>
                  <h2 className="text-[15px] font-semibold">Ringkasan Event</h2>
                  <SummaryRows
                    rows={[
                      ["Guru pengampu", event.teacherName ?? "—"],
                      ["Mode milestone", event.mode],
                      ["Rubrik", rubric?.title ?? "Belum tersedia"],
                      [
                        "Sertifikat",
                        `Nilai akhir ≥ ${certificateThreshold(event)}`,
                      ],
                    ]}
                  />
                </Surface>
                {!submission && (
                  <Surface>
                    <h2 className="text-[15px] font-semibold">
                      Rubrik Penilaian
                    </h2>
                    <p className="mt-1 text-xs text-secondary">
                      Setiap kriteria dinilai sesuai rentang rubrik
                    </p>
                    <SummaryRows
                      rows={
                        rubric?.criteria.map((c) => [
                          c.title,
                          `Skor ${c.min}–${c.max}`,
                        ]) ?? []
                      }
                    />
                    <p className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-secondary">
                      Nilai = (total skor ÷{" "}
                      {rubric?.criteria.reduce((s, c) => s + c.max, 0) ??
                        "total maksimum"}
                      ) × 100
                    </p>
                  </Surface>
                )}
              </>
            )}
            {!revision && !submission && (
              <Surface>
                <h2 className="mb-3 text-[15px] font-semibold">Form Survei</h2>
                <StatusBadge status="missing">Belum tersedia</StatusBadge>
                <p className="my-3 text-[13px] leading-5 text-secondary">
                  Form survei terbuka setelah tugas Milestone {index + 1}{" "}
                  dikumpulkan.
                  {next &&
                    ` Milestone ${index + 2} terbuka setelah survei dikirim.`}
                </p>
              </Surface>
            )}
          </aside>
        </div>
      )}
    </SiswaShell>
  );
}
