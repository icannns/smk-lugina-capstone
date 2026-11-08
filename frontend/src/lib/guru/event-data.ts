import { draftTitle, guruEvents } from "./dashboard-data";
import { studentEnrollments, studentEvents, students } from "./student-data";
import type { EventEnrollment, ManagedEvent } from "./event-types";

const kantinMilestones = [
  {
    id: "M1",
    title: "Riset Pengguna",
    instructions:
      "Wawancarai minimal 5 siswa pengguna kantin dan rangkum temuan dalam satu dokumen.",
    deadline: "2025-03-14T23:59",
    formats: "PDF, Teks",
    surveyActive: true,
  },
  {
    id: "M2",
    title: "User Flow & Wireframe",
    instructions: "Susun user flow pemesanan dan wireframe 6 layar utama.",
    deadline: "2025-03-28T23:59",
    formats: "PDF, Gambar, Hyperlink",
    surveyActive: true,
  },
  {
    id: "M3",
    title: "Desain UI High-Fidelity",
    instructions: "Buat desain UI lengkap memakai style guide kantin.",
    deadline: "2025-04-11T23:59",
    formats: "PDF, Gambar",
    surveyActive: true,
  },
  {
    id: "M4",
    title: "Prototipe & Presentasi",
    instructions: "Buat prototipe interaktif dan video presentasi 3 menit.",
    deadline: "2025-04-25T23:59",
    formats: "Hyperlink, PDF",
    surveyActive: true,
  },
];

// Four unique published events. The repeated UMKM cards and conflicting footer
// in 291:17842 are presentation placeholders, not additional event identities.
export const managedEvents: ManagedEvent[] = [
  {
    id: "kantin",
    title: guruEvents[0].title,
    status: "ongoing",
    mode: "Penyelesaian",
    updated: "2025-04-01",
    period: "3 Mar 2025, 08.00 WIB – 25 Apr 2025, 23.59 WIB",
    milestones: kantinMilestones,
    progress: 34,
    rubric: "Rubrik UI/UX Dasar",
    certificate: "Nilai akhir ≥ 75",
  },
  {
    id: "wireframe",
    title: guruEvents[2].title,
    status: "ended",
    mode: "Penyelesaian",
    updated: "2025-02-16",
    period: "15 Feb 2025, 07.30 WIB – 15 Feb 2025, 15.00 WIB",
    milestones: studentEvents[0].milestones,
    progress: 35,
  },
  {
    id: "poster",
    title: guruEvents[3].title,
    status: "ended",
    mode: "Penyelesaian",
    updated: "2025-02-03",
    period: "6 Jan 2025, 08.00 WIB – 31 Jan 2025, 23.59 WIB",
    milestones: [
      { id: "M1", title: "" },
      { id: "M2", title: "Poster Final" },
    ],
    progress: 12,
  },
  {
    id: "umkm",
    title: guruEvents[1].title,
    status: "upcoming",
    mode: "Penyelesaian",
    updated: "2025-03-28",
    period: "5 Mei 2025, 08.00 WIB – 30 Mei 2025, 23.59 WIB",
    milestones: [1, 2, 3].map((n) => ({ id: `M${n}`, title: "" })),
    progress: 0,
  },
  {
    id: "absensi",
    title: draftTitle,
    status: "draft",
    mode: "Penyelesaian",
    updated: "2025-03-30",
    period: "Belum diatur",
    milestones: [
      { id: "M1", title: "" },
      { id: "M2", title: "" },
    ],
  },
];

// Fictional enrollment fixtures. A student may enroll in multiple events;
// neither participant membership nor counts are derived from school classes.
// Preserve known enrollment IDs from Student Management, then supplement its
// partial sample with anonymous demo identities for the Figma participant count.
export const eventEnrollments: EventEnrollment[] = guruEvents.flatMap(
  (event) => {
    const known = studentEnrollments.filter((e) => e.eventId === event.id);
    const ids = [
      ...new Set([
        ...known.map((e) => e.studentId),
        ...students.map((s) => s.id),
        ...Array.from({ length: event.students }, (_, i) => `demo-${i + 1}`),
      ]),
    ].slice(0, event.students);
    return ids.map((studentId) => ({
      id:
        known.find((e) => e.studentId === studentId)?.id ??
        `${event.id}-${studentId}`,
      eventId: event.id,
      studentId,
      method: "self",
    }));
  },
);
