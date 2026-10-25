# Tugas Kelompok 2 — Matriks Auth dan Endpoint Terlindungi

**Proyek:** E-Library — Kelompok 5  
**Versi:** 1.1  
**Status:** Kontrak autentikasi, endpoint, middleware JWT/role, dan automated test suite telah ditambahkan. Test suite harus dijalankan sebelum dinyatakan terverifikasi.

## 1. Tujuan

Menetapkan aturan yang sama untuk autentikasi dan hak akses sebelum prototipe login web dan mobile pada Tugas Kelompok 3 dibuat. Frontend hanya mengatur tampilan; keputusan izin akses harus tetap diperiksa oleh backend.

## 2. Role pengguna

- **Guest:** pengunjung yang belum login.
- **Member:** pengguna yang sudah login dan hanya boleh mengakses data miliknya sendiri untuk fitur akun/peminjaman.
- **Admin:** petugas yang sudah login dan diizinkan mengelola katalog serta status peminjaman.

Role diberikan atau diverifikasi oleh backend. Frontend tidak boleh menaikkan role berdasarkan input pengguna atau nilai yang disimpan di browser.

## 3. Matriks hak akses

| Fitur | Guest | Member | Admin |
|---|---|---|---|
| Melihat daftar buku dan detail buku | Boleh | Boleh | Boleh |
| Melihat kategori buku | Boleh | Boleh | Boleh |
| Registrasi akun | Boleh | Tidak perlu | Tidak perlu |
| Login | Boleh | Boleh | Boleh |
| Melihat profil sendiri | Tidak boleh | Boleh | Boleh |
| Mengajukan peminjaman | Tidak boleh | Boleh | Sesuai kebijakan aplikasi |
| Melihat riwayat peminjaman sendiri | Tidak boleh | Boleh | Boleh melihat seluruh riwayat |
| Mengembalikan peminjaman milik sendiri | Tidak boleh | Boleh, jika status mengizinkan | Boleh mengelola sesuai kebijakan |
| Menambah, mengubah, dan menghapus buku | Tidak boleh | Tidak boleh | Boleh |
| Mengelola kategori buku | Tidak boleh | Tidak boleh | Boleh |
| Melihat seluruh peminjaman | Tidak boleh | Tidak boleh | Boleh |
| Mengubah status peminjaman | Tidak boleh | Tidak boleh | Boleh |

**Aturan kepemilikan:** Member hanya boleh membaca atau mengubah sumber daya yang menjadi miliknya. Mengganti ID pada URL tidak boleh memberikan akses ke data Member lain. Untuk endpoint admin, backend wajib memeriksa token dan role admin pada setiap permintaan.

## 4. Kontrak endpoint awal

Prefix API yang direncanakan adalah `/api`. Path dan metode di bawah merupakan usulan kontrak agar tim frontend dan backend memakai acuan yang sama; endpoint belum dianggap tersedia sampai diimplementasikan.

### Endpoint publik

| Method | Endpoint | Fungsi | Akses |
|---|---|---|---|
| GET | `/api/books` | Daftar dan pencarian buku | Publik |
| GET | `/api/books/:id` | Detail buku | Publik |
| GET | `/api/categories` | Daftar kategori | Publik |
| POST | `/api/auth/register` | Membuat akun Member | Publik |
| POST | `/api/auth/login` | Memvalidasi kredensial dan menerbitkan token | Publik |

### Endpoint untuk pengguna login

| Method | Endpoint | Fungsi | Aturan |
|---|---|---|---|
| GET | `/api/auth/me` | Profil pengguna dari token | Member/Admin |
| POST | `/api/loans` | Mengajukan peminjaman | Member; pemilik diambil dari token, bukan body |
| GET | `/api/loans/my` | Riwayat pinjaman pengguna aktif | Member; hanya data sendiri |
| POST | `/api/loans/:id/return` | Mengajukan/mencatat pengembalian | Member; harus pemilik dan status harus valid |

### Endpoint khusus Admin

| Method | Endpoint | Fungsi | Aturan |
|---|---|---|---|
| POST | `/api/admin/books` | Menambahkan buku | Admin |
| PATCH | `/api/admin/books/:id` | Mengubah data buku | Admin |
| DELETE | `/api/admin/books/:id` | Menghapus buku | Admin |
| POST | `/api/admin/categories` | Menambahkan kategori | Admin |
| PATCH | `/api/admin/categories/:id` | Mengubah kategori | Admin |
| DELETE | `/api/admin/categories/:id` | Menghapus kategori | Admin |
| GET | `/api/admin/loans` | Melihat semua peminjaman | Admin |
| PATCH | `/api/admin/loans/:id/status` | Mengubah status peminjaman | Admin |

### Aturan implementasi endpoint

1. Middleware autentikasi memvalidasi token sebelum handler endpoint terlindungi berjalan.
2. Middleware otorisasi memeriksa role yang dibutuhkan; menyembunyikan tombol di frontend saja tidak cukup.
3. Validasi data, status peminjaman, ketersediaan buku, dan kepemilikan dilakukan di server.
4. Jangan menerima `userId` atau `role` dari body sebagai sumber identitas yang dipercaya. Ambil identitas dari klaim token terverifikasi.
5. Penghapusan buku yang sudah mempunyai riwayat peminjaman perlu aturan bisnis; backend boleh menolak operasi tersebut daripada merusak riwayat.
6. Jika path atau kebutuhan berubah saat implementasi, perubahan dicatat dan disepakati melalui Pull Request.

## 5. Kontrak autentikasi JWT

- Setelah login berhasil, backend menerbitkan access token yang ditandatangani dengan secret/key dari konfigurasi server.
- Klaim minimum yang direncanakan: `sub` (ID pengguna), `role`, dan `exp` (waktu kedaluwarsa). Backend tetap memvalidasi tanda tangan serta masa berlaku token.
- Token dikirim pada request terlindungi melalui header `Authorization: Bearer <token>`.
- Password disimpan sebagai hash yang aman, bukan plaintext; proses login membandingkan password terhadap hash.
- Secret JWT dan kredensial database harus berada di environment variable, bukan di repository atau source frontend.
- Web dan mobile menggunakan kontrak API serta aturan role yang sama.
- Jangan menyimpan password di local storage atau mencatat token/password ke log. Untuk web, pilihan penyimpanan token harus mempertimbangkan risiko XSS/CSRF dan disepakati tim saat implementasi.
- Untuk versi stateless sederhana, logout dapat menghapus token di sisi klien. Jika backend membutuhkan pencabutan token sebelum kedaluwarsa, perlu mekanisme revocation/session yang dirancang terpisah.

Contoh header:

```http
Authorization: Bearer <access_token>
```

## 6. Format respons error yang disepakati

Contoh format umum:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Akses tidak diizinkan."
  }
}
```

| HTTP status | Kapan digunakan |
|---|---|
| 400 Bad Request | Request tidak dapat diproses karena format dasar tidak valid |
| 401 Unauthorized | Token tidak ada, tidak valid, atau sudah kedaluwarsa; kredensial login tidak cocok |
| 403 Forbidden | Pengguna terautentikasi tetapi role tidak memiliki izin |
| 404 Not Found | Sumber daya tidak ditemukan atau tidak boleh diungkap keberadaannya |
| 409 Conflict | Email sudah terdaftar atau transisi status bertentangan dengan keadaan saat ini |
| 422 Unprocessable Entity | Field lolos parsing tetapi gagal validasi |
| 500 Internal Server Error | Kesalahan server yang tidak terduga; jangan mengirim detail rahasia ke klien |

Server sebaiknya tidak membocorkan apakah email tertentu terdaftar pada alur yang dapat dimanfaatkan untuk enumerasi akun. Pesan respons harus konsisten dan tidak memuat stack trace atau data sensitif.

## 7. Skenario pengujian minimum

- [ ] Guest dapat membuka daftar/detail buku dan kategori.
- [ ] Guest menerima `401` saat mengakses `/api/auth/me` atau endpoint peminjaman tanpa token.
- [ ] Token yang salah tanda tangan atau kedaluwarsa ditolak dengan `401`.
- [ ] Member tidak dapat memanggil endpoint khusus Admin; respons `403`.
- [ ] Member A tidak dapat membaca, mengubah, atau mengembalikan peminjaman Member B.
- [ ] Backend mengabaikan `userId`/role manipulatif dari request body dan memakai identitas terverifikasi.
- [ ] Admin yang valid dapat mengakses endpoint pengelolaan katalog dan seluruh peminjaman.
- [ ] Password tidak pernah dikembalikan dalam respons API.
- [ ] Input tidak valid dan konflik status menghasilkan kode HTTP serta format error yang sesuai.
- [ ] Percobaan akses ilegal diuji di API, tidak hanya melalui tampilan frontend.

## 8. Kriteria selesai Tugas Kelompok 2

- [x] Role Guest, Member, dan Admin didefinisikan.
- [x] Matriks fitur dan role disusun.
- [x] Endpoint publik, endpoint login, dan endpoint khusus Admin didokumentasikan.
- [x] Aturan JWT, kepemilikan data, dan format error dijelaskan.
- [x] Skenario pengujian minimum disiapkan.
- [x] Implementasi backend menyediakan endpoint utama sesuai kontrak (Express, SQLite, JWT, serta role middleware).
- [x] Automated test suite ditambahkan; status hasil run CI menjadi sumber verifikasi terakhir.

## 9. Langkah berikutnya

Tugas Kelompok 3 dapat menggunakan kontrak ini untuk membuat prototipe login web dan mobile yang mengakses API yang sama. Tim Backend perlu mengonfirmasi path, skema database, masa berlaku token, dan alur status peminjaman sebelum API diimplementasikan.
