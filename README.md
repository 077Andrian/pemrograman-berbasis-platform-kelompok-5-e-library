# E-Library — Kelompok 5

Proyek akhir mata kuliah Pemrograman Berbasis Platform. Kelompok 5 memilih **Project 4 — E-Library** dari daftar pilihan proyek praktikum dan mempertahankannya sampai UAS.

## Pembagian Peran

Lihat [pembagian peran anggota](docs/pembagian-peran.md).

## Role Pengguna

- **Anggota (member):** registrasi/login, mencari buku, melihat ketersediaan, meminjam/mengembalikan, dan melihat riwayat sendiri.
- **Pustakawan (librarian):** mengelola katalog dan kategori serta memantau/memperbarui sirkulasi.
- **Pimpinan (leadership):** melihat statistik koleksi, peminjaman, anggota aktif, buku populer, dan stok menipis.
- Pengunjung yang belum login bisa melihat katalog publik; Guest bukan role akun tambahan.

## Struktur Repository

    .
    ├── .github/workflows/
    ├── backend/
    │   ├── src/
    │   ├── scripts/
    │   └── tests/
    ├── docs/
    ├── frontend/
    │   ├── web/
    │   └── mobile/
    ├── .gitignore
    ├── CONTRIBUTING.md
    └── README.md

## Tugas Kelompok yang sudah dibuat

1. **TK 1 — Design System:** [Dokumen](docs/tugas-kelompok-1-design-system.md), [preview HTML](frontend/web/design-system-preview.html), dan [preview visual SVG](docs/assets/design-system-preview.svg).
2. **TK 2 — Auth Matrix dan protected endpoints:** [Dokumen rancangan](docs/tugas-kelompok-2-auth-matrix.md), middleware JWT/role, dan endpoint API.
3. **TK 3 — Login Web dan Flutter:** [Dokumen](docs/tugas-kelompok-3-login-prototype.md), [halaman login web](frontend/web/login.html), dan [kode Flutter](frontend/mobile/lib/main.dart).

## Requirement 12 Fitur

Daftar requirement lengkap terdapat di [proposal proyek](docs/proposal.md) dan status pengerjaannya di [backlog](docs/backlog.md).

1. Autentikasi dan hak akses tiga role.
2. Pencarian buku berdasarkan judul, pengarang, dan ISBN.
3. Detail buku dan ketersediaan.
4. Peminjaman dan tanggal kembali.
5. Pengembalian dan pembaruan stok.
6. Perpanjangan masa pinjam.
7. Antrean reservasi buku.
8. Perhitungan denda keterlambatan.
9. Katalog dan unduhan e-book.
10. Kelola katalog dan stok oleh Pustakawan.
11. Kelola sirkulasi oleh Pustakawan.
12. Dashboard statistik Pimpinan.

Fitur 6–9 masih merupakan pekerjaan lanjutan sampai implementasi dan pengujiannya benar-benar selesai.

## Teknologi dan Fitur Dasar

- Node.js 24 dan Express REST API.
- SQLite untuk data lokal.
- JWT untuk autentikasi serta bcrypt untuk hashing kata sandi.
- Frontend web HTML/CSS/JavaScript.
- Frontend mobile Flutter.
- Katalog dengan pencarian, login/registrasi Anggota, peminjaman/pengembalian, pengelolaan katalog oleh Pustakawan, dan statistik Pimpinan.

## Menjalankan Aplikasi Lokal

### 1. Backend API

Masuk ke folder backend, lalu jalankan:

    npm install
    copy .env.example .env

Buka .env, isi JWT_SECRET dengan secret acak minimal 32 karakter, simpan, lalu jalankan:

    npm test
    npm run dev

Endpoint dasar:
- Health: http://localhost:3000/api/health
- Daftar/pencarian buku: http://localhost:3000/api/books
- Detail buku: http://localhost:3000/api/books/1
- Kategori: http://localhost:3000/api/categories
- Statistik Pimpinan (memerlukan token role leadership): GET /api/leadership/stats

Registrasi publik hanya menghasilkan role member. Buat akun Pustakawan/Pimpinan dari folder backend:

    npm run user:create -- pustakawan@elibrary.local "PasswordKuat123456!" "Pustakawan E-Library" librarian
    npm run user:create -- pimpinan@elibrary.local "PasswordKuat123456!" "Pimpinan E-Library" leadership

Gunakan email dan kata sandi lokal milik tim sendiri; jangan commit .env atau kredensial.

### 2. Frontend Web

Dari folder frontend/web, jalankan:

    py -m http.server 5500

Kemudian buka http://localhost:5500/login.html. URL API lokal disetel pada frontend/web/config.js.

### 3. Flutter Mobile

Lihat [panduan mobile](frontend/mobile/README.md). Untuk Android Emulator, URL API biasanya http://10.0.2.2:3000/api. Jika folder platform Android belum ada, ikuti panduan mobile lalu jalankan flutter pub get, flutter test, dan flutter run.

## Pengujian

Di folder backend jalankan npm test. Checklist pengujian manual ada di [docs/manual-smoke-test.md](docs/manual-smoke-test.md). Pengujian browser serta Android Emulator/perangkat harus dilakukan tim; hasil CI yang hijau bukan pengganti pengujian manual.

Workflow CI yang sebelumnya diverifikasi: [GitHub Actions](https://github.com/077Andrian/pemrograman-berbasis-platform-kelompok-5-e-library/actions/runs/40192043036). Periksa hasil workflow terbaru sesudah perubahan role, karena commit baru memicu pengujian ulang.

## Keamanan dan Batasan

- Jangan commit .env, token, password, credential, atau file database lokal.
- Registrasi publik tidak menerima role yang dipilih pengguna; backend hanya membuat Anggota.
- Gunakan HTTPS untuk deployment produksi.
- Proyek belum dianggap production-ready; fitur lanjutan serta pengujian manual perlu dituntaskan sebelum rilis.
