import fs from 'node:fs';
import path from 'node:path';
import type { Pool } from 'pg';

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'src/db/migrations');

export async function runMigrations(
  db: Pool,
  log: (message: string) => void = () => {},
): Promise<void> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const appliedResult = await db.query('SELECT name FROM schema_migrations');
  const applied = new Set<string>(appliedResult.rows.map((row) => row.name));

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      log(`Skipping already-applied migration: ${file}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
    const client = await db.connect();

    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      log(`Applied migration: ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      log(`Failed to apply migration: ${file}`);
      throw err;
    } finally {
      client.release();
    }
  }
}