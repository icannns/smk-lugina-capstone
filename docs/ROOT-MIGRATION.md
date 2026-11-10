# Migrasi Next.js ke Root Repository

Verifikasi dilakukan pada **10 November 2026**, menggunakan Node.js 24.15.0,
npm 11.12.1, Windows, dan browser Edge headless. Basis migrasi adalah
`origin/main` pada commit `b0d11f2f9c6032f532697640ab636038e5d0aad4`.
Perubahan diajukan melalui branch `chore/nextjs-repository-root`; penggabungan
ke `main` memerlukan review tim.

## Perubahan struktur

Sebelumnya aplikasi berada di `frontend/`, sedangkan root hanya berisi README.
Sesudah migrasi aplikasi berada langsung di root:

```text
smk-lugina-capstone/
├── README.md
├── AGENTS.md
├── .gitignore
├── package.json
├── package-lock.json
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── src/                     # app, components, lib
├── public/                  # URL aset tetap /auth, /guru, /siswa
├── tests/
└── docs/
    ├── FRONTEND.md
    ├── INTEGRATION-HANDOVER.md
    ├── SHARED-AUTHENTICATION.md
    ├── TEACHER-MODULE.md
    ├── STUDENT-MODULE.md
    └── ROOT-MIGRATION.md
```

Sebanyak **288 berkas** dipindahkan: 119 source, 153 aset, 4 berkas pengujian,
5 panduan teknis, serta 7 konfigurasi/instruksi di root. README utama tetap
dipertahankan dan disesuaikan; README aplikasi lama menjadi `docs/FRONTEND.md`.
Tautan antardokumen dan petunjuk pengujian diperbarui.

Root sebelumnya tidak memiliki AGENTS.md atau .gitignore. Keduanya dipindahkan
dengan isi utuh, termasuk blok instruksi yang dikelola Next.js. Aturan ignore
yang dahulu relatif terhadap aplikasi sekarang berlaku dari root.

Seluruh source, aset, tiga runner regresi, package.json, lockfile, dan konfigurasi
Next.js/TypeScript/ESLint identik dengan versi sebelum pemindahan. Alias `@/*`
tetap menuju `./src/*`; import relatif dan path pengujian tetap valid karena
struktur internal dipertahankan. Tidak diperlukan perubahan script atau nilai
konfigurasi. Tidak ada dependency baru, aplikasi kedua, perubahan logika bisnis,
desain, key sessionStorage, maupun URL Guru/Siswa.

## Menjalankan aplikasi

Jalankan perintah berikut dari root checkout yang memakai struktur baru:

```powershell
npm ci
npm run dev
```

Pemeriksaan dan produksi lokal:

```powershell
npm run lint
npm run build
node node_modules/typescript/bin/tsc --noEmit --incremental false
node --test tests/audit-regressions.test.mjs
npm run start
```

Build menghasilkan tipe route untuk pemeriksaan TypeScript mandiri. Detail
runner browser ada pada [panduan pengujian](../tests/README.md); dependency
Playwright disediakan oleh lingkungan QA, bukan ditambahkan ke aplikasi.

## Hasil verifikasi migrasi

| Pemeriksaan | Hasil aktual |
| --- | --- |
| `npm ci` dari root | PASS; dependency dipasang dari lockfile yang sama |
| `npm run dev` dari root | PASS; diuji pada port 3003 dengan Turbopack |
| `npm run lint` | PASS |
| `npm run build` | PASS; route autentikasi, Guru, dan Siswa tetap dihasilkan |
| TypeScript mandiri | PASS dengan `--noEmit --incremental false` |
| Tes logika repository | PASS, 9 tes |
| Regresi browser B01–B10 | PASS, 8 kelompok termasuk form, laporan, PDF/XLSX, dan nama panjang |
| Role dan Instant Navigation | PASS, 51 pemeriksaan development dan 51 produksi; tanpa diagnostic navigasi, console error, page error, atau HTTP gagal |
| Autentikasi bersama | PASS, 8 kelompok termasuk invalid credentials, register, simulasi Google, loading, redirect, dan logout |
| Sidebar/responsif | PASS, 36 kasus menu/108 aktivasi dan 36 navigasi pada 320/768/1440 px; survei milestone tetap berfungsi |
| Integrasi Guru–Siswa | PASS, 9 kelompok: terbitkan event, enroll Dimas, draf/submit, penilaian/feedback, portofolio/laporan, revisi, dan isolasi sesi |
| Aset lokal | PASS, seluruh 153 berkas public merespons HTTP 200 dan byte identik pada development serta produksi |
| Snapshot Git bersih | PASS; ekspor berkas terlacak tanpa frontend/, node_modules, atau .next, lalu instalasi, build, dan TypeScript mandiri diulang dari root |

Snapshot bersih berasal dari tree Git kandidat migrasi. Source dan konfigurasi
yang diuji identik dengan hasil akhir; penambahan laporan ini hanya dokumentasi.
Screenshot Dashboard Guru dan sidebar Siswa diperiksa setelah migrasi. Ini
bukan audit ulang kesetaraan piksel seluruh frame Figma atau semua browser.

## Koordinasi integrasi dan risiko

- Ubah working directory CI/hosting dari `frontend` menjadi `.` atau root
  repository. Build tetap `npm ci` lalu `npm run build`; output Next.js tetap
  `.next`. Pengaturan hosting di luar repository tidak diubah otomatis.
- Instal ulang dependency dari root. Gunakan checkout baru untuk verifikasi;
  jangan memindahkan node_modules atau cache .next dari lokasi lama.
- Checkout lama dapat menyisakan folder frontend yang berisi dependency, cache,
  dan laporan audit lokal. Simpan laporan lokal sebelum berpindah branch dan
  periksa status Git; jangan menambahkan sisa build/dependency itu ke commit.
  Migrasi ini tidak menghapus atau memublikasikan tiga laporan audit lokal.
- Branch tim `sistem-analitik` yang teramati pada `d9bc7a6` masih menggunakan
  frontend/. Branch tersebut tidak diubah atau digabung. Saat integrasi,
  arahkan berkas baru ke src/ dan tinjau konflik rename, package/lockfile,
  root layout, sidebar, serta route bersama. Jangan membuat aplikasi Next.js
  kedua untuk menyelesaikan konflik struktur.
- Audit npm pada lingkungan ini mencatat 7 temuan moderate development dan
  nol production-only. Peringatan deprecation ESLint dan ukuran ikon privasi
  development tetap ada; tidak ada perubahan dependency atau visual untuk
  menyamarkannya dalam migrasi ini.
- Batas prototipe tetap berlaku: data lokal per tab/alamat/port, tanpa backend
  atau autentikasi sungguhan. Event baru belum memprovisikan instrumen Survei.
  Tidak ada klaim sinkronisasi antartab/perangkat atau kesiapan produksi.

Lihat [README utama](../README.md), [panduan frontend](FRONTEND.md), dan
[handover COMMIT](INTEGRATION-HANDOVER.md) untuk konteks penggunaan/integrasi.
