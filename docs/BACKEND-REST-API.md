# REST API dan Persistensi Pembelajaran — Backend Phase 3

## Status dan arsitektur

Backend berada di aplikasi Next.js yang sama: App Router → Route Handler →
`src/server/domain/` → Prisma → PostgreSQL. Auth.js/RBAC Phase 2 tetap digunakan.
Tidak ada Express, backend kedua, OAuth Google, atau deployment produksi.

Baseline fase ini: merge PR #5 (`3a32dc1`), sesudah migrasi root PR #2, dashboard
asesmen PR #3, fondasi database PR #4, dan autentikasi PR #5. Remote
`sistem-analitik` ditinjau sebagai referensi koordinasi saja; kontrak tipe
analitiknya tidak diubah. Endpoint provider FOMO/COMMIT belum dikonfirmasi.

Halaman Guru/Siswa memakai cache API bersama, **bukan sessionStorage sebagai
sumber data bisnis**. Draf wizard yang sedang diketik tetap di memori sampai
Simpan Draf/perpindahan langkah; draf tugas disimpan hanya saat tombol Simpan
Draf ditekan. Perubahan yang sudah disimpan bertahan setelah refresh/logout dan
terlihat pada sesi/browser lain melalui database yang sama. Tab dalam profil
browser yang sama berbagi cookie login; gunakan profil/incognito terpisah untuk
Guru dan Siswa secara bersamaan.

`WorkspaceBoundary` mengambil `/api/workspace` saat login, fokus, dan setiap
5 detik. Setelah mutasi, cache dibaca ulang. Cache dikosongkan saat identitas
berganti; respons terlambat dari akun lama dibuang. Gangguan API menampilkan
error/retry, bukan fixture pengganti. Bila write berhasil tetapi refresh gagal,
UI memberitahu bahwa perubahan sudah di server agar pengguna tidak mengulang
secara membabi buta. Polling bukan WebSocket dan belum dioptimalkan untuk skala besar.

## Identitas, hak akses, dan respons

- `User.id` adalah identitas Auth.js. `TeacherProfile.id`/`StudentProfile.id`
  adalah identitas domain; keduanya tidak boleh dipertukarkan.
- Guru hanya mengelola event, rubrik, peserta, tugas, dan nilai miliknya.
- Siswa dapat menemukan metadata event terbit; enrollment, draf pekerjaan,
  submission, nilai, profil, dan feedback yang diterima hanya miliknya.
- Guru tidak menerima isi draf tugas/survei yang belum dikirim oleh Siswa.
- Kepemilikan diambil dari sesi server. Body `studentId`/role buatan klien tidak
  dapat menentukan pemilik. Pendaftaran publik tetap hanya membuat Siswa.
- Semua respons privat memakai `Cache-Control: no-store`. Mutasi memerlukan
  origin yang sama serta JSON, kecuali aksi klaim tanpa body. Batas body 1 MiB;
  metadata lampiran dibatasi jumlah/ukuran/format. Isi berkas tidak diunggah.
- HTML studi kasus/instruksi disanitasi memakai daftar tag/atribut terbatas;
  teks tugas dan feedback dirender sebagai teks React.

Bentuk error: `{ "error": { "code": "...", "message": "...", "fields": [] } }`.
`fields` hanya disertakan untuk error validasi Zod, berisi path dan pesan.
Tidak ada hash password, URL database, JWT, atau detail exception internal.

| Status | Arti |
| --- | --- |
| 200 / 201 | Berhasil / create atau submission; retry idempoten dapat tetap 201 dengan flag replay/created false |
| 400 | JSON/field/rentang nilai/tanggal tidak valid |
| 401 | Sesi tidak tersedia atau dicabut |
| 403 | Role/kepemilikan ditolak; resource privat yang tidak ditemukan juga memakai 403 |
| 409 | Revisi stale, versi tugas berubah, riwayat dilindungi, enrollment ditutup, atau prasyarat belum terpenuhi |
| 413 / 415 | Body terlalu besar / Content-Type tidak sesuai |
| 501 | Provider/instrumen survei eksternal belum terintegrasi |
| 503 | Layanan gagal; tidak beralih ke data mock |

## Inventaris endpoint

Semua path berikut relatif terhadap `/api`. `e`, `m`, `s`, `r`, dan `n` pada
penjelasan masing-masing berarti ID event, milestone, submission, rubrik, enrollment.
Encode setiap segmen URL menggunakan `encodeURIComponent`.

| Method dan path | Akses | Kontrak utama |
| --- | --- | --- |
| GET `/workspace` | Keduanya | `WorkspaceSnapshot`: accountId, serverTime, saved/published, rubrics, learning, profile, studentUI, studentReviews; `learning.source=api` |
| GET `/events` | Keduanya | Query search, status, sort=title, page, pageSize (maks.100); `{events,total,page,pageSize}`; Guru juga mendapat draf sendiri |
| POST `/events` | Guru | `{event: ManagedEvent}` → `{id,revision,created}`; selalu membuat draf |
| GET `/events/:e` | Keduanya | `{event}` sesuai scope |
| PUT `/events/:e` | Guru pemilik | `{event}` dengan id path sama dan revision terbaru → `{id,revision,published:false}` |
| DELETE `/events/:e?revision=N` | Guru pemilik | Hanya draf tanpa peserta/riwayat → `{deleted:true}` |
| POST `/events/:e/publish` | Guru pemilik | `{event}` lengkap dengan revision → `{id,revision,published:true}` |
| GET `/enrollments` | Siswa | Enrollment sesi aktif: `{enrollments:[{id,eventId,enrolledAt}]}` |
| POST `/events/:e/enrollments` | Siswa | `{}` → `{enrollmentId,created}`; tidak menerima studentId |
| GET `/events/:e/enrollments` | Keduanya | Guru pemilik: peserta event; Siswa: dirinya saja |
| GET `/events/:e/milestones` | Keduanya | `{milestones}` metadata event yang terlihat |
| PUT `/events/:e/milestones` | Guru pemilik | `{milestones:EventMilestone[],expectedRevision}`; seluruh koleksi untuk tambah/edit/urut/hapus |
| PUT `/events/:e/milestones/:m/work-draft` | Siswa peserta | `{work:{text,link,files}}` → `{saved:true}` |
| POST `/events/:e/milestones/:m/submissions` | Siswa peserta | `{work,expectedVersion,requestId}` → `{submissionId,version,replay?}` |
| GET `/events/:e/milestones/:m/submissions` | Keduanya | `{submissions}` yang diizinkan; tidak membocorkan peserta lain |
| GET `/submissions/:s` | Siswa pemilik/Guru event | `{submission,assessments,feedback}`, semua versi yang tersimpan |
| PUT `/submissions/:s/assessment` | Guru event | `{version,scores:{criterionId:number},expectedRevision,requestId}` → `{id,revision,replay?}` |
| POST `/submissions/:s/feedback` | Guru event | `{id,message,revision:boolean,deadline?,version}` → `{id,replay?}` |
| GET / POST `/rubrics` | Guru | `{rubrics}` / body `GuruRubric` → `{id}` |
| GET / PUT `/rubrics/:r` | Guru pemilik | `{rubric}` / body `GuruRubric` dengan id sama; rubrik terpakai tidak diedit |
| GET `/progress` | Keduanya | `{events:[{eventId,...eventLearning}]}` dari tugas/nilai/respons nyata yang diizinkan |
| GET `/reports` | Guru | Query event, student, work, assessment, milestone, survey; `{reports:[{eventId,...reportRows}]}` |
| PUT `/profile` | Akun sendiri | `{name,email,phone,avatar?,role?}` → `{saved:true}`; role tampilan hanya Guru |
| PUT `/enrollments/:n/note` | Guru event | `{note}` → `{saved:true}` |
| POST `/enrollments/:n/review` | Guru event | `{responseIds:string[]}` seluruh respons terbaru peserta → `{reviewed:true}` |
| PUT `/events/:e/milestones/:m/survey-reference` | Guru event | `{surveyReferenceId:string|null,expectedRevision}`; hanya referensi DEMO yang sudah ada |
| PUT / POST `/events/:e/milestones/:m/survey` | Siswa peserta | Draf / kirim `{first,second,reflection}` untuk instrumen DEMO; bukan API provider |
| POST / PUT `/events/:e/certificate-claim` | Siswa peserta | Cek syarat dan klaim / catat unduhan; `{id,prototype:true}` / `{recorded:true,prototype:true}` |
| GET `/assessment-results` | Keduanya | Adapter read-only referensi asesmen eksternal milik akun/event yang diizinkan; tetap terpisah dari nilai milestone |

Endpoint Auth.js, register, `/me`, serta pembacaan privat Phase 2 tetap tersedia;
lihat [autentikasi](AUTHENTICATION-RBAC.md). Tidak ada endpoint delete rubrik
karena UI sebelumnya tidak menyediakan penghapusan rubrik.

## Kontrak domain dan penulisan aman

Kontrak DTO frontend ada di `src/lib/guru/event-types.ts`, `teacher-types.ts`,
`src/lib/siswa/student-types.ts`, dan `src/lib/domain/contracts.ts`. Validasi
runtime server ada di `src/server/domain/common.ts`.

`ManagedEvent`: id, title, status, mode=Penyelesaian, updated, period, milestones;
opsional revision, rubricId, certificateConfig, caseStudyHtml, directionsHtml,
startAt/endAt, attachments, wizard. `updated/period/status` tampilan tidak menjadi
otoritas server; status/pemilik/waktu dihitung dari record database.
`EventMilestone`: id, title, instructions?, deadline?, formats?, surveyActive?, attachments?.
Tanggal input `YYYY-MM-DDTHH:mm` adalah waktu **WIB**, disimpan timestamptz.
Metadata file `{id,name,size,type}` tidak berarti blob tersedia.

- Event memakai optimistic concurrency `revision` + transaksi Serializable dan
  row lock. Revisi stale menghasilkan 409, tidak menimpa sesi lain. ID create
  yang sama oleh pemilik yang sama adalah retry, bukan event kedua.
- Enrollment unik `(eventId,studentId)`. Permintaan berulang mengembalikan record
  sama. Event yang sudah berakhir menolak enrollment baru.
- Milestone memakai key `(eventId,id)`; reorder tidak mengubah id. Penghapusan
  milestone dengan pekerjaan/draf/respons ditolak dan seluruh transaksi rollback.
- Submission unik peserta/event/milestone; versi append-only. requestId unik
  menjamin retry pengiriman tidak membuat dua versi. expectedVersion harus cocok.
  Versi berikutnya memerlukan permintaan revisi pada versi terakhir.
- Nilai terkait **SubmissionVersion** serta snapshot rubrik event. Semua kriteria
  wajib berupa integer dalam rentang snapshot; hasil = jumlah skor / jumlah skor
  maksimum × 100. Bukan skor UI/UX eksternal atau skor klinis Technostress.
- Nilai versi lama tetap ada. Permintaan revisi mengosongkan nilai yang dianggap
  berlaku sampai versi baru dinilai. Penilaian memakai revision CAS; payload nilai
  identik dapat diulang tanpa membuat penilaian kedua.
- Rubrik belum terpakai dapat diedit. Rubrik yang sudah terhubung ke event adalah
  snapshot tetap; buat rubrik baru untuk perubahan. Seluruh kriteria rubrik event
  diterapkan pada setiap milestone, mengikuti konfigurasi UI yang ada; pembagian
  kriteria khusus per milestone belum tersedia di UI.
- Urutan milestone mengikuti perilaku UI sebelumnya: kirim tugas sebelumnya dan
  isi survei **hanya bila referensinya diaktifkan**. Tidak menambah aturan klinis,
  bobot nilai, persetujuan institusi, atau kebijakan keterlambatan baru. Sertifikat
  contoh tetap memerlukan seluruh penilaian terkini dan tanpa revisi terbuka.
- Respons survei DEMO dikunci setelah dikirim; pengiriman jawaban identik adalah
  retry, jawaban berbeda ditolak. Review Guru terkait ID respons terbaru, bukan
  sekadar waktu tugas atau flag global. Provider eksternal belum dihubungkan.
  Laporan menampilkan Tidak diwajibkan untuk milestone tanpa referensi aktif;
  filter Terisi/Belum diisi hanya menggolongkan survei yang diwajibkan.
- Profil mengubah nama/kontak/avatar, **bukan email login, password, atau RBAC**.
  Pengubahan nama tidak mengubah nama yang sudah dibekukan pada klaim sertifikat.

## Schema dan migrasi

Migrasi tambahan tunggal:
`prisma/migrations/20261112000400_learning_persistence/migration.sql`.
Tiga migrasi sebelumnya tetap utuh. Total 27 model (24 sebelumnya + 3):

| Tambahan | Alasan dan relasi |
| --- | --- |
| `SubmissionDraft` | Draf pekerjaan dan jawaban DEMO privat; FK enrollment serta milestone pada event yang sama |
| `MilestoneCriterion` | Hubungan milestone/kriteria dengan versi rubrik event yang sama; data lama di-backfill |
| `PrototypeCertificateClaim` | Snapshot nama/nilai saat klaim dokumen penyelesaian contoh; unik event/Siswa |

Kolom tambahan: revision event/assessment, wizardState/certificateConfig/attachments,
metadata lampiran milestone, catatan enrollment, requestId unik submission-version,
serta kontak/avatar/peran tampilan profil. CHECK melindungi revision nonnegatif dan
nilai klaim 0–100. FK/unique/trigger lama tetap berlaku. Migrasi **tidak** mengubah
ID/hash password akun Phase 2 atau mengimpor data browser lama. Submission baru
memakai ID server; selector tidak menganggap ID selalu gabungan tiga string.

## Setup development dan data pengujian

1. Gunakan Node sesuai `package.json`, PostgreSQL lokal, `.env.example`, dan
   [panduan database](DATABASE-FOUNDATION.md). `.env`/password jangan dikomit.
2. Isi DATABASE_URL, AUTH_SECRET acak kuat, AUTH_URL sesuai origin. Port berbeda
   memerlukan AUTH_URL yang sesuai. Tidak ada fallback database otomatis.
3. Dari root: `npm ci`, `npm run db:validate`, `npm run db:migrate:deploy`.
4. Hanya DB development/test lokal bernama `bojong_united_dev*` atau
   `bojong_united_test*`: aktifkan ALLOW_DEV_SEED=true dan jalankan `npm run db:seed`.
   Seed idempoten tidak menimpa akun/pekerjaan lama.
5. Provision akun fiktif sesuai [Auth/RBAC](AUTHENTICATION-RBAC.md), dengan tiga
   TEST_*_PASSWORD privat dan ALLOW_DEV_ACCOUNT_PROVISION=true. ID dan username
   `rina.guru`, `dimas`, `aisyah` dipertahankan; password lama tidak dirotasi.
6. `npm run dev`; Guru dan Siswa memakai dua profil browser terpisah. Buat event
   baru dengan tanggal yang masih terbuka, milestone berformat Teks, pilih rubrik,
   atur dokumen contoh, tinjau dan terbitkan. Dimas enroll dan mengirim teks;
   Guru menilai/meminta revisi; periksa Portfolio dan Reports setelah refresh.

Seed menyediakan 3 akun, 2 event, 4 enrollment, rubrik/snapshot, riwayat tugas,
referensi survei DEMO dan 8 referensi asesmen eksternal fiktif. Seed tidak
memprovisikan password otomatis. Fixture awal memiliki tanggal desain lama;
gunakan event baru untuk skenario pendaftaran dengan tanggal masa depan.

Contoh pengiriman dengan sesi Student aktif (same-origin browser):

```ts
const response = await fetch(`/api/events/${encodeURIComponent(eventId)}/milestones/${encodeURIComponent(milestoneId)}/submissions`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    work: { text: "Jawaban fiktif", link: "", files: [] },
    expectedVersion: 0,
    requestId: crypto.randomUUID(),
  }),
});
const result = await response.json();
if (!response.ok) throw new Error(result.error.message);
```

Simpan requestId yang sama saat mengulang **permintaan yang sama**. Setelah
konflik 409, baca versi/revisi baru dan minta pengguna meninjau perubahan.

## Pengujian dan bukti

Lihat [runner dan hasil verifikasi](../tests/README.md#rest-dan-persistensi-phase-3).
Tes DB/browser wajib menunjuk DB disposable lokal `bojong_united_test*`, bukan DB
pengembangan bersama. Tes membuat fixture fiktif unik dan menyimpannya untuk
inspeksi; tidak menghapus data pengguna. Screenshot/download/log disimpan di
AUDIT_OUTPUT_DIR di luar Git. Tes keamanan sesi dijalankan berurutan karena
mengubah sementara grant akun test, lalu memulihkannya.

## Batas dan handover deployment

- Teks, tautan, metadata lampiran, draf, nilai/feedback, progres/laporan, profil,
  dan klaim prototipe sudah database-backed. **Blob file belum diunggah/disimpan**;
  preview/download lampiran tetap simulasi yang diberi label. PDF/XLSX laporan
  benar-benar dibuat di browser dari DTO database.
- Sertifikat adalah dokumen pembelajaran contoh, bukan penerbitan kompetensi,
  tanda tangan resmi, atau layanan verifikasi institusi.
- Jawaban DEMO survei dapat disimpan di DB untuk menguji workflow; tidak menghitung
  Technostress/diagnosis dan bukan modul Survei produksi. Provider selain DEMO
  mengembalikan 501; tim pemilik harus menyepakati instrument ID, ownership,
  consent, versi, webhook/auth, serta error/retry sebelum membuat adapter.
- Hasil dashboard eksternal dibaca dari ExternalAssessmentReference; source DEMO
  tetap berlabel contoh. Tidak ada HTTP ke FOMO/COMMIT, sinkronisasi provider,
  atau pencampuran nilai eksternal dengan AssessmentScore.
- Cache workspace mengambil koleksi penuh yang diizinkan; pagination UI lokal
  dan polling cocok untuk prototipe, belum untuk ribuan event/berkas besar.
- Penyimpanan note/profil/draf tugas masih last-write-wins; CAS diterapkan pada
  event, versi submission, dan penilaian yang berisiko kehilangan riwayat.
- Deployment team perlu HTTPS, origin/proxy tepercaya, secret management, backup,
  pooling, observability, batas request/rate limit, retensi data, object storage
  serta hardening Auth.js beta sebelum produksi. Jangan aktifkan seed/provision
  development di produksi. Jalankan migration deploy melalui proses rilis yang
  disetujui setelah backup; pekerjaan fase ini tidak mengakses database produksi.
- Implementasi ini bukan audit penetrasi independen atau persetujuan produksi.

## Hasil verifikasi fase ini

Verifikasi lokal 12 November 2026, Node 24.15.0, PostgreSQL 17 pada container
QA terisolasi, Edge/Chromium headless. Tidak memakai DB produksi atau sesi
browser pengguna. Bukti disimpan di temporary OS di luar repository.

| Pemeriksaan yang dijalankan | Hasil aktual |
| --- | --- |
| npm ci dari root, postinstall Prisma generate | PASS |
| Prisma validate/generate | PASS |
| Upgrade dari tiga migrasi Phase 2 ke migrasi keempat | PASS; ID dan hash password ketiga akun tidak berubah |
| Replay empat migrasi di DB kosong, seed dua kali | PASS |
| Drift DB aktif ↔ schema, replay DB ↔ schema, migrasi ↔ schema dengan shadow DB terpisah | PASS; exit 0 |
| Sepuluh tes integritas PostgreSQL pada DB replay terpisah | PASS 10/10 |
| ESLint, TypeScript mandiri, build produksi tanpa DATABASE_URL/AUTH_SECRET | PASS |
| Unit/selector/cache/PDF/asesmen frontend | PASS 18/18 |
| Validasi Auth/Argon2id dan guard seed | PASS 3/3 + 3/3 |
| REST API nyata | PASS 12 kelompok |
| UI lintas sesi Guru–Siswa melalui PostgreSQL | PASS 11 kelompok |
| Regresi audit dengan fixture DB 40 peserta | PASS 7 kelompok |
| Dashboard asesmen eksternal dari referensi DB | PASS 25 cek |
| Inventaris route Guru/Siswa dan logout/wrong-role | PASS 51 cek; produksi tanpa console/runtime/HTTP error atau diagnostic Instant Navigation |
| Autentikasi, RBAC, expiry/revocation, CSRF, register dan rate limit | PASS 15 kelompok |
| Layar 320/768/1440 px | PASS pada dashboard kedua role, profil/nama panjang/portofolio, hasil asesmen dan layar Auth yang diuji |
| Ekspor nyata | PASS; PDF 40 peserta dua halaman, teks peserta terakhir terbaca, XLSX ZIP/XML valid dengan 43 baris |
| Dependency produksi | npm audit --omit=dev: 0 temuan |
| Dependency development | 7 moderat pada rantai typescript-eslint/minimatch; belum diperbaiki pada scope fase ini |
| Pelestarian workspace lama | PASS; HEAD/branch/status dan SHA-256 1.255 file pada empat workspace tetap identik |

Seluruh enam suite browser/API dijalankan pada build produksi lokal. Setelah
koreksi label pemberi feedback/status survei opsional dan validasi tanggal dokumen,
ESLint/TypeScript/build/unit serta tiga suite terkait (REST, UI integrasi, audit
laporan/ekspor) dijalankan ulang dan lulus. Runner frontend lama yang bergantung
pada injeksi sessionStorage diubah menjadi fixture PostgreSQL nyata; bukan
mengaktifkan kembali fallback untuk meloloskan tes. Regresi role tetap mencakup
51 skenario memakai peserta Aisyah M1/M4 yang benar-benar ada di database.

Temuan yang diperbaiki selama pengujian: wizard stale revision saat klik cepat,
serialisasi row-lock yang sebelumnya menjadi 503 alih-alih retry/409, pergantian
rubrik draf yang terhalang FK, field presentasi profil ikut terkirim ke body ketat,
catatan submission versi terbaru tidak terlihat Guru, label nama Guru pada event
serta feedback Siswa, pagination banyak event pada 320 px, dan survei opsional
salah dikategorikan belum diisi. Tidak ada perubahan global CSS atau desain ulang.

Yang **tidak** dibuktikan: kesamaan piksel penuh terhadap seluruh frame Figma,
seluruh browser/perangkat, screen reader, load test produksi, penetrasi keamanan
independen, binary upload, provider FOMO/COMMIT nyata, atau kesiapan deployment.
