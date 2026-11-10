# Autentikasi Bersama Guru dan Siswa

Frontend di `main` menggunakan satu alur autentikasi mock untuk kedua role. Petunjuk instalasi tersedia di [panduan frontend](README.md), sedangkan kredensial fiktif yang menjadi acuan ada pada [akun demo di README utama](../README.md#akun-demo).

## Referensi desain dan route

Sumber desain adalah Figma `hWTpQwbyreDsivI3tZ0yLa` → **Guru & Siswa** (`348:10566`) → **Redesign Siswa**. Referensi autentikasi Guru yang lama telah digantikan oleh:

| Layar | Frame | Route bersama |
| --- | --- | --- |
| S01 Login | `370:1538` | `/login` |
| S02 Register | `370:1651` | `/register` |
| S03 Registrasi Google mock | `370:1724` | `/register/google` |
| S04 Loading | `370:1777` | `/loading` |

Teks Login netral terhadap role. Layout terpisah, ilustrasi, dan aset SVG lokal di `public/auth/shared/` mengikuti referensi; bentuk dekoratif menggunakan CSS. Klaim otorisasi Google atau sertifikasi resmi diganti dengan keterangan simulasi.

## Penentuan identitas dan role

`src/lib/auth/accounts.ts` memuat akun Guru Rina serta Siswa Dimas/Aisyah beserta kredensial demo publik. `AccountRole` hanya berisi `teacher | student`. Email, nama, domain, dan label profil tidak digunakan untuk menaikkan hak akses.

- Login menerima username atau email dan mencocokkan kata sandi demo.
- Register publik hanya membuat akun Siswa fiktif dengan email `@example.com`, pemeriksaan kekuatan kata sandi, dan konfirmasi yang cocok. Tidak ada pemilih role Guru.
- Simulasi Google menggunakan identitas `google-dimas` dengan role Siswa; identitas pembelajarannya sama dengan Dimas. Tidak ada request Google OAuth.
- Email kontak profil dapat diubah tanpa mengganti identitas login atau role. Akun Guru berasal dari fixture yang sudah ditentukan.

## Login, loading, dan pembatasan halaman

Setelah kredensial valid, sesi diberi status pending. S04 tampil melalui dua frame animasi, lalu akun pending diaktifkan: Guru menuju `/guru/dashboard`, Siswa menuju `/siswa/dashboard`. Tidak ada penundaan panjang buatan. Kredensial salah tetap berada di Login dengan pesan error.

Layout `/guru` dan `/siswa` selalu merender child page. Setiap halaman terlindungi menempatkan `RoleGate` di dalam page, membungkus komponen fitur; batas Suspense yang sudah ada dipertahankan. Guard mengarahkan pengguna tanpa sesi ke `/login` dan role yang salah ke dashboard miliknya.

Pola tersebut memperbaiki `instant-unrendered-segment`: guard pada layout sebelumnya mengganti seluruh subtree dengan loading sehingga validator Next.js tidak mencapai segmen page. Validasi tidak dinonaktifkan. Halaman terlindungi baru harus memakai guard role yang sesuai dan ditambahkan pada `tests/role-navigation-regressions.mjs`.

Logout mengosongkan akun aktif/pending dan membatasi akses berikutnya. Data domain tetap tersedia dalam tab yang sama untuk pergantian akun demo. Ini pembatasan UI di browser, bukan otorisasi server.

## Penyimpanan dan penanganan gangguan

`src/lib/auth/session.ts` menyediakan sesi reaktif melalui `useSyncExternalStore`. Key `lugina.auth.demo.v1` di sessionStorage menyimpan ID akun, record registrasi fiktif, profil Google mock, serta salt dan digest SHA-256 untuk pencocokan kata sandi registrasi. Kata sandi registrasi tidak disimpan sebagai plaintext. Kata sandi akun fixture tetap publik pada source dan informasi akun demo.

Pilihan “Ingat saya” mempertahankan login saat refresh pada tab yang sama. Jika tidak dipilih, akun aktif hanya bertahan di memori halaman; record registrasi fiktif masih dapat digunakan pada tab tersebut. Logout tidak menghapus data pembelajaran. Storage rusak atau diblokir menampilkan peringatan dan menggunakan fallback memori dengan batas persistensi yang dijelaskan kepada pengguna.

Tidak ada localStorage, cookie sesi server, database autentikasi, atau pengiriman kredensial ke backend. Penyimpanan dan role di browser dapat dimodifikasi pengguna. Produksi memerlukan verifikasi akun, otorisasi setiap request, sesi aman, hashing kata sandi yang sesuai, dan OAuth sungguhan.

## Peta implementasi

| Lokasi | Isi |
| --- | --- |
| `src/lib/auth/accounts.ts` | Akun tetap, `AccountRole`, dan tujuan dashboard |
| `src/lib/auth/session.ts` | Sesi, pencocokan kredensial, registrasi, dan simulasi Google |
| `src/lib/auth/validation.ts` | Validasi form bersama |
| `src/components/auth/` | Shell, form, ilustrasi, loading, `shared-ui.tsx`, dan `role-gate.tsx` |
| `src/app/(auth)/` | Route autentikasi bersama |
| `src/app/guru/`, `src/app/siswa/` | Page yang menggunakan guard sesuai role |

Komponen `AuthButton` lama tetap memiliki konsumen pada modul Guru; keberadaannya tidak berarti ada alur login kedua. Tidak ada route login khusus Guru/Siswa yang terpisah.

## Verifikasi

Gunakan [panduan pengujian](tests/README.md) untuk tes navigasi role di development dan produksi. Pemeriksaan perlu mencakup register, invalid credentials, S04, login kedua role, refresh, logout, akses langsung, dan penolakan role yang salah. Catatan hasil verifikasi sebelumnya serta batas QA ada pada [handover](INTEGRATION-HANDOVER.md).
