import type { CertificateConfig, GuruRubric } from "./teacher-types";
export const initialRubrics: GuruRubric[] = [
  [
    "uiux",
    "Rubrik UI/UX Dasar",
    "Konsistensi, Navigasi, Keterbacaan, Kesesuaian Desain",
  ],
  [
    "wireframe",
    "Rubrik Wireframe Cepat",
    "Struktur Layout, Kelengkapan Layar, Anotasi",
  ],
  ["poster", "Rubrik Poster Digital", "Komposisi, Pesan"],
  ["database", "Rubrik Basis Data Dasar", "Normalisasi, Relasi"],
].map(([id, title, names]) => ({
  id,
  title,
  description:
    id === "uiux"
      ? "Untuk menilai desain antarmuka aplikasi mobile/web tingkat dasar."
      : id === "database"
        ? "Belum dipakai menilai — bisa diedit."
        : "",
  updated: (
    {
      uiux: "2025-02-12",
      wireframe: "2025-02-03",
      poster: "2024-12-20",
      database: "2025-03-28",
    } as Record<string, string>
  )[id],
  inUse: id !== "database",
  criteria: names.split(", ").map((title, index) => ({
    id: `${id}-${index + 1}`,
    title,
    description:
      id === "uiux"
        ? [
            "Keseragaman warna, tipografi, dan komponen antar layar.",
            "Kemudahan pengguna berpindah antar layar.",
            "Ukuran huruf, kontras, dan hierarki teks.",
            "Kesesuaian solusi dengan studi kasus.",
          ][index]
        : id === "database"
          ? ["Struktur tabel bebas redundansi.", "Ketepatan kunci dan relasi."][
              index
            ]
          : "",
    min: 1,
    max: 5,
    levels:
      id === "uiux"
        ? [
            [
              "Tidak konsisten di hampir semua layar",
              "Banyak elemen tidak seragam",
              "Cukup konsisten, ada beberapa perbedaan",
              "Konsisten dengan sedikit pengecualian",
              "Sepenuhnya konsisten dan terdokumentasi",
            ],
            [
              "Alur membingungkan",
              "Alur sering buntu",
              "Alur utama jelas",
              "Alur jelas dan efisien",
              "Alur intuitif untuk semua skenario",
            ],
            [
              "Sulit dibaca",
              "Kontras/ukuran kurang",
              "Terbaca dengan usaha",
              "Mudah dibaca",
              "Sangat jelas dan hierarkis",
            ],
            [
              "Tidak sesuai",
              "Sebagian kecil sesuai",
              "Cukup sesuai",
              "Sesuai",
              "Sangat sesuai dan inovatif",
            ],
          ][index]
        : id === "database"
          ? [
              [
                "Tidak ada",
                "Banyak redundansi",
                "Cukup",
                "Baik",
                "Sangat baik",
              ],
              ["", "Banyak salah", "Cukup", "Tepat", "Sangat tepat"],
            ][index]
          : Array(5).fill(""),
  })),
}));
export function defaultCertificate(): CertificateConfig {
  return {
    mode: "details",
    threshold: "75",
    name: "Sertifikat Kompetensi UI/UX",
    organizer: "SMK Lugina Rancaekek",
    issuedAt: "",
    signer: "Penandatangan Demo",
    signerRole: "Kepala Sekolah (contoh)",
    description: "Telah menyelesaikan event dengan baik.",
    logo: { name: "logo-lugina.png", size: 12000, type: "image/png" },
    template: {
      name: "template-sertifikat.pdf",
      size: 1200000,
      type: "application/pdf",
    },
    positions: {
      student: { x: 50, y: 45 },
      event: { x: 50, y: 58 },
      date: { x: 17, y: 78 },
      score: { x: 83, y: 78 },
    },
  };
}
export function rubricMaximum(rubric: GuruRubric) {
  return rubric.criteria.reduce((sum, c) => sum + c.max, 0);
}
