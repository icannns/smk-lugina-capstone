import type { ManagedEvent } from "./event-types";
import type { GuruRubric } from "./teacher-types";
import { defaultCertificate } from "./rubric-data";

export function isWibDateTime(value: string | undefined): value is string {
  const parts = value?.match(
    /^(\d{4,})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/,
  );
  if (!parts) return false;
  const [year, month, day, hour, minute, second] = parts
    .slice(1)
    .map((v) => Number(v ?? 0));
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, 0);
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date.getUTCHours() === hour &&
    date.getUTCMinutes() === minute &&
    date.getUTCSeconds() === second
  );
}

export function informationErrors(event: ManagedEvent) {
  const errors: Record<string, string> = {};
  if (!event.title.trim()) errors["event-title"] = "Judul event wajib diisi.";
  const plain =
    new DOMParser().parseFromString(event.caseStudyHtml ?? "", "text/html").body
      .textContent ?? "";
  if (!plain.replace(/\u00a0/g, " ").trim())
    errors["event-case-study"] = "Studi kasus dan tujuan wajib diisi.";
  if (!isWibDateTime(event.startAt))
    errors["event-start"] = "Tanggal mulai event wajib diisi.";
  if (!isWibDateTime(event.endAt))
    errors["event-end"] = "Deadline event wajib diisi.";
  if (event.startAt && event.endAt && event.endAt < event.startAt)
    errors["event-end"] = "Deadline event tidak boleh sebelum tanggal mulai.";
  return errors;
}
export function milestoneErrors(event: ManagedEvent) {
  const errors: Record<string, string> = {};
  if (!event.milestones.length)
    errors["milestone-list"] = "Tambahkan milestone sebelum melanjutkan.";
  for (const m of event.milestones) {
    const key = `milestone-${m.id}`;
    if (!m.title.trim())
      errors[`${key}-title`] = "Judul milestone wajib diisi.";
    if (!m.formats?.trim())
      errors[`${key}-formats`] = "Pilih minimal satu format pengumpulan.";
    if (!isWibDateTime(m.deadline))
      errors[`${key}-deadline`] = "Deadline milestone wajib diisi.";
  }
  return errors;
}
export function rubricErrors(
  event: ManagedEvent,
  rubrics: GuruRubric[],
): Record<string, string> {
  return rubrics.some((r) => r.id === event.rubricId)
    ? {}
    : { "wizard-rubric": "Pilih rubrik penilaian." };
}
export function certificateErrors(event: ManagedEvent) {
  const c = event.certificateConfig ?? defaultCertificate();
  const errors: Record<string, string> = {};
  if (
    c.threshold.trim() === "" ||
    !Number.isFinite(Number(c.threshold)) ||
    Number(c.threshold) < 0 ||
    Number(c.threshold) > 100
  )
    errors["cert-threshold"] = "Ambang nilai harus antara 0 dan 100.";
  if (c.mode === "template") {
    if (!c.template) errors["cert-template"] = "Pilih template sertifikat.";
  } else {
    for (const key of [
      "name",
      "organizer",
      "issuedAt",
      "signer",
      "signerRole",
    ] as const)
      if (!c[key].trim()) errors[`cert-${key}`] = "Kolom ini wajib diisi.";
    if (c.issuedAt && !isWibDateTime(`${c.issuedAt}T00:00`))
      errors["cert-issuedAt"] = "Tanggal terbit tidak valid.";
  }
  return errors;
}
