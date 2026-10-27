# Proposal Proyek E-Library — Kelompok 5

## Pilihan Proyek

Kelompok 5 memilih **Project 4 — E-Library** dan mempertahankan pilihan ini sampai UAS sesuai panduan praktikum. Proyek ini dipilih karena masalah pencarian koleksi, ketersediaan buku, peminjaman, pengembalian, dan pencatatan sirkulasi dekat dengan kebutuhan pengguna perpustakaan kampus. Aplikasi akan menyatukan katalog dan sirkulasi dalam satu sistem yang dapat diakses melalui web serta aplikasi mobile.

## Latar Belakang

Anggota perpustakaan perlu mengetahui ketersediaan buku sebelum datang ke rak. Pustakawan membutuhkan catatan sirkulasi yang teratur, sementara pimpinan membutuhkan data untuk membantu keputusan pengadaan. Sistem E-Library dirancang agar katalog, peminjaman, pengembalian, serta statistik koleksi dapat dikelola dari satu sumber data.

## Tujuan

1. Menyediakan pencarian katalog berdasarkan judul, pengarang, dan ISBN.
2. Menyediakan alur peminjaman, tanggal jatuh tempo, dan pengembalian yang memperbarui stok.
3. Memisahkan hak akses Anggota, Pustakawan, dan Pimpinan.
4. Menyediakan statistik dasar untuk evaluasi koleksi dan sirkulasi.
5. Mengembangkan API yang dipakai bersama oleh frontend web dan mobile.

## Pengguna dan Peran

- **Anggota (member):** mencari buku, melihat stok, meminjam, mengembalikan, dan melihat riwayat pinjaman sendiri.
- **Pustakawan (librarian):** mengelola katalog, kategori, stok, serta memantau dan memperbarui status sirkulasi.
- **Pimpinan (leadership):** membaca dashboard statistik koleksi, transaksi, aktivitas anggota, dan buku yang stoknya menipis.
- Pengunjung yang belum login dapat melihat katalog publik, tetapi bukan role akun keempat.

## Requirement — 12 Fitur

| No. | Fitur | Kriteria ringkas |
|---:|---|---|
| 1 | Autentikasi dan hak akses tiga role | Anggota dapat registrasi/login; Pustakawan dan Pimpinan dibuat oleh pengelola; backend menerapkan otorisasi. |
| 2 | Pencarian buku | Pencarian berdasarkan judul, pengarang, atau ISBN. |
| 3 | Detail dan ketersediaan buku | Pengguna melihat informasi buku, kategori, dan stok tersedia. |
| 4 | Peminjaman | Anggota meminjam buku yang stoknya tersedia; tanggal jatuh tempo tercatat. |
| 5 | Pengembalian | Status transaksi diperbarui dan stok bertambah tepat satu kali. |
| 6 | Perpanjangan masa pinjam | Anggota meminta perpanjangan; tanggal baru divalidasi backend. |
| 7 | Antrean reservasi | Anggota dapat masuk antrean saat stok habis dan melihat posisi antreannya. |
| 8 | Denda terlambat | Sistem menghitung denda berdasarkan tanggal jatuh tempo dan aturan yang disepakati. |
| 9 | Koleksi e-book | Katalog e-book tersedia dan file hanya dapat diakses sesuai hak pengguna. |
| 10 | Kelola katalog dan stok | Pustakawan menambah, mengubah, dan menghapus data sesuai aturan transaksi. |
| 11 | Kelola sirkulasi | Pustakawan melihat seluruh pinjaman dan memperbarui pengembalian yang sah. |
| 12 | Dashboard pimpinan | Statistik jumlah judul, stok, pinjaman aktif, buku populer, anggota aktif, dan stok menipis. |

Requirement 6–9 merupakan target lanjutan; pencantumannya tidak berarti fitur tersebut sudah diimplementasikan.

## Teknologi

- Backend/API: Node.js 24, Express, REST API.
- Database: SQLite.
- Autentikasi: JWT dan bcrypt untuk hashing kata sandi.
- Frontend Web: HTML, CSS, JavaScript.
- Frontend Mobile: Flutter dan Dart.
- Pengujian: Node.js test runner, Supertest, Flutter widget tests, dan smoke test manual.

## Pembagian Peran

Lihat [pembagian peran kelompok](pembagian-peran.md). Nama/NIM anggota Backend yang belum dikonfirmasi harus diisi oleh kelompok, bukan ditebak.

## Target Milestone Awal

Untuk pemeriksaan Rabu, 28 Oktober 2026, kelompok menargetkan minimal 8 dari 12 fitur (66,7%) dapat didemonstrasikan, memiliki REST API yang berjalan, dan memiliki tiga role. Pencapaian dihitung hanya untuk fitur yang benar-benar sudah diimplementasikan dan diuji; fitur yang baru direncanakan tidak dihitung selesai.

## Status

Fondasi backend, autentikasi awal, katalog, peminjaman/pengembalian, halaman web, aplikasi Flutter, serta endpoint statistik pimpinan telah ditambahkan ke repository. Perubahan role dan dashboard masih perlu ditarik ke komputer serta diverifikasi melalui npm test, Flutter test/analysis, dan uji manual di web/mobile.
