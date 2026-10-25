# Frontend Web — E-Library

Prototipe web menggunakan HTML, CSS, dan JavaScript biasa agar bisa dicoba tanpa langkah build framework.

## File utama

- login.html: form login dan area katalog setelah login.
- login.css: styling mengikuti Design System Kelompok 5.
- login.js: validasi form, auth token di memori, katalog, peminjaman, dan kontrol Admin.
- config.js: konfigurasi base URL API.

## Menjalankan

1. Pastikan backend menyediakan endpoint pada port 3000.
2. Atur apiBaseUrl di config.js; default http://localhost:3000/api.
3. Jalankan server static dari folder ini, misalnya python -m http.server 5500.
4. Buka http://localhost:5500/login.html.

Setelah login, aplikasi memanggil endpoint profil terlindungi sebelum menampilkan katalog. Member dapat melihat/mencari buku, meminjam, serta mengembalikan pinjaman miliknya. Admin dapat menambah/mengubah/menghapus buku dan mengelola pengembalian pinjaman.

Backend harus mengizinkan origin development lewat CORS. Token hanya dipegang di memori browser, tidak disimpan dalam localStorage/sessionStorage; refresh halaman akan mengharuskan login ulang. Kontrol UI bukan pengganti otorisasi backend. Pengujian langsung browser belum diverifikasi otomatis; tes API ada di folder backend/tests.