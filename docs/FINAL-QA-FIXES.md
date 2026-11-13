# Perbaikan Tujuh Bug Final QA

Tanggal verifikasi: 14 November 2026.

Branch lokal: `fix/final-qa-bugs`, base `origin/main` commit
`1a0148927de64fc730d610547bfcffe076d82432`.
Workspace: `C:/Capstone Lugina Rancaekek Fixes`.
Pengujian selesai sebelum publikasi Git; identitas publikasi tercatat pada riwayat
commit. Tidak ada deployment atau perubahan database produksi.
Laporan audit semula tetap dipertahankan sebagai bukti kondisi sebelum perbaikan.

## Hasil per temuan

| ID | Status | Perbaikan dan bukti pengujian |
| --- | --- | --- |
| QA-01 | FIXED / VERIFIED | Workspace DTO menyediakan `updatedAt` ISO dengan presisi penuh, terpisah dari tanggal tampilan `updated`. API mengurutkan seluruh published+draft sebelum pagination; tie-break memakai ID. UI memakai comparator yang sama. Unit dan API/browser memverifikasi timestamp pada hari yang sama serta halaman 1/2. |
| QA-02 | FIXED / VERIFIED | Detail Siswa memakai completion selector pembelajaran bersama. Timestamp respons survei tetap terpisah. Unit mencakup survei opsional, survei wajib belum diisi, dan survei wajib terisi. Browser membuktikan progres 100% tanpa mengarang respons survei atau nilai. |
| QA-03 | FIXED / VERIFIED | Registrasi/profil dan UI memakai validasi nama yang menolak kontrol/surrogate invalid. Serializer XML menangani data historis yang sudah terlanjur tersimpan, sambil mempertahankan Unicode valid. Ekspor XLSX nyata untuk nama lama U+000B berhasil diparse sebagai XML dan tetap string cell, bukan formula. |
| QA-04 | FIXED / VERIFIED | Rantai typescript-eslint diperbarui dalam rentang yang sudah dipakai. Scoped override hanya pada minimatch milik typescript-estree, ke 11.0.8. Npm audit penuh dan production keduanya 0 vulnerability; clean npm ci memverifikasi lockfile. |
| QA-05 | FIXED / VERIFIED | Dua banner dokumentasi menyebut Phase 4B,29 model, bytes privat dan kontrak terbaru. Status Phase 1/2 ditandai historis. Tautan dan isi banner diperiksa. |
| QA-06 | FIXED / VERIFIED | Card sebelum submit hanya ditampilkan bila milestone benar-benar memiliki survei aktif. Lima lebar layar diuji; alur survei yang ditugaskan tetap lulus regresi. |
| QA-07 | FIXED / VERIFIED | Iframe native diganti PDF.js canvas lokal dengan worker terbundel. Isi PDF dua halaman benar-benar digambar, navigasi halaman/keyboard/reopen dan download checksum diuji; Student lain tetap 403. Tidak membuka sandbox atau URL file publik. |

## Verifikasi aktual

**210 assertion group unik PASS:**44 unit/integritasDB,156 group dalam 9 suite existing,
dan 10 group khusus perbaikan. Pengulangan tes setelah clean install tidak dihitung
sebagai kasus baru. Ini bukan jumlah HTTP request ataupun 210 perjalanan pengguna.

- Unit/integritas:18 Node tests lama,10 auth/storage/safety/HTTP tests,6 test baru,
  serta 10 integrity tests PostgreSQL.
- Suite existing: REST 12, REST-browser 11, audit-browser 7, assessment-dashboard 25,
  role-navigation 51, auth-browser 15, file API 13, file-browser 9, UIUX 13.
- Focused: sorting, progres, validasi nama/profil, XLSX historis, copy survei,
  rendering PDF dua halaman, page navigation, download, isolasi akun dan reopen.
- `npm ci`:PASS, Prisma postinstall sukses,0 vulnerability.
- `npm run build`:PASS dari root setelah clean install.
- `npm run lint`:PASS, tanpa error/warning lint.
- `tsc --noEmit --incremental false`:PASS setelah Next type generation/build.
- `npm audit --json` dan `npm audit --omit=dev --json`:PASS, keduanya 0 vulnerability.
- Enam migrasi existing berhasil direplay pada PostgreSQL 17 khusus pengujian.
  Tidak membuat/mengubah file migration atau menyentuh DB audit/produksi.
- PDF dan card survei diperiksa pada 320, 375, 768, 1024, dan 1440 px.
  Screenshot 320/1440 diperiksa visual; tidak ada overflow dokumen atau runtime error
  pada focused test. Halaman PDF boleh scroll di dalam panel.
- 46 asset JS/MJS hasil build dipindai terhadap nilai rahasia QA aktual:0 match.
- `git diff --check`:PASS; tidak ada .env, build artifact atau credential yang
  ditambahkan ke source.

Skenario 37 langkah audit tidak dijalankan lagi sebagai runner terpisah pada putaran
ini. Regresi lintas peran/publish/enroll/submit/revisi/assessment/portfolio/report
tercakup pada suite existing yang benar-benar dijalankan ulang, ditambah probe
khusus di atas. Tidak mengklaim pengujian cloud atau produksi.

## Cara menjalankan regresi baru

```powershell
npm run test:qa:fixes
npm run test:qa:fixes:browser
```

Browser test memerlukan server production lokal, DB dengan nama test dan guard
`ALLOW_DEV_SEED`, tiga akun testing terotorisasi, password via environment,
`AUDIT_BASE_URL`, `AUDIT_OUTPUT_DIR` serta `PLAYWRIGHT_MODULE` seperti suite existing.
Gunakan storage privat dan database QA terisolasi; script menambah fixture fiktif,
bukan untuk dijalankan pada shared/production. Guard menolak remote/generic target.
Tidak ada password atau signing secret dalam dokumen ini.

Test baru ada di [unit regression](../tests/final-qa-fixes.test.ts) dan
[browser regression](../tests/final-qa-fixes-browser.mjs). Assertion PDF pada
[file browser regression](../tests/file-attachments-browser.mjs) diperkuat agar
memeriksa pixel dokumen, bukan hanya keberadaan iframe.

## Dependency dan batas yang masih berlaku

- PDF.js 5.4.624 dipin karena mendukung rentang Node proyek; worker dilayani dari
  bundle aplikasi sendiri, tanpa CDN atau pengiriman berkas ke layanan luar.
  Implementasi mengikuti [contoh resmi Mozilla PDF.js](https://mozilla.github.io/pdf.js/examples/).
  Parsing/rendering terjadi pada worker/canvas, `isEvalSupported:false`;
  script/links/form interaktif PDF tidak diaktifkan. Hanya satu halaman dirender
  sekaligus, ukuran raster dibatasi, worker/objek dibersihkan saat dialog ditutup.
- Canvas belum menyediakan text layer/screen-reader dokumen atau fitur lengkap
  pembaca PDF. Tombol Unduh PDF tetap tersedia untuk aplikasi PDF/aksesibilitas.
  Berkas tak terbaca atau terenkripsi dapat menampilkan fallback error/download;
  tidak diklaim seluruh varian PDF teruji. Edge Windows diuji, bukan seluruh OS/browser.
- Npm masih memberi peringatan lifecycle ESLint 9.39.5, meskipun audit kerentanan 0.
  Migrasi major ESLint bukan bagian perbaikan ini. Override minimatch harus ditinjau
  lagi bila upstream typescript-eslint mengadopsi versi patched secara native.
- S3 live, TLS produksi, antivirus/quarantine, restore backup, load test dan integrasi
  FOMO/COMMIT tetap belum diverifikasi/di luar scope, sesuai laporan audit awal.
  Menutup tujuh bug lokal bukan pengesahan kesiapan produksi.

## File perubahan

- `docs/AUTHENTICATION-RBAC.md`
- `docs/DATABASE-FOUNDATION.md`
- `docs/FINAL-QA-FIXES.md`
- `package-lock.json`
- `package.json`
- `src/app/api/events/route.ts`
- `src/app/api/profile/route.ts`
- `src/components/guru/profile/teacher-profile.tsx`
- `src/components/shared/attachment-actions.tsx`
- `src/components/shared/pdf-preview.tsx`
- `src/components/siswa/profile/student-profile.tsx`
- `src/components/siswa/workspace/student-workspace.tsx`
- `src/lib/auth-demo.ts`
- `src/lib/guru/client-export.ts`
- `src/lib/guru/event-selectors.ts`
- `src/lib/guru/event-types.ts`
- `src/lib/guru/student-integration.ts`
- `src/lib/text-validation.ts`
- `src/server/auth/validation.ts`
- `src/server/domain/common.ts`
- `src/server/domain/workspace.ts`
- `tests/file-attachments-browser.mjs`
- `tests/final-qa-fixes-browser.mjs`
- `tests/final-qa-fixes.test.ts`

## Bukti lokal

Bukti JSON/log/screenshot/PDF/XLSX dan ledger perintah tersimpan di folder evidence
privat audit perbaikan, di luar Git. Percobaan awal focused test memperbaiki fixture
konfigurasi sertifikat, payload attachment dan pemisahan newline Windows; tidak ada
bug aplikasi yang disembunyikan sebagai PASS. Hasil focused final serta pengulangan
setelah clean install masing-masing 10/10 PASS. Penghentian proses server terkontrol
bukan kegagalan test aplikasi.


Layanan QA dimatikan setelah pemeriksaan; database, objects dan evidence tidak
dihapus. Seluruh workspace lama dan laporan audit dipertahankan.
