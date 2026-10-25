# Panduan Kontribusi

Ikuti alur kerja pada modul mata kuliah.

## Alur kerja
1. Pastikan `main` terbaru: `git checkout main` lalu `git pull --ff-only origin main`.
2. Buat branch baru dari `main`, dengan nama yang menjelaskan pekerjaan, misalnya `docs/design-system`.
3. Kerjakan satu topik per branch dan lakukan pengujian yang relevan.
4. Commit perubahan dengan format `tipe(bagian): ringkasan perubahan`.
5. Push branch dan buka Pull Request ke `main`.
6. Minta anggota lain melakukan review. Perbaiki masukan sebelum merge.

## Contoh pesan commit
- `docs(kelompok-01): susun rancangan design system`
- `docs(kelompok-02): tambah matriks hak akses`
- `feat(auth): buat prototipe login`

## Aturan keamanan
Jangan memasukkan `.env`, token, password, credential, atau data rahasia ke repository. Gunakan `.env.example` yang berisi nama variabel dan nilai placeholder saja.