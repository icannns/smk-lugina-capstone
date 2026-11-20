# Matriks Final UAT Bojong United

Snapshot integrasi `release/bojong-united-final` memadukan basis `a78006673c0cf0be29b0cc139cd61a0791a20905`, Docker `b26fe28aea53d5789ae8df766f7a9c3b585df872`, dan patch UI yang diterbitkan bersama dokumen ini. Kolom UAT menyalin status manusia di `Usability Test`. Kolom Uji ulang merangkum bukti pengujian aktual pada snapshot audit.

## Rekonsiliasi

| Cakupan | Skenario | Works | Error | Partial | PASS | FAIL | BLOCKED | NOT TESTED | OUT OF SCOPE |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Guru | 30 | 21 | 2 | 7 | 30 | 0 | 0 | 0 | 0 |
| Umum | 1 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 |
| Siswa | 15 | 15 | 0 | 0 | 15 | 0 | 0 | 0 | 0 |
| **Total** | **46** | **36** | **2** | **8** | **46** | **0** | **0** | **0** | **0** |

Sheet `Ringkasan` mencatat 29. Formula pada `B5:E7` mulai dari baris 6 dan belum mencakup kategori Siswa, sehingga melewatkan Login Umum pada baris 5 dan skenario Siswa. Skenario Guru di baris 28 juga luput dari formula karena kolom Modul kosong. Skenario lanjutan dengan metadata kosong tetap dihitung. Baris 51–54 hanya memuat label *Belum Diuji* dan tidak masuk hitungan. Kedua sheet, keterangan pada kolom I dan 49 penempatan screenshot terlampir dibaca. Sidik jari SHA-256 workbook `ee5c45b29a16d12b8cf235434a1b4bf96e43452f1cb41edfc815a644cb5a245d`.

Brief memperkirakan 30 skenario Guru dan Umum. Setelah baris 28 dan Login Umum dihitung masing-masing sebagai skenario valid, matriks memuat 31 skenario Guru dan Umum.

Bukti aktual berasal dari Edge dan API/SQL QA. Berkas bukti tersimpan di `%TEMP%\bojong-final-release-20261121`. Kode E menunjuk berkas lokal pada daftar di akhir dokumen. Baris 33 lulus pada snapshot integrasi. Kolom UAT tetap merekam penilaian manusia dari versi awal workbook.

## Guru dan fitur umum

| Excel | Modul | Fitur | Langkah pengujian | Hasil yang diharapkan | UAT | Uji ulang | Bukti aktual | Bug atau catatan |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 5 · U01 | Umum | Login | Buka form dan tekan tombol visibilitas kata sandi | Ikon email, gembok dan mata tampil dan input bisa diungkap | Partial | PASS | E1, E8, E12 | BUG-09. Ikon aktual dan toggle berfungsi. |
| 6 · G01 | Guru | Dashboard statistik | Buka dashboard, bandingkan kartu dengan snapshot API | Jumlah project dan status periode sesuai data | Works | PASS | E2 baris 6 | Enam event terbit pada DB awal, dengan indikator berjalan dan berakhir. |
| 7 · G01 | Guru | Dashboard filter | Klik Semua, Berlangsung, Belum dimulai dan Berakhir | Status aktif dan hasil daftar berubah sesuai filter | Works | PASS | E2 baris 7 | Empat kontrol menunjukkan status terpilih dan angka sesuai fixture. |
| 8 · G01 | Guru | Pengelolaan Data Siswa | Pilih event Kantin, cari siswa, buka Lihat Detail | Peserta dan detail sesuai event | Works | PASS | E2 baris 8 | Data peserta ditampilkan di event yang dipilih. |
| 9 · G01 | Guru | Catatan dan review | Simpan catatan, tandai respons survei sudah ditinjau lalu muat ulang | Kedua aksi tersimpan | Works | PASS | E3 B04, E4 survei | Catatan tersimpan setelah refresh dan review terkait respons tersimpan setelah reload. |
| 10 · G01 | Guru | Halaman Create Event | Buka menu Create Event | Daftar event dan antarmuka muncul | Works | PASS | E2 baris 10 | Enam kartu dan heading teramati. |
| 11 · G01 | Guru | Lihat Detail event | Klik Lihat Detail pada salah satu event | Detail menampilkan milestone event yang benar | Works | PASS | E2 baris 11, E1 | Detil event terbit juga mendukung ubah deadline. |
| 12 · G02 | Guru | Filter event dan draf | Berpindah tab Terbit/Draf dan pilih setiap status | Tab dan filter status berfungsi | Works | PASS | E2 baris 12, E7 | Status semua, berlangsung, akan datang dan berakhir diuji. |
| 13 · G02 | Guru | Tombol Create Event | Klik Create Event dari daftar | Wizard tahap Informasi terbuka | Works | PASS | E2 baris 13, E4 | Jalur UI dari Dashboard dan daftar terbit diuji. |
| 14 · G02 | Guru | Validasi Informasi | Kosongkan judul, klik Lanjut | Input wajib ditandai dan langkah tidak berpindah | Works | PASS | E2 baris 14 | `aria-invalid=true` pada judul kosong. |
| 15 · G03 | Guru | Mode Penyelesaian | Buka Informasi pada event baru dan draf lama | Mode tidak tampil sebagai pilihan | Error | PASS | E1, E4, E12 | BUG-04. Pilihan dihapus sesuai keputusan UAT. Mode tetap otomatis. |
| 16 · G03 | Guru | Validasi Milestone | Masuk ke langkah Milestone dengan field wajib belum lengkap, klik Lanjut ke Rubrik | Tetap di Milestone dan menampilkan validasi | Works | PASS | E2 baris 16 | Rubrik belum bisa dibuka sampai syarat lengkap. |
| 17 · G03 | Guru | Tiga milestone | Isi judul, format PDF dan deadline pada tiga editor, lanjut | Ketiga milestone valid dan wizard dapat maju | Works | PASS | E2 baris 17 | Editor 1–3 dibuka dan ketiga konfigurasi diterima. |
| 18 · G03 | Guru | Pemilihan Rubrik | Centang Rubrik UI/UX Dasar, lanjut ke sertifikat | Rubrik terpilih. Penguncian mengikuti mode berurutan | Works | PASS | E2 baris 18, E7 | Langkah F18 menyebut mode, keterangan UAT menyebut pilihan rubrik. Keduanya dicakup oleh uji pilihan rubrik dan penguncian REST. |
| 19 · G03 | Guru | Sertifikat | Isi keterangan sampai 5.000 karakter dan kirim 5.001 ke server | Pembatas/penghitung dan validasi konsisten | Partial | PASS | E1 | BUG-05. Preview tetap tampil, server menolak 5.001. |
| 20 · G03 | Guru | Tinjau dan Ubah | Buka ringkasan dengan data yang telah diisi, klik Ubah Informasi | Ringkasan cocok dan tombol kembali ke editor | Works | PASS | E2 baris 20 | Ringkasan menampilkan judul yang dibuat dan tombol membuka Informasi. |
| 21 · G03 | Guru | Simpan Draf | Simpan, periksa toast, cek data setelah reload | Pemberitahuan terlihat dan draf tersimpan | Partial | PASS | E1, E4 | BUG-06. Respons error menghindari pemberitahuan sukses palsu. |
| 22 · G03 | Guru | Buka ulang draf | Buka tab Draf, klik Lanjutkan Draf, lalu reload | Draf dan field tersimpan terbuka | Works | PASS | E13 | Uji tambahan menjalankan klik dari daftar pada server QA integrasi. |
| 23 · G03 | Guru | Terbitkan event | Review lalu klik Terbitkan Event | Event terbit dan muncul di data resmi aplikasi | Works | PASS | E4, E9, E10 | Uji wizard nyata, event tampil di Jelajah Event akun lain. |
| 24 · G05 | Guru | Edit rubrik | Edit rubrik yang belum terkunci. Tambahkan kriteria dan isi deskripsi skor wajib | Kriteria baru tersimpan setelah reload | Works | PASS | E11 baris 24 | PUT HTTP 200 dan kriteria bertambah dari 2 menjadi 3. |
| 25 · G05 | Guru | Pencarian Monitoring | Cari satu nama siswa di event | Baris siswa sesuai muncul | Works | PASS | E2 baris 25 | Baris siswa lain tersembunyi. |
| 26 · G05 | Guru | Filter revisi | Buat permintaan revisi, buka roster dan klik Revisi diminta | Roster akan menampilkan peserta sesuai status revisi | Works | PASS | E11 baris 26 | Satu baris revisi yang benar terlihat setelah filter. |
| 27 · G05 | Guru | Nilai dan minta revisi | Nilai rendah, kirim permintaan revisi, reload | Tugas tercatat dinilai historis dan status saat ini Revisi diminta | Error | PASS | E1, E9 | BUG-01. Status revisi konsisten di detail dan roster. |
| 28 · G05 | Guru | Nilai di atas ambang | Simpan nilai memenuhi ambang dan amati pemberitahuan | Nilai tersimpan dan pemberitahuan berhasil terlihat | Partial | PASS | E1, E4, E9 | BUG-07. Skenario lanjutan baris 27. |
| 29 · G06 | Guru | Arsip Karya Siswa | Cari event di Karya Siswa, buka Lihat Karya | Karya peserta tersedia pada event terkait | Works | PASS | E2 baris 29 | Daftar peserta berisi siswa yang benar. |
| 30 · G06 | Guru | Detail dan riwayat | Buka detail karya setelah pengumpulan pertama | Versi 1 tercatat sebagai pengumpulan awal | Partial | PASS | E1, E6 | BUG-02. Revisi nyata menghasilkan riwayat terpisah. |
| 31 · G07 | Guru | Laporan progres dan nilai | Buka laporan selama progres parsial dan setelah seluruh penilaian | Status dan nilai final tercermin sesuai kelengkapan | Partial | PASS | E1, E5, E9 | BUG-03. Filter milestone menjaga cakupan status event. |
| 32 · G07 | Guru | Filter Laporan | Uji event, siswa, milestone dan kombinasi, kembali ke Semua siswa | Filter menyaring konsisten dan bisa menampilkan kembali semua siswa yang cocok | Partial | PASS | E1, E3 | BUG-08. Baris ini menyimpan langkah uji di kolom A. |
| 33 · G05 | Guru | Navigasi setelah menilai milestone | Buka detail M1, klik Milestone berikutnya dua kali, ulangi untuk peserta kedua, lalu uji Siswa berikutnya dan Back/Forward | Aksi milestone mempertahankan event dan siswa. Aksi siswa mempertahankan milestone | Partial | **PASS** | E2 baris 33, E1 cek navigasi, E9 | FS-01. Data tugas, nilai dan feedback sesuai tujuan. Milestone terakhir menampilkan penanda akhir. |
| 34 · G07 | Guru | Ekspor PDF | Unduh PDF dari Laporan, buka struktur hasil | PDF valid dapat diunduh | Works | PASS | E1, E3, E14 | Hasil 40 peserta dua halaman, mencakup baris terakhir. |
| 35 · G07 | Guru | Ekspor Excel | Klik ekspor dan verifikasi paket file diunduh | Workbook Excel yang valid | Works | PASS | E1, E3, E14 | BUG-10. Keterangan manusia menyebut CSV, uji aktual menghasilkan OOXML XLSX. |

## Siswa

| Excel | Modul | Fitur | Langkah pengujian | Hasil yang diharapkan | UAT | Uji ulang | Bukti aktual | Bug atau catatan |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 36 · S01 | Siswa | Profil | Ubah profil dan muat ulang | Perubahan tampil dan tersimpan | Works | PASS | E5 `UAT-36` | PostgreSQL mengonfirmasi field hasil edit. |
| 37 · S02 | Siswa | Progres Event Saya | Kerjakan satu milestone, periksa dashboard | Status Dalam pengerjaan dan jumlah kemajuan bertambah | Works | PASS | E5 `UAT-37` | Progres 1/3 terlihat. |
| 38 · S02 | Siswa | Lampiran Workspace | Unggah, pratinjau, unduh dan hapus dari draf | Aksi berfungsi pada berkas asli | Works | PASS | E6, E5 `PRIVATE-FILE-PERSISTENCE-AFTER-RELOGIN` | Byte cocok dengan fixture, file draf dapat dihapus. |
| 39 · S02 | Siswa | Validasi sebelum pengumpulan | Coba kirim tugas kosong dan buka milestone selanjutnya | Pengumpulan kosong dan milestone terkunci ditolak | Works | PASS | E5 `UAT-39` dan `SEQUENTIAL` | Lanjutan baris 38. |
| 40 · S02 | Siswa | Selesainya event | Selesaikan tiga tugas, uji status sebelum dan sesudah dinilai | Event baru Selesai setelah seluruh syarat dan nilai terkini lengkap | Works | PASS | E5 `UAT-40` | P1. 3/3 belum dinilai penuh belum Selesai. |
| 41 · S02 | Siswa | Filter Event Saya | Klik Semua, Aktif dan Selesai | Tampilan mengikuti filter dan event berakhir tidak masuk Aktif | Works | PASS | E5 `UAT-41` | P2. Filter dan lifecycle diuji. |
| 42 · S03 | Siswa | Detail event yang diikuti | Buka detail event yang sudah diikuti | Status terdaftar dan CTA ruang kerja tersedia | Works | PASS | E5 `UAT-42` | Konfirmasi status setelah enroll. |
| 43 · S03 | Siswa | Detail event belum enroll | Buka detail event sebelum enroll | Status belum terdaftar dan opsi Enroll tersedia | Works | PASS | E5 `UAT-43` | Lanjutan baris 42. |
| 44 · S03 | Siswa | Enroll | Klik Enroll Event, konfirmasi dialog | Enrollment tersimpan satu kali dan muncul di peserta Guru | Works | PASS | E5 `UAT-44`, E9 | Akun baru dan enrollment tersimpan di SQL. |
| 45 · S03 | Siswa | Filter Jelajah Event | Pilih opsi status dan bandingkan hasil | Daftar mengikuti filter | Works | PASS | E5 `UAT-45` dan `EVENT-LIFECYCLE` | Event arsip dapat dilihat dan menolak enroll. |
| 46 · S03 | Siswa | Pencarian event | Masukkan kata kunci yang cocok | Event ditemukan | Works | PASS | E5 `UAT-46` | Pencarian katalog nyata, termasuk pagination. |
| 47 · S03 | Siswa | Tombol Event Saya | Klik Event Saya dari Jelajah Event | Dashboard membuka daftar event yang diikuti | Works | PASS | E5 `UAT-47` | Enrollment baru terlihat. |
| 48 · S02 | Siswa | Detail asesmen | Buka detail hasil asesmen dari dashboard | Modal menampilkan hasil akun aktif | Works | PASS | E15, cek modal di E5 | Hasil UI/UX dan histori bersumber dari data scope akun. |
| 49 · S04 | Siswa | Detail karya portofolio | Buka karya setelah pengumpulan dan penilaian | Detail proyek, versi tugas, dan feedback terlihat | Works | PASS | E5 `UAT-49`, E9 | Versi terbaru tetap terlihat setelah relogin. |
| 50 · S04 | Siswa | Nilai tiga milestone | Buka detail setelah ketiga milestone dinilai | Nilai masing-masing milestone terlihat | Works | PASS | E5 `UAT-50` | Uji juga konsistensi skor laporan dan portofolio. |

## Referensi bukti lokal

| Kode | Berkas pada folder bukti |
| --- | --- |
| E1 | `retest/teacher-uat.log` dan `retest/suites/teacher-uat/results.json` |
| E2 | `excel-teacher.log` dan `suites/excel-teacher/excel-extra.json` |
| E3 | `audit-browser.log` dan `suites/audit-browser/results.json` |
| E4 | `rest-browser.log` dan `suites/rest-browser/results.json` |
| E5 | `student-uat.log` dan `suites/student-uat/results.json` |
| E6 | `file-browser.log` dan `file-attachments-regressions.log` |
| E7 | `rest-api.log` dan `suites/rest-api/results.json` |
| E8 | `auth-browser.log` |
| E9 | `cross-retest/new-student-e2e.log` dan `cross-retest/suites/new-student-e2e/cross-account-results.json` |
| E10 | `docker-release-smoke.log` |
| E11 | `excel-teacher.log` baris 24 dan 26, serta cek filter revisi dalam `cross-retest/new-student-e2e.log` |
| E12 | `suites/responsive` dan `final-audit-browser.log` |
| E13 | `cross-retest/new-student-e2e.log`, cek `draft-list-resume` |
| E14 | `retest/suites/teacher-uat/report.pdf`, `retest/suites/teacher-uat/report.xlsx` dan ekspor 40 peserta di `suites/audit-browser` |
| E15 | `assessment-dashboard.log` dan `uiux-api.log` |

[Laporan audit dan putusan merge](FINAL-SYSTEM-AUDIT.md) · [Daftar temuan](FINAL-BUG-REGISTER.md)
