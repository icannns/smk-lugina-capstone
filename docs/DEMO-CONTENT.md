# Konten demo Guru dan Siswa

Enam event utama development berasal dari `src/lib/guru/demo-events.ts`:

1. Redesign Aplikasi Kantin Sekolah
2. Landing Page UMKM Rancaekek
3. Poster Kampanye Hemat Energi
4. Workshop Wireframe Sehari
5. Aplikasi Absensi Siswa
6. Company Profile Ekstrakurikuler Sekolah

Seed membuat enrollment akun demo Dimas dan Aisyah untuk keenam event.
Akun baru tetap harus enroll sendiri. Statistik dihitung dari enrollment,
submission, dan assessment yang sebenarnya, tanpa angka tambahan di UI.
Guru dan Siswa memakai record PostgreSQL yang sama; tidak ada fallback API
atau judul samaran khusus frontend. Daftar card menampilkan enam item per
halaman secara bawaan, dengan filter dan pagination tetap tersedia.

## Database development yang sudah berisi hasil pengujian

`npm run db:seed` hanya menambahkan fixture yang belum ada. Perintah itu
tidak menimpa judul event yang sudah tersimpan. Untuk merapikan judul fixture
pengujian lama, buat backup database lalu gunakan perintah berikut pada
database lokal development/test dengan konfigurasi `.env` yang sesuai:

```powershell
$env:NODE_ENV = 'development'
$env:ALLOW_DEV_SEED = 'true'
npm run demo:content
# Periksa daftar perubahan terlebih dahulu; perintah di atas hanya preview.
npm run demo:content -- --apply
```

Perintah menolak database produksi/nonlokal, database tanpa marker seed,
dan pemilik akun demo yang tidak cocok. Hanya fixture dengan pola ID
pengujian yang dikenal dan judul yang masih berisi penanda testing yang
diganti. Judul project buatan pengguna tidak disamarkan atau difilter.
Tidak ada record yang dihapus; ID, enrollment, tugas, file, dan penilaian lama
dipertahankan. Riwayat fixture lama mendapat nama project sekolah lain yang
natural dan tetap bisa diakses melalui pagination. Enam event utama
ditambahkan hanya bila belum ada, bukan menggandakan setiap refresh.

Perapian lokal tidak mengubah database rekan tim melalui Git. Setelah pull,
rekan tim perlu menjalankan seed/perapian development pada database mereka
sendiri. Data tetap fiktif; perintah ini bukan migrasi database produksi.

## Verifikasi perubahan

ESLint, `npx tsc --noEmit`, dan production build lulus. Pengujian mencakup
40 assertion unit/regresi/integritas database serta 25 pemeriksaan browser
dengan database QA terpisah: enam card, pagination, pencarian/filter, detail
event, registrasi, enrollment tersimpan, dan peserta di Monitoring Guru.
Screenshot 1440 px menunjukkan grid daftar event 3 kolom × 2 baris.
Pemeriksaan 320, 768, dan 1440 px tidak menemukan overflow horizontal pada
empat layar card. Pemeriksaan tambahan di aplikasi lokal memastikan enam
card per halaman, judul terbit tanpa penanda testing, dan gambar yang
terlihat berhasil dimuat.

Histori pada database lokal yang sudah dipakai tidak dibatasi menjadi enam
record: perapian mempertahankan event lama melalui pagination. Enam adalah
jumlah bawaan card per halaman dan jumlah event utama untuk seed bersih.
Database lama diperiksa dengan fingerprint record sebelum/sesudah perapian;
tidak ada record lama yang hilang atau berubah selain judul dan timestamp
pembaruan Event.
