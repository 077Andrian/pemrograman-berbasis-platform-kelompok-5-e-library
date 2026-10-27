require('dotenv').config();

const crypto = require('node:crypto');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const { db } = require('./db');
const { ApiError, signAccessToken, authenticate, authorize } = require('./auth');

const app = express();
app.disable('x-powered-by');
app.use(helmet());

const allowedOrigins = (process.env.CORS_ORIGINS ||
  'http://localhost:5500,http://127.0.0.1:5500,http://localhost:5173,http://127.0.0.1:5173')
  .split(',').map((origin) => origin.trim()).filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new ApiError(403, 'CORS_ORIGIN_DENIED', 'Origin tidak diizinkan.'));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600
}));
app.use(express.json({ limit: '100kb' }));

const nowIso = () => new Date().toISOString();
const positiveInt = (value) => Number.isInteger(Number(value)) && Number(value) > 0;
const isEmail = (value) => typeof value === 'string' && value.length <= 254 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function parseBook(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    isbn: row.isbn,
    description: row.description,
    categoryId: row.category_id,
    categoryName: row.category_name || null,
    stock: row.stock,
    coverUrl: row.cover_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function parseLoan(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name || undefined,
    userEmail: row.user_email || undefined,
    bookId: row.book_id,
    bookTitle: row.book_title,
    author: row.book_author || undefined,
    status: row.status,
    loanedAt: row.loaned_at,
    dueDate: row.due_date,
    returnedAt: row.returned_at
  };
}

function bookQuery() {
  return 'SELECT b.*, c.name AS category_name FROM books b ' +
    'LEFT JOIN categories c ON c.id = b.category_id ';
}
function loanQuery() {
  return 'SELECT l.*, u.name AS user_name, u.email AS user_email, ' +
    'b.title AS book_title, b.author AS book_author FROM loans l ' +
    'JOIN users u ON u.id = l.user_id JOIN books b ON b.id = l.book_id ';
}
function getBook(id) {
  return db.prepare(bookQuery() + 'WHERE b.id = ?').get(id);
}
function getLoan(id) {
  return db.prepare(loanQuery() + 'WHERE l.id = ?').get(id);
}
function requireFields(body, fields) {
  for (const field of fields) {
    if (!body || typeof body[field] !== 'string' || !body[field].trim()) {
      throw new ApiError(422, 'VALIDATION_ERROR', 'Field ' + field + ' wajib diisi.');
    }
  }
}
function parseOptionalText(value, field, maxLength) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || value.length > maxLength) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Field ' + field + ' tidak valid.');
  }
  return value.trim();
}
function parseCoverUrl(value) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('scheme');
    return url.toString();
  } catch (_) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'coverUrl harus berupa URL HTTP/HTTPS yang valid.');
  }
}
function parseCategoryId(value, allowNull) {
  if (value === undefined && allowNull) return null;
  if ((value === null || value === '') && allowNull) return null;
  if (!positiveInt(value)) throw new ApiError(422, 'VALIDATION_ERROR', 'categoryId harus berupa ID kategori yang valid.');
  const id = Number(value);
  if (!db.prepare('SELECT id FROM categories WHERE id = ?').get(id)) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Kategori tidak ditemukan.');
  }
  return id;
}
function parseStock(value) {
  if (!Number.isInteger(value) || value < 0 || value > 100000) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'stock harus berupa bilangan bulat 0 sampai 100000.');
  }
  return value;
}
function validateBookInput(body, partial) {
  const input = {};
  if (!partial || Object.prototype.hasOwnProperty.call(body, 'title')) {
    requireFields(body, ['title']);
    input.title = parseOptionalText(body.title, 'title', 200);
    if (!input.title) throw new ApiError(422, 'VALIDATION_ERROR', 'title tidak boleh kosong.');
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, 'author')) {
    requireFields(body, ['author']);
    input.author = parseOptionalText(body.author, 'author', 160);
    if (!input.author) throw new ApiError(422, 'VALIDATION_ERROR', 'author tidak boleh kosong.');
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, 'description')) {
    input.description = body.description === undefined && !partial ? '' :
      parseOptionalText(body.description, 'description', 5000);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'isbn') || !partial) {
    input.isbn = body.isbn === '' || body.isbn === null ? null :
      parseOptionalText(body.isbn, 'isbn', 32);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'categoryId') || !partial) {
    input.category_id = parseCategoryId(body.categoryId, true);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'stock') || !partial) {
    input.stock = parseStock(body.stock === undefined && !partial ? 0 : body.stock);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'coverUrl') || !partial) {
    input.cover_url = parseCoverUrl(body.coverUrl);
  }
  if (partial && Object.keys(input).length === 0) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Setidaknya satu field buku harus dikirim.');
  }
  return input;
}
function handleSqliteError(error) {
  if (error && error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return new ApiError(409, 'CONFLICT', 'Data dengan nilai unik tersebut sudah terdaftar.');
  }
  if (error && error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return new ApiError(409, 'CONFLICT', 'Data masih terhubung dengan sumber daya lain.');
  }
  return error;
}
function adminCreateBook(body) {
  const input = validateBookInput(body, false);
  const now = nowIso();
  const result = db.prepare(
    'INSERT INTO books (title, author, isbn, description, category_id, stock, cover_url, created_at, updated_at) ' +
    'VALUES (@title, @author, @isbn, @description, @category_id, @stock, @cover_url, @created_at, @updated_at)'
  ).run({
    title: input.title, author: input.author, isbn: input.isbn || null,
    description: input.description || '', category_id: input.category_id,
    stock: input.stock, cover_url: input.cover_url || null, created_at: now, updated_at: now
  });
  return parseBook(getBook(result.lastInsertRowid));
}
function doReturnLoan(loanId, expectedUserId) {
  const txn = db.transaction(() => {
    const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(loanId);
    if (!loan || (expectedUserId && loan.user_id !== expectedUserId)) {
      throw new ApiError(404, 'NOT_FOUND', 'Peminjaman tidak ditemukan.');
    }
    if (loan.status === 'returned') {
      throw new ApiError(409, 'CONFLICT', 'Peminjaman sudah dikembalikan.');
    }
    db.prepare('UPDATE loans SET status = \'returned\', returned_at = ? WHERE id = ?')
      .run(nowIso(), loanId);
    db.prepare('UPDATE books SET stock = stock + 1, updated_at = ? WHERE id = ?')
      .run(nowIso(), loan.book_id);
    return getLoan(loanId);
  });
  return parseLoan(txn());
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'elibrary-api', timestamp: nowIso() });
});

app.get('/api/books', (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 120) : '';
  const categoryId = req.query.categoryId;
  const page = Math.max(1, positiveInt(req.query.page) ? Number(req.query.page) : 1);
  const limit = Math.min(100, Math.max(1, positiveInt(req.query.limit) ? Number(req.query.limit) : 20));
  const where = [];
  const params = [];
  if (q) {
    where.push('(b.title LIKE ? OR b.author LIKE ? OR COALESCE(b.isbn, \'\') LIKE ?)');
    const pattern = '%' + q + '%';
    params.push(pattern, pattern, pattern);
  }
  if (categoryId !== undefined) {
    if (!positiveInt(categoryId)) throw new ApiError(400, 'INVALID_QUERY', 'categoryId harus berupa ID positif.');
    where.push('b.category_id = ?');
    params.push(Number(categoryId));
  }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const total = db.prepare('SELECT COUNT(*) AS total FROM books b ' + whereSql).get(...params).total;
  const rows = db.prepare(bookQuery() + whereSql + ' ORDER BY b.title COLLATE NOCASE LIMIT ? OFFSET ?')
    .all(...params, limit, (page - 1) * limit);
  res.json({
    data: rows.map(parseBook),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  });
});

app.get('/api/books/:id', (req, res) => {
  if (!positiveInt(req.params.id)) throw new ApiError(400, 'INVALID_ID', 'ID buku tidak valid.');
  const row = getBook(Number(req.params.id));
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'Buku tidak ditemukan.');
  res.json({ data: parseBook(row) });
});

app.get('/api/categories', (req, res) => {
  const rows = db.prepare(
    'SELECT c.id, c.name, c.slug, c.created_at, COUNT(b.id) AS book_count ' +
    'FROM categories c LEFT JOIN books b ON b.category_id = c.id ' +
    'GROUP BY c.id ORDER BY c.name COLLATE NOCASE'
  ).all();
  res.json({ data: rows.map((row) => ({
    id: row.id, name: row.name, slug: row.slug,
    bookCount: row.book_count, createdAt: row.created_at
  })) });
});

app.post('/api/auth/register', async (req, res) => {
  const body = req.body || {};
  requireFields(body, ['name', 'email', 'password']);
  const name = body.name.trim();
  const email = body.email.trim().toLowerCase();
  const password = body.password;
  if (name.length < 2 || name.length > 80) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Nama harus terdiri dari 2 sampai 80 karakter.');
  }
  if (!isEmail(email)) throw new ApiError(422, 'VALIDATION_ERROR', 'Format email tidak valid.');
  if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Kata sandi harus terdiri dari 8 sampai 72 karakter.');
  }
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
    throw new ApiError(409, 'CONFLICT', 'Email sudah terdaftar.');
  }
  const id = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    db.prepare(
      'INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, name, email, passwordHash, 'member', nowIso());
  } catch (error) {
    throw handleSqliteError(error);
  }
  const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(id);
  res.status(201).json({ data: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.created_at } });
});

app.post('/api/auth/login', async (req, res) => {
  const body = req.body || {};
  if (!isEmail(body.email) || typeof body.password !== 'string' || !body.password) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Email dan kata sandi wajib diisi dengan format yang valid.');
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(body.email.trim().toLowerCase());
  const matches = user ? await bcrypt.compare(body.password, user.password_hash) : false;
  if (!matches) throw new ApiError(401, 'UNAUTHORIZED', 'Email atau kata sandi tidak sesuai.');
  const safeUser = {
    id: user.id, name: user.name, email: user.email, role: user.role,
    createdAt: user.created_at
  };
  res.json({
    accessToken: signAccessToken(user),
    tokenType: 'Bearer',
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
    user: safeUser
  });
});

app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({ data: req.user });
});

app.post('/api/loans', authenticate, authorize('member'), (req, res) => {
  const body = req.body || {};
  if (!positiveInt(body.bookId)) throw new ApiError(422, 'VALIDATION_ERROR', 'bookId harus berupa ID buku positif.');
  let dueDate = body.dueDate;
  if (dueDate !== undefined) {
    if (typeof dueDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
        Number.isNaN(Date.parse(dueDate)) || new Date(dueDate).toISOString().slice(0, 10) !== dueDate) {
      throw new ApiError(422, 'VALIDATION_ERROR', 'dueDate harus berformat YYYY-MM-DD.');
    }
    if (dueDate <= nowIso().slice(0, 10)) throw new ApiError(422, 'VALIDATION_ERROR', 'dueDate harus setelah hari ini.');
  } else {
    const due = new Date();
    due.setUTCDate(due.getUTCDate() + 14);
    dueDate = due.toISOString().slice(0, 10);
  }

  const txn = db.transaction(() => {
    const book = db.prepare('SELECT id, stock FROM books WHERE id = ?').get(Number(body.bookId));
    if (!book) throw new ApiError(404, 'NOT_FOUND', 'Buku tidak ditemukan.');
    if (book.stock < 1) throw new ApiError(409, 'OUT_OF_STOCK', 'Stok buku sedang habis.');
    db.prepare('UPDATE books SET stock = stock - 1, updated_at = ? WHERE id = ? AND stock > 0')
      .run(nowIso(), book.id);
    const result = db.prepare(
      'INSERT INTO loans (user_id, book_id, status, loaned_at, due_date, returned_at) VALUES (?, ?, ?, ?, ?, NULL)'
    ).run(req.user.id, book.id, 'borrowed', nowIso(), dueDate);
    return getLoan(result.lastInsertRowid);
  });
  res.status(201).json({ data: parseLoan(txn()) });
});

app.get('/api/loans/my', authenticate, authorize('member'), (req, res) => {
  const rows = db.prepare(loanQuery() + 'WHERE l.user_id = ? ORDER BY l.loaned_at DESC, l.id DESC')
    .all(req.user.id);
  res.json({ data: rows.map(parseLoan) });
});

app.post('/api/loans/:id/return', authenticate, authorize('member'), (req, res) => {
  if (!positiveInt(req.params.id)) throw new ApiError(400, 'INVALID_ID', 'ID peminjaman tidak valid.');
  res.json({ data: doReturnLoan(Number(req.params.id), req.user.id) });
});

app.post('/api/admin/books', authenticate, authorize('librarian'), (req, res) => {
  try {
    res.status(201).json({ data: adminCreateBook(req.body || {}) });
  } catch (error) {
    throw handleSqliteError(error);
  }
});

app.patch('/api/admin/books/:id', authenticate, authorize('librarian'), (req, res) => {
  if (!positiveInt(req.params.id)) throw new ApiError(400, 'INVALID_ID', 'ID buku tidak valid.');
  if (!getBook(Number(req.params.id))) throw new ApiError(404, 'NOT_FOUND', 'Buku tidak ditemukan.');
  const body = req.body || {};
  const input = validateBookInput(body, true);
  const assignments = Object.keys(input).map((key) => key + ' = @' + key);
  assignments.push('updated_at = @updated_at');
  try {
    db.prepare('UPDATE books SET ' + assignments.join(', ') + ' WHERE id = @id')
      .run(Object.assign({ id: Number(req.params.id), updated_at: nowIso() }, input));
  } catch (error) {
    throw handleSqliteError(error);
  }
  res.json({ data: parseBook(getBook(Number(req.params.id))) });
});

app.delete('/api/admin/books/:id', authenticate, authorize('librarian'), (req, res) => {
  if (!positiveInt(req.params.id)) throw new ApiError(400, 'INVALID_ID', 'ID buku tidak valid.');
  const id = Number(req.params.id);
  if (!getBook(id)) throw new ApiError(404, 'NOT_FOUND', 'Buku tidak ditemukan.');
  const loans = db.prepare('SELECT COUNT(*) AS total FROM loans WHERE book_id = ?').get(id).total;
  if (loans > 0) throw new ApiError(409, 'CONFLICT', 'Buku tidak dapat dihapus karena memiliki riwayat peminjaman.');
  db.prepare('DELETE FROM books WHERE id = ?').run(id);
  res.status(204).end();
});

function slugify(value) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
app.post('/api/admin/categories', authenticate, authorize('librarian'), (req, res) => {
  const body = req.body || {};
  requireFields(body, ['name']);
  const name = body.name.trim();
  if (name.length < 2 || name.length > 80) throw new ApiError(422, 'VALIDATION_ERROR', 'Nama kategori harus 2 sampai 80 karakter.');
  try {
    const result = db.prepare('INSERT INTO categories (name, slug, created_at) VALUES (?, ?, ?)')
      .run(name, slugify(name), nowIso());
    const row = db.prepare('SELECT id, name, slug, created_at FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ data: { id: row.id, name: row.name, slug: row.slug, createdAt: row.created_at } });
  } catch (error) {
    throw handleSqliteError(error);
  }
});

app.patch('/api/admin/categories/:id', authenticate, authorize('librarian'), (req, res) => {
  if (!positiveInt(req.params.id)) throw new ApiError(400, 'INVALID_ID', 'ID kategori tidak valid.');
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Kategori tidak ditemukan.');
  const body = req.body || {};
  if (typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.trim().length > 80) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'name harus terdiri dari 2 sampai 80 karakter.');
  }
  try {
    db.prepare('UPDATE categories SET name = ?, slug = ? WHERE id = ?')
      .run(body.name.trim(), slugify(body.name.trim()), id);
  } catch (error) {
    throw handleSqliteError(error);
  }
  const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  res.json({ data: { id: row.id, name: row.name, slug: row.slug, createdAt: row.created_at } });
});

app.delete('/api/admin/categories/:id', authenticate, authorize('librarian'), (req, res) => {
  if (!positiveInt(req.params.id)) throw new ApiError(400, 'INVALID_ID', 'ID kategori tidak valid.');
  const id = Number(req.params.id);
  if (!db.prepare('SELECT id FROM categories WHERE id = ?').get(id)) throw new ApiError(404, 'NOT_FOUND', 'Kategori tidak ditemukan.');
  const books = db.prepare('SELECT COUNT(*) AS total FROM books WHERE category_id = ?').get(id).total;
  if (books > 0) throw new ApiError(409, 'CONFLICT', 'Kategori tidak dapat dihapus karena masih dipakai buku.');
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  res.status(204).end();
});

app.get('/api/admin/loans', authenticate, authorize('librarian'), (req, res) => {
  const rows = db.prepare(loanQuery() + 'ORDER BY l.loaned_at DESC, l.id DESC').all();
  res.json({ data: rows.map(parseLoan) });
});

app.patch('/api/admin/loans/:id/status', authenticate, authorize('librarian'), (req, res) => {
  if (!positiveInt(req.params.id)) throw new ApiError(400, 'INVALID_ID', 'ID peminjaman tidak valid.');
  if (!req.body || req.body.status !== 'returned') {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Status yang dapat diatur melalui endpoint ini adalah returned.');
  }
  res.json({ data: doReturnLoan(Number(req.params.id), null) });
});

app.get('/api/leadership/stats', authenticate, authorize('leadership'), (req, res) => {
  const totalTitles = db.prepare('SELECT COUNT(*) AS total FROM books').get().total;
  const availableCopies = db.prepare('SELECT COALESCE(SUM(stock), 0) AS total FROM books').get().total;
  const totalLoans = db.prepare('SELECT COUNT(*) AS total FROM loans').get().total;
  const activeLoans = db.prepare("SELECT COUNT(*) AS total FROM loans WHERE status = 'borrowed'").get().total;
  const totalMembers = db.prepare("SELECT COUNT(*) AS total FROM users WHERE role = 'member'").get().total;

  const mostBorrowed = db.prepare(
    "SELECT b.id, b.title, b.author, COUNT(l.id) AS loanCount " +
    "FROM books b LEFT JOIN loans l ON l.book_id = b.id " +
    "GROUP BY b.id ORDER BY loanCount DESC, b.title COLLATE NOCASE ASC LIMIT 5"
  ).all();

  const mostActiveMembers = db.prepare(
    "SELECT u.id, u.name, u.email, COUNT(l.id) AS loanCount " +
    "FROM users u LEFT JOIN loans l ON l.user_id = u.id " +
    "WHERE u.role = 'member' GROUP BY u.id " +
    "ORDER BY loanCount DESC, u.name COLLATE NOCASE ASC LIMIT 5"
  ).all();

  const lowStockBooks = db.prepare(
    "SELECT id, title, author, stock FROM books WHERE stock <= 1 " +
    "ORDER BY stock ASC, title COLLATE NOCASE ASC LIMIT 5"
  ).all();

  res.json({
    data: {
      summary: { totalTitles, availableCopies, totalLoans, activeLoans, totalMembers },
      mostBorrowed,
      mostActiveMembers,
      lowStockBooks
    }
  });
});

app.use((req, res, next) => next(new ApiError(404, 'NOT_FOUND', 'Endpoint tidak ditemukan.')));

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = Number.isInteger(error.status) ? error.status : 500;
  if (status >= 500) console.error('[api-error]', error.message);
  res.status(status).json({
    error: {
      code: error.code || (status === 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR'),
      message: status === 500 ? 'Terjadi kesalahan internal pada server.' : error.message
    }
  });
});

module.exports = app;