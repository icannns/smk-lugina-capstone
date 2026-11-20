# Laporan regresi final UAT Siswa Bojong United

20 November 2026 · branch `qa/student-final-regression`

**PASS — STUDENT UAT READY** untuk UAT internal. Retest memakai build dari
`aab5137729b9834237e9b1a649a5d523c6f40221` plus perbaikan lokal di bawah.
`origin/main` pada waktu pengambilan sudah mencakup merge PR #9 dan commit
perbaikan UAT Guru `0aed0515abad034472ad2fb923557b816c5be955`.

## Lingkungan pengujian

- Worktree `C:/Capstone Lugina Rancaekek Student QA`, Node.js 24.15.0,
  Next.js 16.4.3, Prisma 7.10.1, dan PostgreSQL 18.
- Baseline, retest browser, retest fokus, dan tes integritas memakai database QA
  terpisah. Koneksi database dan aplikasi memakai loopback. Zona bawaan QA
  menggunakan UTC+07. Berkas tersimpan pada private storage sementara.
- Browser Microsoft Edge headless dengan context terpisah untuk Guru,
  Siswa A, Siswa B, dan Siswa baru. Tes Auth, REST, dan lampiran juga memakai
  fixture Guru pemilik resource berbeda untuk menguji otorisasi.
- Bukti lokal berada di `%TEMP%/lugina-student-final-qa-20261120`. Pembacaan
  baseline ada di `student-final-baseline/results.json`, retest fokus di
  `focus/student-final-regressions/results.json`, dan hasil suite lain pada
  `suites-status.txt` beserta log. Log proses awal mencatat asumsi runner yang
  dikoreksi. Eksekusi fokus final menggunakan roster Monitoring, kolom storage
  berisi `local`, dan memeriksa ulang berkas setelah autentikasi ulang.

## Pengujian yang dijalankan

| Pemeriksaan | Hasil | Cakupan aktual |
| --- | --- | --- |
| Inventaris Siswa dari workbook | PASS | 15 skenario dijalankan. 15 PASS, 0 FAIL, 0 BLOCKED pada build final. Empat placeholder dikeluarkan. |
| Instalasi paket, Prisma generate dan validate | PASS | `npm ci` membentuk Prisma Client dan `prisma validate` memvalidasi skema. |
| Migrasi dan drift | PASS | Enam migrasi diterapkan pada database QA baru, `migrate status` menunjukkan up to date, dan diff schema tidak menemukan perbedaan. |
| ESLint, TypeScript, production build | PASS | ESLint dan `tsc --noEmit --incremental false` lulus. Build lulus setelah percobaan pertama berhenti untuk menampilkan advisori Next.js. |
| Tes unit | PASS | 37 tes Node/TSX. |
| Integritas PostgreSQL | PASS | 11 tes, termasuk constraint relasional, riwayat versi, skor dan pembacaan waktu sesi. |
| `student-final-regressions` | PASS | 24 pemeriksaan yang tercatat, termasuk 13 skenario workbook, progres, registrasi, enrollment, dan file setelah relogin. Dua skenario workbook lain dibuktikan melalui suite lampiran dan asesmen. |
| `rest-api-regressions` dan `rest-browser-integration` | PASS | 12 kelompok API dan 11 kelompok browser lintas Guru–Siswa, termasuk bootstrap API gagal yang menampilkan penanganan dan retry. |
| `teacher-uat-regressions` dan `audit-browser-regressions` | PASS | Regresi UAT Guru dan 7 pemeriksaan audit, termasuk revision grade, laporan, dan ekspor nyata. |
| `role-navigation-regressions` | PASS | 51 pemeriksaan navigasi dengan 0 page error, 0 console error, 0 warning dan 0 kegagalan respons yang tidak diharapkan. |
| `file-attachments-regressions` dan `file-attachments-browser` | PASS | 13 kelompok API dan 9 kelompok browser, termasuk byte asli, batas file, invalid MIME, pratinjau PDF/gambar, hapus draf, perlindungan lampiran revisi dan pengecekan otorisasi. |
| `assessment-dashboard-regressions` dan `ui-ux-api-regressions` | PASS | 25 pemeriksaan Dashboard dan 13 kelompok API UI/UX. Hasil DEMO terpisah dari INTERNAL, detail dan feedback sesuai pemilik, perubahan skor internal terlihat pada dashboard terbuka. |
| `auth-browser-regressions` | PASS | 15 kelompok, termasuk login, logout, pendaftaran publik, role, ownership, cookie, akses anonim, sesi kedaluwarsa dan rate limit. |
| Responsif | PASS | 45 kombinasi dari 9 tampilan/keadaan dan lebar 320, 375, 768, 1024, 1440 px. Dashboard/Event Saya, katalog, detail event, workspace yang selesai dan form unggah, daftar/detail Portofolio, Profil dan modal asesmen diuji. Halaman bebas overflow horizontal pada cakupan ini. Tampilan unggah dan panel hasil UI/UX juga diperiksa lewat screenshot 320 px. |

Total 11 suite browser/API lulus. Angka per suite mencakup pemeriksaan yang
bertumpang tindih dengan workbook dan dilaporkan terpisah. Pemindaian paket
`npm audit --omit=dev` mengembalikan kode 1 dengan satu entri moderate (`next`)
dan tiga high (`prisma`, `@prisma/config`, `effect`). Lockfile sama dengan
baseline. Status tersebut merupakan temuan dependensi untuk persiapan rilis.

## Konsistensi progres dan penilaian

| Kondisi event tiga milestone | Siswa pada baseline | Siswa dan Guru setelah retest | Nilai akhir |
| --- | --- | --- | --- |
| 1. M1 selesai | Dalam pengerjaan | Dalam pengerjaan, 1/3 | Kosong |
| 2. M1 dan M2 selesai | Dalam pengerjaan | Dalam pengerjaan, 2/3 | Kosong |
| 3. Semua tugas dan survei wajib selesai, baru M1 dinilai | Selesai | Menunggu penilaian, 3/3 | Kosong |
| 4. Semua versi terkini dinilai | Selesai | Selesai, 3/3 | 87 |
| 5. Guru meminta revisi M1 | Selesai | Menunggu penilaian, 3/3. Monitoring dan detail submission menampilkan Revisi diminta. | Kosong |
| 6. Siswa mengirim v2 dan Guru menilai ulang | Selesai | Selesai, 3/3. Riwayat tetap menyimpan kedua versi. | 80 |

Dashboard Guru memeriksa jumlah peserta selesai. Monitoring menampilkan status
per siswa dan Laporan tetap memakai total seluruh event ketika difilter ke M1.
Dashboard, Ruang Kerja, dan Portofolio Siswa memperoleh status dari selector
yang sama. REST `/api/progress` dan `/api/reports` mengonfirmasi nilai, status
revisi, dan jumlah peserta selesai sesuai keadaan yang tercatat.

Simpanan draf lama dan event baru berfungsi tanpa kontrol Mode Penyelesaian.
Pada fixture dengan survei DEMO yang diwajibkan, M2 tetap terkunci di UI dan
REST sampai tugas M1 dan survei terkirim. Sesudahnya M2 terbuka tanpa
menunggu nilai. Event draf tidak muncul di katalog dan gagal dienroll.
Event berakhir juga menolak enrollment baru dengan `ENROLLMENT_CLOSED`.

## Persistensi dan isolasi lintas akun

- **Registrasi dan profil.** Registrasi melalui form publik membentuk satu
  `User` ber-role `STUDENT` dengan hash Argon2id dan satu `StudentProfile` yang
  terelasi. Login dengan akun baru berhasil. Profil menolak nama terlalu
  pendek, kemudian menyimpan nama dan email kontak. Email login tetap dapat
  dipakai setelah perubahan email kontak.
- **Enrollment.** Dari Jelajah Event, akun baru membuka detail event Guru QA,
  membatalkan lalu mengonfirmasi Enroll, dan membuka Event Saya. PostgreSQL
  memiliki tepat satu baris `Enrollment` untuk pasangan profil dan event.
  Duplikat idempoten dan pemilihan `studentId` lain ditolak. Guru melihat
  jumlah peserta di detail event, lalu nama akun baru pada roster Monitoring.
  Enrollment yang sama bertahan setelah refresh dan relogin pada kedua role.
- **Akses.** Akses tanpa sesi dialihkan ke login. Siswa yang membuka halaman
  Guru dialihkan ke Dashboard Siswa. REST menolak endpoint Guru, akses detail
  submission/feedback milik Siswa lain, pengiriman tanpa enrollment,
  perubahan penilaian oleh Siswa, serta unduhan atau perubahan lampiran di
  luar kepemilikan. Guru lain ditolak pada resource yang terikat pemiliknya.
- **Lampiran.** PDF, PNG, JPEG, dan DOCX asli lolos unggah dan dibandingkan
  dengan byte fixture saat unduh. PDF dan gambar dapat dipratinjau. DOCX dapat
  diunduh, dengan keterangan pratinjau tidak tersedia. Lebih dari 10 MB, lebih
  dari lima lampiran dan file tidak sah ditolak. Metadata `SubmissionUpload`
  berstatus `READY` dengan checksum dan ukuran cocok. PDF, JPEG dan DOCX
  milik akun baru dapat diunduh kembali setelah refresh dan relogin.
- **Submission dan Portofolio.** Pengumpulan awal tampil sebagai versi awal.
  Versi 2 tercatat setelah permintaan revisi, lampiran lama tetap terlindungi,
  dan nilai versi lama tidak dihitung sebagai nilai aktif. Portofolio
  menampilkan detail event, tiga nilai milestone, riwayat, file, dan feedback
  yang sesuai dengan akun.
- **UI/UX.** Data DEMO dan INTERNAL dipisah. Hasil internal yang ditulis ke
  PostgreSQL muncul pada dashboard Guru dan Siswa yang benar beserta skor,
  status, feedback, dan riwayat. Siswa lain tidak menerima hasil tersebut.

## File yang berubah

| File | Perubahan |
| --- | --- |
| `src/components/siswa/student-dashboard.tsx` | Status event, filter, statistik dan tautan tindakan mengikuti progres penilaian yang sama. |
| `src/components/siswa/workspace/student-workspace.tsx` | Badge status event memakai hasil selector bersama. |
| `src/components/siswa/portfolio/student-portfolio.tsx` | Badge status konsisten pada daftar dan detail. Status submission terkini terlihat per milestone. |
| `src/components/siswa/siswa-ui.tsx` | Komponen badge status event bersama untuk tiga tampilan. |
| `src/components/siswa/events/student-events.tsx` | Label event arsip, berjalan, dan mendatang sesuai status kalender. |
| `tests/student-final-regressions.mjs` | Reproduksi baseline dan regresi cross-role dengan akun baru, PostgreSQL, storage privat dan lima viewport. |
| `docs/UAT-SISWA-FINAL-AUDIT.md` dan `docs/UAT-SISWA-REGRESSION-REPORT.md` | Inventaris workbook, bukti, severity, status, dan keputusan UAT. |

## Handover

Prioritaskan demonstrasi satu alur enrollment akun baru, unggah PDF, penilaian
Guru, lalu revisi dan penilaian ulang. Jadikan kondisi 3/3 tugas dengan hasil
yang masih menunggu nilai sebagai pemeriksaan bersama Guru dan Siswa.
Untuk rilis, tinjau advisori dependensi dan ulangi uji storage serta akses
lintas akun pada lingkungan target. Perbaikan tersedia lokal untuk review.
