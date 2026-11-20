# Daftar Temuan Final Bojong United

Snapshot integrasi memuat basis main `a7800667` dan Docker `b26fe28`. Tidak ditemukan P0/P1 pada pengujian akhir. Ketiga temuan P3 dari audit sebelumnya ditutup.

| ID | Status | Hasil aktual |
| --- | --- | --- |
| FS-01 · G05 baris 33 | FIXED | “Milestone berikutnya” menjaga event dan siswa, mengikuti urutan posisi dan berhenti di akhir. “Siswa berikutnya” tetap berpindah peserta pada tahap yang sama. Data tujuan, Back/Forward dan refresh diuji. |
| FS-02 · copy Login | FIXED | Notice menyebut persistensi database dan data contoh eksternal dengan akurat. Role routing dan layout login lulus regresi. |
| FS-03 · sapaan waktu | FIXED | Sapaan Guru dan Siswa mengikuti empat rentang WIB. Pergantian otomatis dan hydration diuji di browser. |

## UAT Guru dan Siswa yang diuji ulang

| Temuan | Hasil aktual | Bukti |
| --- | --- | --- |
| BUG-01 · status Revisi diminta | PASS. Badge revisi di detail/roster dan riwayat versi tetap benar setelah reload. | `retest/teacher-uat.log`, `excel-teacher.log` |
| BUG-02 · pengumpulan awal dalam riwayat | PASS. Versi pertama digolongkan sebagai pengumpulan awal. Revisi dan lampiran historis dipertahankan. | `retest/teacher-uat.log`, `file-attachments-regressions.log` |
| BUG-03 · progres event terlalu dini | PASS. 1/3 dan 2/3 dalam pengerjaan, 3/3 belum dinilai penuh menunggu, selesai setelah seluruh nilai aktif. Filter detail tidak mengubah denominator event. | `retest/teacher-uat.log`, `student-uat.log` |
| BUG-04 · Mode Penyelesaian | PASS. Kontrol absen pada Informasi. Mode default berurutan, draf dan edit deadline lama tetap berjalan. | `retest/teacher-uat.log`, `rest-browser.log`, `rest-api.log` |
| BUG-05 · keterangan sertifikat | PASS. Batas 5.000 karakter dan penghitung terlihat, server menolak 5.001. | `retest/teacher-uat.log` |
| BUG-06 · notifikasi simpan draf | PASS. Toast terlihat; kegagalan server menampilkan peringatan tanpa klaim sukses. Draf bisa dibuka ulang. | `retest/teacher-uat.log`, `cross-retest/new-student-e2e.log` |
| BUG-07 · notifikasi penilaian | PASS. Toast nilai sukses terlihat dan kegagalan menampilkan pesan. | `retest/teacher-uat.log` |
| BUG-08 · filter Semua siswa | PASS. Filter kembali ke Semua siswa dan kombinasi filter lain menyaring konsisten. Klaim lama mengenai Semua siswa tidak terulang. | `retest/teacher-uat.log` |
| BUG-09 · ikon login | PASS. Ikon email, gembok dan mata tampil. Toggle diuji pada browser. | `retest/teacher-uat.log` dan frame Login hasil run |
| BUG-10 · XLSX | PASS. Catatan CSV pada workbook baris 35 tidak terulang. File OOXML yang diunduh valid. | `retest/suites/teacher-uat/report.xlsx` dan tes ZIP/XML |
| REG-01 · kedaluwarsa sesi dan WIB | PASS. Sesi expired ditolak server dan instant timestamp WIB dipertahankan via Prisma UTC. | `auth-browser.log`, `db-integrity.log` |
| UAT Siswa P1 · selesai terlalu dini | PASS. Event 3/3 menunggu nilai terkini; permintaan revisi dan versi belum dinilai ulang menggugurkan nilai aktif; nilai ulang memulihkan status sesuai syarat. | `student-uat.log` |
| UAT Siswa P2 · event berakhir | PASS. Label Berakhir untuk peserta/bukan peserta, enrollment baru ditolak dan filter aktif/selesai konsisten. | `student-uat.log` |

[Laporan perbaikan final](FINAL-AUDIT-FIX-REPORT.md)
