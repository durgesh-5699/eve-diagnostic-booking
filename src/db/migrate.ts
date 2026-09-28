import { pool } from './pool';
import { runMigrations } from './migrator';
import { logger } from '../utils/logger';

runMigrations(pool, (message) => logger.info(message))
  .then(() => pool.end())
  .catch(async (err) => {
    logger.error({ err }, 'migration failed');
    await pool.end();
    process.exit(1);
  });