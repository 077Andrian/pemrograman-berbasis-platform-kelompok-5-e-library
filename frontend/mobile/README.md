# Frontend Mobile — E-Library

Prototipe mobile menggunakan Flutter dan endpoint autentikasi yang sama dengan frontend web. Pengguna dapat membuat akun Member, login, melihat katalog dan mengelola pinjaman.

## Menyiapkan platform Android

Folder ini berisi pubspec.yaml, lib/main.dart, dan widget tests. Jika folder Android belum ada, jalankan dari folder ini:

    flutter create --platforms=android .

Lalu instal dependency:

    flutter pub get

## Menjalankan Android Emulator

Jalankan backend pada komputer host, kemudian:

    flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api

10.0.2.2 adalah alamat untuk mengakses server komputer host dari Android Emulator. Untuk perangkat fisik, ganti dengan alamat IP LAN komputer dan pastikan firewall mengizinkan koneksi. Jika Android menolak HTTP saat debug lokal, pada android/app/src/debug/AndroidManifest.xml tambahkan atribut android:usesCleartextTraffic="true" pada elemen application; jangan aktifkan izin ini pada manifest utama atau build produksi. HTTPS wajib digunakan saat deployment produksi.

Sesudah login berhasil, aplikasi mengambil profil melalui endpoint terlindungi lalu menampilkan katalog. Member bisa mencari, meminjam, dan mengembalikan bukunya. Admin dapat mengelola buku dan status pengembalian. Token hanya disimpan di memori aplikasi; keluar akan menghapus token dari state lokal.

## Build dan test

    flutter pub get
    flutter analyze --no-fatal-infos
    flutter test
    flutter build apk --debug

GitHub Actions menjalankan analisis, widget test, dan build APK debug. Jika workflow berhasil, artefak `elibrary-mobile-debug-apk` tersedia di bagian Artifacts pada run CI selama 14 hari. Unduh APK, pindahkan ke perangkat Android untuk instalasi uji, dan jangan menganggap lolos build sebagai pengganti uji manual.