# E-Library — Kelompok 5

Proyek akhir mata kuliah Pemrograman Berbasis Platform.

## Pembagian Peran
Lihat [pembagian peran anggota](docs/pembagian-peran.md).

## Struktur Repository

    .
    ├── .github/workflows/
    ├── backend/
    │   ├── src/
    │   ├── scripts/
    │   └── tests/
    ├── docs/
    │   └── assets/
    ├── frontend/
    │   ├── web/
    │   └── mobile/
    ├── .gitignore
    ├── CONTRIBUTING.md
    └── README.md

## Tugas Kelompok

1. **TK 1 — Design System:** [Dokumen](docs/tugas-kelompok-1-design-system.md), [preview HTML](frontend/web/design-system-preview.html), dan [preview visual SVG](docs/assets/design-system-preview.svg).
2. **TK 2 — Auth Matrix dan protected endpoints:** [dokumen rancangan](docs/tugas-kelompok-2-auth-matrix.md), middleware JWT/role, dan endpoint API.
3. **TK 3 — Login Web dan Flutter:** [dokumen](docs/tugas-kelompok-3-login-prototype.md), [halaman login web](frontend/web/login.html), dan [kode Flutter](frontend/mobile/lib/main.dart).

## Fitur yang tersedia

- Registrasi Member dan login memakai backend yang sama.
- Access token JWT dan middleware autentikasi/otorisasi untuk Guest, Member, dan Admin.
- Katalog buku dan kategori dengan pencarian.
- Member dapat meminjam buku, melihat pinjaman sendiri, dan mengembalikan pinjaman.
- Admin dapat menambah, mengubah, dan menghapus buku serta mengelola status pinjaman.
- SQLite untuk penyimpanan data lokal, enam buku contoh, dan kategori seed.
- CI memeriksa API backend, sintaks JavaScript web, analisis/widget test Flutter, dan build APK debug Android.

## Menjalankan aplikasi lokal

### Backend API

Ikuti [panduan Backend](backend/README.md). Masuk ke folder backend, jalankan npm install, salin .env.example menjadi .env, isi JWT_SECRET dengan secret acak minimal 32 karakter, lalu jalankan npm run dev.

- Health: http://localhost:3000/api/health
- Daftar buku: http://localhost:3000/api/books
- Kategori: http://localhost:3000/api/categories

Buat akun Admin dengan perintah pada panduan backend. Jangan memakai kata sandi contoh untuk akun penting.

### Web

Jalankan server static dari folder frontend/web, misalnya python -m http.server 5500, lalu buka http://localhost:5500/login.html. Base URL API diatur di frontend/web/config.js.

### Flutter

Lihat [panduan mobile](frontend/mobile/README.md). Jika platform Android belum tersedia, jalankan flutter create --platforms=android . dari folder frontend/mobile. Untuk Android Emulator gunakan API URL http://10.0.2.2:3000/api.

## Pengujian dan APK

Di folder backend, jalankan npm test. GitHub Actions menjalankan automated API tests, pemeriksaan sintaks web, Flutter analyze/widget tests, serta membangun APK debug. Artefak APK tersedia di halaman [CI yang menghasilkan build Android](https://github.com/077Andrian/pemrograman-berbasis-platform-kelompok-5-e-library/actions/runs/40191686584) selama 14 hari sejak 25 Oktober 2026.

Sebelum penyerahan final, jalankan aplikasi pada browser dan Android Emulator/perangkat untuk smoke test manual. Proyek belum dideploy ke server publik dan belum dipromosikan sebagai layanan produksi.

## Catatan keamanan

Jangan commit .env, token, password, credential, atau database lokal. Registrasi publik hanya menghasilkan role member; Admin dibuat melalui perintah khusus. Gunakan HTTPS untuk deployment produksi.