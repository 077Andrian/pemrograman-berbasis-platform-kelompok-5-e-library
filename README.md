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
2. **TK 2 — Auth Matrix dan protected endpoints:** [dokumen rancangan](docs/tugas-kelompok-2-auth-matrix.md), middleware JWT/role serta endpoint backend.
3. **TK 3 — Prototipe login web dan mobile:** [dokumen](docs/tugas-kelompok-3-login-prototype.md), [halaman login web](frontend/web/login.html), dan [kode Flutter](frontend/mobile/lib/main.dart).

## Menjalankan aplikasi lokal

### Backend API

Ikuti [panduan Backend](backend/README.md). Intinya: masuk ke folder backend, instal dependency, salin .env.example menjadi .env, isi secret JWT acak minimal 32 karakter, lalu jalankan npm run dev.

- Health: http://localhost:3000/api/health
- Daftar buku: http://localhost:3000/api/books
- Kategori: http://localhost:3000/api/categories

### Web

Jalankan server static dari folder frontend/web, misalnya python -m http.server 5500, lalu buka http://localhost:5500/login.html. Base URL API diatur di frontend/web/config.js.

### Flutter

Lihat [panduan mobile](frontend/mobile/README.md). Untuk Android Emulator gunakan API URL http://10.0.2.2:3000/api agar emulator dapat terhubung ke backend pada komputer host.

## Pengujian

Jalankan npm test dari folder backend. GitHub Actions juga menjalankan automated API tests untuk perubahan backend. Build Flutter dan uji manual di browser/emulator tetap perlu dilakukan di komputer pengembang.

## Catatan keamanan

Jangan commit .env, token, password, credential, ataupun database lokal. Pendaftaran publik hanya menghasilkan role member; Admin dibuat oleh perintah khusus. Proyek ini adalah baseline tugas kuliah, belum dipromosikan sebagai layanan produksi.