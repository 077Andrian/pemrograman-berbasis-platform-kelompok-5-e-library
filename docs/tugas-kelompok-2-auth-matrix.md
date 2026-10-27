# Tugas Kelompok 2 — Matriks Auth dan Endpoint Terlindungi

**Proyek:** E-Library — Kelompok 5  
**Versi:** 1.2  
**Role aplikasi:** Anggota (member), Pustakawan (librarian), dan Pimpinan (leadership).

## 1. Prinsip

Frontend web dan mobile memakai API yang sama. Backend menjadi sumber kebenaran autentikasi dan otorisasi. Menyembunyikan tombol di UI tidak menggantikan pemeriksaan role di server.

Pengunjung tanpa login boleh mengakses katalog publik, tetapi Guest bukan role akun dalam tiga role utama proyek.

## 2. Matriks hak akses

| Fitur | Publik | Anggota | Pustakawan | Pimpinan |
|---|---|---|---|---|
| Melihat/mencari katalog dan kategori | Boleh | Boleh | Boleh | Boleh |
| Registrasi akun | Boleh, role selalu member | Tidak perlu | Tidak | Tidak |
| Login dan melihat profil sendiri | Login | Boleh | Boleh | Boleh |
| Meminjam buku | Tidak | Boleh | Tidak | Tidak |
| Melihat riwayat pinjaman sendiri | Tidak | Boleh | Tidak | Tidak |
| Mengembalikan pinjaman sendiri | Tidak | Boleh jika status valid | Tidak melalui alur Anggota | Tidak |
| Menambah, mengubah, menghapus buku | Tidak | Tidak | Boleh | Tidak |
| Mengelola kategori | Tidak | Tidak | Boleh | Tidak |
| Melihat semua peminjaman | Tidak | Tidak | Boleh | Statistik agregat saja |
| Mengubah status pengembalian | Tidak | Tidak | Boleh | Tidak |
| Melihat statistik koleksi dan sirkulasi | Tidak | Tidak | Tidak | Boleh |
| Melihat buku populer, anggota aktif, stok menipis | Tidak | Tidak | Tidak | Boleh |

**Aturan identitas:** ID pengguna untuk pinjaman berasal dari token terverifikasi, bukan dari userId yang dikirim klien. Anggota tidak dapat membaca atau mengembalikan pinjaman milik anggota lain.

## 3. Endpoint API yang tersedia

Prefix API: /api.

### Publik

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | /api/health | Health check |
| GET | /api/books | Daftar/pencarian buku dengan query q, page, limit, categoryId |
| GET | /api/books/:id | Detail buku |
| GET | /api/categories | Daftar kategori |
| POST | /api/auth/register | Membuat akun Anggota |
| POST | /api/auth/login | Login dan menerbitkan token |

### Anggota

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | /api/auth/me | Profil akun aktif |
| POST | /api/loans | Meminjam buku yang tersedia |
| GET | /api/loans/my | Riwayat akun aktif |
| POST | /api/loans/:id/return | Mengembalikan pinjaman sendiri |

### Pustakawan

Path /api/admin/... dipertahankan untuk kompatibilitas klien, tetapi seluruh endpoint berikut memerlukan token role librarian.

| Method | Endpoint | Fungsi |
|---|---|---|
| POST | /api/admin/books | Menambah buku |
| PATCH | /api/admin/books/:id | Memperbarui buku |
| DELETE | /api/admin/books/:id | Menghapus buku tanpa riwayat pinjaman |
| POST | /api/admin/categories | Menambah kategori |
| PATCH | /api/admin/categories/:id | Memperbarui kategori |
| DELETE | /api/admin/categories/:id | Menghapus kategori yang tidak sedang dipakai |
| GET | /api/admin/loans | Melihat semua peminjaman |
| PATCH | /api/admin/loans/:id/status | Mencatat pengembalian yang diizinkan |

### Pimpinan

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | /api/leadership/stats | Ringkasan jumlah judul, stok, transaksi, pinjaman aktif, anggota, buku populer, anggota aktif, dan stok menipis |

Fitur perpanjangan, antrean reservasi, denda, dan e-book masih memerlukan endpoint tambahan.

## 4. Kontrak JWT dan keamanan

- Token diterbitkan setelah kredensial tervalidasi dan menggunakan secret dari environment server.
- Token dikirim dengan header Authorization: Bearer <token>.
- Middleware memvalidasi signature dan expiry token, lalu memuat role aktif pengguna dari database.
- Password disimpan menggunakan hashing bcrypt, bukan plaintext.
- Registrasi publik tidak menerima role sebagai nilai yang dipercaya. Pustakawan dan Pimpinan dibuat melalui proses administratif.
- Jangan commit .env, password, token, atau database lokal.
- Gunakan HTTPS untuk deployment produksi.

## 5. Format error

    {
      "error": {
        "code": "FORBIDDEN",
        "message": "Role Anda tidak memiliki izin untuk tindakan ini."
      }
    }

Status utama: 400 untuk query/ID tidak valid, 401 untuk token/kredensial tidak valid, 403 untuk role yang tidak berhak, 404 untuk data tidak ditemukan, 409 untuk konflik, 422 untuk validasi, dan 500 untuk kesalahan internal.

## 6. Rencana verifikasi

Jalankan npm test di folder backend. QC harus memastikan:
1. Anggota dapat meminjam dan mengembalikan pinjaman sendiri.
2. Anggota tidak dapat menggunakan endpoint Pustakawan.
3. Pustakawan dapat mengelola katalog dan sirkulasi.
4. Pimpinan dapat melihat statistik tetapi tidak dapat mengubah katalog.
5. Endpoint terlindungi menolak request tanpa token.
