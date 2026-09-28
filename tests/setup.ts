import { beforeEach, afterAll } from 'vitest';
import { pool } from '../src/db/pool';

const dbName = new URL(process.env.DATABASE_URL!).pathname.replace(/^\//, '');
if (!dbName.endsWith('_test')) {
  throw new Error(`Refusing to truncate "${dbName}": integration tests must use a *_test database`);
}

beforeEach(async () => {
  await pool.query(
    `TRUNCATE users, diagnostic_centres, diagnostic_tests, bookings, payments, webhook_events
     RESTART IDENTITY CASCADE`,
  );
});

afterAll(async () => {
  await pool.end();
});