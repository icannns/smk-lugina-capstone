/** Only known historical test fixture identities are eligible for a title change. */
const legacyTitles: [RegExp, string][] = [
  [/^rest-[a-f0-9]+$/, "Landing Page Koperasi Siswa"],
  [/^parallel-[a-f0-9]+$/, "Website Ekstrakurikuler Sekolah"],
  [/^survey-[a-f0-9]+$/, "Riset Pengalaman Pengguna Perpustakaan"],
  [/^ui-survey-[a-f0-9]+$/, "Evaluasi Layanan Perpustakaan Sekolah"],
  [/^audit-[a-f0-9]+$/, "Company Profile SMK Lugina Rancaekek"],
  [/^files-[a-f0-9]+$/, "Dokumentasi Kegiatan OSIS"],
  [/^fix-[a-f0-9]+$/, "Aplikasi Peminjaman Buku"],
  [/^fix-draft-[a-f0-9]+$/, "Aplikasi Absensi Ekstrakurikuler"],
  [/^preuat-[a-f0-9]+$/, "Website Pameran Karya Siswa"],
  [/^qa-sort-p-[a-f0-9]+$/, "Landing Page Penerimaan Siswa Baru"],
  [/^qa-sort-d-[a-f0-9]+$/, "Company Profile Koperasi Sekolah"],
  [/^empty-[a-f0-9]+$/, "Desain Aplikasi Jadwal Pelajaran"],
  [/^draft-[a-f0-9-]{36}$/, "Company Profile Ekstrakurikuler Pramuka"],
];

export function legacyDemoTitle(event: { id: string; title: string }): string | undefined {
  if (!/\b(QA|PREUAT|REST|PostgreSQL|Fix|published)\b|\bBerkas Nyata\b|\bSurvei Demo\b/i.test(event.title)) return;
  return legacyTitles.find(([identity]) => identity.test(event.id))?.[1];
}
