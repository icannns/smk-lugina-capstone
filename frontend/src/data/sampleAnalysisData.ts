import { AnalyticsResponse } from "../types";

export const fallbackAnalysisData: AnalyticsResponse = {
  success: true,
  summary: {
    total_records: 25,
    can_render_chart: true,
    can_render_wordcloud: true,
    stress_counts: {
      Tinggi: 11,
      Sedang: 4,
      Rendah: 10
    },
    average_score: 2.9
  },
  students: [
    { id: "S-001", name: "Rizky Pratama", post_date: "2026-10-23 09:12", kalkulasi: 4.25, rounded_scale: 4, kategori: "Tinggi", essay_text: "Sistem sering lambat ketika pengumpulan tugas malam hari, notifikasi bertubi-tubi membuat pusing dan cemas ketinggalan batas waktu." },
    { id: "S-002", name: "Anisa Rahma", post_date: "2026-10-23 09:15", kalkulasi: 3.85, rounded_scale: 4, kategori: "Tinggi", essay_text: "Aplikasi crash mendadak saat ujian berjalan. Beban tugas digital menumpuk tidak sebanding dengan pemahaman materi." },
    { id: "S-003", name: "Budi Santoso", post_date: "2026-10-23 09:20", kalkulasi: 1.80, rounded_scale: 2, kategori: "Rendah", essay_text: "Materi belajar sangat jelas, panduan video tutorial membantu memahami fitur baru tanpa kendala teknis." },
    { id: "S-004", name: "Citra Dewi", post_date: "2026-10-23 09:22", kalkulasi: 4.10, rounded_scale: 4, kategori: "Tinggi", essay_text: "Terlalu banyak platform berbeda yang dipakai tiap guru, membuat bingung kata sandi dan antarmuka rumit." },
    { id: "S-005", name: "Dimas Anggara", post_date: "2026-10-23 09:25", kalkulasi: 2.90, rounded_scale: 3, kategori: "Sedang", essay_text: "Cukup membantu walau kadang ada kendala sinyal internet saat mengunggah laporan praktikum." },
    { id: "S-006", name: "Eka Putri", post_date: "2026-10-23 09:30", kalkulasi: 4.50, rounded_scale: 5, kategori: "Tinggi", essay_text: "Notifikasi malam hari sangat mengganggu jam istirahat. Merasa harus selalu online merespons pesan grup kelas." },
    { id: "S-007", name: "Fajar Hidayat", post_date: "2026-10-23 09:33", kalkulasi: 1.70, rounded_scale: 2, kategori: "Rendah", essay_text: "Sistem mudah dipahami, belajar mandiri lebih terstruktur dan pengumpulan tugas sangat ringkas." },
    { id: "S-008", name: "Gita Safitri", post_date: "2026-10-23 09:40", kalkulasi: 3.10, rounded_scale: 3, kategori: "Sedang", essay_text: "Bagus tapi butuh pelatihan tambahan untuk fitur analitik nilai tugas." },
    { id: "S-009", name: "Hafiz Ramadhan", post_date: "2026-10-23 09:44", kalkulasi: 4.30, rounded_scale: 4, kategori: "Tinggi", essay_text: "Sistem lambat dan sering error validasi token saat jam sibuk pengiriman tugas." },
    { id: "S-010", name: "Indah Permata", post_date: "2026-10-23 09:50", kalkulasi: 1.60, rounded_scale: 2, kategori: "Rendah", essay_text: "Aplikasi berjalan lancar, pengingat deadline ramah dan antarmuka bersih." }
  ],
  top_ngrams: {
    high: [
      { Frasa: "notifikasi malam", Frekuensi: 14 },
      { Frasa: "sistem lambat", Frekuensi: 11 },
      { Frasa: "batas waktu", Frekuensi: 9 },
      { Frasa: "beban tugas", Frekuensi: 8 },
      { Frasa: "aplikasi crash", Frekuensi: 7 },
      { Frasa: "antarmuka rumit", Frekuensi: 6 },
      { Frasa: "kendala sinyal", Frekuensi: 5 },
      { Frasa: "jam istirahat", Frekuensi: 5 },
      { Frasa: "bingung fitur", Frekuensi: 4 },
      { Frasa: "grup tugas", Frekuensi: 4 }
    ],
    low: [
      { Frasa: "materi jelas", Frekuensi: 12 },
      { Frasa: "belajar mandiri", Frekuensi: 10 },
      { Frasa: "mudah dipahami", Frekuensi: 9 },
      { Frasa: "antarmuka bersih", Frekuensi: 7 },
      { Frasa: "pengumpulan ringkas", Frekuensi: 6 },
      { Frasa: "video tutorial", Frekuensi: 6 },
      { Frasa: "lancar digunakan", Frekuensi: 5 },
      { Frasa: "fitur praktis", Frekuensi: 5 },
      { Frasa: "jadwal teratur", Frekuensi: 4 },
      { Frasa: "akses cepat", Frekuensi: 4 }
    ]
  },
  wordclouds: {
    Tinggi: null,
    Rendah: null,
    Sedang: null,
    Semua: null
  }
};
