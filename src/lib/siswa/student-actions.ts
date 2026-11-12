"use client";
import { enrollmentKey } from "@/lib/domain/keys";
import { currentAccount } from "../auth/session";
import type { AppAccount } from "../auth/accounts";
import { mutateDomain, pathId, readEventStore, listedEvents } from "../guru/event-draft-store";
import { allSubmissions } from "../guru/learning-selectors";
import { isEnrolled, milestoneUnlocked } from "./selectors";
import type { WorkDraft, SurveyDraft, StudentProfile, CertificateClaim } from "./student-types";
export function nowWib() { return new Date().toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }).replace(" ", "T").slice(0, 16); }
function context(eventId: string) {
 const account = currentAccount(), state = readEventStore(), event = listedEvents(state).find((e) => e.id === eventId && e.status !== "draft");
 return account?.role === "student" && account.studentId && event ? { account, state, event, studentId: account.studentId } : null;
}
// Authentication creates/validates profiles on the server; never synthesize users in the browser.
export function ensureStudentProfile(account: AppAccount) { void account; }
function milestonePath(eventId: string, milestoneId: string) { return `/api/events/${pathId(eventId)}/milestones/${pathId(milestoneId)}`; }
export async function enrollStudent(eventId: string) {
 const result = await mutateDomain(`/api/events/${pathId(eventId)}/enrollments`, "POST", {});
 return result ? "" : readEventStore().storageError || "Pendaftaran gagal.";
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
export async function saveWorkDraft(eventId: string, milestoneId: string, work: WorkDraft) {
 return Boolean(await mutateDomain(milestonePath(eventId,milestoneId)+"/work-draft", "PUT", { work }));
}
export async function submitStudentWork(eventId: string, milestoneId: string, work: WorkDraft) {
 const error = workError(eventId,milestoneId,work); if (error) return error;
 const c = context(eventId); if (!c) return "Sesi Siswa tidak tersedia.";
 const previous = allSubmissions(c.state.learning).find((s) => s.eventId === eventId && s.studentId === c.studentId && s.milestoneId === milestoneId);
 const result = await mutateDomain(milestonePath(eventId,milestoneId)+"/submissions", "POST", { work, expectedVersion: previous?.versions.at(-1)?.version ?? 0, requestId: crypto.randomUUID() });
 return result ? "" : readEventStore().storageError || "Pengumpulan gagal.";
}
export async function saveSurveyDraft(eventId: string, milestoneId: string, answers: SurveyDraft) {
 return Boolean(await mutateDomain(milestonePath(eventId,milestoneId)+"/survey", "PUT", answers));
}
export async function submitStudentSurvey(eventId: string, milestoneId: string, answers: SurveyDraft) {
 const result = await mutateDomain(milestonePath(eventId,milestoneId)+"/survey", "POST", answers);
 return result ? "" : readEventStore().storageError || "Survei tidak dapat dikirim.";
}
export async function saveStudentProfile(profile: StudentProfile) { return Boolean(await mutateDomain("/api/profile", "PUT", { name: profile.name, email: profile.email, phone: profile.phone, avatar: profile.avatar })); }
export async function claimStudentCertificate(eventId: string): Promise<{claim?: CertificateClaim; error?: string}> {
 const c = context(eventId); if (!c) return { error: "Sesi Siswa tidak tersedia." };
 const result = await mutateDomain(`/api/events/${pathId(eventId)}/certificate-claim`, "POST", {});
 return result ? { claim: readEventStore().studentUI.certificates[enrollmentKey(eventId,c.studentId)] } : { error: readEventStore().storageError || "Syarat penyelesaian belum terpenuhi." };
}
export async function markCertificateDownloaded(eventId: string) { return Boolean(await mutateDomain(`/api/events/${pathId(eventId)}/certificate-claim`, "PUT", {})); }
