import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seedDemo, fixtures } from '../prisma/seed-data.js';

test('seed dapat diulang tanpa menggandakan data atau menimpa pekerjaan mahasiswa', async () => {
  const users = []; const jadwal = []; const peserta = [];
  const db = {
    user: { upsert: async ({ where, create, update }) => {
      const existing = users.find(u => u.nim === where.nim);
      if (existing) return Object.assign(existing, update);
      const user = { ...create, id: users.length + 1 }; users.push(user); return user;
    } },
    jadwal: {
      upsert: async ({ where, create, update }) => {
        const existing = jadwal.find(j => j.id === where.id);
        if (existing) return Object.assign(existing, update);
        jadwal.push({ ...create }); return create;
      },
      findUnique: async ({ where }) => jadwal.find(j => j.id === where.id),
    },
    peserta: {
      findUnique: async ({ where }) => peserta.find(p => p.jadwalId === where.jadwalId_userId.jadwalId && p.userId === where.jadwalId_userId.userId),
      count: async ({ where }) => peserta.filter(p => p.jadwalId === where.jadwalId).length,
      create: async ({ data }) => { const p = { ...data }; peserta.push(p); return p; },
    },
    $transaction: async action => action(db),
  };
  await seedDemo(db);
  assert.equal(users.length, 3); assert.equal(jadwal.length, 6); assert.equal(peserta.length, 2);
  assert(users.every(u => u.passwordHash.startsWith('$2') && !('password' in u)));
  users[1].nama = 'Nama hasil latihan';
  jadwal[0].judul = 'Judul hasil latihan';
  const oldHash = users[0].passwordHash;
  await seedDemo(db);
  assert.equal(users.length, 3); assert.equal(jadwal.length, 6); assert.equal(peserta.length, 2);
  assert.equal(users[1].nama, 'Nama hasil latihan');
  assert.equal(jadwal[0].judul, 'Judul hasil latihan');
  assert.equal(users[0].passwordHash, oldHash);
  peserta.splice(peserta.findIndex(p => p.jadwalId === 1002), 1);
  peserta.push({ jadwalId: 1002, userId: users[2].id });
  await seedDemo(db);
  assert.equal(peserta.filter(p => p.jadwalId === 1002).length, 1);
  assert.equal(fixtures.jadwal.length, 6);
});
