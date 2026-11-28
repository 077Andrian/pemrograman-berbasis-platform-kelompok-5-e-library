import { HttpError } from './errors.js';

export async function serializable(db, action) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await db.$transaction(action, { isolationLevel: 'Serializable' });
    } catch (error) {
      if (error.code !== 'P2034' || attempt === 2) throw error;
    }
  }
}

export function daftarPeserta(db, jadwalId, userId) {
  return serializable(db, async tx => {
    const jadwal = await tx.jadwal.findUnique({ where: { id: jadwalId } });
    if (!jadwal) throw new HttpError(404, 'Jadwal tidak ditemukan');
    const existing = await tx.peserta.findUnique({
      where: { jadwalId_userId: { jadwalId, userId } },
    });
    if (existing) throw new HttpError(409, 'Sudah terdaftar');
    const jumlah = await tx.peserta.count({ where: { jadwalId } });
    if (jumlah >= jadwal.kapasitas) throw new HttpError(409, 'Kelas penuh');
    return tx.peserta.create({ data: { jadwalId, userId } });
  });
}

export function ubahJadwal(db, id, data) {
  return serializable(db, async tx => {
    const jumlah = await tx.peserta.count({ where: { jadwalId: id } });
    if (data.kapasitas < jumlah) throw new HttpError(409, 'Kapasitas di bawah jumlah peserta');
    return tx.jadwal.update({ where: { id }, data });
  });
}
