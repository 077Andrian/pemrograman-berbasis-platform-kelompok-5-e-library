import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { asyncRoute, errorHandler, HttpError } from './errors.js';
import { requireAuth, requireRole, publicUser } from './auth.js';
import { daftarPeserta, ubahJadwal } from './jadwal-service.js';

const idSchema = z.coerce.number().int().positive().max(2147483647);
const akunSchema = z.object({ nim: z.string().regex(/^\d{7,20}$/), password: z.string().min(6).max(72) });
const jadwalSchema = z.object({ judul: z.string().trim().min(3).max(120), kapasitas: z.number().int().min(1).max(500) }).strict();
const querySchema = z.object({
  q: z.string().trim().max(120).default(''),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export function createApp({ db, secret, origin = 'http://localhost:5173' }) {
  if (!secret || secret.length < 32 || secret.startsWith('GANTI_')) throw new Error('Isi JWT_SECRET acak minimal 32 karakter');
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin }));
  app.use(express.json({ limit: '16kb' }));
  const api = express.Router();
  const auth = requireAuth(db, secret);
  const admin = requireRole('ADMIN');

  api.get('/', (req, res) => res.json({ status: true, message: 'Welcome to API v1' }));
  api.get('/health', asyncRoute(async (req, res) => {
    await db.$queryRaw\`SELECT 1\`;
    res.json({ status: 'ok' });
  }));
  api.post('/auth/register', asyncRoute(async (req, res) => {
    const input = akunSchema.extend({ nama: z.string().trim().min(2).max(100) }).strict().parse(req.body);
    const user = await db.user.create({ data: {
      nim: input.nim, nama: input.nama, passwordHash: await bcrypt.hash(input.password, 10),
      role: 'MAHASISWA',
    } });
    res.status(201).json({ data: publicUser(user) });
  }));
  api.post('/auth/login', asyncRoute(async (req, res) => {
    const input = akunSchema.parse(req.body);
    const user = await db.user.findUnique({ where: { nim: input.nim } });
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) throw new HttpError(401, 'NIM atau password salah');
    const token = jwt.sign({}, secret, { subject: String(user.id), expiresIn: '1h', algorithm: 'HS256' });
    res.json({ token, user: publicUser(user) });
  }));
  api.get('/auth/me', auth, (req, res) => res.json({ data: req.user }));

  api.get('/jadwal', asyncRoute(async (req, res) => {
    const { q, page, limit } = querySchema.parse(req.query);
    const where = { judul: { contains: q } };
    const [data, total] = await db.$transaction([
      db.jadwal.findMany({ where, skip: (page - 1) * limit, take: limit,
        orderBy: { id: 'desc' }, include: { _count: { select: { peserta: true } } } }),
      db.jadwal.count({ where }),
    ]);
    res.json({ data, meta: { page, limit, total } });
  }));
  api.get('/jadwal/:id', asyncRoute(async (req, res) => {
    const id = idSchema.parse(req.params.id);
    const data = await db.jadwal.findUnique({ where: { id }, include: { _count: { select: { peserta: true } } } });
    if (!data) throw new HttpError(404, 'Jadwal tidak ditemukan');
    res.json({ data });
  }));
  api.post('/jadwal', auth, admin, asyncRoute(async (req, res) => {
    const data = await db.jadwal.create({ data: jadwalSchema.parse(req.body) });
    res.status(201).json({ data });
  }));
  api.put('/jadwal/:id', auth, admin, asyncRoute(async (req, res) => {
    const data = await ubahJadwal(db, idSchema.parse(req.params.id), jadwalSchema.parse(req.body));
    res.json({ data });
  }));
  api.delete('/jadwal/:id', auth, admin, asyncRoute(async (req, res) => {
    await db.jadwal.delete({ where: { id: idSchema.parse(req.params.id) } });
    res.status(204).end();
  }));
  api.post('/jadwal/:id/peserta', auth, asyncRoute(async (req, res) => {
    const data = await daftarPeserta(db, idSchema.parse(req.params.id), req.user.id);
    res.status(201).json({ data });
  }));
  api.delete('/jadwal/:id/peserta/me', auth, asyncRoute(async (req, res) => {
    await db.peserta.delete({ where: { jadwalId_userId: {
      jadwalId: idSchema.parse(req.params.id), userId: req.user.id,
    } } });
    res.status(204).end();
  }));
  api.get('/peserta/me', auth, asyncRoute(async (req, res) => {
    const data = await db.peserta.findMany({ where: { userId: req.user.id }, include: { jadwal: true } });
    res.json({ data });
  }));
  app.use('/api/v1', api);
  app.use((req, res) => res.status(404).json({ message: 'Route tidak ditemukan' }));
  app.use(errorHandler);
  return app;
}
