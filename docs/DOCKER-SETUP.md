# Menjalankan Bojong United dengan Docker

Gunakan panduan ini untuk pengembangan lokal dan pengujian dengan data fiktif.
Sediakan Git, akses ke repository privat, serta Docker Desktop dengan Linux
containers dan Docker Compose. Build pertama membutuhkan internet untuk image
dasar, paket npm, dan font Next.js. Node.js dan PostgreSQL tersedia di container.

## Mulai dari clone baru

```bash
git clone https://github.com/icannns/smk-lugina-capstone.git
cd smk-lugina-capstone
docker compose up --build -d --wait
```

Buka **http://localhost:3000/login** saat perintah selesai. Nama project default
adalah `bojong-united-local`. Saat memakai salinan kedua, pilih nama project dan
port berbeda untuk mendapat satu set volume tersendiri. Berikut caranya di
PowerShell.

```powershell
$env:BOJONG_PORT = '3001'
docker compose -p bojong-united-qa up --build -d --wait
```

Untuk shell Bash gunakan `BOJONG_PORT=3001 docker compose -p bojong-united-qa up --build -d --wait`.
Buka `http://localhost:3001/login` dan sertakan `-p bojong-united-qa` pada perintah
berikutnya untuk project kedua. Jika menjalankan ulang dengan `up`, gunakan port
yang sama agar origin Auth.js tetap sesuai. Saat mengubah kode, jalankan kembali
perintah `up --build` untuk membangun image. [Referensi Compose](https://docs.docker.com/reference/cli/docker/compose/up/)

## Login akun demo

Jalankan perintah ini di terminal pribadi untuk melihat password acak milik
project Compose yang sedang berjalan.

```bash
docker compose exec web node docker/local.mjs accounts
```

| Username | Akses |
| --- | --- |
| `rina.guru` | Dashboard Guru |
| `dimas` | Dashboard Siswa |
| `aisyah` | Dashboard Siswa |

Password berbeda antara akun dan antara project Compose baru. Simpan keluaran
perintah di terminal pribadi. Hindari menyalinnya ke log, tangkapan layar,
group chat, atau Git. Provisioning mengisi hash akun demo yang belum memiliki
password. Login dan data akun tetap tersedia setelah container dimulai ulang.

## Yang disiapkan Compose

1. `credentials` membuat password PostgreSQL, `AUTH_SECRET`, dan tiga password
   demo acak di volume lokal. File yang sudah ada dipertahankan.
2. `postgres` memulai PostgreSQL 17 dan menjalankan healthcheck koneksi TCP.
3. `db-init` menjalankan `prisma migrate deploy` dan `npm run auth:provision`
   pada `bojong_united_test_docker`. Keduanya perlu berhasil sebelum `web` mulai.
4. `web` menjalankan build Next.js dengan healthcheck `/login`.

`web` dan `db-init` berbagi namespace jaringan PostgreSQL agar keduanya dapat
memakai koneksi loopback sesuai guard provisioning dan storage QA. PostgreSQL
mendengarkan hanya pada `127.0.0.1:5432` di namespace itu. Hanya HTTP yang
dipublikasikan ke loopback host. File unggahan memakai volume `attachments`
di luar `public`, dengan akses melalui route aplikasi.

| Pengaturan | Nilai dan cakupan |
| --- | --- |
| `BOJONG_PORT` | Port HTTP host, default `3000`. Compose menyesuaikan `AUTH_URL`. |
| `AUTH_URL` | `http://localhost` dengan port yang dipilih. Gunakan alamat itu di browser. |
| `DATABASE_URL` | Dibentuk di container untuk PostgreSQL QA Docker yang terisolasi. |
| `AUTH_SECRET` dan `TEST_*_PASSWORD` | Dibuat saat bootstrap dan disimpan di volume kredensial. Isi `.env` setup manual tidak diperlukan. |
| `FILE_STORAGE_DRIVER` | `local` dengan override QA dan direktori volume `/var/lib/bojong/attachments`. |

## Log dan troubleshooting

```bash
docker compose ps -a
docker compose logs credentials postgres db-init
docker compose logs -f web
```

- **Engine Docker belum tersedia.** Buka Docker Desktop, pilih Linux containers,
  lalu pastikan `docker version` menunjukkan bagian Server.
- **Port berpindah atau sudah dipakai.** Pilih `BOJONG_PORT` yang tersedia sebelum
  `up`. Buka aplikasi melalui `http://localhost` dengan port yang ditampilkan Compose.
- **Login gagal atau origin ditolak.** Cek `db-init` selesai dengan kode 0, gunakan
  URL `localhost` yang sesuai, lalu baca password dari project yang sama.
- **Database gagal sehat atau migrasi gagal.** Baca log `postgres` dan `db-init`.
  Startup menunggu dependensi sehat dan provisioning berhasil. Simpan volume
  database dan kredensial sebagai satu set saat membuat cadangan atau memulihkan data.

## Hentikan atau mulai lagi

```bash
docker compose stop
docker compose up -d --wait
```

`docker compose down` juga mempertahankan named volume. Pertahankan volume
`postgres-data`, `attachments`, `app-auth`, dan `db-auth` untuk menjaga data,
lampiran, dan akun. Opsi `down -v` menghapus volume tersebut. [Referensi down](https://docs.docker.com/reference/cli/docker/compose/down/)

## Batas keamanan dan deployment

Stack ini memakai akun fiktif, HTTP loopback, dan penyimpanan privat lokal untuk
QA. Akses Docker Desktop memungkinkan pengguna laptop membaca volume lokal.
Untuk deployment, siapkan secret manager, TLS, provisioning akun terkontrol,
PostgreSQL terkelola, dan penyimpanan privat sesuai panduan proyek.
[Panduan Auth dan RBAC](AUTHENTICATION-RBAC.md).
[Panduan lampiran](FILE-UPLOAD-ATTACHMENTS.md)

Next.js dipatch dari `16.4.3` ke `16.4.6` untuk menangani advisori yang tercatat
pada baseline. Kedua advisori cache yang dibahas saat UAT telah dipatch mulai
`16.4.5`. Lockfile juga mengunci `effect` yang dipakai Prisma ke `3.22.1` untuk
menangani temuan dependensi terpisah. `npm audit` pada lockfile baru melaporkan
nol temuan. Audit tersebut mencakup paket npm pada waktu pemeriksaan.
[Advisori Next.js pertama](https://github.com/advisories/GHSA-mfr8-8qww-v76h),
[advisori Next.js kedua](https://github.com/advisories/GHSA-vc7v-qv4w-wrv8),
[rilis Next.js 16.4.6](https://github.com/vercel/next.js/releases/tag/v16.4.6),
[advisori Effect](https://github.com/Effect-TS/effect/security/advisories/GHSA-7589-6fvf-x4pw)

## Hasil verifikasi lokal

Pada 20 November 2026, clone baru dari `main` di `a780066` diberi patch lokal
Docker untuk diuji. Clone memulai stack tanpa `.env`, `node_modules`, atau
volume project sebelumnya. Pengujian memakai Docker Desktop dengan Linux
containers, Engine 29.9.2, Compose 5.6.1, dan Microsoft Edge headless.

| Pemeriksaan | Hasil |
| --- | --- |
| Build dan startup | Image dibangun. PostgreSQL dan Next.js sehat. Enam migrasi selesai dan ketiga akun demo tersedia. |
| Login dan akses | Guru, Dimas, dan Aisyah berhasil login. Logout memutus akses, dan login ulang memulihkannya. Route Guru dan lampiran milik Siswa lain menolak akses yang tidak berhak. |
| Alur Guru–Siswa | Guru menerbitkan event. Siswa enroll, mengunggah PDF asli, dan mengumpulkan tugas. Guru menyimpan nilai dan feedback yang kemudian tampil di Portofolio Siswa. |
| Restart dan provisioning ulang | Event, enrollment, penilaian, feedback, sesi aktif, dan checksum PDF bertahan setelah restart PostgreSQL dan web. Menjalankan ulang provisioning mempertahankan data dan akun. |
| Pembuatan ulang container | `down` lalu `up` pada port 3101 mempertahankan kredensial, enrollment, dan byte PDF. Login berhasil dengan origin baru. |
| Pemeriksaan tambahan | ESLint, TypeScript, validasi Prisma, 37 tes unit, dan audit npm lulus. |
