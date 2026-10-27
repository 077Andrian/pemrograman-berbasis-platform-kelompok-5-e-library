# Backlog dan Status Requirement — E-Library Kelompok 5

Project yang dipilih: **Project 4 — E-Library**. Status di bawah adalah status repository saat diperbarui; periksa hasil tes lokal sebelum memindahkan pekerjaan menjadi Selesai.

| ID | Fitur / pekerjaan | Prioritas | Status | Kriteria selesai |
|---:|---|---|---|---|
| F01 | Login, registrasi, dan hak akses 3 role | Tinggi | Implementasi ditambahkan; perlu verifikasi lokal | Role member, librarian, leadership; uji endpoint 200/403. |
| F02 | Pencarian judul, pengarang, ISBN | Tinggi | Sudah tersedia; diuji manual di web untuk alur katalog | Pencarian mengembalikan hasil yang sesuai. |
| F03 | Detail buku dan ketersediaan stok | Tinggi | Sudah tersedia | Detail dan stok tampil benar. |
| F04 | Peminjaman dan tanggal jatuh tempo | Tinggi | Sudah tersedia; diuji manual | Transaksi tercatat dan due date tersedia. |
| F05 | Pengembalian dan pembaruan stok | Tinggi | Sudah tersedia; diuji manual | Status berubah dan stok bertambah tepat satu kali. |
| F06 | Perpanjangan masa pinjam | Menengah | Belum diimplementasikan | Endpoint/UI, validasi, tes sukses dan gagal. |
| F07 | Antrean reservasi saat stok habis | Menengah | Belum diimplementasikan | Anggota masuk antrean dan memperoleh posisi. |
| F08 | Denda keterlambatan otomatis | Menengah | Belum diimplementasikan | Aturan hitung disepakati dan hasil dihitung diuji. |
| F09 | Katalog e-book dan unduhan | Menengah | Belum diimplementasikan | Data e-book dan akses file sesuai hak pengguna. |
| F10 | Pustakawan mengelola katalog/stok | Tinggi | Fitur Admin lama dialihkan; perlu verifikasi lokal | Pustakawan tambah, ubah, hapus sesuai aturan transaksi. |
| F11 | Pustakawan mengelola sirkulasi | Tinggi | Fitur pengelolaan pinjaman tersedia; perlu verifikasi lokal | Dapat melihat pinjaman dan mencatat pengembalian. |
| F12 | Dashboard statistik Pimpinan | Tinggi | Endpoint dan panel ditambahkan; perlu verifikasi lokal | Statistik koleksi/sirkulasi dan peringkat muncul. |

## Milestone pemeriksaan Rabu, 28 Oktober 2026

Target kelompok: minimal **8 dari 12 fitur (66,7%)** dapat didemonstrasikan, memiliki API yang berjalan, dan menunjukkan tiga role. Hitung fitur sebagai selesai hanya setelah ada bukti implementasi serta tes yang berhasil. Perubahan role dan dashboard perlu ditarik ke komputer lalu diuji ulang.

## Pekerjaan lintas tim

| ID | Pekerjaan | Penanggung jawab | Status |
|---|---|---|---|
| K1 | Menyelaraskan Design System | Frontend Web/Mobile | Dokumen dan preview tersedia |
| K2 | Memastikan otorisasi tiga role dan API | Backend | Implementasi diperbarui; perlu tes lokal/CI |
| K3 | Mengintegrasikan web dan Flutter | Frontend Web/Mobile | Fitur dasar terintegrasi; role baru perlu tes lokal |
| K4 | Menjalankan skenario QA dan merekam hasil | Quality Control | Checklist tersedia; eksekusi manual tetap wajib |
| K5 | Memperbarui proposal, backlog, README, bukti, dan demo | Dokumentasi bersama tim | Dokumen inti telah diperbarui; lengkapi identitas anggota yang placeholder |

Nama/NIM anggota Backend belum diketahui dan harus dilengkapi langsung oleh kelompok.
