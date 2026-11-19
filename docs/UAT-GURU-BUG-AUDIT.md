# Audit hasil UAT Guru Bojong United

19 November 2026 · Baseline `origin/main` `037914f` · Branch `fix/teacher-uat-findings`

Workbook `Usability_Testing_Digital_Portfolio.xlsx` dibaca tanpa diubah. Pada
`Usability Test!B5:I34` ada **30 skenario**, terdiri dari 21 Works, 2 Error,
dan 7 Partial. `Ringkasan!A5:G8` hanya menghitung 28 (21 Works, 2 Error,
5 Partial). Baris 28 tidak mengisi Modul. Baris 5 tercatat sebagai Umum pada
sumber, meskipun Ringkasan menampilkan nol untuk kategori tersebut.
Gambar yang tertanam di kolom H ikut diperiksa untuk membedakan gejala dari
hasil yang diharapkan.

Kode PRD tersedia di kolom B workbook. Dokumen PRD mandiri tidak ditemukan
dalam checkout. Untuk aturan yang perlu dikonfirmasi, audit memakai kontrak
[Guru](TEACHER-MODULE.md), [Siswa](STUDENT-MODULE.md),
[REST](BACKEND-REST-API.md), dan frame Figma yang disebut dalam dokumentasi.
Baseline direproduksi pada build produksi lokal dengan data fiktif di
PostgreSQL QA, lalu dibandingkan dengan hasil setelah perubahan.

| ID dan sumber | Keparahan | Reproduksi dan perbedaan | Akar masalah dan tindakan | Status |
| --- | --- | --- | --- | --- |
| BUG-01 · G27–I27 | Tinggi | Monitoring → submission versi terkini → simpan nilai rendah → Minta Revisi → refresh. Header menampilkan Revisi diminta bersamaan dengan Belum dinilai. Kolom Penilaian di roster juga menampilkan Belum dinilai. | Nilai disimpan pada SubmissionVersion dan revisi tercatat pada Feedback. Backend sudah mengeluarkan nilai versi yang sedang direvisi dari nilai aktif. UI menambahkan badge generik pada setiap status selain reviewed dan roster memakai jumlah nilai aktif saja. Tampilkan status revisi yang diutamakan, simpan nilai lama dalam Riwayat Pengumpulan, dan kunci input nilai selama revisi terbuka sesuai guard server. Lokasi `submission-assessment.tsx`, `monitoring.tsx`, `learning-selectors.ts`. | FIXED |
| BUG-02 · G30–I30 | Sedang | Karya Siswa → detail Aisyah setelah pengumpulan pertama. Baseline membuka Riwayat revisi berisi versi 1, walaupun tidak ada permintaan revisi. | UI menghitung semua versi sebagai revisi. Versi 1 adalah Pengumpulan awal. Untuk versi berikutnya, label revisi membutuhkan feedback permintaan revisi pada versi sebelumnya. Riwayat tetap bisa diakses dan lampiran memakai komponen akses privat yang sudah ada. Lokasi `student-work.tsx`. | FIXED |
| BUG-03 · G31–I31 | Tinggi | Bukti H31 menunjukkan tiga tugas sudah dikirim, satu telah dinilai. Baseline menampilkan 3/3 Selesai. Saat filter M1 dipasang pada kasus hanya satu tugas dinilai, baseline menampilkan 1/1 Selesai dan 100 pada kolom Nilai akhir. | Penyelesaian tugas/survei dan penyelesaian event belum dibedakan. Filter milestone juga mengganti denominator dan skor final. Progres pengerjaan tetap mengukur tugas dan survei wajib. Selesai event mensyaratkan seluruh pekerjaan dan penilaian terkini, termasuk tidak ada nilai aktif yang gugur karena revisi. Filter milestone kini membatasi rincian. Ambang sertifikat tetap terpisah. Lokasi `learning-selectors.ts`, `report-selectors.ts`, `progress-reports.tsx`. | FIXED |
| BUG-04 · G15–I15 | Rendah | Create Event → Informasi Event menampilkan radio Mode Penyelesaian meskipun sistem hanya mendukung satu mode. | Kontrol mengikuti Figma Redesign Guru [293:29139](https://www.figma.com/design/hWTpQwbyreDsivI3tZ0yLa/SMK-Lugina--Copy-?node-id=293-29139). Keputusan tim terbaru menghapus kontrol itu dan menjelaskan aturan berurutan di langkah Milestone. Uji browser mengonfirmasi event baru dan draf lama dapat disimpan dengan mode default, event dapat diterbitkan, dan deadline event terbit dapat diedit. Uji REST mengonfirmasi milestone berikutnya terkunci sampai tugas dan survei wajib sebelumnya selesai. | FIXED |
| BUG-05 · G19–I19 | Sedang | Wizard → Sertifikat → isi Teks keterangan panjang. UI semula tidak punya pembatas/penghitung, padahal server menerima maksimal 5.000 karakter. Preview berukuran tetap bisa terdesak oleh teks. | Sinkronkan editor dan skema REST dengan batas yang sudah berlaku. Penghitung menjelaskan batas, preview merangkum teks panjang dan penyimpanan tetap memakai isi penuh. Figma [291:19593](https://www.figma.com/design/hWTpQwbyreDsivI3tZ0yLa/SMK-Lugina--Copy-?node-id=291-19593) tidak menentukan batas editorial yang lebih pendek. Jika sekolah ingin ketentuan terpisah untuk dokumen final, perlu keputusan produk. Lokasi `certificate-step.tsx`, `event-wizard-validation.ts`, `common.ts`. | FIXED untuk ketidaksesuaian teknis |
| BUG-06 · G21–I21 | Sedang | Wizard → Simpan Draf. Pesan ada di alur halaman di bawah formulir dan dapat berada di luar viewport. | Pindahkan feedback ke notifikasi tetap yang bisa ditutup. Pesan sukses menunggu konfirmasi penyimpanan dan pemuatan ulang data. Jika konfirmasi gagal, tampilkan peringatan. Draf masih dapat dibuka dari daftar. Lokasi `event-wizard.tsx`, `teacher-action-notice.tsx`. | FIXED |
| BUG-07 · G28–I28 | Sedang | Monitoring → isi semua skor → Simpan Penilaian. Baseline menyimpan grade dan menampilkan status benar, tetapi feedback berada setelah dua kolom formulir yang panjang. | Feedback sukses sebenarnya sudah ada di bagian bawah. Gunakan notifikasi yang sama dengan draf, dengan feedback sukses/gagal sesuai hasil server. Lokasi `submission-assessment.tsx`, `teacher-action-notice.tsx`. | FIXED |
| BUG-08 · G32–I32 | Sedang | Laporan → pilih satu siswa → Tampilkan → Semua siswa → Tampilkan. Dua peserta pada event yang sama kembali terlihat di baseline. Gambar H32 memperlihatkan filter tambahan Selesai + Belum dinilai + M1. | Selector dan API mengambil enrollment event terpilih. Semua siswa mempertahankan filter lain; nol hasil sah bila kombinasi tidak cocok. Bug cakupan penyelesaian pada milestone ditangani melalui BUG-03. UI menerangkan kaitan filter dan menawarkan Hapus filter lain sambil mempertahankan event. Lokasi `report-selectors.ts`, `progress-reports.tsx`. | NOT REPRODUCED untuk klaim filter Semua siswa |
| BUG-09 · G5–I5 | Rendah | Login → periksa kolom email dan kata sandi. Tombol bisa mengganti tipe input, tetapi baseline menggambar tiga bentuk CSS kosong. | SharedAuthInput tidak memasang ikon semantis. Tempatkan ikon email, gembok dan aset mata yang sudah ada, dengan fokus keyboard, label aksesibel, dan penanda saat sandi terlihat. Lokasi `src/components/auth/shared-ui.tsx`. | FIXED |
| BUG-10 · G34–I34 | Rendah | Laporan → Unduh Excel. Penguji mencatat CSV. Pada baseline dan pengujian ulang, tombol mengunduh `.xlsx` dari serializer workbook. | Dokumentasi Guru dan REST menyepakati XLSX. Verifikasi ekstensi dan isi OOXML, bukan nama file saja. Format dipertahankan. Lokasi `progress-reports.tsx`, `client-export.ts`. | NOT REPRODUCED |

## Temuan tambahan saat regresi Auth

**REG-01 · Tinggi · FIXED.** Pada database QA yang default-nya
`Asia/Bangkok`, uji sesi kedaluwarsa mendapatkan HTTP 200 ketika seharusnya
401. Pemeriksaan data membuktikan PostgreSQL menyimpan expiry
`12:29:04.345Z`, sedangkan adapter Prisma membaca `19:29:04.345Z`.
Offset zona dari keluaran PostgreSQL tidak dipertahankan oleh adapter.
Pengaturan UTC diterapkan hanya saat membuka koneksi aplikasi. Instant yang
dibaca sekarang sama dengan yang tersimpan. Jam dan zona bawaan database
tetap WIB. Tidak ada migrasi atau perpanjangan masa sesi. Lokasi
`src/server/db/client.ts` dan `tests/database.integration.test.ts`.
Dokumentasi terkait tersedia pada [TimeZone PostgreSQL](https://www.postgresql.org/docs/current/runtime-config-client.html#GUC-TIMEZONE).

## Inventaris 30 skenario workbook

Status berikut menyalin hasil penguji manusia. Status pengujian otomatis
terbaru tercatat di [laporan pengujian ulang](UAT-GURU-RETEST-REPORT.md).

| Baris | Skenario | Status penguji | Keterangan inti |
| --- | --- | --- | --- |
| 5 | Login umum | Partial | Ikon input/mata tidak tampil sebagai ikon. BUG-09. |
| 6 | Ringkasan dashboard | Works | Kartu jumlah project dan status periode tampil. |
| 7 | Filter status dashboard | Works | Semua opsi status dapat dipilih. |
| 8 | Pengelolaan Data Siswa | Works | Event muncul, detail dapat dibuka. |
| 9 | Catatan Guru dan review | Works | Catatan tersimpan, penandaan berhasil. |
| 10 | Menu Create Event | Works | Halaman muncul. |
| 11 | Lihat Detail event | Works | Tombol detail berfungsi. |
| 12 | Filter event/draf/status | Works | Filter berfungsi. |
| 13 | Tombol Create Event | Works | Wizard terbuka. |
| 14 | Validasi Informasi Event | Works | Kelengkapan harus dipenuhi sebelum lanjut. |
| 15 | Mode Penyelesaian | Error | Field masih terlihat. BUG-04. |
| 16 | Validasi tahap Milestone | Works | Kolom wajib mencegah lanjut. |
| 17 | Tiga tahap milestone | Works | Tombol dan pengisian sampai langkah tiga berfungsi. |
| 18 | Pemilihan Rubrik | Works | Rubrik yang tersedia bisa dipilih. |
| 19 | Keterangan sertifikat panjang | Partial | Batas tampilan tidak jelas. BUG-05. |
| 20 | Tinjau dan ubah | Works | Pratinjau sesuai input dan tombol Ubah berfungsi. |
| 21 | Feedback Simpan Draf | Partial | Notifikasi di bawah tidak terlihat. BUG-06. |
| 22 | Buka ulang draf | Works | Draf tersimpan dan bisa dibuka. |
| 23 | Terbitkan event | Works | Event berhasil terbit. |
| 24 | Edit rubrik | Works | Perubahan kriteria/parameter bisa disimpan. |
| 25 | Cari siswa di Monitoring | Works | Nama yang dicari muncul. |
| 26 | Filter revisi di Monitoring | Works | Filter dapat dipakai. |
| 27 | Nilai rendah dan minta revisi | Error | Label Belum dinilai membingungkan saat Revisi diminta. BUG-01. |
| 28 | Nilai sesuai/di atas ambang | Partial | Penyimpanan benar, notifikasi tidak terlihat. BUG-07. |
| 29 | Arsip Karya Siswa | Works | Search dan filter dapat dipakai. |
| 30 | Detail Karya Siswa | Partial | Versi pertama tercantum sebagai revisi. BUG-02. |
| 31 | Rekap progres dan nilai | Partial | Label Selesai saat hanya sebagian dinilai. BUG-03. |
| 32 | Filter laporan | Partial | Ekspektasi Semua siswa pada kombinasi filter belum jelas. BUG-08. |
| 33 | Ekspor PDF | Works | Berkas terunduh. |
| 34 | Ekspor Excel | Works | Keterangan menyebut CSV, aplikasi saat ini menghasilkan XLSX. BUG-10. |
