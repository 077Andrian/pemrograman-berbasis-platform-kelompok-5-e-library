# Checklist Smoke Test Manual — E-Library Kelompok 5

**Tujuan:** memastikan aplikasi berjalan di komputer anggota kelompok, melampaui hasil automated test di CI.

> Tandai kotak setelah langkah benar-benar dicoba. Jangan menganggap tes manual selesai hanya karena workflow CI hijau.

## A. Persiapan backend

- [ ] Pastikan Node.js 24 dan npm tersedia.
- [ ] Masuk ke folder backend.
- [ ] Instal paket dengan npm install.
- [ ] Salin backend/.env.example menjadi backend/.env dan isi JWT_SECRET dengan secret acak minimal 32 karakter.
- [ ] Pastikan CORS_ORIGINS memuat http://localhost:5500 dan http://127.0.0.1:5500 untuk web lokal.
- [ ] Buat akun admin dengan perintah pada backend/README.md. Gunakan password milik tim minimal 12 karakter; jangan menulis password tersebut di repository atau screenshot.
- [ ] Jalankan npm run dev.
- [ ] Buka http://localhost:3000/api/health dan pastikan respons menunjukkan status ok.
- [ ] Buka http://localhost:3000/api/books dan pastikan daftar buku contoh muncul.

## B. Frontend web

1. Masuk ke folder frontend/web dan jalankan server statis, misalnya python -m http.server 5500.
2. Buka http://localhost:5500/login.html.

- [ ] Halaman login tampil dengan baik dan tidak ada error JavaScript di Console.
- [ ] Registrasi Member dengan data valid berhasil.
- [ ] Registrasi dengan email duplikat menampilkan pesan error.
- [ ] Login dengan password salah ditolak dan tidak menampilkan area perpustakaan.
- [ ] Login dengan akun Member berhasil dan memunculkan katalog.
- [ ] Pencarian buku dan filter kategori bekerja.
- [ ] Member bisa meminjam buku yang stoknya tersedia.
- [ ] Stok buku berkurang setelah dipinjam dan riwayat peminjaman tampil.
- [ ] Member bisa mengembalikan pinjaman sendiri; stok tersedia bertambah kembali.
- [ ] Logout kembali ke form login; refresh halaman meminta login lagi.
- [ ] Login dengan akun Admin menampilkan panel pengelolaan.
- [ ] Admin dapat menambah dan mengubah buku.
- [ ] Admin dapat menghapus buku yang belum memiliki riwayat pinjaman.
- [ ] Admin dapat melihat seluruh peminjaman dan menandai peminjaman sebagai dikembalikan.
- [ ] Member yang mencoba memanggil endpoint admin menerima status 403 (uji dengan REST Client/Postman atau DevTools).

## C. Flutter Android

1. Masuk ke frontend/mobile.
2. Jika belum ada folder platform Android, jalankan flutter create --platforms=android --project-name elibrary_mobile .
3. Jalankan flutter pub get.
4. Jalankan aplikasi pada Android Emulator dengan:

       flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api

5. Jika HTTP diblokir pada build debug lokal, ikuti pengaturan debug-only manifest pada workflow CI. Jangan mengaktifkan cleartext untuk release/production.

- [ ] Aplikasi tampil tanpa crash dan dapat membuka halaman login.
- [ ] Registrasi Member dan validasi form bekerja.
- [ ] Login dengan kredensial valid membuka katalog.
- [ ] Pencarian buku, tampilan stok, dan riwayat pinjaman berfungsi.
- [ ] Member bisa meminjam dan mengembalikan buku.
- [ ] Logout membersihkan status login yang ada di memori.
- [ ] Akun Admin dapat menambah, mengubah, dan menghapus buku sesuai batasan API.
- [ ] Akun Admin dapat melihat dan memperbarui status peminjaman.

## D. Verifikasi lintas role dan keamanan dasar

- [ ] Guest tidak dapat membuka endpoint profil/peminjaman tanpa token (401).
- [ ] Member tidak dapat menggunakan endpoint Admin (403).
- [ ] Member tidak bisa mengembalikan pinjaman milik Member lain (respons 404).
- [ ] Password tidak terlihat dalam response API dan tidak ditulis di log.
- [ ] Coba stok buku habis dan pastikan backend menolak peminjaman.
- [ ] Coba hapus buku yang punya riwayat pinjaman dan pastikan backend menolak operasi tersebut.
- [ ] Tidak ada file .env, password, token, atau database lokal yang di-commit.

## E. Bukti untuk laporan/presentasi

- [ ] Screenshot halaman login web.
- [ ] Screenshot katalog setelah login sebagai Member.
- [ ] Screenshot riwayat peminjaman sebelum dan sesudah pengembalian.
- [ ] Screenshot panel Admin dan data buku.
- [ ] Screenshot aplikasi Flutter di Android Emulator.
- [ ] Simpan hasil dan masalah yang ditemukan dalam dokumen/catatan kelompok tanpa menampilkan credential.

## Status CI

Automated CI yang terakhir diperiksa berhasil untuk backend API tests, web JavaScript syntax, Flutter analysis/widget tests, dan build APK debug: [Buka workflow run](https://github.com/077Andrian/pemrograman-berbasis-platform-kelompok-5-e-library/actions/runs/40192043036).

Status CI bukan pengganti checklist manual ini. Setelah semua kotak yang relevan diuji, catat tanggal, perangkat/browser yang digunakan, hasil, dan bukti yang akan diserahkan.
