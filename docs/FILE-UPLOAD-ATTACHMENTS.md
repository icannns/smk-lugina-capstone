# Upload Privat dan Lampiran Tugas — Backend Phase 4B

## Cakupan dan status

Phase ini melanjutkan main `49306832a0f3dc6cab2d1f61d4974a9d67acf3f6`
(sesudah merge PR #7), tanpa mengganti aplikasi Next.js. File tugas siswa kini
benar-benar diunggah, disimpan privat, dan diakses melalui Auth.js/RBAC.
Metadata PostgreSQL tidak memuat Base64/binary. Tidak ada deployment, integrasi
FOMO/COMMIT, scoring UI/UX baru, atau perubahan bisnis sertifikat.

Adapter lokal sudah diuji dengan PostgreSQL dan browser terisolasi. Adapter S3
tersedia tetapi belum diuji terhadap bucket/provider produksi; konfigurasi cloud,
IAM, malware scanner dan operasional deployment masih harus diverifikasi tim.
Jangan menyamakan hasil QA lokal dengan kesiapan produksi.

## Arsitektur dan data

Route Handler → pemeriksaan Auth.js/Origin/RBAC → `src/server/files/` → Prisma dan
private storage. Download memakai endpoint aplikasi, tanpa URL bucket publik,
presigned URL permanen, atau key/path penyimpanan dalam respons.

Migrasi `prisma/migrations/20261113000200_private_submission_uploads/migration.sql`
menambahkan `SubmissionUpload` dan nullable `SubmissionAttachment.uploadId`.
Schema menjadi 29 model. Lima migrasi sebelumnya tidak diubah.

- `SubmissionUpload` mencatat Student, Enrollment `(eventId,studentId)`, Milestone
  dalam event yang sama, User pengunggah, versi dasar, nama aman, MIME, ukuran,
  SHA-256, object key acak, backend/namespace penyimpanan, request key, kedaluwarsa
  draf, dan status `UPLOADING / READY / FAILED / DELETING / DELETED`.
- Upload dapat terjadi sebelum `Submission` pertama ada. `SubmissionDraft.files`
  menyimpan referensi upload terkonfirmasi, bukan metadata buatan browser.
- Saat pengumpulan, `SubmissionAttachment` menautkan upload ke versi immutable.
  Beberapa versi dapat menunjuk objek immutable yang sama dalam konteks yang sama;
  upload revisi baru selalu mendapat object key baru, tidak menimpa blob versi lama.
- FK, CHECK dan trigger SQL menjaga Student/User, enrollment, event/milestone,
  metadata kanonis, ukuran, format checksum/key dan riwayat berkas. Metadata/identitas
  upload tidak dapat diubah. Referensi versi upload tidak dapat diedit/dihapus;
  upload yang sudah dirujuk tidak dapat dipindah dari READY.
- Lampiran lama dengan `uploadId=null` tetap ada. Tidak ada backfill isi yang tidak
  pernah tersedia. UI menampilkan “Metadata lama; berkas asli tidak tersedia”.

Jalankan migrasi hanya pada DB development/test yang telah dipastikan targetnya:

```powershell
npm ci
npm run db:validate
npm run db:migrate:status
npm run db:migrate:deploy
npm run db:generate
```

Cadangkan DB dan private objects bersama sebelum migrasi lingkungan nyata.
Fase ini tidak menyentuh database produksi/shared.

## Kontrak REST

Semua endpoint membutuhkan cookie sesi Auth.js aktif. POST/DELETE juga memerlukan
Origin yang sama dengan `AUTH_URL`; tidak ada API key, service-to-service auth atau
CORS lintas domain baru. ID dan role siswa tidak diterima dari browser sebagai
sumber otorisasi. Error JSON: `{ "error": { "code": "...", "message": "..." } }`.

| Method dan path | Hak akses dan fungsi |
| --- | --- |
| POST `/api/events/:eventId/milestones/:milestoneId/attachments` | Siswa peserta, milestone dapat diedit; upload pertama/revisi |
| POST `/api/submissions/:submissionId/attachments` | Pemilik submission yang menunggu revisi; staging versi berikutnya |
| GET `/api/submissions/:submissionId/attachments` | Pemilik Siswa atau Guru pemilik event; semua versi yang sudah dikumpulkan |
| GET `/api/attachments/:attachmentId/download` | Pemilik Siswa; Guru pemilik event hanya sesudah file terhubung versi submission |
| GET `/api/attachments/:attachmentId/preview` | Izin sama; PDF, PNG, JPEG saja |
| DELETE `/api/attachments/:attachmentId` | Siswa pemilik, draf editable, belum pernah direferensikan versi |

Upload multipart berisi tepat satu `file`, satu `expectedVersion` (integer >=0;
0 sebelum pengumpulan pertama), dan satu `requestId` unik. Jangan mengirim JSON
Base64. Contoh dari browser dengan sesi aktif:

```ts
const form = new FormData();
form.set("file", selectedFile);
form.set("expectedVersion", String(currentVersion));
form.set("requestId", crypto.randomUUID());
const response = await fetch(`/api/events/${eventId}/milestones/${milestoneId}/attachments`, {
  method: "POST", body: form, credentials: "same-origin"
});
// Jangan memasang Content-Type manual: browser membuat multipart boundary.
```

Respons upload 201 (termasuk retry identik):

```json
{
  "attachment": {
    "id": "UPLOAD_ID",
    "name": "karya.pdf",
    "type": "application/pdf",
    "size": 1234,
    "uploaded": true,
    "checksum": "SHA256_64_HEX",
    "downloadUrl": "/api/attachments/UPLOAD_ID/download",
    "previewUrl": "/api/attachments/UPLOAD_ID/preview"
  },
  "replay": false
}
```

DOCX tidak mendapat `previewUrl`. List: `{ "versions": [{ "version": 1,
"attachments": [attachment] }] }`; legacy attachment berisi `uploaded:false`
tanpa URL unduhan/pratinjau. DELETE JSON: `{ "expectedVersion": 0 }` → 200
`{ "deleted": true }` setelah removal storage terkonfirmasi. Jika storage gagal,
respons error dan record cleanup tetap tersedia; UI tidak mengklaim terhapus.

Save Draft/submission tetap memakai kontrak `{work:{files:[{id,name,size,type}],
text,link},...}` existing. Strip field tampilan `uploaded/checksum/*Url`; server
mencari ID READY milik siswa/event/milestone, memeriksa objek ada, dan memakai
metadata DB. ID palsu/lintas siswa ditolak; metadata browser tidak dipercaya.
`expectedVersion`/`requestId` pengumpulan tetap wajib seperti Phase 3.

Respons file berupa bytes, Content-Type kanonis, Content-Disposition attachment
atau inline dengan fallback ASCII dan filename UTF-8, no-store/private,
nosniff, CORP same-origin, CSP sandbox, dan `X-Checksum-SHA256`. Single byte range
mendukung 206/Content-Range; range invalid 416. Download membaca maksimum 10 MiB
untuk mengecek SHA-256 lalu mengirim potongan 64 KiB. Ini bukan streaming
unbounded langsung dari S3; perhitungkan memori untuk request bersamaan.

Status penting: 400 input/ID invalid, 401 tanpa sesi, 403 bukan pemilik/Origin,
404 objek tidak tersedia, 409 stale/final/history immutable/integritas/konflik,
413 kosong/terlalu besar, 415 format/signature/preview tidak didukung,
429 rate/quota, 503 storage/database tidak tersedia. Tidak ada fallback mock.

## Validasi dan keamanan

- Maksimum lima file per pengumpulan; default 10 MiB = 10.485.760 byte per file.
- PDF, PNG, JPG/JPEG, DOCX; MIME harus cocok dengan ekstensi. Format juga harus
  diizinkan milestone (PDF/Gambar/DOCX). Teks/Hyperlink tetap input terpisah.
- Periksa header/EOF PDF, PNG IHDR/IEND dan dimensi maksimum 40 juta piksel,
  marker JPEG, serta direktori paket ZIP DOCX. Bukan validasi semantik penuh PDF
  atau decoding ulang gambar. Dokumen tidak diekstrak/dieksekusi/diparse isinya.
- DOCX mensyaratkan bagian OOXML utama; tolak traversal, enkripsi, symlink,
  duplikasi entri, macro/ActiveX/embedded executable, >1.000 entri, deklarasi
  uncompressed >100 MiB atau rasio >200. Validasi direktori tidak menjamin isi
  setiap compressed member benar/aman atau bahwa dokumen pasti bisa dibuka Word.
- Body multipart dibatasi sebelum parsing, nama dinormalisasi tanpa slash/control
  character, panjang maksimum 180; object key random 256-bit tidak memakai nama.
- Rate limit PostgreSQL per User: upload 30/menit, download/preview 60/menit.
  Kuota staging 200 MiB/24 jam menghitung reservasi termasuk percobaan gagal dan
  file terhapus. Lock enrollment/Serializable melindungi versi/count; bukan
  global storage quota service. Infrastruktur tetap perlu body/time/concurrency
  limits dan kebijakan retensi bucket, bukan hanya limit aplikasi.
- Retry requestId identik mengembalikan ID sama. Nama+checksum sama dalam draf
  versi sama dideduplikasi. Draf kedaluwarsa atau objek hilang harus dihapus dari
  draf lalu diunggah ulang (atau dibersihkan CLI); retry tidak mengklaim berhasil. Upload bersamaan dapat menghasilkan replay atau 409;
  muat ulang/periksa draf sebelum mencoba ulang setelah timeout.
- Guru tidak melihat draf yang belum dikumpulkan; Guru lain/Siswa lain tidak dapat
  list, preview, download atau menautkan file lewat ID yang diketahui.
- **Belum ada malware/antivirus scanner, content disarm, atau quarantine pipeline.**
  Signature/MIME/DOCX checks bukan jaminan bebas malware. Gunakan berkas latihan
  selama QA. Kebijakan scan produksi harus ditetapkan sebelum menerima data nyata.

## Setup lokal dan variabel lingkungan

Salin `.env.example` ke `.env` yang diabaikan Git. Isi PostgreSQL/Auth.js sesuai
panduan existing. Contoh path tanpa kredensial:

```dotenv
FILE_STORAGE_DRIVER=local
FILE_STORAGE_LOCAL_ROOT=C:/bojong-private/submission-files
FILE_MAX_BYTES=10485760
FILE_DAILY_BYTES=209715200
FILE_UPLOADS_PER_MINUTE=30
FILE_DOWNLOADS_PER_MINUTE=60
```

Path wajib absolut, direktori khusus, di luar public/.next/.git/node_modules,
bukan root disk atau root proyek. `.private-storage/` diabaikan Git bila dipakai
di development. Path eksternal lainnya tetap wajib dikelola di luar Git.
Directory final tidak boleh symlink; key divalidasi 64 hex, file dibuat exclusive,
mode 0600/directory 0700 pada OS yang mendukungnya, fsync sebelum READY. Untuk
Windows, deployment harus memasang ACL privat sendiri; mode POSIX bukan pengganti
ACL. Operator host tetap dipercaya dan bertanggung jawab atas parent directory,
symlink/ACL, kapasitas, backup dan pemulihan.

| Variabel | Arti |
| --- | --- |
| `FILE_STORAGE_DRIVER` | wajib eksplisit `local` atau `s3`, tidak ada fallback |
| `FILE_STORAGE_LOCAL_ROOT` | path absolut privat untuk development |
| `FILE_MAX_BYTES` | default 10485760; batas konfigurasi 1024–10485760; UI menyebut maksimum 10 MB, server boleh lebih ketat |
| `FILE_DAILY_BYTES` | default 209715200, integer >=1024 |
| `FILE_UPLOADS_PER_MINUTE` / `FILE_DOWNLOADS_PER_MINUTE` | default 30 / 60; integer 1–1000 |
| `FILE_S3_BUCKET` / `FILE_S3_REGION` | wajib untuk S3 |
| `FILE_S3_ENDPOINT` | opsional provider S3-compatible, HTTPS tanpa credential/query pada URL |
| `FILE_S3_PREFIX` | default `bojong-submissions/`, private key prefix |
| `FILE_S3_ACCESS_KEY_ID` / `FILE_S3_SECRET_ACCESS_KEY` | secret server, jangan NEXT_PUBLIC/commit/log |
| `FILE_S3_USE_DEFAULT_CREDENTIALS` | default false, opt-in IAM/SDK credential chain |
| `FILE_S3_FORCE_PATH_STYLE` | default false; sesuaikan provider |
| `FILE_STORAGE_ALLOW_LOCAL_TEST` | default false; pengecualian QA production build lokal saja |

`NODE_ENV=production` menolak driver local. Pengecualian QA memerlukan flag
`FILE_STORAGE_ALLOW_LOCAL_TEST=true`, `ALLOW_DEV_SEED=true` dan DATABASE_URL
localhost bernama `bojong_united_test[_suffix]`. Jangan aktifkan flag seed/test
pada deployment. Build frontend sendiri tidak memerlukan DB/storage/secret.

## S3 dan handover deployment

Adapter AWS SDK v3 mendukung endpoint S3-compatible eksplisit; PUT memakai
checksum SHA-256 dan If-None-Match `*`, GET/HEAD/DELETE hanya dari server dengan
timeout. Tidak memasang ACL publik. Tim deployment wajib menyediakan bucket
**privat**, block public access, IAM least privilege ke prefix aplikasi
(PutObject/GetObject/DeleteObject dan kebutuhan checksum provider), TLS, encryption,
backup/retention/versioning sesuai kebijakan, CORS aplikasi bila diperlukan lewat
kontrak terpisah, dan pengujian kompatibilitas checksum/conditional writes.
Bucket/IAM/encryption belum dikonfigurasi atau dibuktikan fase ini.

Namespace hash mencegah salah baca/hapus saat bucket/prefix/root berubah. Mengubah
config tidak memindahkan objek lama; migrasi bytes+metadata membutuhkan prosedur
tersendiri, jangan mengubah namespace record langsung. Jangan memakai storage
filesystem ephemeral serverless atau multi-instance lokal tanpa shared storage.

## Transaksi, cleanup dan retensi

1. Auth/RBAC/editability dan format → reservasi UPLOADING dalam transaksi.
2. Tulis bytes privat dengan key baru di luar transaksi DB.
3. Verifikasi objek dan izin versi lagi → READY + append draft secara atomik.
4. Submit menautkan READY ke versi dalam transaksi/row lock enrollment yang sama.
5. Bila tulis/finalisasi gagal, klaim cleanup hanya jika tidak dirujuk riwayat.
   Catat FAILED/cleanupNeeded sebelum mencoba removal. Kegagalan DB/storage
   meninggalkan key/row untuk retry; tidak menghapus blob yang mungkin terkomit.

```powershell
npm run files:cleanup             # dry-run, tidak menghapus
npm run files:cleanup -- --apply   # target/env diperiksa operator terlebih dahulu
```

CLI memakai DATABASE_URL/storage eksplisit yang sama, maksimal 100 kandidat per
run, menangani failed/incomplete dan staged expired (24 jam). Kandidat dikunci dan
jumlah referensi diperiksa ulang; tandai DELETING dan lepaskan dari draf sebelum
menghapus bytes. DELETED hanya setelah removal terkonfirmasi. Tidak menghapus row
riwayat atau file yang direferensikan submission version. Jalankan berulang melalui
scheduler yang disiapkan deployment; tidak ada cron otomatis pada fase ini.

Expiry membatasi **draf belum dikumpulkan**, bukan retensi versi historis.
Kebijakan penghapusan historis/consent belum ditentukan dan tidak dibuat-buat.
Storage/DB bukan satu transaksi terdistribusi: crash/jaringan dapat meninggalkan
orphan. Reservasi tercatat memungkinkan retry; objek tanpa row akibat restore DB
atau tindakan operator memerlukan rekonsiliasi terkontrol terpisah (jangan delete
massal bucket). Cleanup tidak melakukan inventarisasi/hard-delete objek tak dikenal.

## Workflow UI dan pengujian

Workspace Siswa memakai multipart/XHR progress byte sebenarnya; 100% terkirim
belum dianggap berhasil sampai server mengembalikan READY. Kontrol simpan/kirim/
hapus/picker dikunci selama operasi; error tidak diganti metadata dummy. File asli
tersimpan dalam draf, dapat dihapus sebelum final, dan bertahan setelah refresh.
Monitoring/Karya Guru serta Evidence/Portfolio Siswa memakai komponen lampiran
bersama. PDF/gambar dipratinjau melalui Blob hasil fetch terautentikasi; PDF viewer
bergantung browser/sandbox, gunakan unduh bila tidak tersedia. DOCX unduh saja.
Object URL dibuang saat dialog/komponen ditutup. Tidak ada unduhan `.demo.txt` untuk
lampiran tugas. Lampiran pendukung event/milestone Guru dan aset template sertifikat
masih metadata existing dan memang di luar lingkup phase ini.

Perintah QA: `npm run test:files:unit`, `npm run test:files:api`,
`npm run test:files:browser`; setup/pointer output ada di [tests/README](../tests/README.md).
Gunakan PostgreSQL disposable, temporary private storage, akun test yang disiapkan
lokal dan browser terpisah Guru/Siswa. Jangan memakai database atau storage tim.
Simpan screenshot, checksum, dan hasil suite di luar Git. Setelah restart aplikasi,
jalankan `npm run test:files:api -- restart` dengan direktori output yang sama.

### Hasil aktual QA (13 November 2026)

Pengujian memakai PostgreSQL 17 container baru berlabel phase4b-isolated-qa,
DB bojong_united_test_files/replay/shadow, temporary storage di luar Git, Edge
headless dan sesi Auth.js terpisah. Kredensial dibangkitkan di direktori temp,
bukan repository. Tabel ini memisahkan pemeriksaan aktual dari batas pengujian.

| Pemeriksaan | Hasil |
| --- | --- |
| Clean `npm ci`, Prisma validate/generate | PASS |
| Upgrade lima → enam migrasi | PASS; ID akun dan hash password sebelum/sesudah identik |
| Replay enam migrasi pada DB kosong, seed dua kali | PASS |
| Migrate status, live schema drift, history/shadow drift | PASS; diff exit 0 |
| Database integrity | PASS 10 tes; guard upload/riwayat SQL juga diuji melalui suite file |
| ESLint, TypeScript mandiri, build produksi tanpa DB/secret | PASS; ESLint tanpa warning |
| Unit existing / HTTP assessment / auth / seed safety | PASS 18 / 2 / 3 / 3 |
| Private storage unit (bytes, no overwrite/traversal, config fail closed) | PASS 2 |
| File API (empat format asli, MIME/signature/size, ZIP traversal/encryption, CSRF, RBAC, checksum/range, concurrency, history, fault/expiry cleanup, rate limit) | PASS 13 kelompok skenario pada development dan `next start` |
| Restart aplikasi dengan DB/storage sama | PASS; checksum unduhan tetap sama, juga sesudah perpindahan dev → production build |
| File browser, Student → Teacher → Portfolio/Report | PASS 9 kelompok skenario pada development dan production build |
| Existing REST API | PASS 12; diulang pada production build |
| Existing REST browser | PASS 11; runtime error/failed request tak terduga kosong |
| Existing audit browser | PASS 7 |
| Assessment dashboard / role navigation / Auth.js browser | PASS 25 / 51 / 15 |
| UI/UX internal API dan dashboard Phase 4A | PASS 13; tetap terpisah dari nilai rubrik |
| Responsive Student upload + Teacher assessment | PASS 320/768/1440; screenshot diperiksa, tidak ada overflow dokumen |
| Audit dependency produksi | PASS; `npm audit --omit=dev` menemukan 0 kerentanan |
| Pelestarian enam workspace lama | PASS; branch/HEAD/status dan SHA-256 2.008 file identik, termasuk audit report untracked |
| Dependency lama / secret review | Versi dependency existing tidak berubah; credential QA tidak ditemukan dalam file repo |
| S3 provider nyata, antivirus, pentest independen, load/disaster recovery, seluruh browser | NOT TESTED / belum disediakan |

Install penuh masih melaporkan 7 kerentanan moderate pada dependensi development
existing serta deprecation ESLint 9; tidak dilakukan `audit fix`/upgrade di luar
lingkup. Audit produksi 0 bukan jaminan aplikasi bebas kerentanan.

Screenshot dan hasil runtime disimpan di direktori temp terisolasi di luar Git;
fixture kecil yang dikomit hanya empat dokumen/gambar latihan. Native PDF preview
berhasil mengambil response PDF terautentikasi dan membuka iframe Blob; kualitas
render viewer PDF setiap browser tidak diklaim. Tidak ada klaim pixel-perfect
baru atau pemindaian malware. S3 cloud, beban produksi, backup/restore disaster
dan deployment tidak diuji.

Referensi implementasi: [AWS SDK S3 examples](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_s3_code_examples.html),
[S3 checksums](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/s3-checksums.html),
[yauzl lazy ZIP validation](https://github.com/thejoshwolfe/yauzl/blob/master/README.md).
