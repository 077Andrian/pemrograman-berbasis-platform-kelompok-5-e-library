# Frontend Web — E-Library

Prototipe web menggunakan HTML, CSS, dan JavaScript biasa agar dapat dicoba tanpa langkah build framework.

## File utama

- login.html: form login/registrasi dan area katalog setelah autentikasi.
- login.css: styling mengikuti Design System Kelompok 5.
- login.js: validasi form, request auth, katalog, peminjaman, dan kontrol Admin.
- config.js: konfigurasi base URL API.

## Menjalankan

1. Pastikan backend menyediakan endpoint pada port 3000.
2. Atur apiBaseUrl di config.js; default http://localhost:3000/api.
3. Jalankan server static dari folder ini, misalnya python -m http.server 5500.
4. Buka http://localhost:5500/login.html.

Pengguna dapat mendaftar sebagai Member dan login. Setelah login, aplikasi memanggil endpoint profil terlindungi sebelum menampilkan katalog. Member dapat mencari buku, meminjam, serta mengembalikan pinjaman miliknya. Admin dapat menambah, mengubah, atau menghapus buku serta mengelola pengembalian.

Backend harus mengizinkan origin development lewat CORS. Token hanya dipegang di memori browser, tidak disimpan dalam localStorage/sessionStorage; refresh halaman mengharuskan login ulang. Kontrol UI bukan pengganti otorisasi backend.

CI memeriksa sintaks JavaScript. Pengujian browser secara manual tetap perlu dilakukan; API test otomatis tersedia di folder backend/tests.