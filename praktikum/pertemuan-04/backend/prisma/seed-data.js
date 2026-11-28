import { readFileSync } from 'node:fs';
import bcrypt from 'bcryptjs';

export const fixtures = JSON.parse(readFileSync(new URL('./fixtures.json', import.meta.url), 'utf8'));

export async function seedDemo(db) {
  const users = await Promise.all(fixtures.users.map(async ({ password, ...user }) => ({
    ...user,
    passwordHash: await bcrypt.hash(password, 10),
  })));

  return db.$transaction(async tx => {
    const ids = new Map();
    for (const user of users) {
      const stored = await tx.user.upsert({ where: { nim: user.nim }, update: {}, create: user });
      ids.set(user.nim, stored.id);
    }
    for (const jadwal of fixtures.jadwal) {
      await tx.jadwal.upsert({ where: { id: jadwal.id }, update: {}, create: jadwal });
    }
    for (const item of fixtures.peserta) {
      const key = { jadwalId: item.jadwalId, userId: ids.get(item.nim) };
      const existing = await tx.peserta.findUnique({ where: { jadwalId_userId: key } });
      if (existing) continue;
      const jadwal = await tx.jadwal.findUnique({ where: { id: item.jadwalId } });
      const jumlah = await tx.peserta.count({ where: { jadwalId: item.jadwalId } });
      if (jumlah < jadwal.kapasitas) await tx.peserta.create({ data: key });
    }
  }, { isolationLevel: 'Serializable' });
}
