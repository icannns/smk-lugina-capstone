# Panduan Pengujian Regresi Frontend

Jalankan perintah dari root repository setelah dependensi terpasang melalui `npm ci`. Tes menggunakan data fiktif dan tidak memerlukan backend. Hasil tes lama tidak otomatis berlaku setelah perubahan baru.

## Pemeriksaan dasar dan tes logika

```powershell
npm run lint
npm run build
node node_modules/typescript/bin/tsc --noEmit --incremental false
node --test tests/audit-regressions.test.mjs
```

Build menghasilkan tipe route Next.js seperti `LayoutProps`; pada checkout baru, selesaikan build sebelum TypeScript mandiri. Runner Node menguji selector, serializer, session store, label milestone, dan penulis PDF yang sebenarnya melalui compiler TypeScript proyek. Tidak ada implementasi mock paralel untuk mengganti fungsi yang diuji. Saat ini terdapat sembilan tes logika.

## Persiapan runner browser

Jalankan server hasil build secara terpisah dengan `npm run start`. Hentikan server produksi sebelum build ulang untuk mencegah URL CSS lama. Gunakan instalasi Playwright yang tersedia di lingkungan pengujian; dependensi runtime aplikasi tidak perlu ditambah.

```powershell
$env:PLAYWRIGHT_MODULE = 'C:/path/to/node_modules/@playwright/test'
$env:PLAYWRIGHT_CHANNEL = 'msedge'
node tests/audit-browser-regressions.mjs
```

`PLAYWRIGHT_MODULE` dapat dihilangkan bila `@playwright/test` sudah dapat di-resolve. Channel default adalah Edge. Path di atas merupakan contoh yang harus disesuaikan, bukan path mesin yang wajib digunakan.

| Variabel | Fungsi/default |
| --- | --- |
| `PLAYWRIGHT_MODULE` | Lokasi modul Playwright bila tidak tersedia pada resolusi Node normal |
| `PLAYWRIGHT_CHANNEL` | Channel browser; default `msedge` |
| `AUDIT_BASE_URL` | Alamat server; default `http://localhost:3000` |
| `AUDIT_OUTPUT_DIR` | Folder bukti di luar repository; gunakan lokasi berbeda untuk tiap server/run yang ingin disimpan |

## Regresi temuan audit

`audit-browser-regressions.mjs` membuat konteks browser baru dengan fixture enrollment 40 orang, termasuk nilai historis dan revisi terbaru yang belum dinilai. Delapan kelompok pengujian mencakup B01–B10: filter pengerjaan, label nol/sebagian/seluruh nilai, catatan/review yang bertahan, progres event, metadata/waktu survei, antrean Dashboard, label M1 alih-alih UUID, error form, serta nama panjang pada ukuran 320/768/1440 px.

Runner benar-benar mengunduh PDF/XLSX. Pemeriksaan browser pada runner tidak sama dengan validasi seluruh format/render pada semua aplikasi pembaca; periksa file keluaran bila kebutuhan ekspor berubah. Tanpa `AUDIT_OUTPUT_DIR`, bukti masuk ke folder temporary OS `lugina-final-audit-round-2/regressions`.

Fixture terkontrol ini berbeda dari alur UI membuat event, enrollment, submit, assessment, dan revisi pada [handover](../docs/INTEGRATION-HANDOVER.md#alur-uji-integrasi). Laporan audit lokal tidak diperlukan untuk menjalankan runner.

## Regresi role dan Instant Navigation

`role-navigation-regressions.mjs` menguji seluruh page Guru/Siswa tanpa login, dengan role yang benar, dengan role salah, dan setelah logout. Tes juga memeriksa Aisyah M1 serta Nabila M4 melalui URL langsung dan klik dari Monitoring. Runner gagal jika mendapati diagnostic Instant Navigation, console error, page error, atau respons HTTP gagal. Inventaris route gagal ketika page terlindungi baru belum memiliki skenario.

Gunakan konfigurasi Playwright yang sama, lalu uji development dan produksi:

```powershell
$env:AUDIT_BASE_URL = 'http://localhost:3000'
node tests/role-navigation-regressions.mjs

# Dengan npm run dev yang berjalan pada port 3001:
$env:AUDIT_BASE_URL = 'http://localhost:3001'
node tests/role-navigation-regressions.mjs
```

Setiap run saat ini memuat 51 pemeriksaan. Tanpa override, hasil masuk ke temporary OS `lugina-role-navigation-regressions`. Peringatan ukuran gambar development dicatat terpisah dari diagnostic Instant Navigation. Sesuaikan port dengan server yang benar-benar aktif.

## Hasil asesmen dashboard

Tes tambahan untuk section Uji Kompetensi, Technostress, dan Asesmen UI/UX:

```powershell
node --test tests/assessment-results.test.mjs
# Dengan server aplikasi aktif dan variabel Playwright seperti di atas:
node tests/assessment-dashboard-regressions.mjs
```

Tujuh tes Node memeriksa scope akun, ID/enrollment bersama, nilai nol versus hasil
belum tersedia, filter/ringkasan, pembatalan request saat pergantian akun, serta
render loading/error/empty, dan pilihan catatan terbaru pada kartu ringkasan.
Runner browser memeriksa posisi ringkasan, buka/tutup daftar, filter, pagination, dialog
keyboard/fokus, akun Dimas/Aisyah/akun baru, dan layout 320/768/1440 px. Error dan
loading diuji lewat renderer React; mock lokal tidak berpura-pura menghubungi
server yang gagal. Petunjuk kontrak dan batas fitur ada pada
[panduan asesmen dashboard](../docs/DASHBOARD-ASSESSMENTS.md).

## Batas dan bukti pengujian

Browser memakai sesi terisolasi; sesi browser pengguna tidak dipakai. Simpan bukti di luar Git. Tes ini tidak menyertifikasi keamanan server, perilaku screen reader, sinkronisasi antarperangkat, seluruh browser, atau kesetaraan piksel Figma. Untuk perubahan lintas modul, ulangi alur Guru–Siswa dan periksa data Reports/Portfolio yang sama; untuk backend mendatang, tambahkan tes pengguna/sesi terpisah.

## Fondasi PostgreSQL/Prisma

`npm run test:db:safety` menjalankan tiga tes guard tanpa database.
`npm run test:db` menjalankan sepuluh tes integritas PostgreSQL nyata: diperlukan
DB lokal **test terpisah**, migration deploy, NODE_ENV=test dan
ALLOW_DEV_SEED=true. DATABASE_URL harus menunjuk `bojong_united_test` (boleh
suffix); DB development manual ditolak. Seed hanya membuat fixture, tidak
menghapus atau mereset data. Jangan jalankan terhadap produksi/shared database.

Langkah setup, perlindungan seed, batasan dan SQL CHECK/trigger tersedia pada
[panduan database](../docs/DATABASE-FOUNDATION.md#pengujian). Tes frontend di atas
masih memakai browser mock dan tidak membuktikan integrasi REST/database.
