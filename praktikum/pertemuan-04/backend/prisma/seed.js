import 'dotenv/config';
import { db } from '../src/db.js';
import { seedDemo } from './seed-data.js';

try {
  await seedDemo(db);
  console.log('Data fiktif siap: 3 akun, 6 jadwal (ID 1001–1006), dan contoh pendaftaran.');
  console.log('Seed tidak menimpa field yang sudah ada; jalankan sebelum memulai latihan.');
} finally {
  await db.$disconnect();
}
