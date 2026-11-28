import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import { daftarPeserta } from '../src/jadwal-service.js';

test('MySQL: dua request berebut satu kursi; data tersimpan dan relasi cascade', {
  skip: process.env.RUN_DB_TESTS !== '1',
}, async () => {
  const db = new PrismaClient();
  let jadwal;
  const userIds = [];
  try {
    for (let i = 0; i < 2; i++) {
      const user = await db.user.create({ data: {
        nim: `test-${Date.now()}-${i}`, nama: 'Test', passwordHash: 'unused',
      } });
      userIds.push(user.id);
    }
    jadwal = await db.jadwal.create({ data: { judul: 'Test kursi terakhir', kapasitas: 1 } });
    const hasil = await Promise.allSettled(userIds.map(id => daftarPeserta(db, jadwal.id, id)));
    assert.equal(hasil.filter(r => r.status === 'fulfilled').length, 1);
    assert.equal(await db.peserta.count({ where: { jadwalId: jadwal.id } }), 1);
    const failed = hasil.find(r => r.status === 'rejected');
    assert.equal(failed.reason.status, 409);
    const reader = new PrismaClient();
    try { assert.equal(await reader.peserta.count({ where: { jadwalId: jadwal.id } }), 1); }
    finally { await reader.$disconnect(); }
    await db.jadwal.delete({ where: { id: jadwal.id } });
    assert.equal(await db.peserta.count({ where: { jadwalId: jadwal.id } }), 0);
  } finally {
    if (jadwal) await db.jadwal.deleteMany({ where: { id: jadwal.id } });
    await db.user.deleteMany({ where: { id: { in: userIds } } });
    await db.$disconnect();
  }
});
