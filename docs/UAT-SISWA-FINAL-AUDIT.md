# Audit final UAT Siswa Bojong United

20 November 2026 · `qa/student-final-regression` · baseline `aab5137729b9834237e9b1a649a5d523c6f40221`

**PASS — STUDENT UAT READY.** Kelima belas skenario workbook lulus setelah dua
bug terkonfirmasi diperbaiki. Hasil ini berlaku untuk UAT internal dengan data
fiktif di PostgreSQL QA. Rincian eksekusi ada di
[laporan regresi](UAT-SISWA-REGRESSION-REPORT.md).

## Inventaris workbook dan verifikasi aktual

Sumber penguji adalah `Usability_Testing_Digital_Portfolio (1).xlsx`, sheet
`Usability Test`, `B36:I54`. Baris 36–50 memuat 15 skenario `Works`, 0 `Error`,
dan 0 `Partial`. Baris 39, 41, dan 43 melanjutkan skenario Siswa meski kolom
Modul kosong. Baris 51–54 hanya berisi `Belum Diuji` dan dikeluarkan dari
hitungan. `Ringkasan!A5:G8` belum memiliki kategori Student Module. Worksheet
dibaca sebagai bukti pengujian. SHA-256 file sumber cocok sebelum dan sesudah.

| Baris | Skenario UAT | Excel | Hasil retest dan bukti |
| --- | --- | --- | --- |
| 36 | S01 · Ubah profil | Works | PASS. Nama satu karakter ditolak. Perubahan nama dan email kontak bertahan setelah refresh. Query memeriksa `User.name` dan `StudentProfile.contactEmail`. |
| 37 | S02 · Kerjakan satu milestone | Works | PASS. Setelah tugas dan survei M1, progres 1/3 dan status Dalam pengerjaan terlihat pada akun Siswa dan Guru. |
| 38 | S02 · Pratinjau, unduh, hapus lampiran | Works | PASS. Browser membuka piksel PNG dan halaman PDF sungguhan, mengunduh berkas yang byte-nya cocok, dan menghapus lampiran draf. JPEG dan DOCX juga diunggah dan diunduh. Pratinjau inline DOCX secara eksplisit tidak tersedia. |
| 39 | S02 · Coba melanjutkan tanpa tugas | Works | PASS. Form kosong menampilkan pesan validasi tanpa membuat submission. M2 terkunci di UI dan API sebelum M1 selesai. |
| 40 | S02 · Selesaikan semua milestone | Works | PASS setelah S-01 diperbaiki. 3/3 tugas dengan satu penilaian masih Menunggu penilaian. Setelah nilai lengkap status Selesai. Revisi membuka kembali status penilaian sampai versi terbaru dinilai. |
| 41 | S02 · Filter Semua, Aktif, Selesai | Works | PASS setelah S-01 dan S-02 diperbaiki. Event aktif yang menunggu nilai tetap di Aktif, event lengkap masuk Selesai, dan event arsip tetap bisa ditemukan via Semua. |
| 42 | S03 · Detail event yang sudah diikuti | Works | PASS. Event berjalan menampilkan badge hijau Sudah Terdaftar dan membuka Ruang Kerja. Arsip tetap berstatus Berakhir. |
| 43 | S03 · Detail event yang belum diikuti | Works | PASS. Event berjalan menampilkan badge biru Terbuka dan tombol Enroll. Pada event yang berakhir, tombol dinonaktifkan dan API menolak pendaftaran baru. |
| 44 | S03 · Enroll dan konfirmasi | Works | PASS. Batal menutup dialog, konfirmasi membuat satu `Enrollment`. Permintaan ulang mengembalikan enrollment yang sama. |
| 45 | S03 · Filter Jelajah Event | Works | PASS. Seluruh opsi status dicocokkan dengan katalog API. Belum Diikuti mengecualikan event yang sudah diikuti. Pindah halaman mempertahankan jumlah dan batas enam kartu. |
| 46 | S03 · Cari judul | Works | PASS. Judul event terbit ditemukan, judul draf menghasilkan keadaan kosong. |
| 47 | S03 · Navigasi Event Saya | Works | PASS. Dari katalog, Event Saya membuka Dashboard dengan enrollment sendiri. Enrollment tetap terlihat setelah refresh dan login ulang. |
| 48 | S02 · Detail asesmen Siswa | Works | PASS. Modal memuat skor, status, dan feedback milik akun aktif. Fixture DEMO dan hasil INTERNAL tampil dengan label terpisah. Patch hasil internal terlihat di Dashboard Siswa. |
| 49 | S04 · Lihat detail karya | Works | PASS. Lihat Karya membuka event dan pengumpulan yang benar. Suite lampiran membuktikan hasil upload dan feedback muncul di Portofolio. |
| 50 | S04 · Nilai ketiga milestone | Works | PASS. Ketiga milestone menampilkan 80 setelah penilaian ulang. Dialog riwayat M1 memuat versi 1 dan 2 dari PostgreSQL. |

**Total workbook yang dieksekusi** 15. **PASS** 15. **FAIL** 0. **BLOCKED** 0.
Pengujian otomatis mengulang skenario manual pada build final. Status `Works`
di Excel hanya dicatat sebagai hasil penguji.

## Temuan terkonfirmasi

| Temuan | Severity | Reproduksi pada baseline | Akar masalah dan perbaikan | Status |
| --- | --- | --- | --- | --- |
| S-01 · Event tampak selesai sebelum penilaian lengkap | P1 | Kirim tiga tugas, selesaikan survei M1, lalu beri nilai pada M1 saja. Dashboard dan Portofolio Siswa menampilkan Selesai dan filter Selesai memuat event tersebut. Guru melihat Menunggu penilaian dan API mengembalikan nilai akhir kosong. Ulangi setelah seluruh penilaian lalu minta revisi, dan status Siswa tetap Selesai. | UI Siswa memakai `completed === total`, yaitu hitungan tugas dan survei. Portofolio juga mengutamakan tanda selesai pengerjaan pada kartu milestone meski ada status revisi. Dashboard, Ruang Kerja, dan Portofolio sekarang memakai `eventCompletionStatus` yang sudah dipakai Guru. Status submission mengikuti versi aktif. Aturan pembukaan tetap diperiksa server berdasarkan tugas dan survei wajib. | FIXED. Keadaan 1/3, 2/3, menunggu nilai, dinilai lengkap, revisi terbuka, dan dinilai ulang terverifikasi di browser/API. |
| S-02 · Label arsip bercampur dengan status pengerjaan | P2 | Setelah event yang sudah diikuti berakhir, detail menulis Sudah Terdaftar · Aktif dan katalog menulis Sudah Diikuti · Selesai. Untuk pengunjung lain detail menulis Terbuka · Berakhir, padahal pendaftaran ditolak. | Detail mengunci label peserta ke Aktif dan katalog menganggap event berakhir sama dengan pekerjaan selesai. Tampilan katalog dan detail sekarang menampilkan status kalender yang tepat. Filter Aktif dan hitungan Dashboard memakai kriteria event berjalan dan belum selesai yang sama. | FIXED. Katalog, detail peserta, detail pengunjung, filter Aktif, dan penolakan enrollment baru terverifikasi. |

| P0 | P1 | P2 | P3 | Terbuka |
| --- | --- | --- | --- | --- |
| 0 | 1 diperbaiki | 1 diperbaiki | 0 | 0 |

## Batasan verifikasi

- Pengujian memakai Microsoft Edge headless, PostgreSQL lokal, dan penyimpanan
  privat lokal. Berkas DOCX didukung untuk unggah dan unduh. Pratinjau inline
  tersedia untuk PDF dan gambar.
- Roster peserta tanpa aktivitas tersedia di **Event → Monitoring**. Tabel
  **Catatan peserta** di Pengelolaan Data Siswa menampilkan rincian aktivitas
  survei, sehingga jumlah baris bisa berbeda dari daftar enrollment.
- Hasil internal UI/UX dan referensi DEMO terverifikasi. Integrasi provider,
  penyimpanan cloud, perangkat fisik, dan lingkungan produksi di luar UAT ini.
- Audit npm mencatat kategori advisori pada dependensi yang sudah dipakai
  baseline. Tindak lanjuti di pekerjaan persiapan rilis.
