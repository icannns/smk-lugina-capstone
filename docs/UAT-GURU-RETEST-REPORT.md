# Laporan pengujian ulang UAT Guru Bojong United

19 November 2026 · `fix/teacher-uat-findings` · Baseline `037914f`

Perbaikan menangani delapan masalah terkonfirmasi pada tampilan dan perhitungan.
Regresi pada PostgreSQL dengan zona WIB juga menemukan dan memperbaiki
kesalahan pembacaan waktu kedaluwarsa sesi.
Rincian tiap skenario, termasuk temuan yang perlu keputusan, ada di
[audit bug](UAT-GURU-BUG-AUDIT.md).

## Perbandingan sebelum dan sesudah

| Temuan | Sebelum | Sesudah dan bukti |
| --- | --- | --- |
| BUG-01 · Monitoring/revisi | Revisi diminta dan Belum dinilai tampil bersama. | Label utama Revisi diminta di detail dan kolom Penilaian roster tetap muncul setelah refresh. API masih mengembalikan assessment versi 1 serta feedback revisi. Sesi Dimas melihat feedback, sesi Aisyah ditolak ketika mengakses tugas Dimas. |
| BUG-02 · Riwayat pengumpulan | Riwayat revisi menghitung pengumpulan pertama. | Versi tunggal tidak memunculkan riwayat revisi. Setelah siswa benar-benar mengirim v2 karena feedback pada v1, riwayat menampilkan Pengumpulan awal dan Revisi versi 2. Berkas asli menggunakan kontrol pratinjau/unduh privat yang tersedia. |
| BUG-03 · Penyelesaian laporan | M1 terpilih membuat 1/3 tampil sebagai 1/1, Selesai dan nilai akhir 100. Pada tiga tugas dengan baru satu grade, laporan sudah menulis Selesai. | Filter M1 tetap menunjukkan progres 1/3, Dalam pengerjaan, nilai akhir kosong. 2/3 tetap Dalam pengerjaan. 3/3 dengan satu grade menampilkan Menunggu penilaian. Setelah nilai 100, 80, 80 tersimpan, event menampilkan Selesai dan nilai akhir 87. Dashboard Guru, Monitoring dan Laporan memakai kriteria penyelesaian event yang sama. |
| BUG-04 · Mode Penyelesaian | Informasi Event menampilkan radio untuk satu-satunya mode, sesuai Figma sebelumnya. | Keputusan tim terbaru menghapus kontrol dari Informasi Event. Langkah Milestone menampilkan label Berurutan dan menjelaskan kapan milestone berikutnya terbuka. Mode default `Penyelesaian` tetap digunakan saat simpan draf dan publish. |
| BUG-05 · Keterangan sertifikat | UI tidak menjelaskan batas server, teks panjang bisa memenuhi panel preview. | UI memakai batas 5.000 karakter yang sama dengan REST. Skenario 5.000 karakter bisa ditampilkan di editor dan penanda penandatangan tetap terlihat pada preview. REST menolak 5.001 karakter dengan HTTP 400. |
| BUG-06 · Simpan Draf | Status sukses inline berada di bawah formulir panjang. | Notifikasi sukses muncul dalam viewport setelah simpan dan bisa ditutup. Simulasi HTTP 503 menampilkan notifikasi gagal tanpa sukses palsu. Draf tetap tersimpan melalui proses normal dan dapat diterbitkan. |
| BUG-07 · Simpan Penilaian | Status sukses inline berada di bawah panel penilaian/feedback. | Notifikasi sukses muncul dalam viewport setelah penyimpanan. Simulasi HTTP 503 menampilkan notifikasi gagal. Nilai terkini, versi historis, dan peralihan ke revisi diperiksa melalui API dan browser. |
| BUG-09 · Ikon login | Penanda email, sandi, dan mata berupa bentuk kosong. | Aset mata dimuat dan dua ikon input tampil. Enter dan Space dapat mengubah tipe input. Tiga akun QA tetap login sesuai role. |
| REG-01 · Kedaluwarsa sesi | Sesi sudah kedaluwarsa dua jam, tetapi API masih mengembalikan 200. Prisma membaca waktu kedaluwarsa tujuh jam lebih maju saat zona bawaan server WIB. | Koneksi aplikasi memakai UTC agar Prisma membaca waktu dengan benar. Tes membandingkan waktu PostgreSQL dengan Prisma dan memeriksa API pada sesi yang sudah kedaluwarsa. |

Filter **Semua siswa** memulihkan dua peserta event setelah filter Aisyah
diterapkan. Kombinasi M1 + Selesai + Belum dinilai menghasilkan nol peserta
setelah koreksi status. Tombol **Hapus filter lain** mengembalikan dua peserta
tanpa mengganti event. PDF sebelum/sesudah memiliki header, trailer, dan satu
halaman pada kasus dua peserta. XLSX sebelum/sesudah lolos pemeriksaan ZIP
CRC, XML OOXML, dan lima baris (tiga baris judul/header dan dua peserta).

Kontrak laporan memisahkan rincian sesuai filter dari ringkasan event.
`eventProgress` menyediakan total, progres, status, dan nilai akhir seluruh
milestone. UI, PDF, dan XLSX memakai bagian itu untuk ringkasan event.
Rincian nilai per milestone tetap mengikuti filter. Penyelesaian task/survei
untuk membuka milestone Siswa serta ambang sertifikat tetap mengikuti
ketentuan sebelumnya.

## Lingkungan dan bukti

- PostgreSQL 18 berjalan di klaster lokal QA yang baru pada loopback. Schema
  diulang di database terpisah untuk tes integritas dan shadow migration.
- Edge headless dengan tiga browser context terpisah (Guru, Dimas, Aisyah).
- Next.js production build dari worktree `C:/Capstone Lugina Rancaekek Teacher UAT`.
- Snapshot baseline dan retest, screenshot, ekspor, dan log runner berada di
  direktori lokal QA di luar Git. Runner fokus tersedia pada
  `tests/teacher-uat-regressions.mjs` dan menggunakan konfigurasi
  `NODE_ENV=test`, `AUDIT_BASE_URL`, dan `PLAYWRIGHT_MODULE` sesuai
  [panduan pengujian](../tests/README.md). Argumen `--baseline` merekam
  perilaku sebelum perubahan. Jalankan hanya pada database test terisolasi.

### Hasil teknis

| Pemeriksaan | Hasil |
| --- | --- |
| Install dependency / Prisma validate dan generate | PASS |
| Enam migrasi / migrate status | PASS |
| Drift database terpasang dan replay migrasi dengan shadow DB terpisah | PASS, kedua diff tanpa perubahan |
| Integritas dan persistensi PostgreSQL | PASS, 11 tes, termasuk instant timestamp dan opsi koneksi |
| Selector, laporan, autentikasi, storage, data demo dan regresi lama | PASS, 35 tes |
| ESLint dan TypeScript mandiri | PASS |
| Production build | PASS pada pengulangan. Pemeriksa Next.js sempat menghentikan build untuk menunjukkan advisori yang sudah ada pada baseline. |
| Browser fokus UAT | PASS. Revisi, riwayat versi, laporan 1–3 milestone, notifikasi sukses dan gagal, ikon login, batas sertifikat, filter dan ekspor. Nol page error. |
| REST dan alur Guru–Siswa di browser | PASS, 12 pemeriksaan REST dan 11 pemeriksaan browser. |
| Audit frontend dan navigasi antar-role | PASS, 7 pemeriksaan regresi audit dan 51 pemeriksaan navigasi. |
| Dashboard asesmen Guru/Siswa | PASS, 25 pemeriksaan. |
| API dan browser lampiran privat | PASS, 13 pemeriksaan API dan 9 pemeriksaan browser. |
| Regresi perbaikan final QA | PASS, 10 pemeriksaan browser. |
| API internal asesmen UI/UX | PASS, 13 pemeriksaan. |
| Auth.js dan RBAC | PASS, 15 pemeriksaan browser pada pengujian ulang. Sesi kedaluwarsa ditolak setelah perbaikan REG-01. |
| Responsive | PASS pada autentikasi, dashboard hasil asesmen, dan laporan di 320, 768, dan 1440 px. |

Kesebelas suite browser dan API pada retest awal selesai dengan kode keluar `0`.
Pengujian ekspor ulang menegaskan XLSX valid dengan nilai akhir Aisyah
87 dan PDF satu halaman pada contoh dua peserta. Regresi ekspor dengan 40
peserta juga lulus dan menghasilkan PDF dua halaman.

### Pengujian ulang khusus BUG-04

| Pemeriksaan | Hasil |
| --- | --- |
| ESLint, TypeScript mandiri, Prisma validate dan status migrasi | PASS. Enam migrasi sudah terpasang. |
| Production build | PASS pada percobaan kedua. Percobaan pertama berhenti untuk menampilkan advisori Next.js yang sudah dicatat sebelumnya. |
| Wizard, simpan draf, muat ulang dan publish | PASS, 11 pemeriksaan integrasi browser Guru–Siswa. Informasi Event bebas dari kontrol mode. Event baru tersimpan dan terbit dengan default `Penyelesaian`. |
| Kompatibilitas event lama dan regresi UAT | PASS. Draf dengan `modeChosen: true` dapat diedit dan tetap tersimpan setelah refresh. Deadline event terbit dapat diedit dari daftar event. Kontrak API dan skema Prisma tetap sama. |
| Pembukaan milestone berurutan | PASS, bagian dari 12 kelompok uji REST. M2 mengembalikan `MILESTONE_LOCKED` sebelum tugas M1 dikirim dan ketika survei wajib masih kosong. Sesudah keduanya selesai, M2 menerima pengumpulan tanpa menunggu penilaian Guru. |
| Navigasi Guru dan Siswa | PASS, 51 pemeriksaan pada pengulangan dengan `.env` QA dimuat. Nol kesalahan halaman, konsol, dan respons HTTP. |

Bukti pengujian ulang lokal disimpan di `evidence/bug-04` pada direktori QA
di luar Git. Bukti mencakup screenshot Informasi Event dan log browser/API.

### Verifikasi sebelum publikasi

Finalisasi memakai build produksi dan dua database PostgreSQL QA baru
dengan zona bawaan WIB. Enam migrasi terpasang pada keduanya tanpa drift.
ESLint, TypeScript mandiri, Prisma validate, 30 tes unit, dan 11 tes integrasi
database lulus. Build lulus setelah percobaan pertama berhenti untuk
menampilkan advisori Next.js yang sudah ada pada baseline.

| Suite browser/API | Hasil |
| --- | --- |
| Regresi fokus UAT Guru | PASS, termasuk wizard, draf lama, penilaian/revisi, riwayat, laporan, filter, dan responsif 320/768/1440 px. |
| REST dan integrasi Guru–Siswa | PASS, 12 pemeriksaan API dan 11 pemeriksaan browser. |
| Regresi audit sebelumnya | PASS, 7 pemeriksaan. |
| Navigasi dan dashboard asesmen | PASS, 51 pemeriksaan navigasi dan 25 pemeriksaan dashboard. |
| Lampiran privat | PASS, 13 pemeriksaan API dan 9 pemeriksaan browser. |
| Auth.js dan RBAC | PASS, 15 pemeriksaan. Server menolak sesi kedaluwarsa dan akses di luar role/kepemilikan. |

Pemeriksaan berkas unduhan memvalidasi isi XLSX, skor akhir 87 pada contoh
dua peserta, dan 43 baris termasuk header pada laporan 40 peserta. PDF untuk
dua peserta berisi satu halaman, sedangkan laporan 40 peserta berisi dua
halaman. Bukti final berada di `evidence/publication-20261119-233524` pada
direktori QA lokal di luar Git.

## File yang berubah

| Lokasi | Perubahan |
| --- | --- |
| `src/components/auth/shared-ui.tsx` | Ikon input dan interaksi mata. |
| `src/components/guru/events/wizard/certificate-step.tsx` | Batas, penghitung dan ringkasan preview. |
| `src/components/guru/events/wizard/event-wizard.tsx` | Feedback Simpan Draf. |
| `src/components/guru/events/wizard/information-step.tsx` dan `src/components/guru/events/wizard/milestone-step.tsx` | Hapus pilihan mode dan jelaskan urutan milestone dengan teks biasa. |
| `src/components/guru/learning-ui.tsx` | Gaya badge Menunggu penilaian. |
| `src/components/guru/monitoring/monitoring.tsx` | Ringkasan penyelesaian dan label revisi roster. |
| `src/components/guru/monitoring/submission-assessment.tsx` | Status revisi, form dan notifikasi. |
| `src/components/guru/reports/progress-reports.tsx` | Cakupan progres, nilai akhir, ekspor, dan bantuan filter. |
| `src/components/guru/teacher-action-notice.tsx` | Notifikasi sukses dan gagal yang dapat ditutup. |
| `src/components/guru/work/student-work.tsx` | Riwayat pengumpulan dan evidence privat. |
| `src/lib/guru/event-wizard-validation.ts` dan `src/server/domain/common.ts` | Batas bersama untuk keterangan sertifikat. |
| `src/lib/guru/learning-selectors.ts` dan `src/lib/guru/report-selectors.ts` | Status event berdasarkan tugas/survei dan penilaian terkini. |
| `src/server/db/client.ts` | Pembacaan instant PostgreSQL yang konsisten melalui koneksi UTC. |
| `tests/teacher-uat-regressions.mjs` | Bukti reproduksi dan regresi browser dengan tiga akun QA. |
| `tests/rest-browser-integration.mjs` dan `tests/rest-api-regressions.mjs` | Regresi pembuatan event tanpa pilihan mode dan penguncian milestone sampai tugas dan survei wajib selesai. |
| `tests/database.integration.test.ts` | Regresi timestamp untuk koneksi pada database dengan konfigurasi WIB. |
| `docs/UAT-GURU-BUG-AUDIT.md` dan `docs/UAT-GURU-RETEST-REPORT.md` | Inventaris workbook, hasil retest dan keputusan UAT. |

## Kesiapan untuk UAT ulang

Periksa ulang pembuatan event, hasil penilaian rendah, permintaan revisi, dan
laporan yang difilter dengan penguji Guru pada build yang sama.
Jika tim ingin batas editorial sertifikat yang lebih pendek, tetapkan melalui
PRD. Setelah retest Guru diterima, gunakan tiga sesi terpisah untuk UAT Siswa
dan cek enrollment, lampiran, feedback, revisi, dan portofolio.

Audit paket melaporkan satu dependensi terdampak tingkat sedang, Next.js
16.4.3, pada baseline dan worktree. Tangani peningkatan Next.js sebelum
deployment dalam pekerjaan terpisah. Advisori vendor:
[GHSA-mfr8-8qww-v76h](https://github.com/advisories/GHSA-mfr8-8qww-v76h)
dan [GHSA-vc7v-qv4w-wrv8](https://github.com/advisories/GHSA-vc7v-qv4w-wrv8).
UAT ini memakai data fiktif dan lingkungan loopback.
