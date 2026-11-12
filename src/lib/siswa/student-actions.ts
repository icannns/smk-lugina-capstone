"use client";
import { currentAccount } from "../auth/session";
import { STUDENT_NAME_MAX_LENGTH } from "./student-types";
import type { AppAccount } from "../auth/accounts";
import {
  readEventStore,
  updateStudentDomain,
  listedEvents,
} from "../guru/event-draft-store";
import {
  allSubmissions,
  enrollmentProgress,
  submissionStatus,
} from "../guru/learning-selectors";
import { submissionId } from "../guru/learning-data";
import {
  certificateConditions,
  isEnrolled,
  milestoneUnlocked,
  studentProfileFor,
} from "./selectors";
import type {
  WorkDraft,
  SurveyDraft,
  StudentProfile,
  CertificateClaim,
} from "./student-types";
export function nowWib() {
  return new Date()
    .toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" })
    .replace(" ", "T")
    .slice(0, 16);
}
function context(eventId: string) {
  const account = currentAccount(),
    state = readEventStore(),
    event = listedEvents(state).find(
      (e) => e.id === eventId && e.status !== "draft",
    );
  if (account?.role !== "student" || !account.studentId || !event) return null;
  return { account, state, event, studentId: account.studentId };
}
export function ensureStudentProfile(account: AppAccount) {
  if (account.role !== "student" || !account.studentId) return;
  const state = readEventStore(),
    studentId = account.studentId;
  if (state.studentUI.profiles[studentId]) return;
  const profile = studentProfileFor(account, state.learning, state.studentUI);
  updateStudentDomain((current) => ({
    ...current,
    studentUI: {
      ...current.studentUI,
      profiles: { ...current.studentUI.profiles, [studentId]: profile },
    },
    learning: {
      ...current.learning,
      students: [
        ...(current.learning.students ?? []).filter((s) => s.id !== studentId),
        { id: studentId, name: profile.name, email: profile.email },
      ],
    },
  }));
}
export function enrollStudent(eventId: string) {
  const c = context(eventId);
  if (!c) return "Masuk sebagai Siswa untuk mengikuti event.";
  if (isEnrolled(eventId, c.studentId, c.state.learning)) return "";
  if (c.event.status === "ended")
    return "Event telah berakhir; pendaftaran baru tidak tersedia pada demo.";
  const profile = studentProfileFor(
    c.account,
    c.state.learning,
    c.state.studentUI,
  );
  updateStudentDomain((current) => ({
    ...current,
    learning: {
      ...current.learning,
      students: [
        ...(current.learning.students ?? []).filter(
          (s) => s.id !== c.studentId,
        ),
        { id: c.studentId, name: profile.name, email: profile.email },
      ],
      enrollments: [
        ...(current.learning.enrollments ?? []),
        {
          id: `${eventId}-${c.studentId}`,
          eventId,
          studentId: c.studentId,
          method: "self",
        },
      ],
    },
  }));
  return "";
}
export function workError(
  eventId: string,
  milestoneId: string,
  work: WorkDraft,
) {
  const c = context(eventId);
  if (!c || !isEnrolled(eventId, c.studentId, c.state.learning))
    return "Kamu belum terdaftar pada event ini.";
  const index = c.event.milestones.findIndex((m) => m.id === milestoneId);
  if (!milestoneUnlocked(c.event, c.studentId, index, c.state.learning))
    return "Milestone masih terkunci. Selesaikan tugas dan survei milestone sebelumnya.";
  if (
    work.files.length > 5 ||
    work.files.some((f) => f.size > 10 * 1024 * 1024)
  )
    return "Maksimal 5 file, masing-masing 10 MB.";
  const formats = c.event.milestones[index].formats ?? "";
  for (const f of work.files) {
    if (
      formats &&
      !(
        (formats.includes("PDF") && /\.pdf$/i.test(f.name)) ||
        (formats.includes("Gambar") &&
          /\.(png|jpe?g|webp|svg)$/i.test(f.name)) ||
        (formats.includes("Teks") && /\.txt$/i.test(f.name))
      )
    )
      return "Jenis file tidak sesuai format pengumpulan milestone.";
  }
  if (work.link) {
    try {
      const u = new URL(work.link);
      if (!["http:", "https:"].includes(u.protocol))
        return "Gunakan tautan http atau https yang valid.";
    } catch {
      return "Tautan belum valid.";
    }
    if (formats && !formats.includes("Hyperlink"))
      return "Milestone ini tidak menerima tautan sebagai format pengumpulan.";
  }
  if (!work.files.length && !work.text.trim() && !work.link.trim())
    return "Tambahkan file, teks jawaban, atau tautan contoh sebelum mengumpulkan.";
  return "";
}
export function saveWorkDraft(
  eventId: string,
  milestoneId: string,
  work: WorkDraft,
) {
  const c = context(eventId);
  if (!c || !isEnrolled(eventId, c.studentId, c.state.learning)) return false;
  const key = submissionId(eventId, c.studentId, milestoneId);
  updateStudentDomain((current) => ({
    ...current,
    studentUI: {
      ...current.studentUI,
      workDrafts: { ...current.studentUI.workDrafts, [key]: work },
    },
  }));
  return true;
}
export function submitStudentWork(
  eventId: string,
  milestoneId: string,
  work: WorkDraft,
) {
  const error = workError(eventId, milestoneId, work);
  if (error) return error;
  const c = context(eventId)!;
  const id = submissionId(eventId, c.studentId, milestoneId),
    previous = allSubmissions(c.state.learning).find((s) => s.id === id);
  if (previous && submissionStatus(previous, c.state.learning) !== "revision")
    return "Pengumpulan sudah ada. Periksa riwayat atau tunggu permintaan revisi Guru.";
  const version = {
    version: (previous?.versions.at(-1)?.version ?? 0) + 1,
    submittedAt: nowWib(),
    file:
      work.files[0]?.name ??
      (work.link ? "tautan-project-demo" : "jawaban-teks-demo.txt"),
    files: work.files,
    note: work.text,
    link: work.link,
  };
  updateStudentDomain((current) => {
    const drafts = { ...current.studentUI.workDrafts };
    delete drafts[id];
    return {
      ...current,
      studentUI: { ...current.studentUI, workDrafts: drafts },
      learning: {
        ...current.learning,
        submissions: {
          ...current.learning.submissions,
          [id]: {
            ...previous,
            id,
            eventId,
            studentId: c.studentId,
            milestoneId,
            versions: [
              ...(previous?.versions.map((v) => ({
                ...v,
                note: v.note ?? previous.note,
                link: v.link ?? previous.link,
              })) ?? []),
              version,
            ],
            surveyComplete: previous?.surveyComplete ?? false,
            note: work.text,
            link: work.link || undefined,
          },
        },
      },
    };
  });
  return "";
}
export function saveSurveyDraft(
  eventId: string,
  milestoneId: string,
  answers: SurveyDraft,
) {
  const c = context(eventId);
  if (!c || !isEnrolled(eventId, c.studentId, c.state.learning)) return false;
  const id = submissionId(eventId, c.studentId, milestoneId);
  if (c.state.studentUI.surveyResponses[id]) return false;
  updateStudentDomain((current) => ({
    ...current,
    studentUI: {
      ...current.studentUI,
      surveyDrafts: { ...current.studentUI.surveyDrafts, [id]: answers },
    },
  }));
  return true;
}
export function submitStudentSurvey(
  eventId: string,
  milestoneId: string,
  answers: SurveyDraft,
) {
  const c = context(eventId);
  if (!c || !isEnrolled(eventId, c.studentId, c.state.learning))
    return "Kamu belum terdaftar pada event ini.";
  const id = submissionId(eventId, c.studentId, milestoneId),
    submission = allSubmissions(c.state.learning).find((s) => s.id === id),
    milestone = c.event.milestones.find((m) => m.id === milestoneId);
  if (!submission) return "Kumpulkan tugas milestone sebelum mengisi survei.";
  if (!milestone?.surveyActive)
    return "Form Survei belum disiapkan Guru untuk milestone ini.";
  if (c.state.studentUI.surveyResponses[id] || submission.surveyComplete)
    return "Jawaban survei untuk milestone ini sudah dikirim dan dikunci.";
  if (
    !answers.first ||
    !answers.second ||
    ![answers.first, answers.second].every(
      (n) => Number.isInteger(n) && n >= 1 && n <= 5,
    )
  )
    return "Isi kedua pertanyaan wajib dengan pilihan 1–5.";
  updateStudentDomain((current) => ({
    ...current,
    studentUI: {
      ...current.studentUI,
      surveyResponses: {
        ...current.studentUI.surveyResponses,
        [id]: {
          ...answers,
          id: `SURVEY-DEMO-${crypto.randomUUID()}`,
          submittedAt: nowWib(),
          version: submission.versions.at(-1)!.version,
        },
      },
    },
    learning: {
      ...current.learning,
      submissions: {
        ...current.learning.submissions,
        [id]: {
          ...submission,
          surveyComplete: true,
          surveyScore: undefined,
          surveySummary:
            "Survei selesai · skor instrumen tidak dihitung dalam prototipe.",
          instrument: "Survei Adopsi Teknologi dan Technostress (Versi 1.0)",
          reflection: answers.reflection,
          completion: "Tugas dan Form Survei contoh selesai.",
          integration: "Ringkasan terhubung ke tampilan Guru dalam sesi demo.",
        },
      },
    },
  }));
  return "";
}
export function saveStudentProfile(profile: StudentProfile) {
  const account = currentAccount();
  if (account?.role !== "student" || !account.studentId) return false;
  if (
    !profile.name.trim() ||
    profile.name.length > STUDENT_NAME_MAX_LENGTH ||
    !/^[^\s@]+@example\.com$/i.test(profile.email.trim())
  )
    return false;
  const studentId = account.studentId,
    value = {
      name: profile.name.trim(),
      email: profile.email.trim(),
      phone: profile.phone,
      avatar: profile.avatar,
    };
  updateStudentDomain((current) => ({
    ...current,
    studentUI: {
      ...current.studentUI,
      profiles: { ...current.studentUI.profiles, [studentId]: value },
    },
    learning: {
      ...current.learning,
      students: [
        ...(current.learning.students ?? []).filter((s) => s.id !== studentId),
        { id: studentId, name: value.name, email: value.email },
      ],
    },
  }));
  return true;
}
export function claimStudentCertificate(eventId: string): {
  claim?: CertificateClaim;
  error?: string;
} {
  const c = context(eventId);
  if (!c || !isEnrolled(eventId, c.studentId, c.state.learning))
    return { error: "Event belum diikuti." };
  const key = `${eventId}:${c.studentId}`,
    existing = c.state.studentUI.certificates[key];
  if (existing) return { claim: existing };
  const row = enrollmentProgress(
    c.event,
    c.studentId,
    c.state.learning,
    c.state.rubrics[c.event.rubricId ?? ""],
  );
  if (!certificateConditions(c.event, row, c.state.learning).eligible)
    return {
      error:
        "Seluruh tugas, survei dan penilaian harus lengkap, tanpa revisi terbuka, serta memenuhi ambang nilai.",
    };
  const profile = studentProfileFor(
      c.account,
      c.state.learning,
      c.state.studentUI,
    ),
    claim: CertificateClaim = {
      id: `DEMO-${crypto.randomUUID()}`,
      eventId,
      studentId: c.studentId,
      studentName: profile.name,
      score: row.score!,
      claimedAt: nowWib(),
    };
  updateStudentDomain((current) => ({
    ...current,
    studentUI: {
      ...current.studentUI,
      certificates: { ...current.studentUI.certificates, [key]: claim },
    },
  }));
  return { claim };
}
export function markCertificateDownloaded(eventId: string) {
  const c = context(eventId);
  if (!c) return;
  const key = `${eventId}:${c.studentId}`,
    claim = c.state.studentUI.certificates[key];
  if (!claim) return;
  updateStudentDomain((current) => ({
    ...current,
    studentUI: {
      ...current.studentUI,
      certificates: {
        ...current.studentUI.certificates,
        [key]: { ...claim, downloadedAt: nowWib() },
      },
    },
  }));
}
