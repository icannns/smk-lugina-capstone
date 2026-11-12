# Panduan Pengembangan Frontend Bojong United

> **Pembaruan Backend Phase 3:** alur event/enrollment/tugas/penilaian/profil dan
> laporan sudah memakai REST API + PostgreSQL. Keterangan mock/sessionStorage
> di uraian fase terdahulu di bawah merupakan catatan historis, bukan mode fallback
> aplikasi saat ini. Sesi berbeda memakai database yang sama; lampiran masih
> metadata dan provider eksternal belum terintegrasi. Acuan terbaru:
> [REST API dan persistensi](BACKEND-REST-API.md). Total schema kini 27 model.


Frontend Guru dan Siswa sudah tergabung ke `main` melalui [PR #1](https://github.com/icannns/smk-lugina-capstone/pull/1). Aplikasi menggunakan Next.js 16 App Router, React, TypeScript, dan Tailwind CSS, dengan mock data untuk demonstrasi lokal.

[README utama](../README.md) memuat ringkasan fitur, akun demo, dan langkah mencoba integrasi Guru–Siswa. Dokumen ini menjadi panduan kerja dari root repository. Semua path source dalam panduan modul dihitung dari root repository, bukan dari `docs/`.

## Instalasi dan menjalankan aplikasi

Gunakan Node.js **20.9 atau lebih baru** dan npm. Dari root repository:

```powershell
npm ci
npm run dev
```

Buka alamat yang ditampilkan terminal, biasanya `http://localhost:3000`. Port dapat ditentukan dengan `npm run dev -- --port 3001`. Tidak diperlukan database, backend, atau kredensial `.env` untuk demo saat ini. Build pertama dapat mengunduh font Inter melalui `next/font`; hasil build menyajikannya secara lokal.

Untuk menjalankan hasil build:

```powershell
npm run build
npm run start
```

Hentikan server produksi sebelum membangun ulang `.next`, lalu jalankan kembali server agar CSS dan JavaScript berasal dari build yang sama.

## Struktur dan tanggung jawab

| Lokasi | Tanggung jawab |
| --- | --- |
| `src/app/` | Route, metadata, layout, dan batas Suspense pada App Router |
| `src/app/guru/` | Dashboard, data Siswa, event/wizard, rubric, monitoring, karya, laporan, dan profil Guru |
| `src/app/siswa/` | Event, dashboard, workspace, survei milestone, portofolio, dan profil Siswa |
| `src/components/auth/` | UI autentikasi bersama dan `RoleGate` |
| `src/components/guru/`, `src/components/siswa/` | Komponen fitur sesuai peran |
| `src/lib/auth/` | Akun fiktif, validasi, dan sesi autentikasi mock |
| `src/lib/guru/`, `src/lib/siswa/` | Tipe, fixture, store bersama, adapter, dan selector |
| `public/` | Aset SVG dan gambar lokal |
| `tests/` | Runner regresi logika, browser, dan navigasi role |

Halaman `/login`, `/register`, `/register/google`, dan `/loading` dipakai kedua role. Akun Guru diarahkan ke `/guru/dashboard`, akun Siswa ke `/siswa/dashboard`. Akun demo dan kebijakan register dijelaskan pada [autentikasi bersama](SHARED-AUTHENTICATION.md).

Layout role selalu merender child page. Setiap halaman terlindungi membungkus komponen fiturnya dengan `RoleGate` yang sesuai. Sertakan halaman baru dalam `tests/role-navigation-regressions.mjs`; penempatan guard ini mempertahankan validasi Instant Navigation tanpa menghilangkan segmen halaman.

## State dan batas integrasi

Satu store domain, `src/lib/guru/event-draft-store.ts`, menyatukan event, enrollment, rubric, submission, assessment, profil, dan respons survei. Gunakan kembali tipe dan selector yang ada ketika menambah modul. Rincian kontrak ada di [handover integrasi](INTEGRATION-HANDOVER.md).

State disimpan di sessionStorage per tab dan alamat/port. Gunakan satu tab dengan pergantian akun untuk demo lintas role. Perubahan belum tersinkron otomatis antartab, browser, atau perangkat. Unggahan tugas menyimpan metadata; autentikasi, Google, dan sertifikat tetap prototipe. Event baru belum membuat instrumen survei eksternal.

Menu administrasi Survei/privasi Guru dan Pengaturan Siswa tetap tampil normal sebagai tombol yang dapat ditekan, tetapi sementara tidak menjalankan aksi, membuka modal, atau mengubah URL dan menu aktif. Form survei milestone Siswa yang sudah dikonfigurasi tetap berfungsi. Daftar batasan yang memengaruhi integrasi tersedia pada handover.

## Desain

Gunakan Figma `hWTpQwbyreDsivI3tZ0yLa`: **Page 1 → Redesign Guru** untuk Guru, serta **Guru & Siswa → Redesign Siswa** untuk Siswa dan autentikasi S01–S04. Gunakan frame target sebagai acuan ketika berbeda dari pedoman umum Design System `244:845`. Token dan global CSS yang ada tetap menjadi dasar styling.

## Pemeriksaan

```powershell
npm run lint
npm run build
node node_modules/typescript/bin/tsc --noEmit --incremental false
node --test tests/audit-regressions.test.mjs
```

Build menghasilkan tipe route Next.js seperti `LayoutProps`; pada checkout baru, jalankan build sebelum TypeScript mandiri. Cara menyediakan Playwright dan menjalankan runner browser ada di [panduan pengujian](../tests/README.md). Hasil pengujian lama bukan pengganti pemeriksaan pada perubahan baru.

## Panduan lanjutan

- [Modul Guru](TEACHER-MODULE.md): alur event/wizard, data Siswa, assessment, laporan, dan referensi desain.
- [Modul Siswa](STUDENT-MODULE.md): enrollment, tugas/revisi, survei, portofolio, dan profil.
- [Autentikasi bersama](SHARED-AUTHENTICATION.md): role, sesi mock, dan batas keamanan.
- [Handover integrasi](INTEGRATION-HANDOVER.md): kontrak bersama, batas eksternal, serta migrasi tim COMMIT.
- [Instruksi coding agent](../AGENTS.md): aturan Next.js yang aktif.
