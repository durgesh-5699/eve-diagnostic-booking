import { Pool } from 'pg';
import { runMigrations } from '../src/db/migrator';

export default async function setup() {
  const testUrl = process.env.TEST_DATABASE_URL;
  if (!testUrl) {
    throw new Error('TEST_DATABASE_URL is not set');
  }

  const dbName = new URL(testUrl).pathname.replace(/^\//, '');
  if (!/^[a-zA-Z0-9_]+$/.test(dbName) || !dbName.endsWith('_test')) {
    throw new Error(`Refusing to run: test database name must end with "_test" (got "${dbName}")`);
  }

  const adminUrl = new URL(testUrl);
  adminUrl.pathname = '/postgres';
  const admin = new Pool({ connectionString: adminUrl.toString(), max: 1 });
  try {
    const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (exists.rowCount === 0) {
      await admin.query(`CREATE DATABASE "${dbName}"`);
    }
  } finally {
    await admin.end();
  }

  const testPool = new Pool({ connectionString: testUrl, max: 1 });
  try {
    await runMigrations(testPool);
  } finally {
    await testPool.end();
  }
}