# Fondasi Database — Backend Phase 1

> **Status terkini (Backend Phase 4B):** alur event, enrollment, tugas,
> penilaian, portofolio, laporan, dan profil memakai REST API + PostgreSQL.
> Autentikasi memakai Auth.js dan otorisasi server. Schema kini memiliki **29
> model**. Lampiran berupa berkas nyata di storage privat, dengan metadata dan
> versi tersimpan di PostgreSQL. Hasil UI/UX internal terpisah dari nilai rubrik
> milestone. Provider eksternal belum terintegrasi. Uraian fase terdahulu di bawah
> adalah catatan historis, bukan mode fallback aplikasi saat ini. Acuan terbaru:
> [REST API](BACKEND-REST-API.md), [UI/UX internal](UI-UX-ASSESSMENT-API.md), dan
> [upload lampiran privat](FILE-UPLOAD-ATTACHMENTS.md).


> Pembaruan Phase 2: autentikasi sudah memakai database; lihat
> [Auth.js/RBAC](AUTHENTICATION-RBAC.md). Dokumen ini menjelaskan fondasi
> Phase 1 (22 model); migrasi Auth menambah 2 model tanpa mengubah migrasi awal.

## Status dan batas implementasi Phase 1 (historis)

Fondasi PostgreSQL + Prisma tersedia tanpa mengganti frontend. Halaman Guru dan
Siswa **masih memakai mock/sessionStorage**, bukan database ini. Belum ada Route
Handler REST, Auth.js, RBAC server, OAuth, provisioning akun produksi, atau migrasi
data browser. `User.role` dan foreign key bukan pengganti otorisasi.

Versi terkunci: Prisma CLI/client/adapter PostgreSQL **7.10.1**, `pg` **8.23.1**.
Gunakan Node 20.19+, 22.12+, atau 24+ sesuai `package.json`; pengujian dilakukan
pada Node 24.15.0 dan PostgreSQL 17. Tidak ada perubahan desain, route, setup
Next.js, atau library UI; shadcn/ui belum dikonfigurasi pada repository awal dan
tidak dipasang untuk fase database ini.

## Arsitektur dan pemetaan identitas

| Model | Relasi dan tujuan |
| --- | --- |
| `User`, `TeacherProfile`, `StudentProfile` | Satu role Guru/Siswa sesuai kontrak saat ini; profil wajib cocok dengan role. ID autentikasi `student-dimas` berbeda dari ID domain Siswa `dimas`. Role tambahan/multi-role menunggu keputusan Auth. |
| `Event`, `Enrollment`, `Milestone` | Event dimiliki Guru. Peserta melalui enrollment unik `(eventId, studentId)`, bukan kelas sekolah. Milestone memakai primary key `(eventId, id)` sehingga `M1` boleh berulang pada event berbeda. |
| `Submission`, `SubmissionVersion`, `SubmissionAttachment` | Satu submission per peserta/milestone; banyak versi bernomor unik. FK majemuk memastikan peserta terdaftar dan milestone berasal dari event yang sama. Lampiran hanya metadata/storage key, bukan file unggahan. |
| `Rubric`, `RubricVersion`, `RubricCriterion`, `RubricCriterionLevel` | Rubrik logis memiliki snapshot versi, kriteria berurutan, rentang skor, dan deskripsi level. Event memilih versi tertentu. Versi yang sudah digunakan tidak boleh diubah; edit membuat versi baru. |
| `Assessment`, `AssessmentScore`, `Feedback` | Nilai melekat pada **versi submission**, memakai versi rubrik event yang sama. Skor per kriteria. Feedback/revisi tetap terkait versi asal; versi baru tidak mewarisi nilai/review lama. |
| `SurveyReference`, `MilestoneSurveyReference` | Referensi instrumen provider yang opaque dan ikatan ke milestone event. Tidak mendefinisikan instrumen/modul Survei milik tim lain. |
| `SurveyResponseReference`, `SurveyReview` | Respons berversi, timestamp survei terpisah dari tugas, snapshot opsional, review mengacu respons tertentu. |
| `ExternalAssessmentReference` | Hasil Uji Kompetensi, Technostress, UI/UX; terpisah sepenuhnya dari nilai rubrik milestone. Event opsional; bila ada, enrollment Siswa harus cocok. Provider, ID eksternal dan versi instrumen disiapkan tanpa menebak endpoint. |
| `DevelopmentSeed` | Penanda fixture development; bukan tabel autentikasi. |

Total **22 model dan 5 enum**. ID lama seperti `kantin`, `dimas`, `M1`, ID UUID,
serta `${eventId}:${studentId}:${milestoneId}` tetap dapat disimpan sebagai string.
Tidak ada konversi ID frontend otomatis. Timestamp memakai `timestamptz(3)`;
fixture waktu lokal ditafsirkan WIB (+07:00). REST kelak harus memetakan Decimal,
BigInt dan Date secara eksplisit ke JSON, tidak mengirim objek Prisma langsung.

### Integritas database

- Unique enrollment, nomor versi, posisi milestone/kriteria, email/username
  ternormalisasi, dan ID provider mencegah duplikasi pada konteksnya.
- FK majemuk menolak relasi lintas event, rubrik, versi submission dan peserta.
- Penghapusan history menggunakan `RESTRICT`, bukan cascade otomatis.
- CHECK memvalidasi urutan tanggal, posisi/versi positif, ukuran file nonnegatif,
  pasangan skor eksternal, nama/feedback nonkosong dan kecocokan role profil.
- Trigger memvalidasi skor terhadap **rentang kriteria aktual**, bukan skala
  universal. Snapshot rubrik yang terpakai dilindungi dengan row lock.
- Indeks disediakan pada pemilik/status event, peserta, milestone, waktu
  submission/assessment, reviewer dan pencarian hasil asesmen per Siswa/tipe.

Tidak ada formula kelulusan, threshold klinis Technostress, kebijakan unlocking,
syarat early completion, atau rumus agregasi UI/UX baru. Kelengkapan semua skor,
otorisasi penilai, validasi konten HTML/URL, batas upload, dan transisi status
harus divalidasi service/API pada fase berikutnya. Histori submission/respons
harus diperlakukan append-only oleh service; fase ini belum menyediakan API
atau database permission terpisah untuk menjamin semua writer mengikuti aturan.

## Hasil audit integrasi tim

Baseline utama: merge PR #3 `9e749849d8fb7e3a13496e2096a7e251fecf7dce`,
termasuk PR #2 pemindahan aplikasi ke root. Kontrak existing ditinjau dari
`src/lib/guru/`, `src/lib/siswa/`, `src/lib/auth/`, `src/lib/assessments/`, serta
[handover](INTEGRATION-HANDOVER.md).

Remote `origin/sistem-analitik` pada
`d9bc7a6aa35cc9648a91b1952fda0921105673a5` masih memakai `frontend/`.
`frontend/src/types/index.ts` menyediakan `StudentSurveyRecord`,
`TechnostressStudent`, dan `AnalyticsResponse`: status survei, skor nullable,
`post_date`, `kalkulasi`, `rounded_scale`, kategori, essay dan agregat analitik.
Artefak itu **bukan kontrak REST final**. ID/nama tampilan, kategori maupun
agregatnya tidak diasumsikan identik dengan identitas dan skala database ini.
Tidak ditemukan implementasi FOMO atau backend COMMIT lengkap dalam sumber
repository/remote yang tersedia. Tidak ada pesan yang dikirim ke tim lain.

Hal yang perlu disepakati sebelum adapter/API dibuat:

1. Pemilik instrumen, namespace provider, ID stabil user/event/instrumen/hasil,
   versi instrumen, nullable event, dan deduplikasi histori hasil.
2. Sumber kebenaran status/score/kategori Technostress dan UI/UX; jangan
   menghitung ulang atau menyamakan dengan nilai rubrik milestone.
3. Kebijakan akses/consent/retensi data dan response payload; snapshot survei
   tidak boleh diisi data pribadi/sensitif tanpa kebijakan yang disetujui.
4. Pemetaan Auth.js ke `User.id` dan profile ID, verifikasi email, akun Google,
   provisioning Guru dan akses kepemilikan event. Tidak ada password seed.
5. Pengelolaan draft wizard, konfigurasi sertifikat, file/object storage dan
   laporan: belum dipersist database pada fase ini; bukan fitur yang dihapus.

## Inisialisasi development lokal

Frontend tetap dapat dijalankan tanpa database. `npm ci` menghasilkan client
Prisma melalui `postinstall`; tidak melakukan migrasi, seed atau koneksi DB.
Generated client berada di `src/generated/prisma/` dan tidak masuk Git.

```powershell
npm ci
Copy-Item .env.example .env
```

Edit `.env` lokal: ganti `POSTGRES_PASSWORD` dan bagian password `DATABASE_URL`
dengan password development yang sama. URL-encode karakter khusus pada URL.
Jangan commit `.env`, URL berisi rahasia, atau menyalin kredensial produksi.
`.env.example` hanya placeholder; **tidak dapat dipakai seed sebelum diubah**.

Default `compose.db.yml`: PostgreSQL 17, `127.0.0.1:5433`, user `bojong_dev`, DB
`bojong_united_dev`. Jika port sudah digunakan, pilih port lain dan sesuaikan
`POSTGRES_PORT` serta URL. Jangan menimpa volume atau konfigurasi tim lain.

```powershell
docker compose -f compose.db.yml up -d
npm run db:validate
npm run db:generate
npm run db:migrate:deploy
npm run db:migrate:status
```

`db:migrate:deploy` di sini hanya dipakai pada **database lokal baru yang telah
diperiksa alamatnya**. Command migrasi memerlukan `DATABASE_URL` eksplisit dan
memiliki akses DDL; guard seed tidak membatasi command Prisma migrate. Jangan
menjalankan migration command terhadap produksi/shared DB pada fase ini.

Aktifkan seed untuk satu terminal development secara eksplisit:

```powershell
$env:NODE_ENV = 'development'
$env:ALLOW_DEV_SEED = 'true'
npm run db:seed
Remove-Item Env:NODE_ENV
Remove-Item Env:ALLOW_DEV_SEED
```

Jangan menetapkan NODE_ENV development secara permanen karena memengaruhi build
Next.js. Seed hanya menerima development/test + opt-in, localhost dan nama DB
`bojong_united_dev` / `bojong_united_test` (boleh suffix `_...`). URL remote,
placeholder, database produksi/generik, schema selain public, atau query yang
mengganti host ditolak. Guard ini pencegah salah target, bukan security boundary
untuk admin DB; port forwarding lokal tetap harus diperiksa operator.

Seed memakai transaksi Serializable dan advisory lock. Hanya INSERT/upsert
`update: {}`; tanpa reset, delete atau overwrite. DB berisi data tanpa marker
fixture dan ID demo milik non-demo user ditolak. Menjalankan ulang tidak
mengembalikan perubahan data pengguna ke fixture awal. Konflik fixture lama
harus dianalisis, bukan diatasi dengan reset. Isi seed:

- 3 user demo tanpa password (Rina, Dimas, Aisyah), profil yang sesuai.
- 2 event, 4 enrollment, 7 milestone, 4 rubrik dan versi/kriterianya.
- 1 submission dengan 2 versi: versi pertama bernilai, revisi belum dinilai;
  feedback revisi dan metadata PDF fiktif tanpa file nyata.
- 1 referensi survei, 2 versi respons, review hanya respons pertama.
- 8 referensi asesmen eksternal `source=DEMO`, provider `demo`.

Fixture memakai sebagian data frontend, bukan salinan lengkap sessionStorage;
state browser tidak tersinkron database. Ini bukan provisioning akun produksi.

## Migrasi dan perubahan skema berikutnya

- `prisma/migrations/20261112000100_initial_foundation/migration.sql`: DDL awal.
- `prisma/migrations/20261112000200_integrity_guards/migration.sql`: CHECK,
  validasi skor dan perlindungan snapshot.
- `prisma/migrations/migration_lock.toml`: provider PostgreSQL.

Keduanya transaksional. Constraint/trigger SQL tambahan tidak seluruhnya dapat
diekspresikan dalam `schema.prisma`. Pertahankan migration kedua saat replay;
Prisma diff tanpa perubahan **tidak membuktikan** trigger/CHECK masih ada.
Jangan mengubah migrasi yang sudah dibagikan/diterapkan. Buat migrasi baru,
review SQL dan jalankan tes integritas. Gunakan `npm run db:migrate:dev -- --name
<nama>` hanya pada DB development sendiri. Jika memakai shadow DB, URL-nya
wajib database disposable yang **berbeda** dari database utama. Jangan memakai
`migrate reset`, `db push --accept-data-loss`, atau `docker compose down -v`
untuk menyelesaikan konflik pada data yang ingin dipertahankan.

Client server dipanggil kelak melalui `getDatabase()` dari `src/server/db/`.
Wrapper `server-only` mencegah import ke Client Components; pembacaan URL dan
pool bersifat lazy. Factory terpisah dipakai CLI/tes. Tidak ada query DB ketika
frontend build atau render mock berlangsung. Import tipe kontrak frontend ke
service adapter bila diperlukan; jangan mengganti store browser tanpa rencana
migrasi dan tes lintas pengguna.

## Pengujian

```powershell
npm run db:validate
npm run test:db:safety
npm run lint
npm run build
node node_modules/typescript/bin/tsc --noEmit --incremental false
```

Tes PostgreSQL membutuhkan **database test baru tersendiri** bernama
`bojong_united_test` atau suffix-nya; jangan memakai DB development berisi kerja
manual. Isi DATABASE_URL test pada terminal sendiri, jalankan migration deploy,
kemudian:

```powershell
$env:NODE_ENV = 'test'
$env:ALLOW_DEV_SEED = 'true'
npm run test:db
```

Tes membuat fixture development pada DB test dan menolak DB tanpa marker yang
sudah berisi data. Tes invalid memakai constraint error nyata; perubahan
sementara yang valid di-rollback. Cakupan: idempotensi seed, identitas role,
enrollment/event, snapshot rubrik, rentang skor, submission/review berversi,
nilai nol, pasangan skor, tanggal dan ukuran file. Tidak menguji Auth.js,
otorisasi REST, concurrency semua service, atau performa produksi.

### Hasil verifikasi 12 November 2026

| Pemeriksaan yang benar-benar dijalankan | Hasil |
| --- | --- |
| `npm ci` + postinstall generate, tanpa URL/DB | Lulus |
| Prisma generate dan validate tanpa URL | Lulus |
| Dua migration deploy pada PostgreSQL 17 baru, replay pada DB kedua, deploy ulang dan migrate status | Lulus; tidak ada migrasi tertunda |
| Diff live DB ? schema dan migrations ? schema melalui shadow DB terpisah | Tidak ada perbedaan |
| Katalog PostgreSQL | 22 tabel domain, 20 CHECK, 5 definisi trigger (12 event trigger) |
| Seed dua kali dan tes integritas nyata | 10/10 lulus, tidak menggandakan fixture |
| Guard tanpa DB | 3/3 lulus |
| Seed mode production, opt-in mati, DB berisi data tanpa marker | Ditolak; DB terakhir tetap 1 user asal, 0 marker |
| Migration status tanpa URL | Ditolak sebelum koneksi, tanpa fallback target |
| Docker Compose config | Valid, tanpa menjalankan instance development pengguna |
| ESLint, build produksi, TypeScript mandiri | Lulus tanpa DATABASE_URL |
| Tes Node frontend existing | 16/16 lulus |
| Browser produksi: role/navigation, assessment dashboard, regresi audit | 51 + 25 + 8 lulus; tidak ada error runtime/HTTP yang dilaporkan runner |
| Smoke Guru?Siswa same-tab: publish/enroll/submit/grade/feedback/revision, Reports/Portfolio | 9 pemeriksaan lulus |
| Responsive dalam runner existing | 320, 768, 1440 px lulus |
| `npm audit --omit=dev` | 0 temuan |
| Audit seluruh dependency | 7 moderate pada rantai ESLint/TypeScript-eslint/minimatch development existing; 0 high/critical, tidak diubah di fase ini |
| Workspace lama dan file audit untracked | HEAD, status dan SHA-256 semua berkas baseline tetap sama |

Browser memakai frontend mock, **bukan integrasi REST/PostgreSQL**. Event baru
belum menyediakan instrumen Survei, dan sessionStorage tetap tidak tersinkron
antarkonteks browser; runner mengonfirmasi batas tersebut. Semua akses DB QA
menggunakan container PostgreSQL baru yang terisolasi dan database lokal test,
bukan database produksi. Bukti/log/screenshot berisi fixture disimpan di luar
repository; tidak ada kredensial atau artefak QA yang dipublikasikan.

Tes belum mencakup Auth.js/RBAC, REST, produksi/cloud, multi-user concurrency,
pemulihan backup, atau performance/load. Tidak ada perubahan visual/Figma pada
fase ini; pemeriksaan browser merupakan regresi perilaku dan ukuran layar,
bukan audit ulang kesetaraan piksel. Gunakan [panduan tes](../tests/README.md).

## Referensi Prisma resmi

- [Konfigurasi Prisma 7](https://www.prisma.io/docs/orm/v7/reference/prisma-config-reference).
- [PostgreSQL quickstart](https://www.prisma.io/docs/v7/prisma-orm/quickstart/postgresql).
- [Seed eksplisit Prisma 7](https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/seeding).
