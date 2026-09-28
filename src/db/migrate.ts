import { pool } from './pool';
import { runMigrations } from './migrator';

runMigrations(pool, console.log)
  .then(() => pool.end())
  .catch(async (err) => {
    console.error(err);
    await pool.end();
    process.exit(1);
  });