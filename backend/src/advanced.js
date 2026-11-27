const express = require('express');
const { db } = require('./db');
const { ApiError, authenticate, authorize } = require('./auth');

const router = express.Router();
const DEFAULT_LOAN_DAYS = Math.max(1, Number(process.env.LOAN_PERIOD_DAYS || 14));
const RENEWAL_DAYS = Math.max(1, Number(process.env.LOAN_RENEWAL_DAYS || 14));
const MAX_RENEWALS = Math.max(0, Number(process.env.MAX_LOAN_RENEWALS || 1));
const FINE_PER_DAY = Math.max(0, Number(process.env.FINE_PER_DAY || 1000));
const RESERVATION_HOLD_DAYS = Math.max(1, Number(process.env.RESERVATION_HOLD_DAYS || 3));

function ensureSchema() {
  const columns = db.prepare('PRAGMA table_info(loans)').all().map((column) => column.name);
  if (!columns.includes('renewal_count')) {
    db.exec('ALTER TABLE loans ADD COLUMN renewal_count INTEGER NOT NULL DEFAULT 0');
  }
  db.exec(
    "CREATE TABLE IF NOT EXISTS reservations (" +
    "id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, book_id INTEGER NOT NULL, " +
    "status TEXT NOT NULL DEFAULT 'waiting' CHECK(status IN ('waiting','ready','fulfilled','cancelled','expired')), " +
    "created_at TEXT NOT NULL, ready_at TEXT, expires_at TEXT, fulfilled_at TEXT, " +
    "FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT, " +
    "FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE RESTRICT); " +
    "CREATE INDEX IF NOT EXISTS idx_reservations_queue ON reservations(book_id,status,id); " +
    "CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations(user_id,created_at DESC); " +
    "CREATE TABLE IF NOT EXISTS ebooks (" +
    "id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, author TEXT NOT NULL, " +
    "description TEXT NOT NULL DEFAULT '', file_url TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);"
  );
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_reservation_active_unique ON reservations(user_id,book_id) WHERE status IN ('waiting','ready')");
}
ensureSchema();

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (date, days) => {
  const value = new Date(date + 'T00:00:00.000Z');
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};
const isoNow = () => new Date().toISOString();

function fineForLoan(loan) {
  const endDate = loan.returned_at ? loan.returned_at.slice(0, 10) : today();
  const overdueDays = Math.max(0, Math.floor((Date.parse(endDate) - Date.parse(loan.due_date)) / 86400000));
  return { overdueDays, fineAmount: overdueDays * FINE_PER_DAY };
}
function parseReservation(row) {
  return {
    id: row.id, bookId: row.book_id, bookTitle: row.book_title,
    status: row.status, queueNumber: row.queue_number || null,
    createdAt: row.created_at, readyAt: row.ready_at, expiresAt: row.expires_at
  };
}
function reservationRows(where, params) {
  return db.prepare(
    "SELECT r.*, b.title AS book_title, " +
    "(SELECT COUNT(*) + 1 FROM reservations q WHERE q.book_id = r.book_id AND q.status = 'waiting' AND q.id < r.id) AS queue_number " +
    "FROM reservations r JOIN books b ON b.id = r.book_id " + where + " ORDER BY r.created_at DESC, r.id DESC"
  ).all(...params).map(parseReservation);
}
function dispatchNext(bookId) {
  const book = db.prepare('SELECT stock FROM books WHERE id = ?').get(bookId);
  if (!book || book.stock < 1) return;
  const waiting = db.prepare(
    "SELECT id FROM reservations WHERE book_id = ? AND status = 'waiting' ORDER BY id ASC LIMIT 1"
  ).get(bookId);
  if (!waiting) return;
  const readyAt = isoNow();
  const expiresAt = new Date(Date.now() + RESERVATION_HOLD_DAYS * 86400000).toISOString();
  const txn = db.transaction(() => {
    const changed = db.prepare("UPDATE books SET stock = stock - 1, updated_at = ? WHERE id = ? AND stock > 0")
      .run(readyAt, bookId).changes;
    if (!changed) return;
    db.prepare("UPDATE reservations SET status = 'ready', ready_at = ?, expires_at = ? WHERE id = ? AND status = 'waiting'")
      .run(readyAt, expiresAt, waiting.id);
  });
  txn();
}
function expireReservations() {
  const expired = db.prepare(
    "SELECT id, book_id FROM reservations WHERE status = 'ready' AND expires_at <= ?"
  ).all(isoNow());
  for (const reservation of expired) {
    const txn = db.transaction(() => {
      const changed = db.prepare(
        "UPDATE reservations SET status = 'expired' WHERE id = ? AND status = 'ready'"
      ).run(reservation.id).changes;
      if (changed) db.prepare('UPDATE books SET stock = stock + 1, updated_at = ? WHERE id = ?')
        .run(isoNow(), reservation.book_id);
    });
    txn();
    dispatchNext(reservation.book_id);
  }
}
function createLoanFromReservation(reservation, userId) {
  const txn = db.transaction(() => {
    const current = db.prepare("SELECT * FROM reservations WHERE id = ?").get(reservation.id);
    if (!current || current.user_id !== userId || current.status !== 'ready' || current.expires_at <= isoNow()) {
      throw new ApiError(409, 'RESERVATION_NOT_READY', 'Reservasi tidak tersedia atau masa pengambilan sudah berakhir.');
    }
    const dueDate = addDays(today(), DEFAULT_LOAN_DAYS);
    const loan = db.prepare(
      "INSERT INTO loans (user_id, book_id, status, loaned_at, due_date, returned_at) VALUES (?, ?, 'borrowed', ?, ?, NULL)"
    ).run(userId, current.book_id, isoNow(), dueDate);
    db.prepare("UPDATE reservations SET status = 'fulfilled', fulfilled_at = ? WHERE id = ?")
      .run(isoNow(), current.id);
    return db.prepare('SELECT * FROM loans WHERE id = ?').get(loan.lastInsertRowid);
  });
  return txn();
}

// Called by the normal loan-return flow after stock is restored.
function dispatchReservationsForBook(bookId) {
  expireReservations();
  dispatchNext(bookId);
}

router.post('/api/loans/:id/renew', authenticate, authorize('member'), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) throw new ApiError(400, 'INVALID_ID', 'ID peminjaman tidak valid.');
  const txn = db.transaction(() => {
    const loan = db.prepare('SELECT * FROM loans WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!loan) throw new ApiError(404, 'NOT_FOUND', 'Peminjaman tidak ditemukan.');
    if (loan.status !== 'borrowed') throw new ApiError(409, 'LOAN_NOT_ACTIVE', 'Peminjaman yang sudah dikembalikan tidak dapat diperpanjang.');
    if (loan.due_date < today()) throw new ApiError(409, 'LOAN_OVERDUE', 'Peminjaman terlambat tidak dapat diperpanjang.');
    if ((loan.renewal_count || 0) >= MAX_RENEWALS) throw new ApiError(409, 'RENEWAL_LIMIT', 'Batas perpanjangan peminjaman sudah tercapai.');
    const dueDate = addDays(loan.due_date, RENEWAL_DAYS);
    db.prepare('UPDATE loans SET due_date = ?, renewal_count = renewal_count + 1 WHERE id = ?').run(dueDate, id);
    return db.prepare('SELECT * FROM loans WHERE id = ?').get(id);
  });
  const loan = txn();
  res.json({ data: { id: loan.id, dueDate: loan.due_date, renewalCount: loan.renewal_count } });
});

router.get('/api/fines/my', authenticate, authorize('member'), (req, res) => {
  const rows = db.prepare("SELECT id, book_id, due_date, returned_at, status FROM loans WHERE user_id = ? ORDER BY loaned_at DESC")
    .all(req.user.id);
  const data = rows.map((loan) => {
    const book = db.prepare('SELECT title FROM books WHERE id = ?').get(loan.book_id);
    return { loanId: loan.id, bookTitle: book?.title || 'Buku', dueDate: loan.due_date, status: loan.status, ...fineForLoan(loan) };
  });
  res.json({ data, totalFine: data.reduce((sum, item) => sum + item.fineAmount, 0), finePerDay: FINE_PER_DAY });
});

router.get('/api/admin/fines', authenticate, authorize('librarian'), (req, res) => {
  const rows = db.prepare(
    "SELECT l.id, l.user_id, u.name AS user_name, u.email, l.book_id, b.title AS book_title, l.due_date, l.returned_at, l.status " +
    "FROM loans l JOIN users u ON u.id = l.user_id JOIN books b ON b.id = l.book_id ORDER BY l.due_date"
  ).all();
  const data = rows.map((loan) => ({ loanId: loan.id, userId: loan.user_id, userName: loan.user_name, email: loan.email, bookTitle: loan.book_title, dueDate: loan.due_date, status: loan.status, ...fineForLoan(loan) }));
  res.json({ data, totalFine: data.reduce((sum, item) => sum + item.fineAmount, 0), finePerDay: FINE_PER_DAY });
});

router.post('/api/reservations', authenticate, authorize('member'), (req, res) => {
  expireReservations();
  const bookId = Number(req.body?.bookId);
  if (!Number.isInteger(bookId) || bookId < 1) throw new ApiError(422, 'VALIDATION_ERROR', 'bookId harus berupa ID buku positif.');
  const book = db.prepare('SELECT id, stock FROM books WHERE id = ?').get(bookId);
  if (!book) throw new ApiError(404, 'NOT_FOUND', 'Buku tidak ditemukan.');
  if (book.stock > 0) throw new ApiError(409, 'BOOK_AVAILABLE', 'Buku masih tersedia dan dapat langsung dipinjam.');
  try {
    const result = db.prepare("INSERT INTO reservations (user_id, book_id, status, created_at) VALUES (?, ?, 'waiting', ?)")
      .run(req.user.id, bookId, isoNow());
    dispatchNext(bookId);
    res.status(201).json({ data: reservationRows('WHERE r.id = ?', [result.lastInsertRowid])[0] });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') throw new ApiError(409, 'RESERVATION_EXISTS', 'Anda sudah memiliki reservasi aktif untuk buku ini.');
    throw error;
  }
});

router.get('/api/reservations/my', authenticate, authorize('member'), (req, res) => {
  expireReservations();
  res.json({ data: reservationRows('WHERE r.user_id = ?', [req.user.id]) });
});

router.post('/api/reservations/:id/claim', authenticate, authorize('member'), (req, res) => {
  expireReservations();
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) throw new ApiError(400, 'INVALID_ID', 'ID reservasi tidak valid.');
  const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(id);
  if (!reservation || reservation.user_id !== req.user.id) throw new ApiError(404, 'NOT_FOUND', 'Reservasi tidak ditemukan.');
  const loan = createLoanFromReservation(reservation, req.user.id);
  dispatchNext(reservation.book_id);
  res.status(201).json({ data: { id: loan.id, bookId: loan.book_id, status: loan.status, dueDate: loan.due_date } });
});

router.delete('/api/reservations/:id', authenticate, authorize('member'), (req, res) => {
  expireReservations();
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) throw new ApiError(400, 'INVALID_ID', 'ID reservasi tidak valid.');
  const reservation = db.prepare("SELECT * FROM reservations WHERE id = ? AND user_id = ? AND status IN ('waiting','ready')").get(id, req.user.id);
  if (!reservation) throw new ApiError(404, 'NOT_FOUND', 'Reservasi aktif tidak ditemukan.');
  const txn = db.transaction(() => {
    db.prepare("UPDATE reservations SET status = 'cancelled' WHERE id = ?").run(id);
    if (reservation.status === 'ready') db.prepare('UPDATE books SET stock = stock + 1, updated_at = ? WHERE id = ?').run(isoNow(), reservation.book_id);
  });
  txn();
  dispatchNext(reservation.book_id);
  res.status(204).end();
});

router.get('/api/admin/reservations', authenticate, authorize('librarian'), (req, res) => {
  expireReservations();
  res.json({ data: reservationRows('', []) });
});

router.post('/api/admin/ebooks', authenticate, authorize('librarian'), (req, res) => {
  const { title, author, description = '', fileUrl } = req.body || {};
  if (typeof title !== 'string' || title.trim().length < 2 || typeof author !== 'string' || author.trim().length < 2) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Judul dan penulis e-book wajib diisi.');
  }
  let parsed;
  try { parsed = new URL(fileUrl); } catch (_) { throw new ApiError(422, 'VALIDATION_ERROR', 'fileUrl harus berupa URL HTTPS yang valid.'); }
  if (parsed.protocol !== 'https:') throw new ApiError(422, 'VALIDATION_ERROR', 'fileUrl harus menggunakan HTTPS.');
  if (typeof description !== 'string' || description.length > 2000) throw new ApiError(422, 'VALIDATION_ERROR', 'Deskripsi e-book tidak valid.');
  const now = isoNow();
  const result = db.prepare('INSERT INTO ebooks (title, author, description, file_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(title.trim(), author.trim(), description.trim(), parsed.toString(), now, now);
  res.status(201).json({ data: { id: result.lastInsertRowid, title: title.trim(), author: author.trim(), description: description.trim(), createdAt: now } });
});

router.get('/api/ebooks', (req, res) => {
  const rows = db.prepare('SELECT id, title, author, description, created_at FROM ebooks ORDER BY title COLLATE NOCASE').all();
  res.json({ data: rows.map((row) => ({ id: row.id, title: row.title, author: row.author, description: row.description, createdAt: row.created_at })) });
});

router.get('/api/ebooks/:id/download', authenticate, authorize('member', 'librarian', 'leadership'), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) throw new ApiError(400, 'INVALID_ID', 'ID e-book tidak valid.');
  const ebook = db.prepare('SELECT id, title, file_url FROM ebooks WHERE id = ?').get(id);
  if (!ebook) throw new ApiError(404, 'NOT_FOUND', 'E-book tidak ditemukan.');
  res.json({ data: { id: ebook.id, title: ebook.title, downloadUrl: ebook.file_url } });
});

router.patch('/api/admin/ebooks/:id', authenticate, authorize('librarian'), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) throw new ApiError(400, 'INVALID_ID', 'ID e-book tidak valid.');
  const existing = db.prepare('SELECT * FROM ebooks WHERE id = ?').get(id);
  if (!existing) throw new ApiError(404, 'NOT_FOUND', 'E-book tidak ditemukan.');
  const title = req.body?.title === undefined ? existing.title : req.body.title;
  const author = req.body?.author === undefined ? existing.author : req.body.author;
  const description = req.body?.description === undefined ? existing.description : req.body.description;
  const fileUrl = req.body?.fileUrl === undefined ? existing.file_url : req.body.fileUrl;
  let parsed;
  try { parsed = new URL(fileUrl); } catch (_) { throw new ApiError(422, 'VALIDATION_ERROR', 'fileUrl harus berupa URL HTTPS yang valid.'); }
  if (parsed.protocol !== 'https:' || typeof title !== 'string' || title.trim().length < 2 || typeof author !== 'string' || author.trim().length < 2 || typeof description !== 'string' || description.length > 2000) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Data e-book tidak valid; fileUrl wajib HTTPS.');
  }
  db.prepare('UPDATE ebooks SET title = ?, author = ?, description = ?, file_url = ?, updated_at = ? WHERE id = ?')
    .run(title.trim(), author.trim(), description.trim(), parsed.toString(), isoNow(), id);
  res.json({ data: { id, title: title.trim(), author: author.trim(), description: description.trim() } });
});

router.delete('/api/admin/ebooks/:id', authenticate, authorize('librarian'), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) throw new ApiError(400, 'INVALID_ID', 'ID e-book tidak valid.');
  const result = db.prepare('DELETE FROM ebooks WHERE id = ?').run(id);
  if (!result.changes) throw new ApiError(404, 'NOT_FOUND', 'E-book tidak ditemukan.');
  res.status(204).end();
});

module.exports = { router, dispatchReservationsForBook, fineForLoan };
