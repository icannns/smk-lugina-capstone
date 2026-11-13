# Panduan Pengujian

Jalankan dari root repository. Hasil fase sebelumnya tidak otomatis membuktikan
perubahan sekarang. Tidak ada password default atau fallback ke mock store
browser. Jangan menyimpan cookie, password, `.env`, screenshot, atau dump DB ke Git.

## Pemeriksaan dasar

```powershell
npm ci
npm run db:validate
npm run lint
npm run build
node node_modules/typescript/bin/tsc --noEmit --incremental false
node --test tests/audit-regressions.test.mjs tests/assessment-results.test.mjs
npm run test:auth
npm run test:db:safety
```

Build menghasilkan tipe route Next.js seperti `LayoutProps`; pada checkout baru,
selesaikan build sebelum TypeScript mandiri. Delapan belas tes Node memakai fungsi
selector/serializer/cache/PDF/renderer asli dengan fixture unit eksplisit. Fixture
unit bukan fallback aplikasi. Tiga tes Auth memeriksa Argon2id/validasi dan tiga
tes safety memeriksa penolakan target DB yang tidak diizinkan.

## REST dan persistensi Phase 3

Diperlukan PostgreSQL lokal disposable dengan nama `bojong_united_test` atau
suffix underscore/alphanumeric, empat migrasi terpasang, seed development,
serta tiga akun Phase 2 yang diprovisikan. Jangan memakai DB produksi atau DB
tim bersama. Panduan setup: [REST](../docs/BACKEND-REST-API.md),
[database](../docs/DATABASE-FOUNDATION.md), [Auth](../docs/AUTHENTICATION-RBAC.md).

Isi environment privat: DATABASE_URL, AUTH_SECRET, AUTH_URL, NODE_ENV=test,
ALLOW_DEV_SEED=true, TEST_TEACHER_PASSWORD, TEST_DIMAS_PASSWORD,
TEST_AISYAH_PASSWORD. Provisioning memerlukan ALLOW_DEV_ACCOUNT_PROVISION=true.
Gunakan password yang sama untuk provision dan browser runner; tidak ada rotasi
password akun lama otomatis. `AUTH_URL` harus sesuai alamat server pengujian.

Jalankan server terpisah: `npm run dev -- --port 3004` atau setelah build,
`npm run start -- --port 3004`. Hentikan server produksi sebelum build ulang
agar JavaScript/CSS berasal dari build yang sama.

| Environment runner | Arti |
| --- | --- |
| PLAYWRIGHT_MODULE | Path ke `@playwright/test` bila tidak tersedia melalui resolusi Node normal |
| PLAYWRIGHT_CHANNEL | Default `msedge`; browser channel harus sudah terpasang |
| AUDIT_BASE_URL | Default http://localhost:3000; set sesuai port server |
| AUDIT_OUTPUT_DIR | Folder bukti di luar Git; gunakan subfolder berbeda untuk setiap suite/run |

Dengan konfigurasi tersebut, jalankan **berurutan**:

```powershell
npm run test:rest
npm run test:rest:browser
npx tsx tests/audit-browser-regressions.mjs
npx tsx tests/assessment-dashboard-regressions.mjs
npx tsx tests/role-navigation-regressions.mjs
npm run test:auth:browser
```

| Suite | Cakupan |
| --- | --- |
| rest-api-regressions (12 kelompok) | Auth nyata, RBAC/ownership/IDOR, validasi, CSRF/XSS, draft CRUD/revision, konkurensi enrollment/submission, urutan milestone, publish idempoten, penilaian/feedback/revisi, progres/laporan, klaim contoh, survei DEMO/review berversi, profil |
| rest-browser-integration (11 kelompok) | UI wizard → publish → sesi Siswa terpisah → enroll → draf/tugas → nilai/feedback → revisi v2 → nilai/laporan/portofolio → klaim/PDF → survei DEMO/review → profil; refresh/fresh browser dan kegagalan API tanpa sukses palsu/fallback |
| audit-browser-regressions (7 kelompok) | Fixture DB event 40 peserta, survei belum lengkap, nilai historis vs revisi terbaru, UUID internal, catatan Guru, PDF dua halaman/XLSX nyata, error/fokus rubrik, nama profil 110/120 karakter, layout 320/768/1440 |
| assessment-dashboard-regressions (25 cek) | Tiga jenis hasil Guru dan dua Siswa dari referensi DB; filter, pagination, modal/fokus keyboard, data Dimas/Aisyah terpisah, akun baru kosong, layout 320/768/1440 |
| role-navigation-regressions (51 cek) | Seluruh page Guru/Siswa tanpa login, role benar/salah, logout, Aisyah M1/M4 lewat URL dan klik, diagnostic Instant Navigation, HTTP/console/runtime |
| auth-browser-regressions (15 kelompok) | Login tiga akun, invalid credentials, cookie/sesi, register API/UI/Google non-auth, CSRF/role injection, IDOR, logout/replay, expiry/nonaktif, rate limit, layar auth 320/768/1440 |

Suite REST/browser memakai API nyata, bukan injeksi sessionStorage. Untuk membuat
fixture yang tidak tersedia di UI, runner DB menggunakan koneksi development
berguard: Guru kedua, 39 peserta fiktif tanpa credential, versi historis, respons
survei versi kedua, dan referensi DEMO untuk pagination. Tidak ada endpoint
backdoor/test di aplikasi. Fixture diberi ID unik atau namespace QA, tetap berada
hanya di DB test untuk inspeksi. Akun Dimas dipulihkan setelah tes nama panjang.

Auth runner mengubah sementara expiry/nonaktif/grant akun test untuk menguji
revocation; jalankan terakhir dan jangan bersamaan dengan runner lain.
Rate-limit test memakai identitas acak sehingga tidak mengunci akun asli.
Tes role membutuhkan fixture Dimas/Aisyah yang diprovisikan, bukan Nabila mock.

## Migrasi dan integritas DB

Gunakan DB replay baru, **berbeda dari DB REST/browser**. Pasang empat migrasi,
jalankan seed dua kali, lalu `npm run test:db`. Sepuluh tes memeriksa unique/FK,
scope event/milestone, riwayat versi/nilai/review, trigger snapshot, ownership,
peran profil dan batas retensi. Test fixture murni mengharapkan tiga akun demo;
jangan menjalankannya terhadap DB yang sudah berisi fixture browser tambahan.

Untuk drift:

```powershell
npx prisma migrate status
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code
# SHADOW_DATABASE_URL menunjuk DB disposable lain, tidak sama dengan DB aplikasi:
npx prisma migrate diff --from-migrations prisma/migrations --to-schema prisma/schema.prisma --exit-code
```

Exit 0 pada diff berarti tidak ada perbedaan schema Prisma yang terdeteksi.
CHECK/trigger SQL tetap diperiksa melalui tes integritas. Untuk upgrade Phase 2,
verifikasi ID dan hash password tiga akun sebelum/sesudah migrasi tanpa mencetak
hash/credential ke log publik. Jangan mengedit tiga migrasi lama.

## Bukti ekspor dan batas verifikasi

Runner benar-benar mengunduh PDF/XLSX dan certificate prototype PDF. PDF 40
peserta diperiksa jumlah halaman/posisi teks serta peserta terakhir; XLSX dapat
diperiksa dengan ZIP CRC/XML parser dan 43 baris (judul/header + 40 peserta).
Bukti harus menyebut pemeriksaan yang benar-benar dilakukan, bukan menyamakan
unduhan dengan uji seluruh aplikasi pembaca dokumen.

Browser testing memakai Edge/Chromium lokal; bukan uji seluruh browser, screen
reader, beban produksi, penetrasi independen, atau klaim identik piksel Figma.
Provider FOMO/COMMIT dan deployment produksi tidak diuji. Upload biner privat
memiliki suite Phase 4B tersendiri; adapter S3 belum diverifikasi pada provider nyata. Catatan hasil aktual fase ini ada pada
[panduan REST](../docs/BACKEND-REST-API.md#hasil-verifikasi-fase-ini).

## UI/UX Assessment internal — Phase 4A

`npm run test:uiux` menguji create/read/filter/history, validasi metadata dan nilai,
Auth.js/RBAC, idempotency, duplikasi/concurrent writes, status terminal, history
append-only PostgreSQL, dan hasil pada kedua dashboard dengan sesi berbeda.
Variabel runner sama dengan tes REST di atas. Source INTERNAL tetap terpisah dari
DEMO, provider eksternal dan nilai rubrik milestone.

Runner membuat hasil UI/UX internal baru yang menjadi hasil terkini secara sah;
jalankan suite regresi dashboard seed terlebih dahulu atau gunakan DB disposable
terpisah untuk suite yang mengharapkan fixture awal 79/84/88. Jangan mereset data
atau mengganti respons API dengan mock hanya untuk mempertahankan angka seed.
Kontrak dan hasil verifikasi: [UI/UX API](../docs/UI-UX-ASSESSMENT-API.md).

Tes unit adapter paginated: `npx tsx --test tests/assessment-http.test.ts` (tanpa DB).

## Upload berkas privat — Phase 4B

Lihat [setup, keamanan, dan hasil aktual](../docs/FILE-UPLOAD-ATTACHMENTS.md).
`npm run test:files:unit` tidak memakai DB. Runner API/browser memerlukan DB test
terisolasi, Auth.js aktif dan storage sementara di luar repo:
`npm run test:files:api`, lalu `npm run test:files:browser`.
Gunakan `AUDIT_OUTPUT_DIR` berbeda untuk tiap runner, di bawah induk yang sama;
runner browser membaca `file-attachments-regressions/flow.json` milik runner API.
Sesudah menghentikan dan menyalakan ulang aplikasi dengan DB/root storage sama,
jalankan `npm run test:files:api -- restart` untuk membandingkan checksum kembali.
Runner API melakukan fault injection HANYA pada `FILE_STORAGE_LOCAL_ROOT` di bawah
direktori temp OS; jangan gunakan storage development bersama. Semua file fixture
pada `tests/fixtures/submission-files/` adalah dokumen/gambar fiktif tanpa data siswa.
