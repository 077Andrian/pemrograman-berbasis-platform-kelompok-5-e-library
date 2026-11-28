# Pertemuan 04 — Database, Migrasi, dan Seed

Paket backend latihan resmi dipisahkan dari aplikasi utama E-Library agar tidak mengganti SQLite, autentikasi, katalog, atau peminjaman yang sudah ada.

Menjalankan dari root repository (Windows PowerShell):
1. Pastikan Docker Desktop aktif.
2. `docker compose -f praktikum/pertemuan-04/compose.yaml up -d --wait`
3. `cd praktikum/pertemuan-04/backend`
4. `Copy-Item .env.example .env`
5. Isi JWT_SECRET memakai hasil `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`
6. `npm install`, `npm run generate`, `npm run db:deploy`, `npm run db:seed`, `npm run dev`
7. Terminal kedua: `curl.exe -i http://localhost:3000/api/v1/health`

Akun lokal fixture: admin 2026001/admin123; mahasiswa 2026002/mhs123 dan 2026003/mhs123. Hanya untuk database latihan lokal.

Dari folder backend, `npm test` menjalankan test seed. Untuk test integrasi MySQL pada database latihan yang sudah dimigrasi: `$env:RUN_DB_TESTS="1"; npm test`.

File .env dari ZIP sumber sengaja tidak disalin. Jangan commit .env, token, password produksi, node_modules, atau database lokal.

Paket ini menjalankan API latihan jadwal/peserta sesuai modul, bukan pengganti backend E-Library. Integrasi ke E-Library harus dirancang dan diuji terpisah.
