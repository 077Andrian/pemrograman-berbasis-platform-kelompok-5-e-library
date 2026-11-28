import jwt from 'jsonwebtoken';
import { HttpError, asyncRoute } from './errors.js';

export const publicUser = ({ id, nim, nama, role }) => ({ id, nim, nama, role });

export function requireAuth(db, secret) {
  return asyncRoute(async (req, res, next) => {
    const match = /^Bearer (\S+)$/.exec(req.headers.authorization || '');
    if (!match) throw new HttpError(401, 'Silakan login');
    let payload;
    try {
      payload = jwt.verify(match[1], secret, { algorithms: ['HS256'] });
    } catch {
      throw new HttpError(401, 'Token tidak valid atau kedaluwarsa');
    }
    const id = Number(payload.sub);
    if (!Number.isSafeInteger(id) || id < 1) throw new HttpError(401, 'Token tidak valid');
    const user = await db.user.findUnique({ where: { id } });
    if (!user) throw new HttpError(401, 'Akun tidak ditemukan');
    req.user = publicUser(user);
    next();
  });
}

export function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) return next(new HttpError(403, 'Akses ditolak'));
    next();
  };
}
