# Autentikasi PostgreSQL dan RBAC — Backend Phase 2

> **Status terkini (Backend Phase 4B):** alur event, enrollment, tugas,
> penilaian, portofolio, laporan, dan profil memakai REST API + PostgreSQL.
> Autentikasi memakai Auth.js dan otorisasi server. Schema kini memiliki **29
> model**. Lampiran berupa berkas nyata di storage privat, dengan metadata dan
> versi tersimpan di PostgreSQL. Hasil UI/UX internal terpisah dari nilai rubrik
> milestone. Provider eksternal belum terintegrasi. Uraian fase terdahulu di bawah
> adalah catatan historis, bukan mode fallback aplikasi saat ini. Acuan terbaru:
> [REST API](BACKEND-REST-API.md), [UI/UX internal](UI-UX-ASSESSMENT-API.md), dan
> [upload lampiran privat](FILE-UPLOAD-ATTACHMENTS.md).


## Status pada Phase 2 (historis)

Login email/username dan password kini memakai **Auth.js + PostgreSQL**.
Registrasi publik membuat **Siswa**, bukan Guru. Data event, milestone,
penilaian halaman pembelajaran, portofolio, laporan dan profil tampilan tetap
mock/sessionStorage sampai Backend Phase 3. Sesi lintas browser sudah nyata;
data pembelajaran **belum** tersinkron lintas browser/perangkat.

Baseline: merge PR #4 (`b7e580f`) yang sudah mencakup migrasi root PR #2,
dashboard asesmen PR #3, serta 22 model database Phase 1. Tidak ada User kedua,
framework backend terpisah, OAuth Google, deployment, atau migrasi DB produksi.

## Versi dan arsitektur

- Next.js 16.4.3, React 19.3.0, Prisma/client/adapter 7.10.1 tetap dipertahankan.
- `next-auth` **5.0.0-beta.32** (Auth.js v5) dipin eksplisit; peer range mencakup
  Next.js 16 dan React 19. Versi v5 masih beta dan perlu diuji ulang saat upgrade.
- `argon2` **0.45.2**, Argon2id `memoryCost=19456` KiB, `timeCost=2`,
  `parallelism=1`, salt acak per hash. Verifikasi akun tidak ditemukan tetap
  menjalankan verifikasi dummy hash; runtime tidak mempunyai fallback/master
  password. Contoh password demo lokal di README hanya aktif setelah provisioning
  opt-in pada database yang diizinkan.
- `src/auth.ts`: Credentials provider + JWT session, callback mengambil
  identitas/role/profil dari database, tidak dari input maupun session.update.
- Tidak memakai Prisma Adapter Auth.js: Credentials melakukan lookup/provision
  sendiri melalui Prisma. Tabel Account/OAuth belum diperlukan. Ini tetap
  strategi sesi **JWT**, bukan adapter database-session Auth.js.
- JWT terenkripsi dikelola Auth.js pada cookie HttpOnly/SameSite=Lax. HTTPS
  harus digunakan saat deployment agar cookie Secure. Tidak ada token,
  password, salt/digest password atau hash yang ditulis ke Web Storage.

## Perubahan schema dan sesi

Migrasi baru: `prisma/migrations/20261112000300_authentication/migration.sql`.
Migrasi Phase 1 tidak diubah; kolom nullable tidak menghapus data lama.

| Perubahan | Tujuan |
| --- | --- |
| `User.passwordHash` nullable | Hash Argon2id; user seed Phase 1 tanpa hash belum dapat login. CHECK menolak format non-Argon2id. |
| `User.passwordChangedAt`, `disabledAt` | Pembatalan sesi setelah perubahan credential/nonaktif; belum ada admin UI/password reset. |
| `LoginSession` | Record pencabutan dan absolute expiry per login, FK ke User dan indeks user/expiry; tidak menyimpan JWT atau password. |
| `AuthRateLimit` | Counter 15 menit dan HMAC key; tidak menyimpan email/IP mentah. |

Total model menjadi **24**. ID tetap: User `teacher-rina`, `student-dimas`,
`student-aisyah`; profile `rina`, `dimas`, `aisyah`. Registrasi baru memakai ID
User dan StudentProfile berbeda yang dibuat server. Identity browser lama
`google-dimas`/mock registered tidak diimpor menjadi akun database.

Sesi maksimum absolut: **8 jam** bila Ingat Saya aktif, **1 jam** bila tidak.
Cookie JWT dapat dirotasi oleh Auth.js, tetapi record expiry DB tidak diperpanjang.
Setiap pembacaan Auth.js memeriksa grant, expiry, revocation, role/profil,
nonaktif dan passwordChangedAt dari DB. Tidak ada cache role lintas request.
Logout mencabut **sesi login itu saja**, kemudian cookie dihapus dan navigasi
penuh membersihkan tampilan route lama. Replay cookie sesi yang dicabut ditolak.
Administrator kelak harus mencabut grant ketika menonaktifkan/mengganti password;
callback juga menolak grant yang sudah tidak sesuai. DB harus tersedia agar
pencabutan bisa dicatat; layanan ini fail-closed dan bukan autentikasi offline.

SessionProvider memperbarui pada fokus dan tiap 60 detik. UI terbuka dapat
menampilkan mock lama sampai refetch; setiap navigasi dan API tetap diperiksa
server. Pengguna pada tab browser yang sama berbagi cookie akun; untuk dua
akun bersamaan gunakan browser/profile/context yang terpisah.

## Server-side RBAC

`src/proxy.ts` mencocokkan **semua `/guru/*` dan `/siswa/*`** sebelum halaman/RSC
terlayani. Tanpa sesi -> `/login`; role salah -> dashboard role sendiri.
RoleGate client hanya menangani UX dan loading, bukan otoritas keamanan.
Layout tetap merender children agar tidak mengulangi masalah Instant Navigation.
Wrapper lazy Auth.js di-await sebelum dipanggil sebagai Proxy (runtime library
versi ini mengembalikan wrapper async). Asset, CSS dan route Auth tidak masuk
matcher. Response terlindungi memakai private/no-store.

Setiap handler data memanggil `requirePrincipal()` lagi dan query selalu
mengikat identitas server. Helper ownership tersedia untuk event, rubrik dan
assessment. Halaman mock bukan tempat penyimpanan data pribadi server.

| Role | Batas akses |
| --- | --- |
| TEACHER | `/guru/*`; event dan rubrik milik profil Guru sendiri; Siswa yang ter-enroll pada event miliknya; assessment pada event miliknya. |
| STUDENT | `/siswa/*`; profil sendiri; referensi hasil asesmen sendiri; event yang diikuti; assessment versi tugas miliknya. |
| Tidak login | Halaman autentikasi; registrasi Siswa yang divalidasi; tidak mendapat payload data privat. |

Endpoint read terbatas untuk menguji fondasi otorisasi, **belum adapter UI CRUD**:

- `GET /api/me`: principal sendiri, tanpa hash/token/record sesi.
- `GET /api/assessment-results`: Siswa hanya record sendiri. Guru hanya hasil
  terkait event miliknya; hasil tanpa event tidak dibuka ke Guru sampai kebijakan
  akses disepakati. `studentId` tidak dapat mengganti identitas Siswa.
- `GET /api/events/[eventId]`: pemilik Guru atau Siswa yang ter-enroll.
- `GET /api/rubrics/[rubricId]`: Guru pemilik rubrik.
- `GET /api/students/[studentId]`: Guru dengan enrollment pada event miliknya;
  hanya ID/nama minimal, bukan seluruh data akun.
- `GET /api/assessments/[assessmentId]`: pemilik event Guru atau pemilik tugas Siswa.

API gagal dengan JSON `{error:{code,message}}`: **401 UNAUTHORIZED** tanpa sesi,
**403 FORBIDDEN** untuk akses tak berhak, **503 UNAVAILABLE** pada kegagalan
layanan yang ditangkap. Tidak membedakan ID resource asing dan ID tidak ada.
Auth.js memiliki protokol error sendiri: callback Credentials mengembalikan
redirect error generik; mode X-Auth-Return-Redirect memberi JSON URL dengan HTTP
200 walaupun credential ditolak. Tes memeriksa error code dan sesi kosong,
bukan menganggap HTTP 200 sebagai login berhasil.

## Login, registrasi dan Google

Login memvalidasi string identifier maksimal 320 dan password maksimal 128.
Email/username dinormalisasi lowercase. Credential salah memberi pesan generik,
tanpa mengungkap apakah akun ada/nonaktif. Tidak menampilkan password tester.

`POST /api/auth/register` menerima hanya name/email/password/confirm. Validasi
server: nama 2–100 karakter, email valid maksimal 320, password 8–128, huruf
besar+kecil dan angka/simbol, konfirmasi sama. Field role, ID, isDemo dan field
asing ditolak. Insert User + StudentProfile atomik, role STUDENT dipilih server.
Belum ada verifikasi email atau pemulihan password; identitas email belum terbukti
milik pendaftar. Duplikasi memberi 409 tanpa rincian database.

Registrasi memeriksa Origin terhadap AUTH_URL; login/logout/update sesi memakai
CSRF Auth.js. Body POST dibatasi 16 KiB sebelum diproses. Tidak ada Google
provider: S03 tetap tersedia sebagai **pratinjau desain non-authenticated**.
Submit tidak menyimpan profil, membuat akun, atau memberi sesi. Layout, aset
S01–S04 dan password visibility tetap dipertahankan; teks status diubah agar
membedakan autentikasi nyata dari data pembelajaran contoh.

## Rate limiting

Counter PostgreSQL di-increment atomik per window 15 menit, lintas proses app:
10 percobaan login per identifier; counter identifier dihapus setelah login
berhasil. Registrasi maksimal 5 per email. Counter jaringan juga membatasi
semua upaya: 50 bila trusted proxy IP tersedia, 200 untuk jaringan tidak diketahui.

`AUTH_TRUST_PROXY_HEADERS=false` default: jangan percaya X-Forwarded-For dari
klien langsung. Aktifkan hanya jika ingress yang dipercaya menimpa/membersihkan
header. Bucket jaringan bersama dapat membatasi banyak tester dalam satu NAT;
limit per identifier juga dapat dipakai menyerang availability suatu akun.
Untuk produksi masih perlu kebijakan abuse/CAPTCHA/monitoring dan validasi
konfigurasi proxy. Counter tidak berisi raw identifier, tetapi tetap metadata
keamanan. Job pemeliharaan perlu menghapus counter/grant yang kedaluwarsa sesuai
retensi yang disepakati; belum ada job otomatis/destructive cleanup.

## Environment dan setup lokal

Gunakan Node sesuai package.json dan PostgreSQL lokal sendiri. Jangan arahkan
perintah pengujian/seed ke produksi. Mulai dari `.env.example`, ganti placeholder
DB/password sesuai [panduan database](DATABASE-FOUNDATION.md).

| Variabel | Fungsi |
| --- | --- |
| `DATABASE_URL` | Koneksi PostgreSQL server/CLI; bukan NEXT_PUBLIC. |
| `AUTH_SECRET` | Random setidaknya 32 karakter; placeholder ditolak; simpan dalam secret manager saat deployment. |
| `AUTH_URL` | Origin kanonis, contoh lokal `http://localhost:3000`; HTTPS untuk deployment. |
| `AUTH_TRUST_PROXY_HEADERS` | false kecuali ingress benar-benar dipercaya. |
| `ALLOW_DEV_SEED`, `NODE_ENV` | Guard seed/provision: true dan development/test pada command lokal. |
| `ALLOW_DEV_ACCOUNT_PROVISION` | Opt-in tambahan true khusus provisioning tester. |
| `TEST_TEACHER_PASSWORD`, `TEST_DIMAS_PASSWORD`, `TEST_AISYAH_PASSWORD` | Tiga password tester berbeda. Template membiarkan nilainya kosong. Docker mengisi nilai acak saat bootstrap. |

```powershell
npm ci
# Edit .env lokal dengan koneksi development; jangan commit.
docker compose -f compose.db.yml up -d
npm run db:migrate:deploy
npm run db:migrate:status
```

Generate secret ke environment terminal tanpa mencetak nilainya ke log:

```powershell
$env:AUTH_SECRET = node -e "process.stdout.write(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Gunakan secret yang sama pada semua instance aplikasi. Simpan secara privat
untuk restart; mengganti secret membatalkan cookie lama. Jangan menaruh secret
pada NEXT_PUBLIC, repository, screenshot atau log CI.

## Provisioning akun pengujian

Perintah hanya menerima DB localhost bernama `bojong_united_dev/test` (suffix
boleh). Ini pencegah salah target, bukan jaminan keamanan koneksi tunnel.
Tidak menyediakan endpoint pembuatan Guru. Tidak berlaku untuk produksi.

1. Siapkan tiga password **berbeda**, masing-masing 12–128 karakter dan
   sesuai persyaratan UI. Masukkan melalui environment atau secret manager.
   Docker melakukan langkah ini secara otomatis dan menyediakan opsi password
   bersama khusus project Docker QA baru. [Panduan Docker](DOCKER-SETUP.md#opsional-satu-password-untuk-tiga-akun-demo)
2. Set NODE_ENV=development, ALLOW_DEV_SEED=true,
   ALLOW_DEV_ACCOUNT_PROVISION=true di terminal provisioning.
3. Isi TEST_*_PASSWORD dari vault atau buat secara acak dan bagikan ke tester
   melalui kanal privat yang disetujui.
   Script **tidak mencetak** password/URL.
4. Jalankan `npm run auth:provision`. Command menjalankan seed idempoten,
   memverifikasi ID/role/isDemo, lalu mengisi hash hanya jika masih null.
   Menjalankan ulang tidak mengganti password yang sudah diprovisikan.
5. Hapus variable opt-in dan NODE_ENV development dari terminal app/build.
   Password tester tidak diperlukan oleh server app untuk memverifikasi hash.

| Identitas fiktif | Username | Email | Role / profile |
| --- | --- | --- | --- |
| Rina | rina.guru | guru@example.com | TEACHER / rina |
| Dimas | dimas | siswa@example.com | STUDENT / dimas |
| Aisyah | aisyah | aisyah@example.com | STUDENT / aisyah |

Tim deployment dapat membuat database QA/staging khusus dengan proses ini
melalui koneksi localhost yang diperiksa; jangan memakai data produksi pada DB
tersebut. Provisioning akun produksi, reset/rotasi password dan akun Guru lain
memerlukan workflow admin terkontrol berikutnya. Jangan mematikan guard agar
command ini berjalan terhadap DB produksi.

Frontend build tetap dapat berjalan tanpa URL/secret karena config/client lazy.
Login nyata memerlukan DB, migration, secret dan akun yang sudah diprovisikan.
CI/build stage perlu `npm ci` lengkap (Prisma CLI devDependency dibutuhkan
postinstall/generate); jangan menghilangkan devDependencies sebelum generate/build.

Jalankan `npm run dev` atau `npm run build` + `npm run start` dari root; gunakan
NODE_ENV standar Next, jangan NODE_ENV=test/development untuk server produksi.
Tidak ada akun default atau fallback ke autentikasi mock.

## Testing dan batas keamanan

```powershell
npm run db:validate
npm run db:generate
npm run test:db:safety
npm run test:auth
npm run lint
npm run build
node node_modules/typescript/bin/tsc --noEmit --incremental false
node --test tests/audit-regressions.test.mjs tests/assessment-results.test.mjs
```

`npm run test:auth:browser` membutuhkan server aktif, DB **test disposable**,
NODE_ENV=test, ALLOW_DEV_SEED=true, ketiga TEST_*_PASSWORD, AUDIT_BASE_URL dan
PLAYWRIGHT_MODULE bila tidak terpasang biasa. Runner membuat akun/resource
fiktif di DB test dan memanipulasi expiry untuk menguji penolakan; jangan pakai
DB development manual. Tes DB Phase 1 memakai fixture DB tersendiri agar
assertion data demo awal tidak bercampur akun registrasi publik dari tes Auth.

Regresi browser lama memakai password environment yang sama; tidak ada password
hardcoded atau bypass sessionStorage lagi. Petunjuk ada di [tests](../tests/README.md).
Bukti screenshot/log disimpan di temporary OS di luar Git.

Belum ada klaim kesiapan produksi: perlu HTTPS/ingress tervalidasi, email
verification, reset password, administrasi akun, secret rotation/backup,
retensi sesi/counter dan audit akses, load/concurrency testing, hardening dan
review independen. Dependensi Auth.js beta harus dipantau. Mock business data
bersifat publik/fiktif dan dapat dimodifikasi di browser; bukan database atau
otorisasi produksi. API private yang baru tidak memakai record mock klien.

Backend Phase 3: adapter REST CRUD, validasi domain/ownership transaksi,
persistensi event/enrollment/submission/rubrik/assessment, profil, upload storage,
laporan server, serta kontrak provider FOMO/COMMIT. Identitas/role sesi harus
terus digunakan; jangan menerima studentId/userId pemilik dari klien tanpa scope.

## Hasil verifikasi aktual ? 12 November 2026

| Pemeriksaan | Hasil |
| --- | --- |
| `npm ci` dan postinstall generate tanpa URL/secret | Lulus |
| Prisma validate/generate, ESLint, TypeScript mandiri, build produksi | Lulus tanpa koneksi DB/secret saat build |
| Migrasi tiga tahap pada PostgreSQL 17 disposable; replay baru, deploy ulang dan status | Lulus, tidak ada migrasi tertunda; migrasi Phase 1 tidak diubah |
| Diff live DB/schema dan migrations/schema dengan shadow DB berbeda | Tidak ada perbedaan |
| Tes guard DB, validasi/Argon2id dan integritas DB | 3 + 3 + 10 lulus |
| Provisioning tiga akun, rerun idempoten, penolakan production/opt-in mati | Lulus; tidak ada password yang dicetak |
| Tes Auth/RBAC browser/API | 15 kelompok lulus: login/logout, invalid password, CSRF, registrasi, role/user injection, ownership, data isolation, expiry, disabled account, replay, cookie palsu, body limit, rate limit dan responsive auth |
| Node regresi frontend | 16/16 lulus |
| Browser route/peran | 51/51, tanpa runtime/console/HTTP error dari runner |
| Browser dashboard asesmen | 25/25, aset termuat dan isolasi Dimas/Aisyah/akun baru |
| Browser regresi audit | 8 kelompok lulus, termasuk PDF/XLSX dan layout 320/768/1440 |
| Smoke same-tab publish/enroll/submit/grade/revision/Reports/Portfolio | 9 pemeriksaan lulus dengan login DB nyata dan data bisnis mock |
| Audit dependency runtime | 0 temuan |
| Audit penuh | 7 moderate existing di rantai development ESLint; tidak ada high/critical; versi dependency lama tidak berubah |
| Workspace lama / audit reports | HEAD, status dan hash semua file baseline pada tiga worktree tetap sama |

Matcher awal sempat mengalihkan SVG bersama di `public/guru` ketika diakses
Siswa. Temuan ini sudah diperbaiki dengan pengecualian aset statis dan tes
SVG anonim/Siswa; assertion gambar pada runner tetap dijalankan. Komponen
layout/ilustrasi autentikasi diperiksa melalui screenshot lokal; tidak ada
klaim audit ulang pixel-perfect Figma. Auth.js beta diuji pada Node 24.15.0,
Windows dan Edge headless; deployment/cloud/Linux/load belum diuji.

DB QA terisolasi, bukan produksi. Kredensial dan bukti test berada di temporary
OS di luar Git. Akun QA yang diprovisikan di database disposable bukan akun
produksi dan tidak otomatis tersedia pada database tim lain.

## Referensi resmi

- [Auth.js installation](https://authjs.dev/getting-started/installation?framework=Next.js).
- [Credentials provider](https://authjs.dev/getting-started/authentication/credentials).
- [Next.js integration](https://authjs.dev/reference/nextjs).
- Panduan Next.js versi terpasang: `node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md` dan file convention `proxy.md`.
