import type { Student, StudentEnrollment, StudentEvent } from "./student-types";

// Fictional fixtures. Survey summaries are source text, never recalculated or diagnosed.
export const studentEvents: StudentEvent[] = [
  {
    id: "wireframe",
    title: "Workshop Wireframe Sehari",
    milestones: [
      { id: "M1", title: "Sketsa Layout" },
      { id: "M2", title: "" },
      { id: "M3", title: "" },
    ],
  },
  {
    id: "kantin",
    title: "Redesign Aplikasi Kantin Sekolah",
    milestones: [
      { id: "M1", title: "Riset Pengguna" },
      { id: "M2", title: "User Flow & Wireframe" },
      { id: "M3", title: "Desain UI High-Fidelity" },
      { id: "M4", title: "Prototipe & Presentasi" },
    ],
  },
];

export const students: Student[] = [
  ["aisyah", "Aisyah Putri"],
  ["rizky", "Rizky Pratama"],
  ["dimas", "Dimas Saputra"],
  ["nabila", "Nabila Zahra"],
  ["fajar", "Fajar Nugraha"],
  ["salsa", "Salsa Amelia"],
  ["rangga", "Rangga Firmansyah"],
  ["intan", "Intan Permata"],
  ["bagas", "Bagas Prasetyo"],
  ["citra", "Citra Aulia"],
  ["dewi", "Dewi Permata"],
  ["eka", "Eka Saputra"],
].map(([id, name]) => ({
  id,
  name,
  email: `${name.toLowerCase().replaceAll(" ", ".")}@example.com`,
}));

const workshopSummaries = [
  "Sudah Diisi · Technostress Rendah (2.1/5.0)",
  "Sudah Diisi · Evaluasi Lancar (1.5/5.0)",
  "Sudah Diisi · Technostress Sedang (3.2/5.0)",
  "Sudah Diisi · Technostress Rendah (2.0/5.0) yang konsisten.",
];

export const studentEnrollments: StudentEnrollment[] = [
  ...students.map((student, i) => ({
    id: `wireframe-${student.id}`,
    eventId: "wireframe",
    studentId: student.id,
    // Independent demo values, not a rule derived from survey scores or submissions.
    completedMilestones: i === 11 ? 2 : 3,
    reviewed: false,
    milestones: studentEvents[0].milestones.map((milestone, m) => ({
      id: milestone.id,
      title: milestone.title,
      ...(i === 11 && m === 2
        ? {}
        : {
            submittedAt: `15 Feb 2025, ${["09", "11", "14"][m]}.${String(5 + i * 2).padStart(2, "0")} WIB`,
            summary: workshopSummaries[(i + m) % 4],
            badgeTone: "green" as const,
          }),
    })),
  })),
  {
    id: "kantin-aisyah",
    eventId: "kantin",
    studentId: "aisyah",
    completedMilestones: 2,
    reviewed: true,
    milestones: [
      {
        id: "M1",
        title: "Riset Pengguna",
        submittedAt: "12 Mar 2025, 21.05 WIB",
        summary: workshopSummaries[0],
        instrument: "Survei Pengalaman Belajar & Technostress",
        completion: "Tugas & Form Survei telah terverifikasi",
        integration: "Tercatat pada menu Hasil Survei",
        reflection: "Perlu mulai lebih awal.",
        badgeTone: "amber",
      },
      {
        id: "M2",
        title: "User Flow & Wireframe",
        submittedAt: "26 Mar 2025, 21.05 WIB",
        summary:
          "Skor Rata-rata: 1.6 / 5.0 (Instrumen Survei Technostress Rendah)",
        reflection: "Lancar, wawancara sangat membantu.",
        badgeTone: "green",
      },
      { id: "M3", title: "Desain UI High-Fidelity" },
      { id: "M4", title: "Prototipe & Presentasi" },
    ],
  },
];

export const studentPageSize = 8;
export const studentPrototypeCounts = {
  initial: 13,
  workshop: 15,
  filtered: 13,
  detail: 13,
};
