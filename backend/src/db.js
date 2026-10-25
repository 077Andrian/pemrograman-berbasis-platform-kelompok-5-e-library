const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

const configuredPath = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'elibrary.sqlite');
if (configuredPath !== ':memory:') {
  fs.mkdirSync(path.dirname(path.resolve(configuredPath)), { recursive: true });
}
const db = new Database(configuredPath);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');
db.exec(
  'CREATE TABLE IF NOT EXISTS users (' +
  'id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE COLLATE NOCASE, ' +
  'password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN (\'member\', \'admin\')), ' +
  'created_at TEXT NOT NULL);' +
  'CREATE TABLE IF NOT EXISTS categories (' +
  'id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE COLLATE NOCASE, ' +
  'slug TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL);' +
  'CREATE TABLE IF NOT EXISTS books (' +
  'id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, author TEXT NOT NULL, ' +
  'isbn TEXT UNIQUE, description TEXT NOT NULL DEFAULT \'\', category_id INTEGER, ' +
  'stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0), cover_url TEXT, ' +
  'created_at TEXT NOT NULL, updated_at TEXT NOT NULL, ' +
  'FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE RESTRICT);' +
  'CREATE TABLE IF NOT EXISTS loans (' +
  'id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, book_id INTEGER NOT NULL, ' +
  'status TEXT NOT NULL DEFAULT \'borrowed\' CHECK(status IN (\'borrowed\', \'returned\')), ' +
  'loaned_at TEXT NOT NULL, due_date TEXT NOT NULL, returned_at TEXT, ' +
  'FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT, ' +
  'FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE RESTRICT);' +
  'CREATE INDEX IF NOT EXISTS idx_loans_user ON loans(user_id, loaned_at DESC);' +
  'CREATE INDEX IF NOT EXISTS idx_loans_book ON loans(book_id);' +
  'CREATE INDEX IF NOT EXISTS idx_books_category ON books(category_id);'
);

function seedCatalog() {
  const now = new Date().toISOString();
  const categories = [
    ['Teknologi', 'teknologi'],
    ['Pemrograman', 'pemrograman'],
    ['Bisnis', 'bisnis'],
    ['Fiksi', 'fiksi']
  ];
  const insertCategory = db.prepare(
    'INSERT OR IGNORE INTO categories (name, slug, created_at) VALUES (?, ?, ?)'
  );
  for (const item of categories) insertCategory.run(item[0], item[1], now);

  const count = db.prepare('SELECT COUNT(*) AS total FROM books').get().total;
  if (count > 0) return;

  const cat = (name) => db.prepare('SELECT id FROM categories WHERE name = ?').get(name).id;
  const insertBook = db.prepare(
    'INSERT INTO books (title, author, isbn, description, category_id, stock, cover_url, created_at, updated_at) ' +
    'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const rows = [
    ['Dasar-Dasar Pemrograman', 'Andi Pratama', '9786020000001', 'Pengenalan logika, algoritma, dan dasar pemrograman untuk pemula.', 'Pemrograman', 5],
    ['Membangun API dengan Node.js', 'Dewi Lestari', '9786020000002', 'Panduan merancang REST API, middleware, dan autentikasi.', 'Teknologi', 4],
    ['Basis Data Relasional', 'Bima Saputra', '9786020000003', 'Konsep tabel, relasi, query, dan normalisasi basis data.', 'Teknologi', 3],
    ['Pengantar Kecerdasan Buatan', 'Rani Putri', '9786020000004', 'Gambaran machine learning dan penerapannya dalam kehidupan.', 'Teknologi', 2],
    ['Manajemen Proyek Digital', 'Fajar Nugraha', '9786020000005', 'Perencanaan, pembagian tugas, risiko, dan evaluasi proyek.', 'Bisnis', 4],
    ['Senja di Perpustakaan', 'Maya Anindita', '9786020000006', 'Cerita fiksi tentang persahabatan dan perjalanan menemukan tujuan.', 'Fiksi', 2]
  ];
  const insertSeed = db.transaction(() => {
    for (const row of rows) {
      insertBook.run(row[0], row[1], row[2], row[3], cat(row[4]), row[5], null, now, now);
    }
  });
  insertSeed();
}

seedCatalog();
module.exports = { db };