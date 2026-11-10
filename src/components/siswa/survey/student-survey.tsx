"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { listedEvents, useEventDraftStore } from "@/lib/guru/event-draft-store";
import { enrollmentProgress } from "@/lib/guru/learning-selectors";
import { submissionId } from "@/lib/guru/learning-data";
import { formatEventDate } from "@/lib/guru/event-selectors";
import type { ManagedEvent } from "@/lib/guru/event-types";
import type { SurveyDraft } from "@/lib/siswa/student-types";
import {
  saveSurveyDraft,
  submitStudentSurvey,
} from "@/lib/siswa/student-actions";
import {
  isEnrolled,
  milestoneUnlocked,
  surveyHref,
  workHref,
} from "@/lib/siswa/selectors";
import { likertLabels, surveyQuestions } from "@/lib/siswa/survey-questions";
import { Surface } from "../../guru/design-ui";
import { EmptyRows } from "../../guru/learning-ui";
import { StudentBadge as StatusBadge } from "../siswa-ui";
import { SiswaShell } from "../siswa-shell";
import { useStudentIdentity } from "../use-student-identity";
import {
  Breadcrumb,
  LearningProgress,
  SiswaButton,
  SiswaDialog,
  SiswaLink,
  StudentNotice,
  SummaryRows,
  studentControl,
} from "../siswa-ui";
export function StudentSurvey() {
  const p = useSearchParams(),
    state = useEventDraftStore(),
    identity = useStudentIdentity(),
    event = listedEvents(state).find(
      (e) => e.id === p.get("event") && e.status !== "draft",
    ),
    index =
      event?.milestones.findIndex((m) => m.id === p.get("milestone")) ?? -1;
  if (
    !event ||
    index < 0 ||
    !isEnrolled(event.id, identity.studentId ?? "", state.learning)
  )
    return (
      <SiswaShell frame="370:3247" active="dashboard">
        <EmptyRows>
          Survei tidak ditemukan.{" "}
          <Link href="/siswa/dashboard" className="text-primary">
            Kembali ke Dashboard
          </Link>
        </EmptyRows>
      </SiswaShell>
    );
  return (
    <Survey
      key={`${event.id}:${index}`}
      event={event}
      index={index}
      mode={p.get("mode") ?? "instructions"}
    />
  );
}
function Survey({
  event,
  index,
  mode,
}: {
  event: ManagedEvent;
  index: number;
  mode: string;
}) {
  const state = useEventDraftStore(),
    identity = useStudentIdentity(),
    router = useRouter(),
    studentId = identity.studentId ?? "",
    m = event.milestones[index],
    next = event.milestones[index + 1],
    row = enrollmentProgress(
      event,
      studentId,
      state.learning,
      state.rubrics[event.rubricId ?? ""],
    ),
    submission = row.submissions[index],
    key = submissionId(event.id, studentId, m.id),
    response = state.studentUI.surveyResponses[key],
    locked = Boolean(submission?.surveyComplete),
    [answers, setAnswers] = useState<SurveyDraft>(
      response ??
        state.studentUI.surveyDrafts[key] ?? {
          first: null,
          second: null,
          reflection: "",
        },
    ),
    [confirm, setConfirm] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    result = locked && mode !== "history",
    form = !locked && mode === "form",
    frame = result
      ? "370:3705"
      : confirm
        ? "370:3537"
        : form
          ? "370:3382"
          : "370:3247",
    count =
      Number(Boolean(answers.first)) +
      Number(Boolean(answers.second)) +
      Number(Boolean(answers.reflection.trim()));
  function save() {
    if (saveSurveyDraft(event.id, m.id, answers))
      setNotice("Draf jawaban tersimpan pada sesi tab ini.");
  }
  return (
    <SiswaShell frame={frame} active="dashboard">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/siswa/dashboard" },
          { label: event.title, href: workHref(event.id, m.id) },
          { label: `Milestone ${index + 1}` },
          {
            label: result
              ? "Hasil Pengiriman Survei"
              : form
                ? "Isi Kuesioner Survei"
                : mode === "history"
                  ? "Riwayat Jawaban"
                  : "Petunjuk Survei",
          },
        ]}
      />
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold leading-[34px]">
            {result
              ? "Hasil Pengiriman Survei"
              : form
                ? "Survei Pembelajaran PjBL"
                : mode === "history"
                  ? "Riwayat Jawaban Survei"
                  : "Pengalaman Belajar Anda Sangat Berarti"}
          </h1>
          <p className="mt-2 text-sm text-secondary">
            {!form && !result && mode !== "history" && (
              <span className="mr-2 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-primary">
                Wajib Diisi
              </span>
            )}
            {form
              ? `Pilih jawaban yang paling sesuai dengan pengalaman belajarmu selama mengerjakan Milestone ${index + 1}.`
              : `Survei Adopsi Teknologi dan Technostress (Versi 1.0) · Milestone ${index + 1}: ${m.title}`}
          </p>
        </div>
        {form ? (
          <SiswaButton variant="outline" onClick={save}>
            Simpan Draf
          </SiswaButton>
        ) : (
          <SiswaLink
            href={result ? "/siswa/dashboard" : workHref(event.id, m.id)}
          >
            {result ? "Kembali ke Dashboard" : "Kembali ke Ruang Kerja"}
          </SiswaLink>
        )}
      </header>
      {notice && (
        <div className="mb-4">
          <StudentNotice>{notice}</StudentNotice>
        </div>
      )}
      {!submission ? (
        <StudentNotice tone="amber">
          Kumpulkan tugas milestone sebelum mengisi Form Survei.
        </StudentNotice>
      ) : !m.surveyActive && !locked ? (
        <StudentNotice tone="amber">
          Form Survei belum disiapkan Guru. Konfigurasi modul Survei Guru berada
          di luar prototipe ini.
        </StudentNotice>
      ) : result ? (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2.067fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
              <div className="mb-3 flex flex-wrap justify-between gap-3">
                <h2 className="text-lg font-semibold text-emerald-800">
                  Terima kasih! Survei milestone telah selesai.
                </h2>
                <StatusBadge status="complete">
                  {next &&
                  milestoneUnlocked(event, studentId, index + 1, state.learning)
                    ? `Milestone ${index + 2} Terbuka`
                    : "Survei Selesai"}
                </StatusBadge>
              </div>
              <p className="text-sm leading-6 text-emerald-700">
                {response
                  ? "Jawaban contoh telah dikirim dan dikunci dalam sesi tab ini."
                  : "Data contoh menandai survei ini sudah selesai; rincian jawaban asli tidak tersedia."}{" "}
                {next
                  ? `Sesuai alur Mode Penyelesaian, Milestone ${index + 2} dapat dikerjakan setelah tugas dan survei sebelumnya selesai, tanpa menunggu penilaian manual.`
                  : "Seluruh tahap dapat ditinjau melalui Portofolio. Penilaian Guru tetap diperlukan untuk klaim dokumen belajar."}
              </p>
            </div>
            {next && (
              <Surface>
                <div className="mb-3 flex flex-wrap justify-between gap-2">
                  <div>
                    <h2 className="font-semibold">
                      Milestone {index + 2} · {next.title}
                    </h2>
                    <p className="mt-2 text-xs text-secondary">
                      Deadline:{" "}
                      {next.deadline
                        ? formatEventDate(next.deadline, true)
                        : "Belum ditentukan"}{" "}
                      · Format: {next.formats}
                    </p>
                  </div>
                  <StatusBadge status="complete">
                    Terbuka · Siap Dikerjakan
                  </StatusBadge>
                </div>
                <p className="mb-5 text-sm leading-6 text-secondary">
                  Instruksi tugas: {next.instructions}
                </p>
                <LearningProgress
                  value={Math.round((row.completed / row.total) * 100)}
                  label={`${row.completed} dari ${row.total} Milestone Selesai (${Math.round((row.completed / row.total) * 100)}%)`}
                />
                <SiswaLink
                  primary
                  className="mt-5 w-full"
                  href={workHref(event.id, next.id)}
                >
                  Mulai Kerjakan Milestone {index + 2}
                </SiswaLink>
              </Surface>
            )}
          </div>
          <aside className="space-y-6">
            <Surface>
              <h2 className="font-semibold">Ringkasan Respons Survei</h2>
              <SummaryRows
                rows={[
                  [
                    "ID Respons",
                    <span key="id" className="break-all">
                      {response?.id ?? "Data contoh terdahulu"}
                    </span>,
                  ],
                  [
                    "Waktu Kirim",
                    response
                      ? formatEventDate(response.submittedAt, true)
                      : "Tidak tersedia",
                  ],
                  ["Status Respons", "Terkunci pada sesi demo"],
                  [
                    "Pertanyaan Terjawab",
                    response
                      ? `${2 + Number(Boolean(response.reflection.trim()))} dari 3 Butir`
                      : "Tidak tersedia",
                  ],
                  ["Penyimpanan", "Lokal · sesi tab"],
                ]}
              />
            </Surface>
            <Surface>
              <h2 className="font-semibold">Langkah Selanjutnya</h2>
              <p className="my-3 text-sm leading-6 text-secondary">
                {next
                  ? `Buka ruang kerja Milestone ${index + 2}, kerjakan instruksi tugas, lalu kumpulkan file contoh.`
                  : "Lihat hasil dan status penilaian di Portofolio Pribadi."}
              </p>
              <SiswaLink
                href={surveyHref(event.id, m.id, "history")}
                className="w-full"
              >
                Lihat Riwayat Jawaban
              </SiswaLink>
            </Surface>
          </aside>
        </div>
      ) : mode === "history" ? (
        <Surface>
          <h2 className="mb-4 font-semibold">
            Jawaban terkunci · Milestone {index + 1}
          </h2>
          {response ? (
            <div className="space-y-5">
              {surveyQuestions.map((q, i) => (
                <div key={q.key}>
                  <p className="text-sm font-medium">
                    {i + 1}. {q.text}
                  </p>
                  <p className="mt-2 text-sm text-secondary">
                    {response[q.key]} —{" "}
                    {likertLabels[(response[q.key] ?? 1) - 1]}
                  </p>
                </div>
              ))}
              <div>
                <p className="text-sm font-medium">Refleksi opsional</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-secondary">
                  {response.reflection || "Tidak diisi."}
                </p>
              </div>
              <p className="text-xs text-secondary">
                {response.id} · {formatEventDate(response.submittedAt, true)} ·
                Tidak ada skor diagnostik yang dihitung.
              </p>
            </div>
          ) : (
            <p className="text-sm text-secondary">
              {locked
                ? "Survei selesai pada data contoh terdahulu. Rincian jawaban tidak tersedia dan tidak direkayasa."
                : "Belum ada jawaban survei yang dikirim."}
            </p>
          )}
          <SiswaLink
            href={surveyHref(
              event.id,
              m.id,
              locked ? "result" : "instructions",
            )}
            className="mt-5"
          >
            Kembali
          </SiswaLink>
        </Surface>
      ) : form ? (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!answers.first || !answers.second) {
              setError("Isi kedua pertanyaan wajib sebelum mengirim survei.");
              document
                .getElementById(
                  !answers.first ? "survey-first-1" : "survey-second-1",
                )
                ?.focus();
              return;
            }
            setError("");
            setConfirm(true);
          }}
        >
          <div className="mb-5 rounded-2xl border border-line bg-white p-4">
            <div className="flex flex-wrap justify-between gap-3 text-xs text-secondary">
              <span>
                Bagian 1 dari 1 · 2 pertanyaan wajib + 1 refleksi opsional
              </span>
              <span>
                {count} dari 3 butir terisi ({Math.round((count / 3) * 100)}%)
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${(count / 3) * 100}%` }}
              />
            </div>
          </div>
          <div className="space-y-4">
            {surveyQuestions.map((q, i) => (
              <Surface key={q.key} className="!p-5">
                <fieldset>
                  <legend className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-primary">
                    Pertanyaan {i + 1} · Wajib
                  </legend>
                  <p className="-mt-5 text-right text-xs text-secondary max-sm:mt-2">
                    Dimensi: {q.dimension}
                  </p>
                  <p className="my-3 text-[15px] font-semibold leading-[22px]">
                    {q.key === "first"
                      ? `Penggunaan platform Lugina PjBL memudahkan saya dalam memahami instruksi dan tahapan pengerjaan ${m.title.toLowerCase()}.`
                      : q.text}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-5">
                    {likertLabels.map((label, n) => (
                      <label
                        key={label}
                        className={`flex min-w-0 cursor-pointer items-center gap-2 rounded-xl border px-3 py-3 text-xs ${answers[q.key] === n + 1 ? "border-primary bg-blue-50 text-primary" : "border-line"}`}
                      >
                        <input
                          id={`survey-${q.key}-${n + 1}`}
                          type="radio"
                          name={q.key}
                          required
                          value={n + 1}
                          checked={answers[q.key] === n + 1}
                          onChange={() =>
                            setAnswers((a) => ({ ...a, [q.key]: n + 1 }))
                          }
                          className="size-4 shrink-0 accent-primary"
                        />
                        {n + 1} — {label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </Surface>
            ))}
            <Surface className="!p-5">
              <label
                htmlFor="survey-reflection"
                className="block text-xs font-semibold text-secondary"
              >
                Pertanyaan 3 · Refleksi Opsional
              </label>
              <p className="my-3 text-[15px] font-semibold">
                Apa kendala atau masukan yang ingin Anda sampaikan selama
                menyelesaikan tugas Milestone {index + 1} ini?
              </p>
              <textarea
                id="survey-reflection"
                value={answers.reflection}
                maxLength={4000}
                onChange={(e) =>
                  setAnswers((a) => ({ ...a, reflection: e.target.value }))
                }
                className={`${studentControl} !h-[60px] resize-y bg-gray-50 py-3 text-[13px]`}
                placeholder="Tulis kendala atau masukanmu (opsional)..."
              />
            </Surface>
          </div>
          <footer className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-secondary">
              Jawaban Anda akan dikunci setelah dikirim pada sesi demo ini.
            </p>
            <div className="flex flex-wrap gap-3">
              <SiswaButton variant="outline" onClick={save}>
                Simpan Draf
              </SiswaButton>
              <SiswaButton type="submit">Kirim Jawaban Survei</SiswaButton>
            </div>
          </footer>
          {error && (
            <p role="alert" className="mt-4 text-sm text-danger">
              {error}
            </p>
          )}
        </form>
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2.067fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <Surface>
              <h2 className="mb-4 font-semibold">Tentang Survei Ini</h2>
              <p className="text-sm leading-6 text-secondary">
                Survei ini bertujuan untuk memahami pengalaman siswa saat
                menggunakan teknologi pembelajaran berbasis PjBL di SMK Lugina.
                Jawaban membantu menyempurnakan alur belajar dan materi
                praktikum.
              </p>
              <div className="mt-4 rounded-xl border border-line bg-gray-50 p-4">
                <h3 className="mb-2 text-xs font-semibold">
                  Panduan Skala Penilaian (1–5):
                </h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {likertLabels.map((label, i) => (
                    <div
                      key={label}
                      className="flex min-w-0 flex-col items-center gap-1 rounded-lg border border-line bg-white px-1 py-2 text-center text-[11px] leading-4"
                    >
                      <span className="grid size-5 place-items-center rounded-full bg-blue-50 text-xs font-semibold text-primary">
                        {i + 1}
                      </span>
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </Surface>
            <Surface className="!bg-gray-50 text-sm">
              <h3 className="mb-2 text-sm font-semibold">
                Data &amp; Jawaban dalam Prototipe
              </h3>
              <ul className="list-disc space-y-1 pl-4 text-xs leading-5 text-secondary">
                <li>Gunakan jawaban fiktif untuk demonstrasi pembelajaran.</li>
                <li>
                  Jawaban tidak memengaruhi skor tugas; tidak ada diagnosis atau
                  skor instrumen yang dihitung.
                </li>
                <li>
                  Setelah dikirim, jawaban terkunci dan tersimpan lokal pada
                  sesi tab ini. Tidak dikirim ke server.
                </li>
              </ul>
            </Surface>
          </div>
          <div>
            <Surface>
              <h2 className="font-semibold">Konteks Pengerjaan</h2>
              <SummaryRows
                rows={[
                  ["Event", event.title],
                  ["Milestone", `${index + 1} · ${m.title}`],
                  [
                    "Status Tugas",
                    `Terkumpul (Versi ${submission.versions.at(-1)?.version})`,
                  ],
                  ["Jumlah Soal", "3 Pertanyaan (2 Wajib + 1 Refleksi)"],
                  ["Estimasi Waktu", "± 3 Menit"],
                ]}
              />
            </Surface>
            <div className="my-5 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-primary">
              <p className="font-semibold">
                {next
                  ? `Prasyarat Milestone ${index + 2}`
                  : "Penyelesaian milestone"}
              </p>
              <p>
                {next
                  ? `Milestone ${index + 2} (${next.title}) otomatis terbuka setelah tugas dan survei tahap ini selesai.`
                  : "Survei melengkapi penyelesaian tahap ini. Penilaian tetap dilakukan Guru."}
              </p>
            </div>
            <SiswaLink
              primary
              href={surveyHref(event.id, m.id, "form")}
              className="w-full"
            >
              Mulai Mengisi Survei
            </SiswaLink>
          </div>
        </div>
      )}
      {confirm && (
        <SiswaDialog
          title="Kirim Jawaban Survei Sekarang?"
          label="Konfirmasi Pengiriman"
          frame="370:3537"
          onClose={() => setConfirm(false)}
        >
          <p className="text-sm leading-6 text-secondary">
            Jawaban untuk Milestone {index + 1} akan dikunci pada sesi demo ini
            dan tidak dapat diubah. Pastikan kedua pertanyaan wajib sudah diisi
            sesuai pengalaman contoh.
          </p>
          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <SiswaButton variant="outline" onClick={() => setConfirm(false)}>
              Periksa Kembali
            </SiswaButton>
            <SiswaButton
              onClick={() => {
                const problem = submitStudentSurvey(event.id, m.id, answers);
                setError(problem);
                setConfirm(false);
                if (!problem)
                  router.replace(surveyHref(event.id, m.id, "result"));
              }}
            >
              Ya, Kirim Jawaban
            </SiswaButton>
          </div>
        </SiswaDialog>
      )}
    </SiswaShell>
  );
}
