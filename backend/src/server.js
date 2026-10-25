require('dotenv').config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || /GANTI_DENGAN|CHANGE_ME|REPLACE_ME|YOUR_SECRET/i.test(process.env.JWT_SECRET)) {
  console.error('Konfigurasi JWT_SECRET wajib diisi dengan secret acak minimal 32 karakter.');
  process.exit(1);
}

const app = require('./app');
const { db } = require('./db');
const port = Number(process.env.PORT || 3000);
const server = app.listen(port, () => {
  console.log('E-Library API aktif di http://localhost:' + port);
  console.log('Health check: http://localhost:' + port + '/api/health');
});

function shutdown(signal) {
  console.log(signal + ' diterima; menutup server...');
  server.close(() => {
    db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));