# Checklist Smoke Test Manual — E-Library Kelompok 5

**Tujuan:** memastikan aplikasi berjalan di komputer anggota kelompok dan sesuai tiga role resmi: Anggota, Pustakawan, dan Pimpinan.

> Centang kotak hanya setelah langkah benar-benar dicoba. Hasil CI hijau bukan pengganti uji manual.

## A. Persiapan backend

- [ ] Pastikan Node.js 24 dan npm tersedia.
- [ ] Masuk ke folder backend dan jalankan npm install.
- [ ] Salin .env.example menjadi .env; isi JWT_SECRET dengan secret acak minimal 32 karakter.
- [ ] Pastikan CORS_ORIGINS mengizinkan origin web lokal yang dipakai.
- [ ] Jalankan npm test, lalu catat hasil.
- [ ] Jalankan npm run dev.
- [ ] Buka http://localhost:3000/api/health dan pastikan status ok.
- [ ] Buka http://localhost:3000/api/books dan pastikan buku contoh muncul.
- [ ] Buat akun Pustakawan dan Pimpinan dengan perintah pada backend/README.md.

## B. Frontend web — Anggota

- [ ] Buka http://localhost:5500/login.html.
- [ ] Registrasi Anggota dengan data valid.
- [ ] Registrasi email duplikat ditolak.
- [ ] Login dengan password salah ditolak.
- [ ] Login Anggota berhasil dan katalog tampil.
- [ ] Pencarian judul, pengarang, dan ISBN bekerja.
- [ ] Filter kategori bekerja.
- [ ] Anggota dapat meminjam buku dengan stok tersedia.
- [ ] Stok berkurang dan riwayat peminjaman muncul.
- [ ] Anggota dapat mengembalikan pinjaman sendiri; stok bertambah kembali.
- [ ] Logout kembali ke form login.

## C. Frontend web — Pustakawan

- [ ] Login dengan akun Pustakawan berhasil.
- [ ] Role tampil sebagai Pustakawan dan panel Kelola katalog muncul.
- [ ] Pustakawan dapat menambah buku.
- [ ] Pustakawan dapat mengubah judul buku.
- [ ] Pustakawan dapat menghapus buku tanpa riwayat pinjaman.
- [ ] Pustakawan dapat melihat semua peminjaman.
- [ ] Pustakawan dapat menandai peminjaman sebagai dikembalikan.

## D. Frontend web — Pimpinan

- [ ] Login dengan akun Pimpinan berhasil.
- [ ] Role tampil sebagai Pimpinan.
- [ ] Dashboard menampilkan jumlah judul, stok, pinjaman aktif, transaksi, dan anggota.
- [ ] Daftar buku populer, anggota aktif, serta stok menipis tampil.
- [ ] Pimpinan tidak melihat tombol untuk menambah, mengubah, atau menghapus buku.

## E. Flutter Android

- [ ] flutter pub get selesai.
- [ ] flutter test dan flutter analyze --no-fatal-infos selesai tanpa error.
- [ ] Jalankan backend pada komputer host.
- [ ] Jalankan aplikasi dengan flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api.
- [ ] Uji registrasi/login Anggota, katalog, pencarian, peminjaman, pengembalian, dan logout.
- [ ] Login Pustakawan menampilkan kontrol kelola katalog/sirkulasi.
- [ ] Login Pimpinan menampilkan dashboard statistik read-only.

## F. Otorisasi API

- [ ] Guest tanpa token tidak dapat membaca profil/pinjaman (401).
- [ ] Anggota tidak dapat memanggil endpoint Pustakawan (403).
- [ ] Anggota tidak dapat mengembalikan pinjaman milik Anggota lain.
- [ ] Pustakawan dapat menggunakan endpoint katalog/sirkulasi yang diizinkan.
- [ ] Pustakawan tidak dapat membaca endpoint statistik Pimpinan.
- [ ] Pimpinan dapat membaca /api/leadership/stats.
- [ ] Pimpinan tidak dapat mengubah katalog (403).
- [ ] Password tidak muncul dalam response/log; .env, token, password, dan database lokal tidak di-commit.

## G. Bukti laporan

- [ ] Screenshot login dan katalog Anggota.
- [ ] Screenshot hasil peminjaman dan pengembalian.
- [ ] Screenshot panel Pustakawan.
- [ ] Screenshot dashboard Pimpinan.
- [ ] Screenshot aplikasi Flutter di Android Emulator.
- [ ] Catat tanggal, browser/perangkat, hasil aktual, serta bug yang ditemukan.
