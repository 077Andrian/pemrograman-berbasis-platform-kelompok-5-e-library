const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

process.env.DB_FILE = ':memory:';
process.env.JWT_SECRET = 'test-only-secret-string-that-is-long-enough-123456';
process.env.JWT_EXPIRES_IN = '2h';
process.env.CORS_ORIGINS = 'http://localhost:5500';

const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const { db } = require('../src/db');

let memberToken = '';
let secondMemberToken = '';
let adminToken = '';
let leadershipToken = '';
let adminId = '';
let bookId = 0;
let loanId = 0;
let originalStock = 0;

before(async () => {
  const adminEmail = 'admin-test@elibrary.local';
  const adminPassword = 'AdminTestPassword123!';
  adminId = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(adminPassword, 4);
  db.prepare(
    'INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(adminId, 'Admin Test', adminEmail, passwordHash, 'librarian', new Date().toISOString());

  const login = await request(app).post('/api/auth/login')
    .send({ email: adminEmail, password: adminPassword });
  assert.equal(login.status, 200);
  adminToken = login.body.accessToken;

  const leadershipEmail = 'leadership-test@elibrary.local';
  const leadershipPassword = 'LeadershipTestPassword123!';
  const leadershipId = crypto.randomUUID();
  const leadershipHash = await bcrypt.hash(leadershipPassword, 4);
  db.prepare(
    'INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(leadershipId, 'Pimpinan Test', leadershipEmail, leadershipHash, 'leadership', new Date().toISOString());

  const leadershipLogin = await request(app).post('/api/auth/login')
    .send({ email: leadershipEmail, password: leadershipPassword });
  assert.equal(leadershipLogin.status, 200);
  leadershipToken = leadershipLogin.body.accessToken;
});

after(() => {
  db.close();
});

test('health endpoint returns status ok', async () => {
  const response = await request(app).get('/api/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'ok');
});

test('public catalog returns seeded books and categories', async () => {
  const books = await request(app).get('/api/books');
  const categories = await request(app).get('/api/categories');
  assert.equal(books.status, 200);
  assert.ok(books.body.data.length >= 6);
  assert.equal(books.body.pagination.total, books.body.data.length);
  assert.equal(categories.status, 200);
  assert.ok(categories.body.data.length >= 4);
  bookId = books.body.data[0].id;
  originalStock = books.body.data[0].stock;
});

test('protected profile requires a valid bearer token', async () => {
  const missing = await request(app).get('/api/auth/me');
  assert.equal(missing.status, 401);
  const invalid = await request(app).get('/api/auth/me').set('Authorization', 'Bearer invalid-token');
  assert.equal(invalid.status, 401);
});

test('registration creates only a Member and does not disclose password hash', async () => {
  const response = await request(app).post('/api/auth/register').send({
    name: 'Member Satu',
    email: 'member-one@elibrary.local',
    password: 'MemberPass123!'
  });
  assert.equal(response.status, 201);
  assert.equal(response.body.data.role, 'member');
  assert.equal(Object.hasOwn(response.body.data, 'password_hash'), false);
  const duplicate = await request(app).post('/api/auth/register').send({
    name: 'Member Satu',
    email: 'member-one@elibrary.local',
    password: 'MemberPass123!'
  });
  assert.equal(duplicate.status, 409);

  const login = await request(app).post('/api/auth/login').send({
    email: 'member-one@elibrary.local',
    password: 'MemberPass123!'
  });
  assert.equal(login.status, 200);
  assert.equal(login.body.user.role, 'member');
  assert.ok(login.body.accessToken);
  memberToken = login.body.accessToken;
});

test('wrong password is rejected with a generic 401 message', async () => {
  const response = await request(app).post('/api/auth/login').send({
    email: 'member-one@elibrary.local',
    password: 'WrongPassword123!'
  });
  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, 'UNAUTHORIZED');
});

test('authenticated Member can read their own profile', async () => {
  const response = await request(app).get('/api/auth/me')
    .set('Authorization', 'Bearer ' + memberToken);
  assert.equal(response.status, 200);
  assert.equal(response.body.data.email, 'member-one@elibrary.local');
  assert.equal(response.body.data.role, 'member');
});

test('Member cannot access Librarian-only book creation', async () => {
  const response = await request(app).post('/api/admin/books')
    .set('Authorization', 'Bearer ' + memberToken)
    .send({ title: 'No Access', author: 'Member', stock: 1 });
  assert.equal(response.status, 403);
  assert.equal(response.body.error.code, 'FORBIDDEN');
});

test('Member can borrow a book and return it; another Member cannot return it', async () => {
  const borrowed = await request(app).post('/api/loans')
    .set('Authorization', 'Bearer ' + memberToken)
    .send({ bookId });
  assert.equal(borrowed.status, 201);
  assert.equal(borrowed.body.data.status, 'borrowed');
  loanId = borrowed.body.data.id;

  const mine = await request(app).get('/api/loans/my')
    .set('Authorization', 'Bearer ' + memberToken);
  assert.equal(mine.status, 200);
  assert.ok(mine.body.data.some((loan) => loan.id === loanId));

  const registerSecond = await request(app).post('/api/auth/register').send({
    name: 'Member Dua', email: 'member-two@elibrary.local', password: 'SecondPass123!'
  });
  assert.equal(registerSecond.status, 201);
  const loginSecond = await request(app).post('/api/auth/login').send({
    email: 'member-two@elibrary.local', password: 'SecondPass123!'
  });
  secondMemberToken = loginSecond.body.accessToken;

  const forbiddenLoan = await request(app).post('/api/loans/' + loanId + '/return')
    .set('Authorization', 'Bearer ' + secondMemberToken);
  assert.equal(forbiddenLoan.status, 404);

  const returned = await request(app).post('/api/loans/' + loanId + '/return')
    .set('Authorization', 'Bearer ' + memberToken);
  assert.equal(returned.status, 200);
  assert.equal(returned.body.data.status, 'returned');

  const duplicateReturn = await request(app).post('/api/loans/' + loanId + '/return')
    .set('Authorization', 'Bearer ' + memberToken);
  assert.equal(duplicateReturn.status, 409);

  const book = await request(app).get('/api/books/' + bookId);
  assert.equal(book.status, 200);
  assert.equal(book.body.data.stock, originalStock);
});

test('Librarian can create, update, and delete a book', async () => {
  const categories = await request(app).get('/api/categories');
  const categoryId = categories.body.data[0].id;
  const created = await request(app).post('/api/admin/books')
    .set('Authorization', 'Bearer ' + adminToken)
    .send({
      title: 'Buku Pengujian Admin',
      author: 'Tim Penguji',
      isbn: 'TEST-' + Date.now(),
      description: 'Buku untuk uji otomatis.',
      categoryId,
      stock: 2
    });
  assert.equal(created.status, 201);
  const id = created.body.data.id;

  const updated = await request(app).patch('/api/admin/books/' + id)
    .set('Authorization', 'Bearer ' + adminToken)
    .send({ title: 'Buku Pengujian Admin Diperbarui' });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.title, 'Buku Pengujian Admin Diperbarui');

  const deleted = await request(app).delete('/api/admin/books/' + id)
    .set('Authorization', 'Bearer ' + adminToken);
  assert.equal(deleted.status, 204);
});

test('Librarian can inspect all loans and add a category', async () => {
  const loans = await request(app).get('/api/admin/loans')
    .set('Authorization', 'Bearer ' + adminToken);
  assert.equal(loans.status, 200);
  assert.ok(Array.isArray(loans.body.data));

  const created = await request(app).post('/api/admin/categories')
    .set('Authorization', 'Bearer ' + adminToken)
    .send({ name: 'Kategori Tes ' + Date.now() });
  assert.equal(created.status, 201);
  assert.ok(created.body.data.slug.startsWith('kategori-tes-'));
});


test('Leadership can read aggregated statistics but cannot manage the catalogue', async () => {
  const stats = await request(app).get('/api/leadership/stats')
    .set('Authorization', 'Bearer ' + leadershipToken);
  assert.equal(stats.status, 200);
  assert.equal(typeof stats.body.data.summary.totalTitles, 'number');
  assert.equal(typeof stats.body.data.summary.totalMembers, 'number');
  assert.ok(Array.isArray(stats.body.data.mostBorrowed));
  assert.ok(Array.isArray(stats.body.data.mostActiveMembers));

  const forbidden = await request(app).post('/api/admin/books')
    .set('Authorization', 'Bearer ' + leadershipToken)
    .send({ title: 'No Access', author: 'Pimpinan', stock: 1 });
  assert.equal(forbidden.status, 403);
  assert.equal(forbidden.body.error.code, 'FORBIDDEN');
});

test('validation errors use the shared response envelope', async () => {
  const response = await request(app).post('/api/auth/register').send({
    name: '', email: 'not-an-email', password: 'short'
  });
  assert.equal(response.status, 422);
  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
});