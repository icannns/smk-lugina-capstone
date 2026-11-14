import { managedEvents } from "./event-data";
import type { ManagedEvent } from "./event-types";

/** Shared fictional school projects for development seeding, never an API fallback. */
export const demoEvents: ManagedEvent[] = [
  ...managedEvents.filter((event) => event.status !== "draft").map((event) => {
    const schedules: Record<string, [string, string]> = {
      kantin: ["2025-03-03T08:00", "2025-04-25T23:59"],
      wireframe: ["2025-02-15T07:30", "2025-02-15T15:00"],
      poster: ["2025-01-06T08:00", "2025-01-31T23:59"],
      umkm: ["2026-11-16T08:00", "2026-12-18T23:59"],
    };
    const [startAt, endAt] = schedules[event.id];
    return {
      ...event,
      startAt,
      endAt,
      caseStudyHtml: `<p>${event.title}: kembangkan karya yang menjawab kebutuhan warga sekolah dan masyarakat Rancaekek.</p>`,
      milestones: event.milestones.map((milestone, index) => ({
        ...milestone,
        title: milestone.title || ["Riset Kebutuhan UMKM", "Wireframe Landing Page", "Desain dan Presentasi"][index],
        formats: milestone.formats || "PDF, Gambar, Hyperlink",
        deadline: event.id === "umkm" ? ["2026-11-23T23:59", "2026-12-04T23:59", endAt][index] : milestone.deadline,
      })),
    };
  }),
  {
    id: "absensi-siswa",
    title: "Aplikasi Absensi Siswa",
    status: "ongoing",
    mode: "Penyelesaian",
    updated: "2026-11-02",
    period: "2 Nov 2026 – 18 Des 2026",
    startAt: "2026-11-02T08:00",
    endAt: "2026-12-18T23:59",
    rubricId: "uiux",
    caseStudyHtml: "<p>Rancang aplikasi pencatatan kehadiran yang mudah digunakan siswa dan petugas piket sekolah.</p>",
    milestones: [
      { id: "M1", title: "Riset Alur Kehadiran", instructions: "Petakan kebutuhan siswa dan petugas piket.", formats: "PDF, Teks", deadline: "2026-11-20T23:59" },
      { id: "M2", title: "Wireframe dan Desain Antarmuka", instructions: "Rancang layar absensi dan rekap kehadiran.", formats: "PDF, Gambar, Hyperlink", deadline: "2026-12-04T23:59" },
      { id: "M3", title: "Prototipe dan Presentasi", instructions: "Presentasikan prototipe alur absensi siswa.", formats: "PDF, Hyperlink", deadline: "2026-12-18T23:59" },
    ],
  },
  {
    id: "profil-ekskul",
    title: "Company Profile Ekstrakurikuler Sekolah",
    status: "ongoing",
    mode: "Penyelesaian",
    updated: "2026-11-09",
    period: "9 Nov 2026 – 23 Des 2026",
    startAt: "2026-11-09T08:00",
    endAt: "2026-12-23T23:59",
    rubricId: "uiux",
    caseStudyHtml: "<p>Perkenalkan kegiatan, prestasi, dan cara bergabung dalam ekstrakurikuler melalui website profil sekolah.</p>",
    milestones: [
      { id: "M1", title: "Riset dan Konten Ekstrakurikuler", instructions: "Susun profil kegiatan dan kebutuhan calon anggota.", formats: "PDF, Teks", deadline: "2026-11-23T23:59" },
      { id: "M2", title: "Desain Website Profil", instructions: "Rancang halaman profil, galeri kegiatan, dan informasi pendaftaran.", formats: "PDF, Gambar, Hyperlink", deadline: "2026-12-07T23:59" },
      { id: "M3", title: "Prototipe Website dan Presentasi", instructions: "Presentasikan website profil kepada pengurus ekstrakurikuler.", formats: "PDF, Hyperlink", deadline: "2026-12-23T23:59" },
    ],
  },
];
