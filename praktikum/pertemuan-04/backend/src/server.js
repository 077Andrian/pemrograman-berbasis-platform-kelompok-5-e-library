import 'dotenv/config';
import { db } from './db.js';
import { createApp } from './app.js';

const app = createApp({ db, secret: process.env.JWT_SECRET, origin: process.env.WEB_ORIGIN });
await db.$connect();
const server = app.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => {
  console.log(`API siap pada port ${process.env.PORT || 3000}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    server.close(async () => {
      await db.$disconnect();
      process.exit(0);
    });
  });
}
