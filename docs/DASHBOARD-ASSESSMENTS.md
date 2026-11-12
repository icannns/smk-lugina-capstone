# Hasil Asesmen Dashboard — Frontend Fase 1

Tambahan ini berada pada `/guru/dashboard` dan `/siswa/dashboard` dalam aplikasi
di root repository, branch
`feature/dashboard-assessment-results`, berbasis main `277d178`. Tidak ada
backend, endpoint, database, Auth.js, Prisma, atau integrasi layanan eksternal
yang ditambahkan. Seluruh catatan hasil adalah **data fiktif**.

## Cakupan dan desain

- Guru: tiga kartu ringkasan Uji Kompetensi, Technostress, dan Asesmen UI/UX,
  tepat setelah statistik event dan sebelum draf. Kartu menampilkan jumlah hasil
  tersedia/belum tersedia. Tombol Lihat Hasil membuka daftar lengkap dengan
  pencarian, filter event/status, pagination lima catatan, dan dialog detail.
- Siswa: Hasil Uji Kompetensi dan Hasil Asesmen UI/UX milik ID Siswa pada sesi
  aktif. Dua kartu ringkas berada setelah statistik, sebelum Perlu Tindakan.
  Kartu memakai catatan bertimestamp selesai terbaru, termasuk yang masih
  menunggu hasil; tanpa timestamp, urutan fixture menjadi fallback. Lihat Detail
  membuka hasil dan riwayat lengkap beserta waktu selesai dan umpan balik.
  Akun baru tanpa catatan menampilkan kondisi kosong; tidak memakai hasil Dimas
  sebagai fallback. Technostress tidak ditampilkan pada dashboard Siswa.
- Daftar lengkap tertutup saat halaman dibuka; hanya satu jenis asesmen dibuka
  pada satu waktu. Tutup hasil mengembalikan fokus ke kartu asal. Filter dan
  pagination kembali ke kondisi awal ketika daftar ditutup/jenis diganti.
  Desktop Guru memakai tabel; mobile memakai kartu. Nilai nol tetap ditampilkan
  sebagai nilai yang tersedia.
- Statistik event, draf, kartu event, antrean pemeriksaan, tindakan Siswa,
  enrollment, workspace, portofolio, dan nilai rubrik lama tetap dipertahankan.

Figma MCP digunakan untuk membaca **Page 1 → Redesign Guru `291:16094`** dan
**Guru & Siswa → Redesign Siswa `370:2522` (S09)**, termasuk screenshot dan
konteks komponen. Inter, warna/tipografi Lugina, kartu putih radius 16 px,
kontrol radius 12 px, dan jarak 16/24 px mengikuti pola yang ada.

Lima section hasil asesmen belum terdapat pada dua frame tersebut. Penempatan
ringkasan setelah statistik, panel daftar, filter, pagination, dialog, dan adaptasi mobile
merupakan rancangan tambahan sesuai kebutuhan baru, bukan interaksi yang
dikonfirmasi melalui hotspot Figma. Tidak ada aset baru atau perubahan global
CSS; aset Figma lama digunakan pada callsite yang sama. shadcn/ui belum
dikonfigurasi sehingga tidak ditambahkan sebagai dependency.

## Kontrak data dan adapter

| Bagian | Lokasi/tanggung jawab |
| --- | --- |
| Tipe kontrak | `src/lib/assessments/types.ts` |
| Fixture read-only | `src/lib/assessments/mock-data.ts`, 15 catatan dengan ID unik |
| Selector | `src/lib/assessments/selectors.ts`, scope, label, hasil, ringkasan, filter |
| Batas data asinkron | `src/lib/assessments/repository.ts`, `AssessmentRepository.list(scope, signal)` |
| Lifecycle | `src/components/assessments/use-assessment-results.ts`, loading/error/retry, pembatalan dan pengikatan scope |
| UI bersama | `dashboard-assessments.tsx`, `assessment-summary-card.tsx`, `assessment-section.tsx`, `assessment-ui.tsx` dalam `src/components/assessments/` |

`AssessmentRecord` memuat ID asesmen, jenis (`competency`, `technostress`,
`uiux`), judul, studentId, eventId opsional, status, result opsional (score
value/maximum dan/atau summary), completedAt ISO dengan timezone, feedback
opsional, serta source. Fixture selalu `source: "mock"`; pilihan `api` dalam
tipe disiapkan untuk adapter mendatang dan tidak menunjukkan koneksi aktif.

Status presentasi adalah belum dikerjakan, sedang dikerjakan, menunggu hasil,
dan selesai. Waktu selesai tidak otomatis berarti nilai sudah diterbitkan.
Nilai contoh ditampilkan sebagaimana diberikan fixture, tanpa menghitung
formula nilai, kelulusan, kategori kompeten, atau ambang risiko Technostress.
Technostress hanya memuat ringkasan respons dan status partisipasi.

ID Siswa dan event memakai roster/enrollment yang ada; nama dan judul dibaca
dari store bersama agar perubahan profil tetap terlihat. Catatan asesmen tidak
disalin ke store event/milestone, tidak menyimpan data baru di sessionStorage,
dan tidak mengubah nilai rubrik. Tidak ada permintaan fetch atau endpoint
rekaan. Adapter mock dapat diganti dengan adapter REST setelah kontrak disepakati.

## Isolasi dan kondisi UI

Scope Siswa wajib memiliki studentId yang tidak kosong dan difilter secara
eksak pada adapter serta selector presentasi. ID kosong, akun tanpa hasil, dan
parameter URL tidak membuka data siswa lain. Komponen di-key berdasarkan akun;
hasil request lama dibatalkan/diabaikan saat akun berubah. Detail dan filter
tidak dipertahankan lintas akun.

Ini **isolasi tampilan prototipe**, bukan keamanan server. Fixture masih berada
di bundle browser dan sesi mock dapat dimodifikasi pengguna. Backend harus
melakukan autentikasi dan otorisasi sebelum mengembalikan data; memfilter
seluruh data siswa di browser tidak cukup untuk produksi.

Loading, error dengan tombol Coba lagi, empty, hasil menunggu, dan hasil tersedia
memiliki tampilan terpisah. Mock lokal normal selalu berhasil; loading/error
diuji melalui renderer React tanpa menambah kontrol debug atau kegagalan server
palsu pada UI. Dialog mendukung Enter, Tab/Shift+Tab, Escape, dan pemulihan fokus.

## Verifikasi dan batasnya

Panduan runner ada di [tests/README.md](../tests/README.md). Tes baru:

```powershell
node --test tests/assessment-results.test.mjs
node tests/assessment-dashboard-regressions.mjs
```

Browser memeriksa posisi ringkasan, buka/tutup daftar, kombinasi filter/pagination, detail keyboard, isolasi
Dimas/Aisyah, akun registrasi baru yang kosong, serta lebar 320/768/1440 px.
Screenshot disimpan di folder bukti temporary OS, bukan sebagai aset aplikasi.
Pemeriksaan visual difokuskan pada dashboard dan section baru; tidak ada klaim
pixel-perfect untuk tambahan layout yang belum memiliki frame khusus.

Hasil implementasi pada **11 November 2026** dan verifikasi publikasi ulang pada
**12 November 2026**, Windows/Edge headless:

| Pemeriksaan | Hasil |
| --- | --- |
| ESLint, TypeScript mandiri, production build | PASS |
| Unit/renderer asesmen baru + regresi logika lama | PASS, 7 + 9 tes |
| Browser dashboard baru | PASS, 25 kelompok pada 320/768/1440 px |
| Navigasi/role seluruh page Guru dan Siswa | PASS, 51 pemeriksaan produksi + 51 development |
| Autentikasi bersama | PASS, 8 kelompok |
| Regresi browser audit lama | PASS, 8 kelompok |
| Integrasi Guru–Siswa | PASS, 9 kelompok termasuk publish/enroll/submit/assessment/feedback/revisi/Portfolio/Reports |
| Aset | PASS, 153 file nonkosong dengan HTTP 200; geometri gambar terlihat juga diperiksa runner dashboard |
| Sidebar dan survei milestone | PASS, 36 kasus menu/108 aktivasi, 36 navigasi, dan pengiriman survei contoh |

Temuan fokus dialog dan counter pagination mobile dari pengujian awal telah
diperbaiki lalu diuji ulang. Tidak ada error runtime, console error, atau HTTP
gagal dalam run browser yang lolos. Error/loading hanya diuji dengan renderer
React seperti dijelaskan di atas. Tidak dilakukan audit screen reader penuh,
uji jaringan/backend nyata, atau klaim keamanan produksi.

## Kebutuhan fase backend dan keputusan yang masih terbuka

1. Layanan pembacaan daftar/detail hasil untuk Guru dan hasil pribadi Siswa,
   dengan scope izin dari sesi server. Hak Guru atas event/kelompok Siswa perlu
   disepakati; demo saat ini hanya memiliki satu identitas Guru.
2. Kontrak penyedia Uji Kompetensi, Technostress, dan UI/UX: ID/versi instrumen,
   hubungan event bila ada, status lifecycle, skala nilai, timestamp timezone,
   ringkasan, feedback, dan aturan penerbitan hasil. Path REST belum ditetapkan.
3. Konfirmasi bahwa Asesmen UI/UX adalah asesmen terpisah atau mempunyai relasi
   tertentu dengan rubrik milestone; fase ini sengaja tidak menyamakannya.
4. Penentuan makna kelulusan/kompetensi dan interpretasi Technostress oleh tim
   pemilik. Frontend ini tidak menetapkan kebijakan tersebut.
5. Auth.js/RBAC, normalisasi respons, error jaringan, pagination server, dan
   penggantian adapter hanya dikerjakan pada fase berikutnya. Tidak ada deploy
   atau perubahan dependency pada fase frontend ini. Publikasi Git dilakukan
   atas instruksi eksplisit pengguna, melalui branch fitur dan PR tanpa merge otomatis.
