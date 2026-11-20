// A fixed Figma snapshot, not live school data. Nothing is persisted.
export type EventStatus = "ongoing" | "upcoming" | "ended";
export type GuruEvent = {
  id: string;
  title: string;
  status: EventStatus;
  period: string;
  start: string;
  submitted: number;
  total: number;
  completed: number;
  pending: number;
  finishedStudents: number;
  students: number;
};
export type ReviewItem = {
  href?: string;
  id: string;
  student: string;
  event: string;
  milestone: string;
  submitted: string;
  waitingDays: number;
};
export type DashboardAction = {
  title: string;
  description: string;
  figmaNode?: string;
};

export const teacher = {
  name: "Rina Marlina, S.Kom.",
  initials: "RM",
  role: "Guru",
};
export const snapshotDate = "Rabu, 2 April 2025 · 08.15 WIB";
export const draftTitle = "Aplikasi Absensi Digital";

export const guruEvents: GuruEvent[] = [
  {
    id: "kantin",
    title: "Redesign Aplikasi Kantin Sekolah",
    status: "ongoing",
    period: "3 Mar – 25 Apr 2025",
    start: "2025-03-03",
    submitted: 39,
    total: 80,
    completed: 34,
    pending: 19,
    finishedStudents: 0,
    students: 20,
  },
  {
    id: "umkm",
    title: "Landing Page UMKM Rancaekek",
    status: "upcoming",
    period: "5 Mei – 30 Mei 2025",
    start: "2025-05-05",
    submitted: 0,
    total: 9,
    completed: 0,
    pending: 0,
    finishedStudents: 0,
    students: 3,
  },
  {
    id: "wireframe",
    title: "Workshop Wireframe Sehari",
    status: "ended",
    period: "15 Feb 2025",
    start: "2025-02-15",
    submitted: 35,
    total: 36,
    completed: 35,
    pending: 1,
    finishedStudents: 11,
    students: 12,
  },
  {
    id: "poster",
    title: "Poster Kampanye Hemat Energi",
    status: "ended",
    period: "6 Jan – 31 Jan 2025",
    start: "2025-01-06",
    submitted: 12,
    total: 12,
    completed: 12,
    pending: 1,
    finishedStudents: 6,
    students: 6,
  },
];

export const reviewQueue: ReviewItem[] = [
  {
    id: "dimas",
    student: "Dimas Saputra",
    event: guruEvents[3].title,
    milestone: "M2 · Poster Final",
    submitted: "29 Jan 2025 · 19.10 WIB",
    waitingDays: 62,
  },
  {
    id: "yoga",
    student: "Yoga Aditya",
    event: guruEvents[2].title,
    milestone: "M3 · Presentasi Singkat",
    submitted: "15 Feb 2025 · 14.20 WIB",
    waitingDays: 45,
  },
  {
    id: "intan",
    student: "Intan Permata",
    event: guruEvents[0].title,
    milestone: "M1 · Riset Pengguna",
    submitted: "13 Mar 2025 · 15.49 WIB",
    waitingDays: 19,
  },
  {
    id: "nabila",
    student: "Nabila Zahra",
    event: guruEvents[0].title,
    milestone: "M1 · Riset Pengguna",
    submitted: "13 Mar 2025 · 17.21 WIB",
    waitingDays: 19,
  },
  {
    id: "siti",
    student: "Siti Nurhaliza",
    event: guruEvents[0].title,
    milestone: "M1 · Riset Pengguna",
    submitted: "13 Mar 2025 · 17.45 WIB",
    waitingDays: 19,
  },
  {
    id: "putri",
    student: "Putri Ramadhani",
    event: guruEvents[0].title,
    milestone: "M1 · Riset Pengguna",
    submitted: "13 Mar 2025 · 19.17 WIB",
    waitingDays: 19,
  },
];

export const statusLabels: Record<EventStatus, string> = {
  ongoing: "Berlangsung",
  upcoming: "Belum dimulai",
  ended: "Berakhir",
};
export const statusOrder: Record<EventStatus, number> = {
  ongoing: 0,
  upcoming: 1,
  ended: 2,
};

// Prototype destinations were inspected on the exact two Redesign Guru frames.
// Metadata for prototype actions; implemented destinations use real frontend routes.
export const dashboardActions = {
  create: {
    title: "Buat Event",
    description: "Wizard event contoh tersedia melalui Create Event.",
    figmaNode: "293:29139",
  },
  resume: {
    title: "Lanjutkan Draf",
    description: `Draf “${draftTitle}” dapat dilanjutkan melalui wizard event contoh.`,
    figmaNode: "293:29139",
  },
  monitoring: {
    title: "Monitoring Progres",
    description:
      "Monitoring menampilkan pengumpulan pada enrollment event contoh.",
    figmaNode: "291:21691",
  },
  assessment: {
    title: "Penilaian Siswa",
    description:
      "Pilih pengumpulan siswa di Monitoring untuk membuka lembar penilaian contoh.",
    figmaNode: "291:23200",
  },
  survey: {
    title: "Hasil Survei",
    description:
      "Respons lengkap berada pada modul Survei yang dikerjakan terpisah. Prototipe Teacher hanya menampilkan ringkasan baca-saja; tidak membuka atau mengubah respons survei.",
    figmaNode: "262:6820",
  },
} satisfies Record<string, DashboardAction>;

export const navigationGroups = [
  {
    title: "EVENT",
    items: [
      { label: "Dashboard", icon: "dashboard", figmaNode: "291:16094" },
      {
        label: "Pengelolaan Data Siswa",
        icon: "students",
        figmaNode: "291:16571",
      },
      { label: "Create Event", icon: "create", figmaNode: "291:17842" },
      { label: "Kelola Rubrik", icon: "rubrics", figmaNode: "291:20520" },
      {
        label: "Monitoring Progres",
        icon: "monitoring",
        figmaNode: "291:21691",
      },
      { label: "Karya Siswa", icon: "work", figmaNode: "291:25994" },
      {
        label: "Laporan Perkembangan",
        icon: "reports",
        figmaNode: "291:26708",
      },
    ],
  },
  {
    title: "SURVEI",
    items: [
      {
        label: "Dashboard Survei",
        icon: "survey-dashboard",
        figmaNode: "258:2316",
      },
      { label: "Survei Saya", icon: "surveys", figmaNode: "260:4959" },
      { label: "Template Survei", icon: "templates", figmaNode: "259:3854" },
      { label: "Hasil Survei", icon: "results", figmaNode: "262:6820" },
      { label: "Kebijakan Privasi", icon: "privacy", figmaNode: null },
    ],
  },
  {
    title: "Akun",
    items: [{ label: "Profil", icon: "profile", figmaNode: "291:28235" }],
  },
] as const;
