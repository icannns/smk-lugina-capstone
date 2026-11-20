# Bojong United — SMK Lugina Rancaekek

Bojong United adalah proyek capstone platform pembelajaran berbasis **event dan
proyek** untuk SMK Lugina Rancaekek. Repository ini berisi aplikasi Next.js
beserta REST API untuk dua peran: **Guru** dan **Siswa**.

Modul Guru dan Siswa terhubung melalui PostgreSQL; seed memakai data fiktif. Guru dapat
menerbitkan event, Siswa mengikuti dan mengumpulkan tugas, lalu Guru memberikan
nilai, feedback, atau permintaan revisi.

> **Status saat ini: autentikasi dan pembelajaran memakai PostgreSQL.**
> Login/Register memakai Auth.js; event, enrollment, draf, tugas berversi,
> nilai, feedback, profil, laporan dan portofolio sudah melalui REST API.
> Lampiran tugas mendukung upload privat asli; hasil provider eksternal tetap referensi DEMO.
> Google OAuth belum tersedia. Lihat [panduan REST](docs/BACKEND-REST-API.md)
> dan [setup autentikasi](docs/AUTHENTICATION-RBAC.md).

Implementasi frontend Guru dan Siswa sudah masuk ke branch `main` melalui
[PR #1](https://github.com/icannns/smk-lugina-capstone/pull/1). Panduan teknis
berbahasa Indonesia tersedia pada bagian [referensi dan panduan tim](#referensi-desain-dan-panduan-tim).

## Fitur yang tersedia

| Bagian | Fitur |
| --- | --- |
| Autentikasi bersama | Login/PostgreSQL, register Siswa, pratinjau Google non-auth, loading, redirect role database, dan logout |
| Guru | Dashboard, pengelolaan data Siswa, daftar/detail event dan draf, wizard pembuatan event, pengelolaan rubrik, monitoring progres, penilaian dan revisi, karya Siswa, laporan PDF/XLSX, serta profil |
| Siswa | Pencarian dan pendaftaran event, dashboard, ruang kerja dan milestone, pengumpulan tugas dan revisi, survei milestone yang sudah dikonfigurasi, portofolio, dokumen sertifikat contoh, serta profil |

Wizard pembuatan event mencakup **Informasi Event → Milestone → Rubrik →
Sertifikat → Tinjau → Terbitkan → Selesai**. Draf yang disimpan dan perubahan
pembelajaran tersimpan di PostgreSQL; ketikan yang belum disimpan tetap di memori.

Menu Guru **Dashboard Survei, Survei Saya, Template Survei, Hasil Survei, Kebijakan
Privasi**, serta menu Siswa **Pengaturan** tetap tampil normal dan dapat ditekan,
tetapi sementara tidak menjalankan aksi sampai modul pemiliknya terintegrasi.
Tombol ini tidak membuka modal atau mengubah URL dan menu aktif. Form survei pada milestone Siswa
yang sudah dikonfigurasi tetap dapat digunakan.

## Teknologi

- Next.js 16 dengan App Router.
- React dan TypeScript.
- Tailwind CSS dan komponen yang digunakan kembali.
- Auth.js Credentials/JWT, Argon2id, PostgreSQL dan Prisma.
- REST API dengan RBAC, transaksi Prisma dan cache frontend yang dipisahkan per akun.
- Aset desain lokal dari Figma.

## Cara menjalankan di laptop

Dengan Docker Desktop dalam mode Linux containers, jalankan perintah berikut
dari root repo.

```bash
docker compose up --build -d --wait
```

Buka `http://localhost:3000`. Compose menyiapkan PostgreSQL, migrasi, dan akun
demo secara otomatis. Panduan berikut menjelaskan cara mengambil password lokal,
mengganti port, dan menghentikan layanan. [Panduan Docker](docs/DOCKER-SETUP.md)

### Alternatif dengan Node.js lokal

#### 1. Siapkan kebutuhan

- Node.js **20.19+, 22.12+, atau 24+**, beserta npm (sesuai dukungan Prisma).
- Git dan akses GitHub ke repository ini karena repository bersifat privat.

#### 2. Ambil proyek dan jalankan frontend

Untuk salinan repository baru:

```bash
git clone https://github.com/icannns/smk-lugina-capstone.git
cd smk-lugina-capstone
npm ci
npm run dev
```

Jika repository sudah tersedia di laptop, jalankan `npm ci` dan `npm run dev`
dari root repository. Tidak perlu masuk ke folder `frontend/`.

Buka alamat yang tercetak di terminal, biasanya **http://localhost:3000**.
Untuk memilih port lain secara eksplisit:

```bash
npm run dev -- --port 3001
```

Login nyata memerlukan database lokal, migrasi, AUTH_SECRET dan provisioning akun
[pada panduan Auth](docs/AUTHENTICATION-RBAC.md). Build tetap dapat berjalan tanpa
koneksi database. Build pertama mungkin memerlukan internet untuk mengunduh
font Inter melalui `next/font`; hasil build menyajikan font secara lokal.

#### 3. Menjalankan hasil build produksi secara lokal

Dari root repository:

```bash
npm run build
npm run start
```

Hentikan server produksi yang sedang berjalan sebelum melakukan build ulang,
lalu jalankan kembali `npm run start` agar browser memakai berkas CSS dan
JavaScript dari build yang sama. Mode ini tetap menggunakan data contoh.

## Database dan akun pengujian

Fondasi PostgreSQL/Prisma, migrasi dan seed fiktif tersedia. Autentikasi memakai
database, begitu juga alur pembelajaran inti melalui REST API. Ikuti [panduan database](docs/DATABASE-FOUNDATION.md)
untuk konfigurasi lokal, batas seed dan koordinasi FOMO/COMMIT. `npm ci` hanya
menghasilkan client Prisma, tanpa migrasi atau seed otomatis.

## Akun demo

Gunakan akun fiktif ini pada database development/test. Secara default, Docker
membuat password acak untuk tiap akun. Project QA baru juga bisa memakai satu
password demo yang ditentukan tim. [Panduan password demo bersama](docs/DOCKER-SETUP.md#opsional-satu-password-untuk-tiga-akun-demo)

| Peran | Username | Email |
| --- | --- | --- |
| Guru | `rina.guru` | `guru@example.com` |
| Siswa - Dimas | `dimas` | `siswa@example.com` |
| Siswa - Aisyah | `aisyah` | `aisyah@example.com` |

Lihat password instalasi Docker sendiri dengan `docker compose exec web node
docker/local.mjs accounts`. Untuk setup Node.js lokal, siapkan database dan
`.env` privat sesuai panduan Auth, lalu isi tiga password berbeda sebelum
menjalankan provisioning. [Panduan Auth](docs/AUTHENTICATION-RBAC.md)

```powershell
$env:NODE_ENV = 'development'
$env:ALLOW_DEV_SEED = 'true'
$env:ALLOW_DEV_ACCOUNT_PROVISION = 'true'
# Sediakan TEST_TEACHER_PASSWORD, TEST_DIMAS_PASSWORD, dan
# TEST_AISYAH_PASSWORD secara privat di .env lokal.
try {
    npm run auth:provision
    if ($LASTEXITCODE -ne 0) { throw 'Provisioning gagal; periksa konfigurasi lokal.' }
} finally {
    Remove-Item Env:TEST_TEACHER_PASSWORD, Env:TEST_DIMAS_PASSWORD, Env:TEST_AISYAH_PASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:ALLOW_DEV_ACCOUNT_PROVISION, Env:ALLOW_DEV_SEED, Env:NODE_ENV -ErrorAction SilentlyContinue
}
```

Script tetap menolak target di luar localhost/dev/test yang diizinkan. Ia tidak
mempunyai fallback login atau master password. **Jika akun pada DB lama sudah
memiliki password, menjalankan ulang provisioning tidak mengganti passwordnya.**
Gunakan password yang ditetapkan sebelumnya atau database QA baru; jangan menghapus
akun/history atau reset database bersama untuk memaksakan password demo.

Password akun disimpan sebagai hash Argon2 di PostgreSQL.

Gunakan username **atau** email pada halaman `/login`. Akun Guru diarahkan ke
`/guru/dashboard`, sedangkan akun Siswa ke `/siswa/dashboard`. Pendaftaran publik
hanya membuat akun Siswa di database; Google hanya pratinjau tanpa login.

## Cara mencoba integrasi Guru dan Siswa

Gunakan **dua profil browser/incognito terpisah** pada origin aplikasi yang sama
untuk login Guru dan Siswa bersamaan, atau bergantian logout/login dalam satu tab.

1. Masuk sebagai Guru, buat event beserta milestone dan rubrik, lalu terbitkan.
2. Logout, kemudian masuk sebagai Dimas.
3. Temukan event yang baru diterbitkan, daftar sebagai peserta, lalu buka ruang
   kerja event tersebut.
4. Simpan draf atau kirim tugas dengan data fiktif.
5. Logout, masuk kembali sebagai Guru, lalu buka Monitoring Progres untuk melihat
   pengumpulan Dimas pada event dan milestone yang sama.
6. Berikan nilai dan feedback, atau kirim permintaan revisi.
7. Masuk kembali sebagai Dimas untuk melihat feedback dan mengirim revisi.
8. Masuk sebagai Guru untuk menilai versi terbaru dan memeriksa pembaruan laporan.

Versi tugas dan nilai sebelumnya tetap berada di riwayat. **Revisi baru harus
dinilai ulang**; nilai versi lama tidak otomatis menjadi nilai versi terbaru.

### Sinkronisasi antarsesi

Data yang sudah disimpan dibaca dari PostgreSQL yang sama, termasuk setelah
refresh/logout atau dari browser lain. Halaman memperbarui cache saat fokus dan
setiap lima detik. Dua tab pada profil browser yang sama berbagi cookie login;
untuk dua akun bersamaan gunakan profil/incognito terpisah. Draf yang belum
menekan Simpan Draf belum dijamin bertahan setelah refresh.

## Batasan prototipe

- Login dan role diperiksa server. Email verification, reset password,
  administrasi akun dan hardening deployment belum tersedia.
- Event baru belum otomatis membuat instrumen survei. Pengumpulan tugas,
  penilaian, feedback, dan laporan dapat dicoba, tetapi penyelesaian tahap yang
  memerlukan survei menunggu integrasi modul Survei.
- Untuk mencoba seluruh alur survei dan dokumen sertifikat contoh, gunakan event
  demo yang instrumen surveinya sudah dikonfigurasi.
- Lampiran tugas PDF/PNG/JPEG/DOCX disimpan privat melalui adapter lokal atau S3.
  Metadata historis tanpa berkas tetap ditandai tidak tersedia; tidak dibuat file pengganti.
- Ekspor laporan PDF/XLSX benar-benar dibuat di browser. Dokumen sertifikat
  merupakan contoh penyelesaian belajar, tanpa penerbitan atau verifikasi resmi
  institusi.
- REST CRUD pembelajaran dan RBAC tersedia. Google OAuth, administrasi Survei,
  serta koneksi provider tim lain belum tersedia. Adapter S3 memerlukan konfigurasi
  privat dan verifikasi deployment; tidak ada fallback lokal otomatis di produksi.
- Catatan dependency development dan perbedaan visual kecil masih didokumentasikan
  dalam panduan handover. Prototipe ini belum dinyatakan siap untuk produksi.

## Struktur folder utama

```text
smk-lugina-capstone/
├── README.md                 # Gambaran produk dan cara menjalankan
├── AGENTS.md                 # Instruksi coding agent Next.js
├── docs/                     # Panduan teknis, modul, dan handover
├── src/
│   ├── app/                  # Halaman dan layout Next.js
│   ├── components/           # Komponen autentikasi, Guru, dan Siswa
│   └── lib/                  # Tipe, data contoh, store, dan selector bersama
├── public/                   # Aset lokal; URL aset tidak berubah
├── tests/                    # Tes regresi dan petunjuk pengujian
├── package.json
├── package-lock.json
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
└── .gitignore
```

Route Guru berada di `/guru/*`, route Siswa di `/siswa/*`, dan halaman autentikasi
digunakan bersama. Store domain utama berada di
`src/lib/guru/event-draft-store.ts`; adaptasi sesi Auth.js berada di
`src/lib/auth/`.

## Menjalankan pemeriksaan

Jalankan dari root repository setelah dependensi terpasang:

```bash
npm run lint
npm run build
node node_modules/typescript/bin/tsc --noEmit --incremental false
node --test tests/audit-regressions.test.mjs
```

Build dijalankan sebelum pemeriksaan TypeScript mandiri agar tipe rute Next.js
seperti `LayoutProps` sudah dihasilkan. Petunjuk tes browser, role, dan Instant
Navigation tersedia di [panduan pengujian](tests/README.md).

## Referensi desain dan panduan tim

Desain berada di [Figma SMK Lugina](https://www.figma.com/design/hWTpQwbyreDsivI3tZ0yLa/SMK-Lugina--Copy-):
**Page 1 → Redesign Guru** untuk Guru dan **Guru & Siswa → Redesign Siswa** untuk
Siswa serta autentikasi bersama S01–S04.

- [Upload privat dan lampiran tugas (Phase 4B)](docs/FILE-UPLOAD-ATTACHMENTS.md).
- [API internal hasil UI/UX (Phase 4A)](docs/UI-UX-ASSESSMENT-API.md).
- [REST API, persistensi dan integrasi Guru–Siswa](docs/BACKEND-REST-API.md).
- [Autentikasi PostgreSQL dan RBAC](docs/AUTHENTICATION-RBAC.md).
- [Fondasi PostgreSQL dan Prisma](docs/DATABASE-FOUNDATION.md).
- [Panduan frontend](docs/FRONTEND.md).
- [Panduan integrasi dan handover tim COMMIT](docs/INTEGRATION-HANDOVER.md).
- [Dokumentasi autentikasi bersama](docs/SHARED-AUTHENTICATION.md).
- [Dokumentasi modul Guru](docs/TEACHER-MODULE.md).
- [Dokumentasi modul Siswa](docs/STUDENT-MODULE.md).
- [Petunjuk tes regresi](tests/README.md).
- [Catatan migrasi aplikasi ke root](docs/ROOT-MIGRATION.md).

Untuk integrasi berikutnya, gunakan kembali tipe dan store bersama. Pertahankan
ID event, peserta, milestone, versi tugas, dan penilaian agar data antarperan tetap
konsisten. Detail migrasi tim COMMIT dari Streamlit ke Next.js tersedia pada
panduan handover di atas.
