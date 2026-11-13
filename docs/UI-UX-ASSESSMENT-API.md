# API Internal Assessment UI/UX — Backend Phase 4A

## Status dan batas modul

API ini mengelola **hasil UI/UX yang dicatat Guru berwenang**, menggunakan
Auth.js, Prisma dan PostgreSQL dalam aplikasi Next.js yang sama. Bukan mesin
kuesioner, algoritma skoring, layanan sertifikasi, atau koneksi partner.

Tiga domain tetap berbeda:

| Domain | Penyimpanan / endpoint |
| --- | --- |
| Hasil UI/UX internal | `ExternalAssessmentReference` dengan type `UI_UX`, provider `bojong-united`, source `INTERNAL`; endpoint di dokumen ini |
| Penilaian rubrik milestone | `Assessment`, `AssessmentScore`, `SubmissionVersion`; `PUT /api/submissions/:id/assessment` dan `GET /api/assessments/:id` |
| FOMO/COMMIT/Technostress eksternal | Belum diintegrasikan; tidak ada webhook, service token, atau panggilan provider pada fase ini |

Tidak ditemukan instrumen UI/UX beserta metodologi skoring yang disepakati di
repository. Karena itu nilai/ringkasan diberikan Guru; API hanya memvalidasi dan
menyimpan. Hak tulis mengikuti kepemilikan event yang sudah berlaku, bukan izin
untuk mengatasnamakan hasil provider lain. Tidak ada role/service auth baru.

## Endpoint dan kompatibilitas

Semua path di bawah relatif terhadap origin aplikasi. Respons baru menyertakan
`apiVersion: "1"`. `records` pada list mempertahankan bentuk field sebelumnya.

| Method | Path | Fungsi |
| --- | --- | --- |
| GET | `/api/assessment-results` | Semua jenis sesuai hak akses; type opsional mempertahankan perilaku lama |
| GET | `/api/assessment-results?type=UI_UX` | Filter hasil UI/UX |
| POST | `/api/ui-ux-assessments` | Buat hasil internal, idempoten |
| GET | `/api/ui-ux-assessments/:assessmentId` | Detail hasil UI/UX yang diizinkan |
| PATCH | `/api/ui-ux-assessments/:assessmentId` | Update parsial hasil internal dengan revision CAS |
| GET | `/api/ui-ux-assessments/:assessmentId?history=true` | Detail serta snapshot perubahan yang benar-benar tercatat |

Query list: `type` (`UI_UX`, `COMPETENCY`, `TECHNOSTRESS`), `studentId`, `eventId`,
`page` (1–100000; default 1), `pageSize` (1–100; default 100). Parameter duplikat,
unknown, kosong/tidak valid ditolak 400. Urutan: `recordedAt DESC, id ASC`, dengan
pagination untuk seluruh jenis. Tanpa type: semua jenis tetap tampil. Maksimum
100 record per respons sama dengan batas lama; dashboard mengambil halaman
lanjutan dan melakukan deduplikasi ID, tanpa fallback mock.

History untuk daftar hasil seorang Siswa/event diperoleh dengan filter list lalu
GET masing-masing ID dengan `history=true`. Tidak dibuat endpoint history kedua.
Query detail hanya mendukung `history=true|false` (default false).

## Autentikasi dan otorisasi

Gunakan sesi cookie Auth.js yang sudah ada. POST/PATCH wajib ber-origin sama
sesuai AUTH_URL dan memakai Content-Type application/json. Tidak ada API key,
Bearer partner atau kredensial dalam payload. RBAC/identitas selalu dari server.

| Aktor | List/detail/history | POST/PATCH |
| --- | --- | --- |
| Tanpa sesi valid | 401 | 401 |
| Siswa | Hanya hasil miliknya; studentId Siswa lain 403 | 403, termasuk nilai sendiri |
| Guru | Hasil peserta pada event miliknya | Hanya event miliknya dengan enrollment Siswa valid |
| Guru lain | Resource individual tidak berwenang 403; list tersaring | 403 |
| Partner/service eksternal | Tidak ada metode autentikasi khusus pada fase ini | Tidak tersedia |

GET ID yang tidak ada atau milik jenis asesmen selain UI_UX mengembalikan 404.
Record tanpa event dapat dibaca Siswa pemiliknya melalui kompatibilitas data
lama; Guru tidak mendapat record tanpa konteks event yang dimilikinya. POST baru
wajib event/enrollment. Hasil DEMO/EXTERNAL dapat dibaca sesuai izin, tetapi PATCH
menolaknya sebagai `READ_ONLY_SOURCE`; tidak mengubah data contoh menjadi nyata.

## Membuat hasil

Contoh request dari browser yang sudah login sebagai Guru:

```http
POST /api/ui-ux-assessments
Content-Type: application/json
Origin: http://localhost:3000
```

```json
{
  "studentId": "dimas",
  "eventId": "kantin",
  "type": "UI_UX",
  "provider": "bojong-united",
  "source": "INTERNAL",
  "idempotencyKey": "uiux-dimas-kantin-run-001",
  "externalAssessmentId": null,
  "instrumentVersion": "manual-v1",
  "title": "Hasil review UI/UX internal",
  "status": "IN_PROGRESS"
}
```

`type`, `provider`, `source` boleh dihilangkan; bila dikirim hanya nilai literal
tersebut yang diterima. `externalAssessmentId` opsional/null adalah metadata
opaque bila memang ada, bukan bukti koneksi atau validasi hasil partner. Tidak
menerima role, author, id record, revision, student ownership alternatif atau field
model internal lainnya. ID hasil dibuat server.

Contoh respons 201:

```json
{
  "apiVersion": "1",
  "created": true,
  "assessment": {
    "id": "ID_DIBUAT_SERVER",
    "studentId": "dimas",
    "eventId": "kantin",
    "type": "UI_UX",
    "title": "Hasil review UI/UX internal",
    "provider": "bojong-united",
    "source": "INTERNAL",
    "externalAssessmentId": null,
    "instrumentVersion": "manual-v1",
    "status": "IN_PROGRESS",
    "scoreValue": null,
    "scoreMaximum": null,
    "summary": null,
    "feedback": null,
    "completedAt": null,
    "recordedAt": "2026-11-13T01:00:00.000Z",
    "revision": 1
  }
}
```

ID dan waktu di atas ilustrasi, bukan ID/waktu layanan yang sedang dideploy.

### Idempotency

`idempotencyKey` wajib, 8–128 karakter alfanumerik/colon/underscore/hyphen.
Scope key per Guru, disimpan sebagai SHA-256 bersama fingerprint payload yang
dinormalisasi. Key bukan token autentikasi. Payload create identik dengan key yang
sama mengembalikan 201, `created:false`, ID yang sama dan **state terkini**; tidak
membuat riwayat baru atau mengembalikan data ke kondisi awal. Key sama dengan
payload berbeda: 409 `IDEMPOTENCY_CONFLICT`.

Unique `(provider, externalAssessmentId)` lama tetap berlaku jika ID eksternal
terisi. Konkurensi create dijaga transaksi Serializable dan unique DB. Permintaan
bersamaan bisa menjadi replay atau 409; ulangi payload/key identik setelah
konflik. Jangan membuat key baru hanya karena respons pertama tidak diterima.

## Memperbarui dan menyelesaikan hasil

```http
PATCH /api/ui-ux-assessments/ID_DIBUAT_SERVER
Content-Type: application/json
```

```json
{
  "expectedRevision": 1,
  "status": "COMPLETED",
  "scoreValue": "91.25",
  "scoreMaximum": "100",
  "summary": "Ringkasan review manual Guru.",
  "feedback": "Perjelas hierarki navigasi.",
  "completedAt": "2026-11-13T02:00:00+07:00"
}
```

Gunakan timestamp aktual saat menguji, bukan tanggal contoh masa depan. Respons
200: `{ "apiVersion":"1", "replay":false, "assessment": { ...detail terbaru... } }`.
Revision bertambah satu untuk setiap perubahan efektif. Snapshot dan update
record terjadi atomik. Payload identik yang sudah berlaku merupakan replay:
`replay:true` tanpa penambahan revision. Perubahan berbeda dengan revision lama:
409 `STALE_REVISION`. Row lock dan Serializable mencegah lost update; tidak ada
perubahan paksa/last-write-wins pada hasil ini.

Field PATCH hanya: expectedRevision, title, status, scoreValue, scoreMaximum,
summary, feedback, completedAt. Minimal satu perubahan harus disertakan. Identitas
Siswa/event/provider/source/ID eksternal/instrumentVersion tidak dapat dipindah
melalui PATCH; buat record baru untuk konteks atau instrumen berbeda.

### Aturan validasi dan status

- Title trim 1–240 karakter; ringkasan/feedback maksimal 5000; versi instrumen
  1–100 atau null. ID domain mengikuti batas 191 dan karakter ID aplikasi.
- Score dikirim sebagai **string desimal** nonnegatif, maksimum 8 digit bulat dan
  4 digit pecahan, tanpa exponent, NaN atau Infinity. Pasangan value/maximum harus
  sama-sama terisi atau null; maximum >0 dan value ≤ maximum. API mengembalikan
  string kanonis (`"91.2500"` → `"91.25"`), bukan float kalkulasi. API tidak
  mengubah skala menjadi persen, menyimpulkan kategori, atau menentukan kelulusan.
- `NOT_STARTED` default → `IN_PROGRESS` → `AWAITING_RESULT` → `COMPLETED`.
  Boleh melewati tahap antara; tidak boleh mundur. Field non-final bisa diedit
  selama status belum COMPLETED.
- Status non-final tidak menerima skor akhir atau completedAt. COMPLETED wajib
  completedAt serta skor atau ringkasan nonkosong; hasil kualitatif diperbolehkan
  tanpa membuat skor rekaan.
- Timestamp harus ISO-8601 dengan Z atau offset eksplisit, tanggal kalender valid,
  serta tidak di masa depan. Disimpan timestamptz(3), respons UTC ISO.
- **COMPLETED dibekukan**: perubahan berbeda ditolak `RESULT_FINAL`; retry identik
  tetap aman. Koreksi dibuat sebagai hasil baru dengan key/ID metadata baru.
  Ini kontrak teknis perlindungan data fase ini, bukan aturan penilaian institusi.
  Belum ada relasi supersedes antarhasil yang terpisah.
- Payload strict menolak mass assignment. Batas body dari helper domain: 1 MiB.

## List, detail, dan riwayat

Bentuk list tetap `{records:[...]}`, ditambah `apiVersion` dan:

```json
{
  "pagination": { "page": 1, "pageSize": 100, "total": 3, "hasMore": false }
}
```

Field setiap record list tetap id, studentId, eventId, type, status, title, source,
scoreValue, scoreMaximum, summary, feedback, completedAt. Detail menambahkan
provider, externalAssessmentId, instrumentVersion, recordedAt dan revision.
Hash/key idempotency dan identitas pengubah internal tidak dikirim ke browser.

Contoh bagian respons GET `?history=true`:

```json
{
  "apiVersion": "1",
  "assessment": { "id": "ID_DIBUAT_SERVER", "revision": 2 },
  "historyAvailable": true,
  "revisions": [
    { "revision": 1, "changedAt": "2026-11-13T01:00:00.000Z", "snapshot": { "id": "ID_DIBUAT_SERVER", "revision": 1, "status": "IN_PROGRESS" } },
    { "revision": 2, "changedAt": "2026-11-13T02:00:00.000Z", "snapshot": { "id": "ID_DIBUAT_SERVER", "revision": 2, "status": "COMPLETED" } }
  ]
}
```

Contoh history dipersingkat; assessment/snapshot sebenarnya berisi seluruh field
detail. Record lama DEMO/EXTERNAL mendapat revision 0 tanpa snapshot historis:
`historyAvailable:false, revisions:[]`. Tidak mengarang riwayat sebelum migrasi.

## Error

| HTTP | Contoh code / kondisi |
| --- | --- |
| 400 | INVALID_INPUT: field, skor, query, timestamp atau kombinasi status salah |
| 401 | UNAUTHORIZED: login dibutuhkan atau sesi tidak valid |
| 403 | FORBIDDEN: role, origin atau kepemilikan ditolak |
| 404 | NOT_FOUND: hasil UI/UX atau Siswa tidak ditemukan |
| 409 | STALE_REVISION, IDEMPOTENCY_CONFLICT, RESULT_FINAL, READ_ONLY_SOURCE, INVALID_TRANSITION, ENROLLMENT_REQUIRED, CONFLICT |
| 413 / 415 | Body terlalu besar / bukan JSON |
| 503 | UNAVAILABLE: gangguan DB/server, tanpa fallback mock |

```json
{"error":{"code":"STALE_REVISION","message":"Hasil berubah. Baca revision terbaru."}}
```

Zod menambahkan `fields:[{path,message}]` untuk error field. Tidak mengirim stack,
password hash, credential database, atau token. Respons privat memakai no-store.

## Mapping database dan setup

Tetap memakai `ExternalAssessmentReference` untuk hasil; **bukan model hasil
kedua**. Migrasi tambahan tunggal:
`prisma/migrations/20261113000100_internal_uiux_assessments/migration.sql`.
Empat migrasi sebelumnya tidak diubah. Total schema menjadi **28 model**.

- ReferenceSource menambah INTERNAL; provider internal tetap `bojong-united`.
- Tambahan revision (default 0 untuk data lama), uiUxCreateKey unik dan
  uiUxCreateHash untuk retry; tidak mengubah ID, skor atau credential lama.
- `UiUxAssessmentRevision` menyimpan snapshot JSON, revision, waktu dan FK Guru
  pengubah; FK mengarah hasil yang sama. Transaksi update + history atomik.
- Constraint menjaga identitas/konteks internal dan rentang/status skor.
  Trigger melarang UPDATE/DELETE riwayat serta mengharuskan revision history
  cocok dengan hasil internal UI/UX saat dicatat.

Jalankan dari root: npm ci → npm run db:validate → npm run db:migrate:deploy.
DATABASE_URL, AUTH_SECRET, AUTH_URL mengikuti `.env.example` dan
[panduan Auth/RBAC](AUTHENTICATION-RBAC.md). Tidak ada environment/service secret
baru. Jangan menjalankan seed/provision development pada DB produksi.

## Cara menguji

Gunakan PostgreSQL disposable lokal `bojong_united_test*`, NODE_ENV=test dan
ALLOW_DEV_SEED=true. Pasang migrasi, seed dan provision tiga akun fiktif melalui
environment privat sesuai [panduan pengujian](../tests/README.md). Password tidak
ada di source; tidak perlu mengubah credential akun lama.

Login sebagai Guru pemilik event dengan Siswa terdaftar, lalu gunakan fetch dari
origin aplikasi atau REST client yang membawa cookie sesi yang sah. Buat record,
baca revision, PATCH dengan expectedRevision, dan periksa history. Login sebagai
Dimas di browser context lain: baca miliknya; POST/PATCH harus 403. Aisyah dan Guru
lain tidak boleh membaca/mengubah hasil Dimas pada event Guru tersebut.

`npm run test:uiux` menjalankan API + browser nyata; memerlukan environment
Playwright/AUDIT_BASE_URL/ketiga TEST_*_PASSWORD dan DB test disposable. Runner
membuat fixture Guru/event tambahan dalam DB test, tidak membuat endpoint debug.
Jalankan sebelum/terpisah dari skenario yang mengharapkan seed murni; hasil UI/UX
internal yang sah memang dapat menjadi catatan terbaru pada dashboard.

## Dashboard dan batas lanjutan

Dashboard tetap tiga jenis Guru dan dua Siswa. Adapter membaca semua halaman API,
memetakan source DEMO ke mock, INTERNAL ke hasil internal, dan memperbarui saat
fokus/tiap lima detik. Data baru dan update tampil tanpa menulis mock store.
Filter, detail, dan fokus keyboard dipertahankan. Label DEMO tetap eksplisit;
hasil internal tidak diklaim berasal dari provider eksternal. Tidak ada form
kuesioner, algoritma nilai atau UI CRUD Guru baru pada fase API ini.

FOMO/COMMIT masih memerlukan kesepakatan pemilik instrumen, kontrak payload dan
identitas, izin akses, metode autentikasi partner, audit/consent, transport HTTPS,
retry serta idempotency lintas layanan. Tidak ada deployment, CORS partner,
webhook atau token partner yang ditambahkan. API ini belum dinyatakan dapat
diakses kelompok lain dari internet atau siap produksi. Riwayat per-result dan
polling workspace masih berskala prototype; uji beban/paginasi history dan proses
koreksi/supersedes terkelola memerlukan keputusan fase berikutnya.

## Hasil verifikasi aktual — 13 November 2026

Dijalankan dengan Node 24.15.0, PostgreSQL 17 dalam container QA berlabel sendiri,
Edge/Chromium headless, dan server hasil build produksi lokal. Tidak memakai
DB produksi/shared team. Screenshot, JSON hasil tes dan log berada di temporary
OS di luar Git; tidak memuat credential dalam dokumentasi repository.

| Pemeriksaan | Hasil |
| --- | --- |
| npm ci bersih dan postinstall client Prisma | PASS |
| Prisma validate/generate, ESLint, TypeScript mandiri, production build tanpa DB/secret | PASS |
| Upgrade empat → lima migrasi | PASS; ID/hash password tiga akun Phase 2 tetap identik |
| Replay lima migrasi pada DB kosong, seed dua kali | PASS |
| Drift DB aktif, DB replay, serta migration history terhadap schema | PASS, exit 0 |
| Database integrity regression pada DB replay terpisah | PASS 10 tes |
| Unit/selector/PDF frontend | PASS 18 tes |
| HTTP adapter pagination/mapping/error/abort | PASS 2 tes |
| Auth validation/Argon2id dan guard development | PASS 3 + 3 tes |
| REST API Phase 3 | PASS 12 kelompok |
| UI Guru–Siswa/event/milestone/submission/grade/report | PASS 11 kelompok |
| Audit frontend/ekspor 40 peserta | PASS 7 kelompok |
| Dashboard assessment lama, filter/detail/fokus keyboard | PASS 25 cek |
| Inventaris route/role/logout | PASS 51 cek, tanpa runtime/console/HTTP error atau diagnostic Instant Navigation |
| Login/register/RBAC/expiry/revocation/CSRF/rate limit | PASS 15 kelompok |
| UI/UX API + dashboard baru | PASS 13 kelompok |
| Responsive dashboard hasil UI/UX | PASS 320/768/1440 px untuk Guru dan Siswa |
| Dependency production audit | 0 temuan; tooling development masih 7 moderat yang sudah ada |

Tes UI/UX memverifikasi 401/403/404, larangan tulis Siswa, kepemilikan Guru,
Student/event isolation, payload strict dan skor/timestamp invalid, idempotent
create/retry, natural-key duplicate, dua concurrent PATCH menghasilkan 200/409,
status maju/final immutable, lima snapshot history nyata, serta trigger DB
append-only. Nilai milestone dan hasil Uji Kompetensi/Technostress tidak berubah
oleh operasi UI/UX. Dashboard pada sesi terpisah memperlihatkan nilai/feedback
persisten serta pembaruan polling setelah create/update tanpa reload.

Runner dashboard lama diperbaiki agar pemeriksaan posisi ringkasan juga valid
ketika tidak ada draf event; sebelumnya tes selalu mengasumsikan draf tersedia.
Tidak menambahkan draf palsu ke aplikasi untuk meloloskan tes. Suite yang memakai
angka seed dijalankan sebelum pembuatan hasil UI/UX internal baru.

Belum diuji/diimplementasikan: provider atau partner authentication, deployment,
akses internet lintas origin, instrumen/skoring kuesioner, load test, seluruh
browser, audit penetrasi independen, serta mekanisme koreksi final/supersedes.
