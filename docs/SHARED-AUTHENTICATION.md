# Autentikasi Bersama Guru dan Siswa

> **Pembaruan Backend Phase 3:** alur event/enrollment/tugas/penilaian/profil dan
> laporan sudah memakai REST API + PostgreSQL. Keterangan mock/sessionStorage
> di uraian fase terdahulu di bawah merupakan catatan historis, bukan mode fallback
> aplikasi saat ini. Sesi berbeda memakai database yang sama; lampiran masih
> metadata dan provider eksternal belum terintegrasi. Acuan terbaru:
> [REST API dan persistensi](BACKEND-REST-API.md). Total schema kini 27 model.


Autentikasi kini menggunakan Auth.js, PostgreSQL, Argon2id dan RBAC server.
Panduan konfigurasi, provisioning akun tester, keamanan dan tes berada di
[AUTHENTICATION-RBAC.md](AUTHENTICATION-RBAC.md).

## Referensi desain dan route

Sumber desain adalah Figma `hWTpQwbyreDsivI3tZ0yLa` → **Guru & Siswa** (`348:10566`) → **Redesign Siswa**. Referensi autentikasi Guru yang lama telah digantikan oleh:

| Layar | Frame | Route bersama |
| --- | --- | --- |
| S01 Login | `370:1538` | `/login` |
| S02 Register | `370:1651` | `/register` |
| S03 Pratinjau registrasi Google | `370:1724` | `/register/google` |
| S04 Loading | `370:1777` | `/loading` |

Teks Login netral terhadap role. Layout terpisah, ilustrasi, dan aset SVG lokal di `public/auth/shared/` mengikuti referensi; bentuk dekoratif menggunakan CSS. Google OAuth belum tersedia; layar pratinjau tidak membuat sesi.

## Alur aktif

Login email/username diverifikasi server, lalu S04 mengarahkan ke Dashboard Guru
atau Siswa menurut role database. Registrasi publik hanya membuat Siswa.
Google tetap berupa pratinjau; tidak ada simulasi yang menghasilkan sesi.
Logout mencabut sesi login di database dan menghapus cookie Auth.js.

`src/lib/auth/session.ts` mengadaptasi identitas publik Auth.js untuk fitur
frontend yang ada; tidak menyimpan credential/token di sessionStorage.
Cache autentikasi mock versi lama dibuang saat provider terpasang, sedangkan
cache data event/pembelajaran tetap dipertahankan. Data bisnis masih mock.

Proxy memeriksa seluruh route Guru/Siswa pada server. Handler data memeriksa
principal dan ownership lagi; RoleGate client hanya untuk UX/loading. Layout
mempertahankan child route untuk kompatibilitas Instant Navigation.

Akun fiktif Rina/Dimas/Aisyah perlu diprovisikan melalui command development;
tidak ada password default publik. Gunakan [panduan Auth](AUTHENTICATION-RBAC.md)
sebelum mencoba login, bukan credential frontend mock lama.
