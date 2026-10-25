# Tugas Kelompok 3 — Prototipe Login Web dan Mobile

**Proyek:** E-Library — Kelompok 5  
**Versi:** 1.0  
**Status:** API autentikasi, UI web/Flutter, katalog, dan alur peminjaman terlindungi sudah diimplementasikan. CI lulus untuk backend, sintaks JavaScript, analisis/widget test Flutter, dan build APK debug; smoke test manual masih disarankan.

## 1. Tujuan

Menyiapkan halaman login pada frontend web dan aplikasi Flutter mobile yang menggunakan endpoint autentikasi yang sama, sehingga kontrak request/response tidak berbeda antarplatform.

## 2. File yang dibuat

### Frontend web

- [Halaman login](../frontend/web/login.html)
- [Style login](../frontend/web/login.css)
- [Logika form dan request API](../frontend/web/login.js)
- [Konfigurasi URL API](../frontend/web/config.js)

Halaman mengikuti baseline Design System Tugas Kelompok 1: Primary #1E3A5F, Accent #14B8A6, Surface #F8FAFC, radius 8 px, state focus, pesan error, loading, dan status sukses.

### Frontend mobile

- [Aplikasi Flutter](../frontend/mobile/lib/main.dart)
- [pubspec.yaml](../frontend/mobile/pubspec.yaml)

UI mobile menggunakan Material 3 dengan token warna yang sama, mode registrasi Member dan login, validasi nama/email/kata sandi, tombol tampil/sembunyikan kata sandi, loading state, pesan error, dan hasil autentikasi.

## 3. Kontrak API yang digunakan kedua klien

Kedua klien mengirim request berikut ke endpoint yang sama:

    POST /api/auth/login
    Content-Type: application/json
    Accept: application/json

Body:

    {
      "email": "anggota@contoh.com",
      "password": "kata-sandi"
    }

Contoh respons sukses yang diharapkan:

    {
      "accessToken": "<token-jwt>",
      "user": {
        "id": "user-id",
        "name": "Nama Pengguna",
        "email": "anggota@contoh.com",
        "role": "member"
      }
    }

Contoh respons gagal:

    {
      "error": {
        "code": "UNAUTHORIZED",
        "message": "Email atau kata sandi tidak sesuai."
      }
    }

Backend saat ini menerapkan bentuk respons sukses di atas. Jika bentuk respons berubah, backend dan kedua klien perlu diperbarui bersama melalui Pull Request.

## 4. Konfigurasi dan cara mencoba

### Web

1. Pastikan backend sudah berjalan dan menyediakan POST /api/auth/login.
2. Periksa frontend/web/config.js. Default URL adalah http://localhost:3000/api.
3. Dari folder frontend/web, jalankan server static, misalnya:

       python -m http.server 5500

   Di Windows, py -m http.server 5500 juga dapat digunakan bila perintah py tersedia.
4. Buka http://localhost:5500/login.html.
5. Jika browser melaporkan masalah CORS, backend perlu mengizinkan origin web yang digunakan untuk development. Jangan mematikan validasi keamanan untuk production.

### Flutter Android emulator

1. Instal Flutter SDK dan Android SDK.
2. Dari folder frontend/mobile, buat berkas platform Android bila belum ada:

       flutter create --platforms=android .

3. Ambil dependency dan jalankan:

       flutter pub get
       flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api

   10.0.2.2 adalah alamat khusus yang umum digunakan Android Emulator untuk mengakses server pada komputer host. Untuk perangkat fisik, gunakan alamat IP LAN komputer yang dapat dijangkau perangkat dan pastikan firewall mengizinkan koneksi.
4. Bila environment Android memblokir HTTP cleartext selama development, konfigurasi izin cleartext hanya untuk debug lokal. Gunakan HTTPS untuk deployment produksi.

## 5. Penanganan token

- Klien hanya menganggap login berhasil jika respons memuat accessToken yang tidak kosong.
- Token prototipe ditahan di memori aplikasi/halaman; tidak disimpan ke localStorage, sessionStorage, atau file.
- Password dibersihkan dari field setelah login berhasil dan tidak ditulis ke log.
- Prototipe belum mempunyai route guard, refresh token, logout server-side, atau manajemen sesi produksi. Penggunaan token dan proteksi layar lanjutan perlu dibahas sebelum aplikasi diperluas.

## 6. Status pengujian

- [x] Struktur halaman login web dibuat.
- [x] Tampilan login Flutter dibuat.
- [x] Validasi input dasar, loading, pesan error, dan state sukses ditambahkan.
- [x] Registrasi Member tersedia di web dan Flutter, memakai endpoint yang sama dengan backend.
- [x] Kedua klien memakai POST /api/auth/login dan mengharapkan accessToken serta data pengguna.
- [x] Endpoint profil terlindungi dipakai sebagai guard sebelum menampilkan area login sukses.
- [x] Area katalog/peminjaman Member dan panel kelola buku Admin tersedia pada web dan Flutter.
- [x] APK debug berhasil dibangun oleh GitHub Actions CI.
- [ ] Uji manual pada browser dan Android Emulator/perangkat — masih perlu dilakukan oleh tim sebelum presentasi.
- [ ] Login sukses dan login gagal telah diuji secara manual di browser/emulator — belum diverifikasi.
- [ ] CORS dan integrasi visual lintas perangkat telah diuji manual end-to-end — belum dilakukan.

## 7. Kesimpulan

Prototipe frontend untuk web dan mobile sudah menjadi baseline implementasi dan mengacu pada endpoint autentikasi yang sama. Tugas ini belum membuktikan integrasi berjalan setelah automated test API berjalan sukses dan tes manual browser/emulator berhasil dijalankan.