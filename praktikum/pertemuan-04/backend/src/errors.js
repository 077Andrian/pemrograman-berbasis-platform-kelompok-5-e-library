export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const asyncRoute = handler => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.name === 'ZodError') {
    return res.status(400).json({ message: 'Input tidak valid', errors: error.flatten() });
  }
  if (error.code === 'P2002') return res.status(409).json({ message: 'Data sudah terdaftar' });
  if (error.code === 'P2025') return res.status(404).json({ message: 'Data tidak ditemukan' });
  if (error.code === 'P2034') return res.status(409).json({ message: 'Konflik transaksi, coba lagi' });
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({ message: status >= 500 ? 'Gangguan server' : error.message });
}
