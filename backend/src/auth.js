const jwt = require('jsonwebtoken');
const { db } = require('./db');

class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function signAccessToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET belum dikonfigurasi dengan aman.');
  }
  return jwt.sign(
    { role: user.role },
    secret,
    { subject: user.id, expiresIn: process.env.JWT_EXPIRES_IN || '2h', algorithm: 'HS256' }
  );
}

function authenticate(req, res, next) {
  const header = req.get('authorization') || '';
  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer' || !parts[1]) {
    return next(new ApiError(401, 'UNAUTHORIZED', 'Token akses diperlukan.'));
  }

  try {
    const payload = jwt.verify(parts[1], process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (!payload || typeof payload.sub !== 'string') {
      throw new Error('Token subject tidak valid.');
    }
    const user = db.prepare(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?'
    ).get(payload.sub);
    if (!user) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Token tidak berlaku untuk pengguna yang aktif.');
    }
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.created_at
    };
    return next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    return next(new ApiError(401, 'UNAUTHORIZED', 'Token tidak valid atau sudah kedaluwarsa.'));
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'UNAUTHORIZED', 'Autentikasi diperlukan.'));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'FORBIDDEN', 'Role Anda tidak memiliki izin untuk tindakan ini.'));
    }
    return next();
  };
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.created_at || user.createdAt
  };
}

module.exports = { ApiError, signAccessToken, authenticate, authorize, publicUser };