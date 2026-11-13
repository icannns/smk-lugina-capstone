"use client";
import Link from "next/link";
import { useState } from "react";
import type { ManagedEvent } from "@/lib/guru/event-types";
import type {
  SubmissionVersion,
  TeacherSubmission,
} from "@/lib/guru/teacher-types";
import {
  assessmentFor,
  feedbackFor,
  eventLearning,
  monitoringHref,
  rubricScore,
  submissionStatus,
  allSubmissions,
  allStudents,
  assessmentForVersion,
  milestoneLabel,
} from "@/lib/guru/learning-selectors";
import {
  addTeacherFeedback,
  saveAssessment,
  useEventDraftStore,
  useTeacherProfile,
} from "@/lib/guru/event-draft-store";
import { formatEventDate } from "@/lib/guru/event-selectors";
import { AttachmentActions } from "../../shared/attachment-actions";
import { TeacherPage } from "../teacher-page";
import { Surface, DesignIcon, controlClass } from "../design-ui";
import { EmptyRows, StatusBadge, StudentAvatar } from "../learning-ui";
import {
  DashboardDialog,
  type DashboardDialogState,
} from "../dashboard-dialog";
const nowWib = () => {
  const now = new Date();
  return (
    now
      .toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" })
      .replace(" ", "T") + `.${String(now.getMilliseconds()).padStart(3, "0")}`
  );
};
const date = (v?: string) => (v ? formatEventDate(v.slice(0, 16), true) : "—");
export function Assessment({
  event,
  studentId,
  milestoneId,
}: {
  event: ManagedEvent;
  studentId: string;
  milestoneId: string;
}) {
  const state = useEventDraftStore(),
    rubric = state.rubrics[event.rubricId ?? ""];
  const teacher = useTeacherProfile();
  const teacherSubmissions = allSubmissions(state.learning),
    teacherStudents = allStudents(state.learning);
  const roster = eventLearning(event, state.learning, rubric).rows,
    student = teacherStudents.find((s) => s.id === studentId),
    milestone = event.milestones.find((m) => m.id === milestoneId);
  const submission = teacherSubmissions.find(
    (s) => s.eventId === event.id && s.studentId === studentId && s.milestoneId === milestoneId,
  );
  const status = submissionStatus(submission, state.learning),
    saved = submission ? assessmentFor(submission, state.learning) : undefined,
    latest = submission?.versions.at(-1);
  const [values, setValues] = useState<Record<string, number>>(saved ?? {}),
    [tab, setTab] = useState(
      submission && submission.versions.length > 1 ? "history" : "survey",
    ),
    [message, setMessage] = useState(""),
    [deadline, setDeadline] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [dialog, setDialog] = useState<DashboardDialogState | null>(null);
  if (!student || !milestone || !roster.some((r) => r.student.id === studentId))
    return (
      <TeacherPage activePage="monitoring" frame="291:23200">
        <EmptyRows>
          Peserta atau milestone tidak ditemukan pada event ini.{" "}
          <Link href={monitoringHref(event.id)} className="text-primary">
            Kembali
          </Link>
        </EmptyRows>
      </TeacherPage>
    );
  const score = rubricScore(values, rubric),
    filled =
      rubric?.criteria.filter((c) => values[c.id] !== undefined).length ?? 0,
    criteria = rubric?.criteria.length ?? 0;
  const frame =
    status === "missing"
      ? "291:23934"
      : status === "reviewed"
        ? "291:22831"
        : status === "revision"
          ? "291:24254"
          : status === "survey"
            ? "291:24637"
            : submission!.versions.length > 1
              ? "291:24976"
              : score
                ? "291:23570"
                : "291:23200";
  const next =
    roster[
      (roster.findIndex((r) => r.student.id === studentId) + 1) % roster.length
    ].student;
  const feedback = submission ? feedbackFor(submission.id, state.learning) : [];
  async function send(revision: boolean) {
    if (busy) return;
    if (!submission || !latest) return;
    if (!message.trim()) {
      setError("Tulis pesan feedback terlebih dahulu.");
      return;
    }
    if (
      revision &&
      milestone!.deadline &&
      milestone!.deadline < nowWib() &&
      !deadline
    ) {
      setError("Batas revisi wajib diisi karena deadline telah lewat (D02).");
      return;
    }
    if (revision && deadline && deadline <= nowWib()) {
      setError("Batas revisi harus berada setelah waktu sekarang (WIB).");
      return;
    }
    setNotice("");
    setBusy(true);
    const sent = await addTeacherFeedback(submission.id, {
      id: crypto.randomUUID(),
      message: message.trim(),
      createdAt: nowWib(),
      revision,
      deadline: revision ? deadline || undefined : undefined,
      version: latest.version,
    });
    setBusy(false);
    if (!sent) { setError("Feedback belum tersimpan. Periksa pesan server."); return; }
    setMessage("");
    if (revision) setValues({});
    setDeadline("");
    setError("");
    setNotice(
      revision
        ? "Revisi diminta pada pengumpulan contoh ini."
        : "Feedback tersimpan di server.",
    );
  }
  async function save() {
    if (!submission || !latest || !score || !rubric || busy) return;
    setNotice("");
    setBusy(true);
    const saved = await saveAssessment(
      {
        submissionId: submission.id,
        version: latest.version,
        scores: values,
        savedAt: nowWib(),
      },
      rubric.id,
    );
    setBusy(false);
    if (!saved) { setError("Penilaian belum tersimpan. Periksa pesan server."); return; }
    setNotice("Penilaian tersimpan di server.");
  }
  return (
    <TeacherPage activePage="monitoring" frame={frame}>
      <nav
        aria-label="Breadcrumb"
        className="mb-4 flex flex-wrap items-center gap-2 text-xs text-secondary"
      >
        <Link href="/guru/monitoring">Monitoring Progres</Link>
        <span>›</span>
        <Link href={monitoringHref(event.id)}>{event.title}</Link>
        <span>›</span>
        <span className="text-foreground">
          {student.name} · {milestoneLabel(event, milestone.id)}
        </span>
      </nav>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <StudentAvatar name={student.name} />
          <div>
            <h1 className="text-[30px] font-semibold leading-[38px] tracking-[-.75px]">
              {student.name}
            </h1>
            <p className="text-sm text-secondary">
              {event.title} · Milestone{" "}
              {event.milestones.indexOf(milestone) + 1}: {milestone.title}
            </p>
          </div>
        </div>
        <Link
          href={monitoringHref(event.id, next.id, milestone.id)}
          className="flex h-10 items-center gap-3 rounded-control bg-white px-4 text-sm"
        >
          <DesignIcon frame="291:23200" name="imgIcon1" />
          Siswa berikutnya
        </Link>
      </header>
      <Surface
        padded={false}
        className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3 text-xs"
      >
        <p className="text-secondary">
          Deadline{" "}
          <strong className="font-semibold text-foreground">
            {date(milestone.deadline)}
          </strong>
        </p>
        <p className="text-secondary">
          Dikirim{" "}
          <strong className="font-semibold text-foreground">
            {latest ? date(latest.submittedAt) : "Belum dikumpulkan"}
          </strong>
        </p>
        <StatusBadge status={status} />
        {status !== "reviewed" && (
          <StatusBadge status="missing">Belum dinilai</StatusBadge>
        )}
      </Surface>
      {latest && latest.version > 1 && status !== "reviewed" && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <strong>Perlu diperiksa ulang.</strong> Siswa mengunggah revisi versi{" "}
          {latest.version} pada {date(latest.submittedAt)}. Nilai versi
          sebelumnya tetap ada di Riwayat.
        </div>
      )}
      <div className="grid items-start gap-6 min-[1250px]:grid-cols-[minmax(0,668fr)_minmax(0,420fr)]">
        <div className="min-w-0 space-y-6">
          <Surface>
            <h2 className="font-semibold">
              Bukti pekerjaan{" "}
              {latest && latest.version > 1 && (
                <span className="ml-1 rounded bg-blue-50 px-2 py-1 text-xs font-normal text-primary">
                  Versi {latest.version}
                </span>
              )}
            </h2>
            {submission && latest ? (
              <>
                <p className="mb-3 mt-4 text-xs text-secondary">
                  Versi {latest.version} · dikirim {date(latest.submittedAt)}
                </p>
                <Evidence
                  submission={submission}
                  version={latest}
                  onPreview={setDialog}
                />
                {latest.link && (
                  <div className="mt-2 flex min-w-0 items-center gap-3 rounded-xl border border-line p-3">
                    <DesignIcon frame="291:23200" name="imgIcon5" />
                    <span className="min-w-0 flex-1 break-all text-sm">
                      {latest.link}
                      <small className="block text-xs text-secondary">
                        Tautan eksternal contoh
                      </small>
                    </span>
                    <button
                      type="button"
                      className="shrink-0 text-sm text-primary"
                      onClick={() =>
                        setDialog({
                          title: "Tautan contoh",
                          description:
                            "Alamat ini hanya menggambarkan lampiran Figma pada prototipe. Tidak ada file siswa atau layanan eksternal yang diakses.",
                        })
                      }
                    >
                      Buka
                    </button>
                  </div>
                )}
                {latest.note && (
                  <div className="mt-3 rounded-xl border border-line p-3 text-sm">
                    <p className="mb-1 text-xs text-secondary">Catatan</p>
                    {latest.note}
                  </div>
                )}
              </>
            ) : (
              <div className="py-9 text-center">
                <div className="mx-auto mb-3 flex w-fit rounded-xl bg-gray-50 p-3">
                  <DesignIcon frame="291:23934" name="imgIcon2" />
                </div>
                <h3 className="text-sm font-medium">Belum dikumpulkan</h3>
                <p className="mt-1 text-xs text-secondary">
                  Siswa belum mengirim bukti pekerjaan untuk milestone ini.
                </p>
              </div>
            )}
          </Surface>
          <Surface padded={false} className="overflow-hidden">
            <div
              role="tablist"
              aria-label="Informasi pengumpulan"
              className="flex overflow-x-auto border-b border-line px-6 pt-4"
            >
              {[
                ["survey", "Form Survei"],
                ["history", "Riwayat Pengumpulan"],
                ["rubric", "Lembar Rubrik"],
              ].map(([key, label]) => (
                <button
                  type="button"
                  role="tab"
                  key={key}
                  aria-selected={tab === key}
                  onClick={() => setTab(key)}
                  className={`shrink-0 border-b-2 px-4 pb-3 text-sm ${tab === key ? "border-primary text-foreground" : "border-transparent text-secondary"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div role="tabpanel" className="p-6">
              {tab === "survey" &&
                (submission?.surveyRequired === false ? <p className="text-sm text-secondary">Milestone ini tidak mewajibkan survei.</p> : submission?.surveyComplete ? (
                  <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
                    {[
                      [
                        "Status Form Survei",
                        <StatusBadge key="sent" status="reviewed">
                          Sudah Dikirim
                        </StatusBadge>,
                      ],
                      [
                        "Instrumen Survei",
                        submission.instrument ??
                          (state.learning.source !== "api" && studentId === "dimas"
                            ? "Survei Pengalaman Belajar & Technostress"
                            : "—"),
                      ],
                      [
                        "Ringkasan Skor Survei",
                        submission.surveySummary ??
                          (state.learning.source === "api" ? "Skor provider belum tersedia" : `Skor Technostress: ${submission.surveyScore} / 5.0 (Kategori ${submission.surveyScore! >= 3 ? "Sedang" : "Rendah"})`),
                      ],
                      [
                        "Status Kelengkapan",
                        submission.completion ??
                          (studentId === "dimas"
                            ? "Tugas & Form Survei telah terverifikasi"
                            : "—"),
                      ],
                      [
                        "Integrasi Hasil Survei",
                        submission.integration ??
                          (studentId === "dimas"
                            ? "Tercatat pada menu Hasil Survei Guru"
                            : "—"),
                      ],
                      ["Catatan Refleksi Siswa", submission.reflection ?? "—"],
                    ].map(([key, value]) => (
                      <div
                        key={String(key)}
                        className={
                          key === "Ringkasan Skor Survei" ||
                          key === "Catatan Refleksi Siswa"
                            ? "sm:col-span-2"
                            : ""
                        }
                      >
                        <dt className="mb-1 text-xs text-secondary">{key}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="rounded-xl bg-gray-50 p-4 text-sm text-secondary">
                    ○ Survei belum diisi
                  </p>
                ))}
              {tab === "history" &&
                (submission ? (
                  <div className="space-y-3">
                    {[...submission.versions].reverse().map((v) => {
                      const historic =
                          v.version !== latest?.version ||
                          status === "revision",
                        oldScore = rubricScore(
                          assessmentForVersion(
                            submission,
                            v.version,
                            state.learning,
                          ),
                          rubric,
                        );
                      return (
                        <div
                          key={v.version}
                          className="rounded-xl border border-line p-3"
                        >
                          <div className="mb-2 flex flex-wrap justify-between gap-2 text-xs">
                            <span>
                              <span className="mr-2 rounded bg-blue-50 px-2 py-0.5 text-primary">
                                Versi {v.version}
                              </span>
                              <span className="text-secondary">
                                {date(v.submittedAt)}
                              </span>
                            </span>
                            <span>
                              {oldScore
                                ? `Nilai ${oldScore.percent}${historic ? " (riwayat, bukan nilai final)" : ""}`
                                : "Belum dinilai"}
                            </span>
                          </div>
                          <Evidence
                            submission={submission}
                            version={v}
                            onPreview={setDialog}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-secondary">
                    Belum ada riwayat pengumpulan.
                  </p>
                ))}
              {tab === "rubric" &&
                (rubric ? (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold">{rubric.title}</h3>
                    {rubric.criteria.map((c) => (
                      <div key={c.id}>
                        <h4 className="text-sm font-medium">
                          {c.title}{" "}
                          <span className="text-xs text-secondary">
                            ({c.min}–{c.max})
                          </span>
                        </h4>
                        <p className="text-xs text-secondary">
                          {c.description}
                        </p>
                        {c.levels?.some(Boolean) && (
                          <ol className="mt-2 space-y-1 text-xs text-secondary">
                            {c.levels.map((l, i) => (
                              <li key={i}>
                                {i + 1}. {l || "—"}
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    ))}
                    <Link
                      href={`/guru/rubrics?mode=view&rubric=${rubric.id}`}
                      className="inline-block text-sm text-primary"
                    >
                      Lihat rubrik lengkap →
                    </Link>
                  </div>
                ) : (
                  <p className="text-sm text-secondary">
                    Rubrik belum dikonfigurasi untuk event ini.
                  </p>
                ))}
            </div>
          </Surface>
        </div>
        <div className="min-w-0 space-y-6">
          <Surface>
            <div className="mb-5 flex justify-between gap-2">
              <h2 className="font-semibold">Lembar penilaian</h2>
              <span className="text-xs text-secondary">
                {filled} dari {criteria} kriteria terisi
              </span>
            </div>
            {!submission && (
              <p className="mb-4 rounded-xl bg-gray-50 p-3 text-xs text-secondary">
                Belum dikumpulkan · Belum dinilai. Penilaian aktif setelah siswa
                mengumpulkan.
              </p>
            )}
            {!rubric && (
              <p className="text-sm text-secondary">Rubrik belum tersedia.</p>
            )}
            <div className="space-y-5">
              {rubric?.criteria.map((c) => (
                <fieldset
                  key={c.id}
                  disabled={!submission || Boolean(saved) || busy}
                >
                  <legend className="text-sm font-medium">{c.title}</legend>
                  <p className="mb-2 text-xs text-secondary">{c.description}</p>
                  <div className="flex rounded-xl bg-gray-100 p-1">
                    {Array.from(
                      { length: c.max - c.min + 1 },
                      (_, i) => i + c.min,
                    ).map((n) => (
                      <button
                        type="button"
                        aria-label={`${c.title} skor ${n}`}
                        aria-pressed={values[c.id] === n}
                        key={n}
                        onClick={() => setValues((v) => ({ ...v, [c.id]: n }))}
                        className={`h-9 min-w-0 flex-1 rounded-lg text-sm transition-colors disabled:cursor-not-allowed ${values[c.id] === n ? "bg-primary text-white" : "text-secondary hover:bg-white"}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-secondary">
                    {values[c.id]
                      ? `Skor ${values[c.id]} dipilih`
                      : "Skor belum dipilih"}
                  </p>
                </fieldset>
              ))}
            </div>
            <div className="my-5 grid grid-cols-2 gap-4 rounded-2xl bg-gray-50 p-4">
              <div>
                <p className="text-xs text-secondary">Skor rubrik</p>
                <p className="mt-1 text-lg font-semibold">
                  {score ? `${score.total} / ${score.max}` : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-secondary">Nilai 0–100</p>
                <p className="mt-1 text-sm text-secondary">
                  {score ? `${score.percent} / 100` : "Belum dinilai"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={save}
              disabled={!submission || !score || Boolean(saved) || busy}
              className="h-10 w-full rounded-control bg-primary text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-45"
            >
              {busy
                ? "Menyimpan…"
                : saved
                  ? "Nilai sudah tersimpan"
                  : "Simpan Penilaian"}
            </button>
            {!saved && (
              <p className="mt-1 text-xs text-secondary">
                ⓘ{" "}
                {submission
                  ? `Isi ${criteria - filled} kriteria lagi`
                  : "Belum ada pengumpulan"}
              </p>
            )}
          </Surface>
          <Surface>
            <h2 className="mb-4 font-semibold">Feedback guru</h2>
            <div className="space-y-3">
              {feedback.map((f) => (
                <article
                  key={f.id}
                  className={`rounded-xl border p-3 text-xs ${f.revision ? "border-red-100 bg-red-50/60" : "border-line bg-gray-50"}`}
                >
                  <div className="mb-2 flex flex-wrap gap-2">
                    <strong>{teacher.name}</strong>
                    <time className="text-secondary">{date(f.createdAt)}</time>
                  </div>
                  {f.revision && (
                    <p className="mb-1 text-red-600">Revisi diminta</p>
                  )}
                  <p className="whitespace-pre-wrap leading-5">{f.message}</p>
                  {f.deadline && (
                    <p className="mt-2 text-secondary">
                      Batas revisi {date(f.deadline)}
                    </p>
                  )}
                </article>
              ))}
            </div>
            <label className="mt-4 block text-sm">
              Pesan feedback
              <textarea
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setError("");
                }}
                disabled={!submission}
                placeholder="Tulis masukan yang spesifik dan bisa ditindaklanjuti."
                className={`${controlClass} mt-2 !h-24 resize-y py-3`}
              />
            </label>
            <label className="mt-4 block text-xs">
              Batas revisi (WIB){" "}
              <span className="text-secondary">
                — wajib bila deadline sudah lewat (D02)
              </span>
              <input
                aria-label="Batas revisi (WIB)"
                type="datetime-local"
                className={`${controlClass} mt-1`}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                disabled={!submission}
              />
            </label>
            {error && (
              <p role="alert" className="mt-2 text-xs text-red-600">
                {error}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!submission}
                onClick={() => send(false)}
                className="flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-control bg-white px-2 text-sm disabled:opacity-40"
              >
                <DesignIcon frame="291:23200" name="imgIcon8" />
                Kirim Feedback
              </button>
              <button
                type="button"
                disabled={!submission || status === "revision"}
                onClick={() => send(true)}
                className="flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-control bg-red-600 px-2 text-sm text-white disabled:opacity-40"
              >
                <DesignIcon frame="291:23200" name="imgIcon9" />
                Minta Revisi
              </button>
            </div>
            {status === "revision" && (
              <p className="mt-2 text-xs text-secondary">
                Revisi sudah diminta untuk versi ini.
              </p>
            )}
          </Surface>
        </div>
      </div>
      {notice && (
        <p
          role="status"
          className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-800"
        >
          {notice}
        </p>
      )}
      {state.storageError && (
        <p role="alert" className="mt-4 text-sm text-amber-800">
          {state.storageError}
        </p>
      )}
      <DashboardDialog
        action={dialog}
        onClose={() => setDialog(null)}
        onDelete={() => setDialog(null)}
      />
    </TeacherPage>
  );
}
export function Evidence({
  submission,
  version,
  onPreview,
}: {
  submission: TeacherSubmission;
  version: SubmissionVersion;
  onPreview: (action: DashboardDialogState) => void;
}) {
  void submission; void onPreview;
  const files=version.files??[{id:version.file,name:version.file,size:0,type:""}];
  return <div className="space-y-2">{files.map(file=><AttachmentActions key={file.id} file={file} version={version.version}/>)}</div>;
}
