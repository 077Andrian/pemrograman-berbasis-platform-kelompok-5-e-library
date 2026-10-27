require('dotenv').config();

const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const { db } = require('../src/db');

const args = process.argv.slice(2);
const email = (args[0] || '').trim().toLowerCase();
const password = args[1] || '';
const name = (args[2] || 'Admin E-Library').trim();

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Penggunaan: npm run admin:create -- admin@contoh.com "PasswordKuat123!" "Nama Admin"');
  db.close();
  process.exit(1);
}
if (password.length < 12 || password.length > 72) {
  console.error('Kata sandi Admin harus terdiri dari 12 sampai 72 karakter.');
  db.close();
  process.exit(1);
}
if (name.length < 2 || name.length > 80) {
  console.error('Nama Admin harus terdiri dari 2 sampai 80 karakter.');
  db.close();
  process.exit(1);
}
if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
  console.error('Email sudah terdaftar. Skrip tidak akan mengubah role akun yang sudah ada.');
  db.close();
  process.exit(1);
}
const id = crypto.randomUUID();
const passwordHash = bcrypt.hashSync(password, 12);
db.prepare(
  'INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)'
).run(id, name, email, passwordHash, 'librarian', new Date().toISOString());
console.log('Akun Pustakawan berhasil dibuat untuk ' + email + '. Password tidak ditampilkan.');
db.close();