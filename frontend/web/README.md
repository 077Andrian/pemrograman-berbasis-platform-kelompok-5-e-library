# Frontend Web — E-Library

Prototipe login web menggunakan HTML, CSS, dan JavaScript biasa agar dapat dicoba tanpa langkah build framework.

## File utama

- login.html: halaman login.
- login.css: styling yang mengikuti Design System Kelompok 5.
- login.js: validasi form dan request ke endpoint login.
- config.js: konfigurasi base URL API.

## Menjalankan

1. Pastikan backend menyediakan POST /api/auth/login.
2. Atur apiBaseUrl di config.js; default http://localhost:3000/api.
3. Jalankan server static dari folder ini, misalnya python -m http.server 5500.
4. Buka http://localhost:5500/login.html.

Backend harus mengizinkan origin development lewat CORS. Jika API mengembalikan token, kontrak saat ini mengharapkan accessToken dan objek user. Lihat [dokumen Tugas Kelompok 3](../../docs/tugas-kelompok-3-login-prototype.md).

Token hanya dipegang di memori prototipe. Belum ada route guard atau sesi produksi. Jangan menambahkan secret maupun token uji ke repository.