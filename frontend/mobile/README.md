# Frontend Mobile — E-Library

Prototipe mobile menggunakan Flutter dan endpoint autentikasi yang sama dengan frontend web.

## Menyiapkan platform Android

Folder ini berisi pubspec.yaml dan lib/main.dart. Buat scaffold platform Android bila belum tersedia:

    flutter create --platforms=android .
    flutter pub get

## Menjalankan Android Emulator

Pastikan backend berjalan pada port yang sesuai di komputer host, lalu jalankan:

    flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api

Nilai default API URL adalah http://10.0.2.2:3000/api agar emulator Android dapat mencoba terhubung ke server pada komputer host. Untuk perangkat fisik, ganti dengan alamat IP LAN komputer. Pastikan jaringan dan firewall mengizinkan koneksi. Gunakan HTTPS untuk deployment produksi.

Endpoint yang dipanggil adalah POST /api/auth/login. Respons sukses diharapkan berisi accessToken dan objek user. Token hanya dipegang di memori aplikasi pada prototipe ini.

Lihat [dokumen Tugas Kelompok 3](../../docs/tugas-kelompok-3-login-prototype.md). Build emulator dan pengujian end-to-end belum diverifikasi; backend harus diimplementasikan terlebih dahulu.