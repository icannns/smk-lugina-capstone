# Kesiapan Handover Bojong United

**PASS untuk handover teknis pada snapshot integrasi yang memuat dokumen ini.** Bukti mencakup 46 skenario UAT dan pengujian Docker lokal. Sign-off deployment produksi merupakan pemeriksaan terpisah.

## Setup tim dari clone

Buka Docker Desktop dalam mode Linux containers. Panduan ini memakai `main` setelah rilis integrasi.

```bash
git clone --branch main https://github.com/icannns/smk-lugina-capstone.git
cd smk-lugina-capstone
docker compose up --build -d --wait
docker compose exec web node docker/local.mjs accounts
```

Buka `http://localhost:3000`. Perintah terakhir menampilkan akun `rina.guru`, `dimas` dan `aisyah` beserta password acak khusus project ini. Gunakan terminal pribadi. Volume `db-auth` dan `app-auth` menyimpan kredensial, `postgres-data` menyimpan database, dan `attachments` menyimpan lampiran. Pertahankan empat volume sebagai satu set. Jalankan `docker compose stop` untuk menghentikan layanan dan `docker compose up -d --wait` untuk menyalakan kembali. Panduan log, port alternatif dan pemulihan environment ada di [Docker Setup](DOCKER-SETUP.md).

## Yang telah diperiksa

- UI Guru dan Siswa serta autentikasi bersama berjalan pada PostgreSQL dengan Prisma dan Auth.js/RBAC.
- Enam migrasi dan dua pemeriksaan drift berhasil. Migrasi dijalankan sebagai langkah terpisah sebelum aplikasi menerima trafik.
- Alur Guru → registrasi Siswa baru → enrollment → berkas privat → penilaian → revisi → nilai ulang → Laporan dan Portofolio berjalan tanpa API tiruan.
- Akun demo, data dan lampiran bertahan setelah restart Docker. Provisioning berulang mempertahankan kredensial yang ada.
- 46 dari 46 skenario workbook lulus pada pengujian ulang otomatis. Kedua aksi Monitoring berfungsi dan seluruh temuan audit sudah ditutup. [Daftar bug](FINAL-BUG-REGISTER.md).

## Persyaratan staging dan produksi

| Area | Yang perlu disiapkan dan dibuktikan oleh tim deployment |
| --- | --- |
| Runtime | Gunakan versi Node yang didukung dan sesuai lockfile. Bangun image staging/produksi dengan kebijakan patch base image dan scanner OS/paket. Verifikasi start serta rollback rilis pada platform target. |
| Auth dan ingress | Tetapkan `AUTH_URL` HTTPS yang kanonis dan `AUTH_SECRET` acak dari secret manager. Pertahankan `AUTH_TRUST_PROXY_HEADERS=false` kecuali ingress dipercaya dan dikonfigurasi dengan benar. Uji cookie HTTPS, origin, expiry, login, logout, pembatasan akses dan rate limit di belakang ingress. |
| Database | Sediakan PostgreSQL terkelola atau jaringan privat dan `DATABASE_URL` dari secret manager. Validasi versi server, parameter koneksi, kredensial dengan izin minimum, backup serta pemulihan. Uji `prisma migrate deploy` pada salinan staging dan verifikasi integritas pascamigrasi. |
| Akun | Sediakan akun institusi dengan proses administrasi yang disepakati. Provisioning demo pengembangan menyasar database lokal dengan opt-in khusus. Hilangkan opt-in seed dan QA dari environment produksi. |
| Penyimpanan | Set `FILE_STORAGE_DRIVER` eksplisit. Untuk opsi S3, siapkan bucket privat, region, prefix, identitas runtime dan enkripsi sesuai platform. Uji upload, preview, download lintas perangkat, checksum, retensi, cleanup dan pemulihan objek bersama database. |
| Observabilitas | Pastikan log, error handling, pemantauan healthcheck, alert, dan backup DB maupun objek dapat dioperasikan. Lindungi cookie, credential, dan detail siswa dari log. Uji beban dan ukuran request yang diterapkan oleh ingress terhadap batas aplikasi. |

Rujukan konfigurasi. [Auth dan RBAC](AUTHENTICATION-RBAC.md) · [Prisma dan PostgreSQL](DATABASE-FOUNDATION.md) · [Storage privat](FILE-UPLOAD-ATTACHMENTS.md) · [Kontrak REST](BACKEND-REST-API.md) · [API asesmen internal](UI-UX-ASSESSMENT-API.md)

## Batas handover

Sertifikat adalah dokumen contoh. Google OAuth, integrasi Survey/FOMO/COMMIT dan hasil provider eksternal di luar audit. Pengujian desain memakai empat frame desktop sebagai sampel dan pengujian browser memakai Edge. Penggunaan S3, TLS/ingress, pemulihan backup, dan ketahanan produksi harus dibuktikan pada staging. Salinan laporan memberi dasar review dan penerimaan lokal. [Laporan audit](FINAL-SYSTEM-AUDIT.md)
