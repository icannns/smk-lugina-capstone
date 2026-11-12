# Bojong United — SMK Lugina Rancaekek

Bojong United adalah proyek capstone platform pembelajaran berbasis **event dan
proyek** untuk SMK Lugina Rancaekek. Repository ini berisi frontend untuk dua
peran: **Guru** dan **Siswa**.

Modul Guru dan Siswa sudah terhubung melalui data contoh bersama. Guru dapat
menerbitkan event, Siswa mengikuti dan mengumpulkan tugas, lalu Guru memberikan
nilai, feedback, atau permintaan revisi.

> **Status saat ini: prototipe frontend dengan data fiktif untuk demonstrasi
> lokal.** UI belum terhubung ke backend/database, autentikasi sungguhan, atau Google
> OAuth. Gunakan akun dan data contoh; jangan masukkan kredensial atau data pribadi
> asli.

Implementasi frontend Guru dan Siswa sudah masuk ke branch `main` melalui
[PR #1](https://github.com/icannns/smk-lugina-capstone/pull/1). Panduan teknis
berbahasa Indonesia tersedia pada bagian [referensi dan panduan tim](#referensi-desain-dan-panduan-tim).

## Fitur yang tersedia

| Bagian | Fitur |
| --- | --- |
| Autentikasi bersama | Login, register akun Siswa contoh, simulasi Google, loading, redirect berdasarkan peran, dan logout |
| Guru | Dashboard, pengelolaan data Siswa, daftar/detail event dan draf, wizard pembuatan event, pengelolaan rubrik, monitoring progres, penilaian dan revisi, karya Siswa, laporan PDF/XLSX, serta profil |
| Siswa | Pencarian dan pendaftaran event, dashboard, ruang kerja dan milestone, pengumpulan tugas dan revisi, survei milestone yang sudah dikonfigurasi, portofolio, dokumen sertifikat contoh, serta profil |

Wizard pembuatan event mencakup **Informasi Event → Milestone → Rubrik →
Sertifikat → Tinjau → Terbitkan → Selesai**. Draf dan perubahan demo disimpan pada
sesi browser.

Menu Guru **Dashboard Survei, Survei Saya, Template Survei, Hasil Survei, Kebijakan
Privasi**, serta menu Siswa **Pengaturan** tetap tampil normal dan dapat ditekan,
tetapi sementara tidak menjalankan aksi sampai modul pemiliknya terintegrasi.
Tombol ini tidak membuka modal atau mengubah URL dan menu aktif. Form survei pada milestone Siswa
yang sudah dikonfigurasi tetap dapat digunakan.

## Teknologi

- Next.js 16 dengan App Router.
- React dan TypeScript.
- Tailwind CSS dan komponen yang digunakan kembali.
- Data contoh bersama dengan penyimpanan `sessionStorage` di browser.
- Aset desain lokal dari Figma.

## Cara menjalankan di laptop

### 1. Siapkan kebutuhan

- Node.js **20.19+, 22.12+, atau 24+**, beserta npm (sesuai dukungan Prisma).
- Git dan akses GitHub ke repository ini karena repository bersifat privat.

### 2. Ambil proyek dan jalankan frontend

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

Frontend saat ini dapat didemokan tanpa konfigurasi database, server backend,
atau kredensial `.env`. Build pertama mungkin memerlukan internet untuk mengunduh
font Inter melalui `next/font`; hasil build menyajikan font secara lokal.

### 3. Menjalankan hasil build produksi secara lokal

Dari root repository:

```bash
npm run build
npm run start
```

Hentikan server produksi yang sedang berjalan sebelum melakukan build ulang,
lalu jalankan kembali `npm run start` agar browser memakai berkas CSS dan
JavaScript dari build yang sama. Mode ini tetap menggunakan data contoh.

## Database development (opsional)

Fondasi PostgreSQL/Prisma, migrasi dan seed fiktif tersedia. UI tetap memakai
mock sampai API/Auth diimplementasikan. Ikuti [panduan database](docs/DATABASE-FOUNDATION.md)
untuk konfigurasi lokal, batas seed dan koordinasi FOMO/COMMIT. `npm ci` hanya
menghasilkan client Prisma, tanpa migrasi atau seed otomatis.

## Akun demo

Semua kredensial berikut merupakan **akun fiktif yang memang disediakan untuk
pengujian**, bukan akun sekolah atau rahasia produksi.

| Peran | Username | Email | Kata sandi |
| --- | --- | --- | --- |
| Guru | `rina.guru` | `guru@example.com` | `DemoGuru123!` |
| Siswa — Dimas | `dimas` | `siswa@example.com` | `DemoSiswa123!` |
| Siswa — Aisyah | `aisyah` | `aisyah@example.com` | `DemoSiswa123!` |

Gunakan username **atau** email pada halaman `/login`. Akun Guru diarahkan ke
`/guru/dashboard`, sedangkan akun Siswa ke `/siswa/dashboard`. Pendaftaran publik
hanya membuat akun Siswa contoh; tombol Google juga merupakan simulasi.

## Cara mencoba integrasi Guru dan Siswa

Gunakan **satu tab browser pada alamat dan port yang sama**, lalu bergantian
logout/login dengan akun demo.

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

### Mengapa harus satu tab?

Data demo tersimpan pada sesi tab. Tab baru dapat membawa salinan data awal,
tetapi perubahan berikutnya **belum tersinkron otomatis** antartab, browser, atau
perangkat. Data ini juga bukan penyimpanan permanen. Integrasi pengguna yang
berjalan bersamaan memerlukan backend dan database.

## Batasan prototipe

- Pemeriksaan login dan peran dilakukan di browser untuk demonstrasi. Keamanan
  penggunaan nyata memerlukan autentikasi dan otorisasi di server.
- Event baru belum otomatis membuat instrumen survei. Pengumpulan tugas,
  penilaian, feedback, dan laporan dapat dicoba, tetapi penyelesaian tahap yang
  memerlukan survei menunggu integrasi modul Survei.
- Untuk mencoba seluruh alur survei dan dokumen sertifikat contoh, gunakan event
  demo yang instrumen surveinya sudah dikonfigurasi.
- Lampiran tugas menyimpan metadata contoh, bukan isi file yang diunggah ke
  server. Preview dan unduhan sampel diberi keterangan simulasi.
- Ekspor laporan PDF/XLSX benar-benar dibuat di browser. Dokumen sertifikat
  merupakan contoh penyelesaian belajar, tanpa penerbitan atau verifikasi resmi
  institusi.
- Fondasi PostgreSQL/Prisma tersedia untuk development, tetapi belum terhubung
  ke UI. REST API, Auth.js/RBAC, Google OAuth sungguhan, administrasi Survei dan
  integrasi modul tim lain belum diimplementasikan.
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
`src/lib/guru/event-draft-store.ts`; pengelolaan sesi demo berada di
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
