# Backend API — E-Library Kelompok 5

Backend memakai Node.js 24+, Express, SQLite, bcryptjs untuk hashing kata sandi, dan JWT.

## Instalasi dan konfigurasi

Masuk ke folder backend:

    npm install
    copy .env.example .env

Di PowerShell, gunakan Copy-Item .env.example .env. Buka .env dan atur JWT_SECRET dengan secret acak minimal 32 karakter. Jangan commit .env.

Jalankan server:

    npm run dev

Default API berjalan di http://localhost:3000. Database SQLite dibuat otomatis di backend/data/elibrary.sqlite (relatif ke direktori kerja saat perintah dijalankan). Kategori dan enam buku contoh dibuat saat startup awal.

Health check: GET /api/health

## Membuat akun role

Registrasi melalui aplikasi selalu membuat role member. Untuk akun Pustakawan atau Pimpinan, jalankan dari folder backend:

    npm run user:create -- pustakawan@elibrary.local "PasswordKuat123456!" "Pustakawan E-Library" librarian
    npm run user:create -- pimpinan@elibrary.local "PasswordKuat123456!" "Pimpinan E-Library" leadership

Password role khusus harus terdiri dari 12–72 karakter. Jangan menaruh credential dalam repository, screenshot, atau laporan. Perintah lama npm run admin:create -- email password "Nama" tetap tersedia untuk menyiapkan akun Pustakawan pada database lokal.

Saat server pertama kali dijalankan setelah pembaruan role, database lokal lama memigrasikan role admin menjadi librarian. Migration mempertahankan data akun dan peminjaman.

## Endpoint publik

- GET /api/health
- GET /api/books?q=kata&page=1&limit=20&categoryId=1
- GET /api/books/:id
- GET /api/categories
- POST /api/auth/register — JSON: name, email, password
- POST /api/auth/login — JSON: email, password

## Endpoint Anggota

Kirim header Authorization: Bearer <accessToken>.

- GET /api/auth/me
- POST /api/loans — JSON: bookId dan dueDate opsional (YYYY-MM-DD)
- GET /api/loans/my
- POST /api/loans/:id/return

Identitas peminjam berasal dari token terverifikasi. Anggota hanya dapat mengelola pinjamannya sendiri.

## Endpoint Pustakawan

Path /api/admin/... dipertahankan untuk kompatibilitas, tetapi endpoint ini hanya menerima token role librarian.

- POST /api/admin/books
- PATCH /api/admin/books/:id
- DELETE /api/admin/books/:id
- POST /api/admin/categories
- PATCH /api/admin/categories/:id
- DELETE /api/admin/categories/:id
- GET /api/admin/loans
- PATCH /api/admin/loans/:id/status — status yang diterima saat ini adalah returned

## Endpoint Pimpinan

- GET /api/leadership/stats — memerlukan token role leadership, mengembalikan ringkasan koleksi dan sirkulasi, buku yang sering dipinjam, anggota aktif, serta stok menipis.

## Format respons

Data umum dikirim sebagai { "data": ... }; login mengembalikan accessToken, tokenType, expiresIn, dan user. Error memakai { "error": { "code": "...", "message": "..." } }.

Kode status utama: 400 untuk query/ID tidak valid, 401 token/kredensial tidak valid, 403 role tidak diizinkan, 404 tidak ditemukan, 409 konflik, 422 validasi, 500 kesalahan internal.

## Menjalankan test

    npm test

Test memakai database SQLite sementara di memori. Setelah perubahan role, jalankan test ini dan periksa output sebelum menyatakan API lulus.

## Batasan yang masih direncanakan

Perpanjangan masa pinjam, antrean reservasi, perhitungan denda otomatis, penyimpanan/unduhan e-book, rate limiting percobaan login, refresh/revocation token, monitoring, backup, dan deployment HTTPS masih perlu pekerjaan lanjutan.
