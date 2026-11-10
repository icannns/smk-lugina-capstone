# Panduan Modul Guru

Modul Guru sudah tergabung ke `main` bersama modul Siswa sebagai prototipe lokal. [Panduan frontend](FRONTEND.md) menjelaskan setup; [handover integrasi](INTEGRATION-HANDOVER.md) menjadi acuan state dan kontrak lintas tim. Angka fixture adalah data fiktif, bukan statistik sekolah yang sedang berjalan.

## Referensi desain

Figma `hWTpQwbyreDsivI3tZ0yLa`, **Page 1** (`0:1`) → **Redesign Guru**, di antara Form Survei Guru dan Redesign Siswa. Frame target didahulukan ketika berbeda dari Design System `244:845`. Autentikasi mengikuti [Redesign Siswa S01–S04](SHARED-AUTHENTICATION.md), bukan Role Guru lama.

| Bagian | Frame acuan |
| --- | --- |
| Dashboard dan kondisi kosong | `291:16094`, `291:16304` |
| Data Siswa: pemilihan event, Workshop, filter M1, detail | `291:16571`, `291:16703`, `291:17019`, `291:17339` |
| Event: daftar, draf, konfirmasi hapus, detail | `291:17842`, `291:18128`, `291:18301`, `291:18474` |
| Wizard: informasi, milestone, rubric, sertifikat/template, tinjau, selesai | `293:29139`, `291:19016`, `291:19328`, `291:19593`, `291:19865`, `291:20108`, `291:20395` |
| Kelola rubric: daftar, buat, lihat, edit | `291:20520`, `291:20745`, `291:21058`, `291:21370` |
| Monitoring dan berbagai kondisi assessment | `291:21691`, `291:22831`, `291:23200`, `291:23570`, `291:23934`, `291:24254`, `291:24637`, `291:24976`, `291:25369` |
| Karya Siswa | `291:25994`, `291:26201`, `291:26470` |
| Laporan Perkembangan | `291:26708`, `291:26879`, `291:27314` |
| Profil Guru | `291:28235` |

Aset lokal berada di `public/guru/dashboard/`, `public/guru/students/`, `public/guru/events/`, `public/guru/wizard/`, dan `public/guru/design/`. Pemetaan berada pada berkas asset dan navigation di `src/lib/guru/`. Inter, token Lugina, radius kontrol, dan warna semantik digunakan kembali. Mobile merupakan adaptasi frame desktop; tidak ada klaim identik piksel pada semua ukuran.

## Route dan konteks

| Route | Fungsi dan parameter penting |
| --- | --- |
| `/guru/dashboard` | Ringkasan; `?state=empty` untuk kondisi kosong |
| `/guru/students` | Pilih event; `event`, `milestone`, `q`, `review`, `page`; `student` membuka detail |
| `/guru/events` | Daftar terbit; `tab=draft` untuk draf; `event` untuk detail; `q`, `status`, `sort`, `page`, `size` untuk daftar |
| `/guru/events/create` | Wizard; `draft=ID` dan `step=information/milestones/rubric/certificate/review`; layar selesai mengikuti status event terbit |
| `/guru/rubrics` | Daftar; `mode=create/view/edit/copy`, `rubric=ID`, dan `from=DRAFT_ID` untuk kembali ke wizard |
| `/guru/monitoring` | Konteks `event=ID`; `student=ID&milestone=ID` membuka assessment |
| `/guru/work` | Arsip event; `event=ID` untuk peserta dan `student=ID` untuk riwayat karya |
| `/guru/reports` | Filter event, survei, Siswa, pengerjaan, penilaian, dan milestone |
| `/guru/profile` | Profil dan crop avatar contoh |

Contoh deep link: `/guru/students?event=wireframe&milestone=M1`, `/guru/students?event=kantin&student=aisyah`, dan `/guru/monitoring?event=kantin&student=nabila&milestone=M4`. Link detail membawa identitas event dan Siswa yang dipilih, sehingga contoh Workshop tidak terbuka sebagai enrollment Kantin.

## Dashboard dan navigasi

Dashboard menyediakan kondisi berisi/kosong, pencarian judul, filter status, pengurutan, dan pagination 2/4 event. Jumlah hasil mengikuti event unik; kartu yang berulang di Figma tidak menjadi event duplikat. Angka progres dan antrean penilaian/survei berasal dari selector bersama. Tanggal header tetap merupakan snapshot desain.

Create Event membuka wizard; Lanjutkan Draf memakai draft ID yang sama. Hapus draf menggunakan konfirmasi dan mendukung undo pada Dashboard. Sidebar fitur aktif terhubung ke route yang sesuai. Menu administrasi Survei/privasi tampil normal dan dapat ditekan, tetapi sementara tidak menjalankan aksi, membuka modal, atau mengubah URL dan menu aktif. Menu akun mendukung Escape dan klik di luar; drawer mobile memakai dialog dengan pembatasan fokus dan tombol tutup.

## Pengelolaan data Siswa

Tabel berisi record pengumpulan menurut enrollment event, bukan seluruh anggota kelas. Pencarian nama, filter milestone/review, reset, delapan record per halaman, dan navigasi detail bekerja pada data yang sama. Parameter URL mempertahankan konteks filter dan mendukung refresh serta Browser Back melalui History API.

Pilihan review “Semua/Sudah ditinjau/Belum ditinjau” merupakan interpretasi kontrol Figma yang tidak berlabel lengkap. Detail menyimpan catatan secara eksplisit dan penanda review ke store bersama per enrollment. Keduanya bertahan setelah perpindahan modul dan refresh selama storage sesi tersedia. Respons survei baru memerlukan peninjauan lagi; penanda review bukan nilai rubric.

Adapter `student-integration.ts` menggabungkan metadata respons baru dengan fixture lama. Waktu respons survei dibedakan dari waktu pengiriman tugas. Timestamp/jawaban historis yang tidak tersedia ditampilkan sebagai tidak tersedia; tidak dibuat ulang. Ringkasan survei tidak menjadi diagnosis klinis atau kebijakan kelulusan tambahan.

## Daftar dan detail event

Pencarian, filter status, pengurutan referensi/judul/pembaruan, tab terbit/draf, dan ukuran halaman 2/4/6 tersedia. Parameter yang tidak valid memakai fallback atau dibatasi ke halaman yang tersedia. Detail dan Browser Back mempertahankan konteks daftar.

Konfirmasi hapus draf mendukung batal, Escape, dan pemulihan fokus. Detail event menampilkan milestone, instruksi, format, status survei, rubric, dan konfigurasi sertifikat yang benar-benar tersedia. Perubahan deadline dikaitkan dengan event + milestone dan muncul juga di Monitoring. Nilai waktu memakai WIB; informasi fixture yang tidak diketahui tidak diisi dengan aturan baru.

Jumlah peserta berasal dari enrollment. Event baru mulai dengan nol peserta dan kemudian dapat menerima pendaftaran melalui modul Siswa. Progres detail memakai metrik bersama: task terkirim berbeda dari penyelesaian task beserta surveinya.

## Wizard pembuatan event

1. **Informasi:** judul, studi kasus/tujuan, ketentuan/arahan dengan format teks, tautan HTTP/HTTPS, lampiran pendukung, tanggal mulai/deadline WIB, dan Mode Penyelesaian.
2. **Milestone:** tambah, pilih, edit, duplikasi, hapus, pindahkan urutan, instruksi, format pengumpulan, deadline, dan lampiran. ID stabil dipertahankan ketika mengubah urutan.
3. **Rubric:** memilih dari data rubric yang sama dengan Kelola Rubrik; pembuatan rubric dapat kembali ke draft yang sedang dikerjakan.
4. **Sertifikat:** memilih template atau pengaturan khusus, preview, ambang nilai 0–100, dan konfigurasi yang terlihat di UI. Penanda template dapat dipindahkan dengan pointer/keyboard sebagai adaptasi frontend.
5. **Tinjau:** menampilkan rangkuman, kontrol kembali/edit, validasi sebelum publikasi, dan aksi Terbitkan mock.
6. **Selesai:** event terbit muncul pada daftar dengan ID asal; publikasi ulang tidak membuat duplikat.

Informasi wajib mencakup judul, studi kasus, dan tanggal yang valid; deadline event tidak boleh sebelum tanggal mulai. Milestone memerlukan judul, format pengumpulan, dan deadline; setidaknya satu milestone diperlukan untuk lanjut. Milestone yang salah dipilih dan field error difokuskan. Draft parsial tetap dapat disimpan.

Validator milestone belum menambahkan aturan bahwa deadline harus berada di antara tanggal mulai dan akhir event. Kebijakan itu perlu disepakati sebelum integrasi produksi, bukan diasumsikan dari contoh.

State `working` menyimpan perubahan dalam sesi, sedangkan Simpan Draf mengisi daftar `saved`. Penyimpanan berulang memperbarui ID yang sama. Draft tanpa judul ditampilkan sebagai “Draf tanpa judul”; ID yang sudah dihapus tidak dapat dibuka kembali. Field, format teks, urutan, dan milestone terpilih dipertahankan saat navigasi. Parser menormalisasi tanggal invalid dan memulihkan HTML editor melalui allowlist format. Editor memakai perintah penyuntingan native browser; kompatibilitas penuh lintas browser belum dijamin.

Lampiran pendukung Guru menerima PDF/gambar/DOCX, maksimal lima berkas dengan batas `20 * 1024 * 1024` byte per berkas (UI menyebut 20 MB). Picker lampiran milestone Guru tidak menerapkan batas yang sama; jangan menganggapnya kebijakan upload produksi. File hanya disimpan sebagai metadata, bukan diunggah. Nilai contoh `brief-perpustakaan.pdf` merupakan simulasi.

Status survei event baru tetap belum disiapkan. Aksi menuju pembuatan/template Survei tidak membuat instrumen eksternal. Riwayat Figma menempatkan Kembali pada Tinjau menuju Milestone; kontrol edit menuju bagian terkait. Beberapa breadcrumb/URL, autosave, dan navigasi Browser Back merupakan adaptasi frontend, bukan tambahan kebijakan institusi.

## Rubric, assessment, dan revisi

Rubric memakai kriteria berbobot sama, skala 1–5, dan lima uraian skor wajib. Kelola Rubrik mendukung pencarian, buat, lihat, salin, edit, hapus kriteria, dan perubahan urutan kriteria. Rubric yang ditandai `inUse` terkunci untuk edit langsung; salinan mendapat identitas baru. Tidak ada aksi hapus rubric global yang ditambahkan di luar desain.

Skor assessment dinormalisasi: total skor dibagi maksimum rubric × 100. Nilai akhir merupakan rata-rata milestone tanpa bobot tambahan ketika penilaian yang disyaratkan lengkap. Pengumpulan kosong tidak dapat dinilai. Status nol, sebagian, dan seluruh assessment terbaru dibedakan.

Guru dapat menyimpan nilai, feedback, dan permintaan revisi. Revisi setelah deadline memerlukan deadline revisi; nilai yang diberikan untuk deadline revisi harus berupa waktu WIB yang valid di masa depan. Versi lama mempertahankan nilai/feedback historis; versi baru menunggu penilaian ulang. “Siswa berikutnya” mengikuti roster event/milestone yang sama sebagai interpretasi navigasi contoh.

Penyelesaian lebih awal tidak otomatis melewati assessment atau syarat sertifikat. Aturan milestone Siswa dan ambang contoh dijelaskan pada [modul Siswa](STUDENT-MODULE.md).

## Karya, laporan, dan profil

Karya Siswa menyediakan arsip per event, daftar peserta, bukti tugas, feedback, dan versi terdahulu. Buka menampilkan preview contoh; Unduh menghasilkan `.demo.txt` berlabel simulasi, bukan file tugas asli.

Laporan menerapkan filter saat Tampilkan ditekan dan menghapus konteks saat Reset. Status pengerjaan pada tabel, filter, dan ekspor menggunakan definisi yang sama, termasuk task terkirim dengan survei belum lengkap. PDF merangkum data dengan wrapping/pagination; XLSX memuat tabel hasil filter. Keduanya benar-benar dibuat di browser. PDF menggunakan normalisasi teks sederhana; dukungan tipografi Unicode penuh tidak dijanjikan.

Profil Guru mendukung validasi nama, informasi kontak contoh, avatar/crop lokal, simpan, dan batal. Identitas tampilan dipakai header, Dashboard, dan feedback. Perubahan profil tidak memberi role baru atau mengubah password sungguhan.

## Data bersama, desain yang ambigu, dan kelanjutan

Gunakan `ManagedEvent`, `EventMilestone`, serta tipe enrollment dan assessment pada `src/lib/guru/`. `event-draft-store.ts` adalah satu adapter domain; `learning-selectors.ts`, `report-selectors.ts`, dan `student-integration.ts` menyelaraskan tampilan. Inventaris fixture awal berisi empat event unik dengan enrollment Kantin/Workshop/Poster/UMKM; jumlah dapat berubah setelah interaksi mock. Kontrak ID dan key storage ada pada [handover](INTEGRATION-HANDOVER.md).

Snapshot Figma memiliki perbedaan nama, tanggal, jumlah kartu, dan nilai. Implementasi mempertahankan identitas yang konsisten dan menghitung ringkasan dari data bersama. Opsi filter, mekanisme pencarian, deadline editor, serta susunan mobile tidak selalu memiliki hotspot prototype tersendiri; perilakunya adalah adaptasi UI. Jangan menafsirkan adaptasi itu sebagai kebijakan enrollment, pembobotan nilai, atau pengesahan institusi.

Pemeriksaan terdahulu mencakup desktop dan ukuran 320/390/768/1440 px, alur simpan/refresh, penilaian/revisi, serta ekspor. Jalankan [tes regresi](../tests/README.md) pada perubahan baru. Backend, database, OAuth, administrasi Survei, otorisasi dokumen, dan sinkronisasi multi-user menunggu integrasi yang disepakati tim.
