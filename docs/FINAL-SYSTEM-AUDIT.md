# Final System Audit Bojong United

**PASS — siap untuk handover teknis.** Seluruh 46 skenario workbook lulus pada pengujian ulang. Alur Guru–Siswa, penyimpanan PostgreSQL, lampiran privat, dan Docker development/QA terverifikasi. Persetujuan UAT manusia dan kesiapan deployment produksi merupakan pemeriksaan terpisah.

## Snapshot dan lingkungan

| Item | Nilai |
| --- | --- |
| Branch integrasi | `release/bojong-united-final` |
| Basis main | `a78006673c0cf0be29b0cc139cd61a0791a20905`, memuat PR #9 dan PR #10 |
| Riwayat Docker | `b26fe28aea53d5789ae8df766f7a9c3b585df872`, dipertahankan sebagai parent integrasi [PR #11](https://github.com/icannns/smk-lugina-capstone/pull/11) |
| Snapshot rilis | Komit yang memuat dokumen ini menggabungkan Docker dan patch akhir Login, Dashboard dan Monitoring, beserta tes |
| Lingkungan | Windows, Edge headless, Node.js 24, Next.js 16.4.6, Prisma 7.10.1, PostgreSQL QA native 18.6 dan Docker 17 |
| Bukti lokal | `%TEMP%\bojong-final-release-20261121`, termasuk log runner, hasil UAT, screenshot dan ekspor |
| Sumber UAT | `Usability_Testing_Digital_Portfolio (1).xlsx`, SHA-256 `ee5c45b29a16d12b8cf235434a1b4bf96e43452f1cb41edfc815a644cb5a245d` |

Perubahan lokal dari worktree Final Audit Fix disalin dan diverifikasi sebelum integrasi. Kandidat diuji pada worktree terpisah. Docker kandidat diuji dari clone kosong PR #11 yang diberi salinan patch integrasi, tanpa `.env` atau `node_modules` host. Data QA dibatasi pada database dan volume sendiri.

## UAT dan alur aplikasi

| Cakupan | Hasil |
| --- | --- |
| Guru dan Umum | 31 PASS. Dashboard dan asesmen, data peserta, event dan wizard, draf/publish, rubrik, Monitoring, penilaian, feedback, revisi, karya, laporan, ekspor dan profil diuji ulang. |
| Siswa | 15 PASS. Registrasi, profil, katalog, filter/pencarian/pagination, enrollment, workspace, pengumpulan dan revisi, asesmen, portofolio dan status event diuji ulang. |
| G05 baris 33 | PASS. Milestone berikutnya mengikuti urutan posisi database pada siswa dan event yang sama. Siswa berikutnya mempertahankan milestone. Milestone terakhir menunjukkan penanda akhir. Back/Forward, refresh, URL langsung, 5 lebar layar, tugas, nilai dan feedback tujuan diverifikasi. |
| Copy Login dan sapaan | PASS. Login menjelaskan basis data dan data demo eksternal dengan akurat. Unit test mencakup empat batas waktu WIB. Browser menguji pergantian tanpa reload dan tanpa hydration error pada kedua role. |
| Status progres | PASS. Jalur 0/3 hingga 3/3, sebelum dan sesudah penilaian, serta revisi dan nilai ulang selaras dengan aturan penyelesaian. Nilai historis tetap tersedia. |
| Ekspor | PASS. PDF 40 peserta terverifikasi dua halaman dan mencakup baris terakhir. XLSX terverifikasi sebagai ZIP dan XML. Alur lintas akun juga mengunduh kedua format dari laporan dengan nilai aktual. |

[Matriks 46 skenario dan bukti](FINAL-UAT-TRACEABILITY.md) memetakan baris Excel, status manusia, hasil aktual, dan bukti. Empat baris kosong tidak dihitung. [Daftar temuan](FINAL-BUG-REGISTER.md) mencatat status BUG-01 sampai BUG-10, REG-01, dan dua perbaikan UAT Siswa.

## Cross-role dan data

Satu rangkaian browser memakai context terpisah untuk Guru, dua akun Siswa yang diprovisikan, dan satu Siswa baru. Guru membuat event dengan tiga milestone serta rubrik, menyimpan dan membuka draf dari daftar, lalu menerbitkannya. Siswa baru mendaftar, login ulang, enroll, dan muncul di Monitoring Guru. SQL memverifikasi peran, profil, enrollment, urutan milestone, dan checksum PDF.

Guru membuka dan mengunduh PDF, memberi nilai dan feedback, lalu meminta revisi. Siswa melihat feedback dan mengirim versi kedua dengan unggahan PNG baru. Guru melihat kedua lampiran dalam riwayat dan memverifikasi checksum. Nilai aktif menunggu penilaian ulang. Guru menilai kembali, berpindah milestone dan siswa, lalu memeriksa Laporan dan mengunduh PDF/XLSX. Nilai akhir 100 cocok dengan Portofolio dan empat record penilaian aktif/historis untuk tiga milestone. Dua akun lain menerima HTTP 403 pada resource privat. Keempat akun logout/login ulang dan data tetap tersedia. Bukti `cross-retest/new-student-e2e.log` dan `cross-retest/suites/new-student-e2e`.

## Verifikasi teknis dan keamanan

- **Static dan build.** `npm ci`, ESLint, TypeScript mandiri, Prisma generate/validate, production build, dan 39 unit test lulus.
- **PostgreSQL.** Enam migrasi berhasil, migrate status up to date, dan diff database aktif serta replay migrasi melaporkan *No difference detected*. Sebelas tes integritas lulus, termasuk relasi, scope, perubahan versi, dan timestamp expiry dengan zona WIB.
- **Auth.js/RBAC.** 15 kelompok tes autentikasi dan 51 cek navigasi lulus. Program menguji login salah, registrasi, logout, expiry, rate limit, scope Guru/Siswa, dan isolasi akses.
- **API.** 12 kelompok REST, 13 kelompok UI/UX internal, dan 25 cek dashboard asesmen lulus. UI/UX internal memiliki riwayat tersendiri dan scope sesuai role.
- **Lampiran.** 13 kelompok API upload dan sembilan kelompok browser lulus. PDF, PNG, JPG dan DOCX, batas ukuran dan jumlah, mismatch format, preview/unduh, revisi, private access, checksum, serta restart diverifikasi. Penyimpanan privat dan riwayat lama dipertahankan.
- **Responsif.** 90 kombinasi 18 route dan 5 lebar (320, 375, 768, 1024, 1440 px) lulus. Tidak terdeteksi overflow halaman, gambar rusak, atau error runtime yang tak terduga. Detail Monitoring, modal asesmen, PDF dan upload juga diuji tersendiri.
- **Dependensi.** Lockfile mengunci Next.js dan eslint-config-next `16.4.6` serta Effect `3.22.1`. Audit npm penuh dan runtime melaporkan 0 entri terdeteksi. Audit mencakup paket npm pada saat tes. [Advisori Next.js](https://github.com/advisories/GHSA-mfr8-8qww-v76h) · [Advisori Effect](https://github.com/Effect-TS/effect/security/advisories/GHSA-7589-6fvf-x4pw)

## Docker dan restart

Compose valid. Image dibangun dengan Next.js 16.4.6, enam migrasi dijalankan, tiga akun demo diprovisikan, dan PostgreSQL serta web sehat. Instalasi QA mempublikasikan satu port HTTP loopback. PostgreSQL mendengar hanya pada loopback namespace container. Browser menguji login Guru/Siswa, publish, enroll, unggah dan unduh PDF, penilaian serta logout/login. Setelah PostgreSQL dan web direstart, sesi, event, enrollment, penilaian, dan byte lampiran tetap ada. Migrasi dan provisioning ulang idempoten.

Pemindaian 15 layer image dan log layanan tidak menemukan kredensial QA. File secret di volume berizin `0600`, direktorinya `0700`, dan provisioning menolak production serta opt-in yang dinonaktifkan. Database host utama tidak dipakai. Bukti `docker-fresh-start.log`, `docker-release-smoke.log`, dan `docker-security.log`.

## Batas rilis

FOMO/COMMIT dan provider eksternal di luar cakupan. Sertifikat merupakan dokumen contoh. Scan OS image, uji beban, perangkat fisik, TLS/ingress, penyimpanan S3 nyata, backup/restore dan deployment produksi belum diverifikasi. [Kesiapan handover](FINAL-HANDOVER-READINESS.md) · [Panduan Docker](DOCKER-SETUP.md)
