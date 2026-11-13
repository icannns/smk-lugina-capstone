# Panduan Modul Siswa

> **Pembaruan Backend Phase 3:** alur event/enrollment/tugas/penilaian/profil dan
> laporan sudah memakai REST API + PostgreSQL. Keterangan mock/sessionStorage
> di uraian fase terdahulu di bawah merupakan catatan historis, bukan mode fallback
> aplikasi saat ini. Sesi berbeda memakai database yang sama. Lampiran tugas
> memakai [upload privat Phase 4B](FILE-UPLOAD-ATTACHMENTS.md); provider eksternal
> belum terintegrasi. Acuan terbaru:
> [REST API dan persistensi](BACKEND-REST-API.md). Total schema kini 27 model.


Modul Siswa sudah tergabung ke `main` bersama modul Guru sebagai prototipe lokal. Gunakan [panduan frontend](FRONTEND.md) untuk setup dan [autentikasi bersama](SHARED-AUTHENTICATION.md) untuk login/role. Data lintas peran menggunakan store yang sama; pergantian akun dalam satu tab dijelaskan pada [README utama](../README.md#cara-mencoba-integrasi-guru-dan-siswa).

## Referensi desain dan route

Sumber Figma adalah `hWTpQwbyreDsivI3tZ0yLa` → **Guru & Siswa** (`348:10566`) → **Redesign Siswa**. Varian portofolio yang tidak bernomor dan S22 tetap termasuk cakupan.

| Fitur | Frame | Route |
| --- | --- | --- |
| Autentikasi S01–S04 | `370:1538`, `370:1651`, `370:1724`, `370:1777` | `/login`, `/register`, `/register/google`, `/loading` |
| Jelajah/enrollment S05–S08 | `370:1786`, `370:2001`, `370:2171`, `370:2352` | `/siswa/events?event=ID` |
| Dashboard S09 | `370:2522` | `/siswa/dashboard` |
| Workspace, revisi, dan survei tertunda S10–S12 | `370:2708`, `370:2885`, `370:3058` | `/siswa/workspace?event=ID&milestone=ID` |
| Survei S13–S16 | `370:3247`, `370:3382`, `370:3537`, `370:3705` | `/siswa/survey?event=ID&milestone=ID&mode=MODE` |
| Daftar portofolio | `370:3829` | `/siswa/portfolio` |
| Bukti tugas dan feedback | `370:4068`, `370:4426`, `370:5414` | `/siswa/portfolio?event=ID` |
| Detail proyek, klaim, dan penilaian parsial | `370:4833`, `370:5120`, `370:5687` | `/siswa/portfolio?event=ID&view=project` |
| Preview sertifikat contoh | `370:5945` | Dialog pada detail proyek |
| Profil S21–S22 | `370:6265`, `370:6393` | `/siswa/profile` |

Nilai `mode` survei adalah `instructions`, `form`, `result`, atau `history`. Sidebar desktop 256 px, header 64 px, Inter, token Lugina, dan aset di `public/siswa/design/` digunakan kembali. Pemetaan SVG/navigation ada di `src/lib/siswa/`. Tampilan mobile mengadaptasi referensi desktop.

## Jelajah event dan dashboard

Jelajah mendukung pencarian, filter status, tab seluruh/belum diikuti, pagination, detail, konfirmasi/cancel enrollment, dan tautan workspace. Enrollment berulang tidak membuat peserta ganda. Event yang diterbitkan Guru pada sesi yang sama dapat ditemukan dan diikuti Siswa.

Dashboard menampilkan statistik berdasarkan enrollment, tab event, milestone saat ini, dan tindakan revisi/survei/dokumen yang relevan. Empat event fixture unik dipertahankan; kartu Figma yang berulang tidak diduplikasi sebagai data. Dimas sudah memiliki enrollment contoh; akun Siswa baru dapat digunakan untuk memperagakan pendaftaran dari kondisi kosong.

Penutupan enrollment event berstatus berakhir adalah interpretasi frontend. Status dan tanggal fixture tetap berupa snapshot; tidak dihitung ulang menjadi kondisi sekolah berdasarkan tanggal hari ini.

## Workspace, submission, dan revisi

Workspace menampilkan milestone terurut, instruksi, deadline, format, bukti versi terkini/terdahulu, nilai historis, dan feedback Guru. File dapat dipilih atau diseret; jawaban teks/tautan dan penghapusan lampiran mengikuti kontrol yang tersedia. Maksimal lima file dengan batas `10 * 1024 * 1024` byte per file (UI menyebut 10 MB), dengan validasi format yang didukung milestone.

Simpan Draf mempertahankan isian saat refresh pada sesi yang sama. Kirim tugas membuat versi submission; revisi menambah versi baru. Guru dapat membaca dan menilai versi terbaru, sementara evidence, feedback, dan nilai lama tetap berada pada riwayat. Nilai lama tidak otomatis menjadi penilaian versi baru.

Lampiran tugas menyimpan berkas asli privat; pratinjau PDF/gambar dan unduh memakai endpoint Auth.js/RBAC. DOCX hanya diunduh. Lampiran historis yang hanya metadata ditandai tidak tersedia tanpa file pengganti. Route event/milestone yang tidak ditemukan atau belum diikuti menyediakan tautan pemulihan.

## Survei milestone dan progres

Alur survei yang sudah dikonfigurasi mencakup petunjuk → form → konfirmasi → hasil/riwayat. Terdapat dua pertanyaan wajib berskala 1–5 dan satu refleksi opsional, counter isian, simpan draf, serta jawaban terkunci setelah dikirim. Respons baru memiliki ID, waktu respons, dan metadata yang dibaca juga oleh Guru. Jawaban historis yang tidak diketahui tidak dibuat-buat; tidak dihitung skor diagnostik Technostress baru.

Pada Mode Penyelesaian, task **dan survei tahap sebelumnya** harus selesai untuk membuka milestone berikutnya; nilai Guru bukan prasyarat unlock. Submission tahap berikutnya yang sudah ada tidak dikunci ulang hanya karena revisi diminta pada tahap sebelumnya. Kondisi revisi dan survei tertunda dapat muncul bersamaan, sesuai S11/S12.

Event baru dari wizard Guru belum mempunyai instrumen survei sampai modul pemilik menyiapkannya. UI dapat menampilkan “Form belum disiapkan Guru.” Task, assessment, dan feedback masih dapat dicoba; alur selanjutnya yang memerlukan survei belum dapat dituntaskan pada event baru itu. Administrasi Survei bukan bagian implementasi ini.

## Portofolio dan dokumen contoh

Portofolio mendukung pencarian, filter periode/status, detail evidence, feedback, dan riwayat per milestone. Detail proyek menampilkan konteks event, progres, penilaian, dan syarat dokumen. Nilai final mengikuti assessment versi terbaru.

Syarat contoh: semua task/form dan assessment yang diperlukan selesai, nilai memenuhi ambang event, dan tidak ada revisi terbuka. Fixture Workshop memakai ambang 70, Kantin/Poster 75; konfigurasi event dan helper `certificateThreshold` menjadi acuan bersama. Deadline berakhir atau pengiriman lebih awal tidak melewati persyaratan tersebut.

Klaim bersifat idempotent dan menyimpan nama serta nilai saat klaim. Edit profil tidak menulis ulang dokumen yang sudah diklaim. PDF contoh benar-benar dihasilkan, tetapi tidak memiliki penerbitan institusional, tanda tangan resmi, serial resmi, atau layanan verifikasi. Membuka preview sebelum konfirmasi adalah interpretasi UI karena frame preview tidak memiliki koneksi masuk yang terkonfirmasi.

## Profil dan navigasi

Profil mendukung validasi nama/kontak, simpan/batal, feedback, serta pembaruan identitas header/roster. Nama yang valid sampai `STUDENT_NAME_MAX_LENGTH` (120 karakter) dipertahankan saat rehidrasi. Role dan sekolah tidak dapat diubah; email profil tidak mengganti identitas login atau memberikan akses Guru.

Avatar menggunakan JPG/PNG lokal, maksimal 2 MB dan minimal 200×200 piksel, dengan canvas crop yang digunakan kembali dari komponen Guru. Gunakan gambar dan identitas fiktif. Pengaturan tampil normal dan dapat ditekan, tetapi sementara tidak menjalankan aksi, membuka modal, atau mengubah URL dan menu aktif; bantuan mempertahankan keterangan informatifnya. Form survei milestone tetap aktif.

## Peta source dan integrasi

- `src/app/siswa/`: page `dashboard`, `events`, `workspace`, `survey`, `portfolio`, `profile`, serta layout. Setiap page memakai `RoleGate` role Siswa.
- `src/components/siswa/`: shell, komponen umum, dashboard, `events/`, `workspace/`, `survey/`, `portfolio/`, `profile/`, dan `use-student-identity.ts`.
- `src/lib/siswa/`: `student-types.ts`, `student-actions.ts`, `selectors.ts`, `serialization.ts`, `survey-questions.ts`, serta pemetaan aset/navigation.
- `src/lib/guru/event-draft-store.ts`: adapter domain tunggal; `studentUI` memuat profil, draf, respons, dan klaim. Perubahan learning terhubung melalui enrollment dan ID submission/version yang stabil.

Enrollment/pengumpulan muncul pada Data Siswa, Monitoring, Karya, Laporan, dan Dashboard Guru. Assessment/feedback/revisi Guru kembali terlihat di Siswa. Kontrak storage dan penggantian adapter backend dijelaskan pada [handover](INTEGRATION-HANDOVER.md); jangan membuat salinan event/assessment yang bersaing.

## Interpretasi desain dan pengujian

S04 menggunakan redirect dashboard otomatis berdasarkan kebutuhan autentikasi bersama, meskipun hotspot desain menuju Jelajah. Refleksi survei tetap opsional meski salah satu header contoh menyebut semua wajib. Query URL, pencarian, penanganan error, dialog Escape/fokus, dan susunan mobile merupakan adaptasi frontend. Kebijakan pencabutan sertifikat, kapasitas enrollment, provisioning role, dan penyimpanan upload permanen belum ditetapkan.

Pengujian terdahulu mencakup draft/refresh, enrollment, validasi berkas/avatar, survei, revisi/assessment ulang, portofolio/dokumen, serta layout 320/390/768/1440 px. Ini bukan klaim pixel-perfect atau pengganti tes baru. Jalankan [runner regresi](../tests/README.md) dan alur demo di README utama saat mengubah integrasi.
