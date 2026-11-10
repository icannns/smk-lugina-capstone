# Handover Integrasi Frontend dan Tim COMMIT

Frontend Guru/Siswa sudah digabung ke `main` melalui [PR #1](https://github.com/icannns/smk-lugina-capstone/pull/1). Statusnya prototipe lokal dengan mock data, bukan layanan produksi. Gunakan [README utama](../README.md) untuk gambaran produk/akun demo dan [panduan frontend](FRONTEND.md) untuk struktur pengembangan.

## Memulai integrasi

Aplikasi Next.js berada langsung di root repository. Gunakan Node.js 20.9 atau lebih baru; jalankan dari root:

```powershell
npm ci
npm run dev
```

Buka alamat/port pada terminal. Backend, database, OAuth, dan kredensial `.env` tidak diperlukan untuk skenario demo yang ada. Hentikan server produksi sebelum build ulang, lalu jalankan kembali `npm run start` agar aset sesuai build terbaru.

## Route dan titik koordinasi

| Area | Titik masuk |
| --- | --- |
| Autentikasi | `/login`, `/register`, `/register/google`, `/loading`; `src/lib/auth/` dan `src/components/auth/role-gate.tsx` |
| Guru | `/guru/dashboard`, `/guru/students`, `/guru/events`, `/guru/events/create`, `/guru/rubrics`, `/guru/monitoring`, `/guru/work`, `/guru/reports`, `/guru/profile` |
| Siswa | `/siswa/events`, `/siswa/dashboard`, `/siswa/workspace`, `/siswa/survey`, `/siswa/portfolio`, `/siswa/profile` |
| Domain bersama | `src/lib/guru/event-draft-store.ts`, `event-types.ts`, `teacher-types.ts`, `learning-selectors.ts`, `report-selectors.ts`, `student-integration.ts` |
| Adapter Siswa | `src/lib/siswa/student-types.ts`, `student-actions.ts`, `selectors.ts`, `serialization.ts`, `survey-questions.ts` |
| Tampilan | `src/components/guru/`, `src/components/siswa/`, token `src/app/globals.css`, aset lokal `public/`, serta pemetaan di `src/lib/` |

Monitoring menggunakan `?event=ID&student=ID&milestone=ID`; contoh Nabila M4 adalah `/guru/monitoring?event=kantin&student=nabila&milestone=M4`. UI harus tetap menyatakan data belum tersedia ketika submission belum ada. Perubahan pada layout, auth, store, tipe bersama, dan global CSS perlu dikoordinasikan antartim.

## Kontrak data yang harus dipertahankan

| Entitas/konteks | Aturan integrasi saat ini |
| --- | --- |
| Identitas | ID akun/pembelajar stabil; role bertipe `teacher | student`, tidak ditentukan dari nama atau email profil |
| Event dan milestone | `ManagedEvent`/`EventMilestone` digunakan lintas modul; label M1/M2 dipisahkan dari UUID internal |
| Enrollment | Hubungan event ID + student ID; keanggotaan kelas bukan pengganti peserta event |
| Submission | Konteks event, Siswa, milestone; versi baru mempertahankan bukti dan nilai historis |
| Assessment | Kunci versi `${submissionId}:v${version}`; hanya penilaian versi terkini yang dihitung sebagai nilai aktif |
| Survei | Waktu respons berbeda dari waktu tugas; instrument/response/review harus memiliki kepemilikan dan kontrak yang disepakati |
| Sertifikat contoh | Eligibility terpisah dari task/progres; nama dan nilai dibekukan pada saat klaim |

Key sessionStorage domain adalah `lugina.teacher.event-drafts.v1`. Store tersebut memuat `working`, `saved`, `deleted`, `rubrics`, `published`, `learning`, `profile`, `studentUI`, dan catatan/penanda review Guru pada `studentReviews`. Parser mempertahankan kompatibilitas state versi 1 dan memakai default untuk bagian lama yang belum tersedia. Storage rusak/tidak tersedia memakai fallback memori dengan peringatan; keberhasilan persisten tidak boleh diklaim ketika penyimpanan gagal.

Auth memakai `lugina.auth.demo.v1` dengan tanggung jawab berbeda dari domain. Kata sandi registrasi demo berbentuk digest bersalt, tetapi seluruh mekanisme browser tetap dapat dimodifikasi pengguna. Produksi memerlukan backend autentikasi/otorisasi, bukan penggunaan sessionStorage sebagai lapisan keamanan.

Task terkirim, task+survei selesai, assessment aktif, dan eligibility dokumen adalah konsep terpisah. Jangan mengubah salah satunya untuk memalsukan penyelesaian konsep lain. Catatan peninjauan survei juga bukan assessment rubric. Aturan review produksi per respons masih perlu ditetapkan tim pemilik.

## Migrasi tim COMMIT dari Streamlit ke Next.js

1. Tambahkan route App Router dalam namespace yang disepakati pada aplikasi yang sama. Gunakan kembali identitas, shell, komponen, dan token yang sesuai; hindari router/aplikasi Next.js paralel serta reset global CSS.
2. Ubah mekanisme rerun Streamlit menjadi event handler dan state React. State UI sementara berada dekat komponennya; record lintas halaman melewati adapter bertipe bersama. Jangan memindahkan `st.session_state` menjadi store event kedua.
3. Browser API dan interaksi ditempatkan pada Client Components; pertahankan batas server/client App Router. Layout role harus tetap merender page; page terlindungi membungkus fitur dengan guard yang sesuai.
4. Sepakati pemilik record dan versi kontrak user, event, enrollment, milestone, rubric, submission/version, assessment, serta instrument/response Survei sebelum menghubungkan data. Pertahankan konversi waktu WIB yang eksplisit.
5. Jika COMMIT memakai role Guru, gunakan role yang ada. Role baru memerlukan perubahan eksplisit pada tipe akun, pemetaan tujuan, dan guard; label profil bukan sumber izin.
6. Ganti adapter persistence/auth ketika layanan tersedia. Siapkan server authorization, upload permanen, sinkronisasi/concurrency, dan kebijakan dokumen yang disetujui. Endpoint API produksi belum ditetapkan oleh prototipe ini.
7. Jalankan lint, build, TypeScript, tes regresi, dan alur lintas role setelah integrasi. Ketika backend tersedia, tambah pengujian pengguna nyata yang memakai sesi/perangkat terpisah.

## Batas dengan tim Survei dan layanan eksternal

Event baru belum memprovisikan instrument Survei. Task dapat dikirim dan dinilai, tetapi tahap yang menunggu survei belum selesai. Pemilik modul perlu menyediakan konfigurasi/aktivasi instrument per event/milestone, ID respons, versi, timestamp, status kelengkapan, dan status review. Jangan menganggap jawaban fixture sebagai kebijakan penilaian baru atau membuat hasil diagnosis.

Menu administrasi Survei/privasi Guru dan Pengaturan Siswa tampil normal dan dapat ditekan, tetapi sementara tidak menjalankan aksi, membuka modal, atau mengubah URL dan menu aktif. Form survei milestone yang sudah dikonfigurasi tetap aktif. Gunakan event demo yang sesuai untuk mencoba unlock serta klaim dokumen sampai akhir; alur membuat event baru tidak berpura-pura menyediakan layanan Survei.

Data mock hanya lokal pada tab dan alamat/port. Tab baru dapat membawa salinan awal tetapi tidak menerima pembaruan berikutnya; tidak ada sinkronisasi otomatis antartab/perangkat. Lampiran berupa metadata, preview/unduhan sampel diberi label simulasi. Laporan PDF/XLSX dibuat di browser; dokumen sertifikat contoh tidak memiliki penerbitan, tanda tangan, pengakuan profesi, atau verifikasi resmi institusi.

## Alur uji integrasi

Gunakan [langkah Guru–Siswa](../README.md#cara-mencoba-integrasi-guru-dan-siswa) dalam satu tab: Guru terbitkan event → Dimas daftar/kirim tugas → Guru nilai/feedback → Dimas baca feedback/kirim revisi → Guru nilai versi baru dan periksa laporan. Sebuah event baru dapat memiliki nilai lengkap tetapi penyelesaian masih tertunda karena surveinya belum dikonfigurasi. Gunakan fixture dengan survei aktif untuk uji tahap lanjut.

## Catatan verifikasi dan isu terbuka

Catatan berikut adalah hasil verifikasi implementasi pada 9 November 2026, bukan klaim tes baru pada setiap pembacaan dokumen:

- Temuan fungsional B01–B10 dan komposisi visual V01–V03 telah diperbaiki dan diuji ulang. Filter/status laporan, progres event, nilai versi terbaru, catatan/review, metadata survei, pagination PDF, panjang nama profil, label milestone, dan asosiasi error form menggunakan perilaku yang diperbaiki.
- Pengujian terdahulu meliputi 9 tes logika, 8 kelompok regresi browser, auth kedua role, alur Guru/Siswa, 153 kombinasi layar/resolusi, PDF 40 peserta dua halaman dan XLSX 43 baris. Jalankan ulang [tes repository](../tests/README.md) ketika implementasi berubah; bukti lokal lama bukan pengganti.
- Fix `6712c64` memindahkan `RoleGate` dari layout ke 15 page. Diagnostic Aisyah M1 direproduksi sebelum fix; setelahnya 51 pemeriksaan navigasi lolos masing-masing pada development dan produksi, termasuk Nabila M4, tanpa diagnostic Instant Navigation atau error runtime. Validasi framework tidak dimatikan. Peringatan development tentang ukuran ikon privasi masih terpisah dari fix tersebut.
- B11 masih berupa advisory development pada rantai `eslint-config-next → typescript-eslint → @typescript-eslint/typescript-estree → minimatch`. Audit saat verifikasi mencatat 8 paket moderate dalam satu rantai dan nol temuan production-only. Itu bukan delapan eksploit terpisah atau jaminan keamanan. Ulangi audit pada lingkungan terbaru; jangan memakai force-fix/override major tanpa kajian.
- V04 memuat selisih kecil jarak, wrapping, kontrol tanggal/select native, dan detail visual. Audit screen reader penuh, browser/perangkat lain, kesetaraan piksel, serta performa navigasi menyeluruh belum disertifikasi.
- Backend, OAuth, upload permanen, administrasi Survei, concurrency, dan pengesahan dokumen masih menjadi pekerjaan integrasi berikutnya.

## Peta dokumentasi dan riwayat

| Dokumen | Fungsi |
| --- | --- |
| [README utama](../README.md) | Gambaran, setup awal, akun demo, dan alur demonstrasi |
| [Panduan frontend](FRONTEND.md) | Struktur pengembangan dan perintah kerja |
| [Modul Guru](TEACHER-MODULE.md) | Referensi desain/route dan alur fitur Guru, termasuk event/wizard |
| [Modul Siswa](STUDENT-MODULE.md) | Enrollment, submission/revisi, survei, portofolio, dan profil |
| [Autentikasi](SHARED-AUTHENTICATION.md) | Sesi, role, guard, dan batas keamanan |
| [Pengujian](../tests/README.md) | Runner yang dapat dijalankan ulang |
| [Instruksi agent](../AGENTS.md) | Aturan Next.js yang aktif |

Informasi fase awal yang masih berlaku telah dikonsolidasikan ke panduan modul. Riwayat lengkap tetap tersedia pada commit lama; klaim fase yang sudah bertentangan dengan source tidak menjadi petunjuk integrasi saat ini.

`FINAL-AUDIT-ROUND-1.md`, `FINAL-AUDIT-ROUND-2.md`, dan `FINAL-VERIFICATION.md` adalah laporan historis lokal yang sengaja tidak di-commit. Jangan menambahkannya, file megaprompt operasional, environment privat, log, screenshot, unduhan QA, `node_modules`, atau `.next` ke snapshot aplikasi.
