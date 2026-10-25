# Backend API — E-Library Kelompok 5

Backend memakai Node.js 24+, Express, SQLite, bcryptjs untuk hashing kata sandi, dan JWT untuk autentikasi.

## Instalasi dan konfigurasi

Masuk ke folder backend:

    npm install
    copy .env.example .env

Di PowerShell perintah salin bisa menggunakan Copy-Item .env.example .env. Buka .env dan ubah JWT_SECRET menjadi string acak minimal 32 karakter. Jangan commit .env.

Jalankan server:

    npm run dev

Default API berjalan di http://localhost:3000. Database SQLite dibuat otomatis di backend/data/elibrary.sqlite. Kategori dan enam buku contoh dibuat saat startup awal.

Health check: GET /api/health

## Membuat akun Admin

Gunakan terminal pada folder backend, ganti email/password/nama dengan milik kelompok:

    npm run admin:create -- admin@elibrary.local "PasswordKuatYangBerbeda123!" "Admin E-Library"

Password Admin harus terdiri dari 12–72 karakter. Skrip tidak akan menaikkan role akun yang sudah ada. Jangan gunakan password contoh untuk data penting. Registrasi API biasa selalu membuat role member.

## Endpoint publik

- GET /api/health
- GET /api/books?q=kata&page=1&limit=20&categoryId=1
- GET /api/books/:id
- GET /api/categories
- POST /api/auth/register — JSON: name, email, password
- POST /api/auth/login — JSON: email, password

## Endpoint Member

Kirim header Authorization: Bearer <accessToken>.

- GET /api/auth/me
- POST /api/loans — JSON: bookId dan dueDate opsional (YYYY-MM-DD)
- GET /api/loans/my
- POST /api/loans/:id/return

Identitas peminjam diambil dari JWT terverifikasi; userId dari request body tidak dipercaya.

## Endpoint Admin

Semua endpoint berikut memerlukan token Admin:

- POST /api/admin/books
- PATCH /api/admin/books/:id
- DELETE /api/admin/books/:id
- POST /api/admin/categories
- PATCH /api/admin/categories/:id
- DELETE /api/admin/categories/:id
- GET /api/admin/loans
- PATCH /api/admin/loans/:id/status — endpoint saat ini menerima status returned

Contoh body buku:

    {
      "title": "Belajar API",
      "author": "Andi Pratama",
      "isbn": "9786021234567",
      "description": "Panduan membangun REST API",
      "categoryId": 2,
      "stock": 4,
      "coverUrl": null
    }

## Format respons

Data umum dikirim sebagai { "data": ... }; login mengembalikan accessToken, tokenType, expiresIn, dan user. Error memakai { "error": { "code": "...", "message": "..." } }.

Kode status utama: 400 query/ID tidak valid, 401 token atau kredensial salah, 403 role tidak diizinkan, 404 tidak ditemukan, 409 konflik, 422 validasi, 500 kesalahan internal.

## Menjalankan test

    npm test

Test menggunakan database SQLite sementara di memori.

## Catatan batasan

Sebelum deployment nyata, evaluasi backup database, rate limiting percobaan login, refresh/revocation token, monitoring, HTTPS, dan secret produksi.