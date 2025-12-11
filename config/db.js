const { Pool } = require('pg');
const { logger } = require('../src/utils/logger');

// Global pool instance
let pool = null;

/**
 * Initialize PostgreSQL pool from environment variables (.env).
 * This does NOT depend on src/utils/config.pg now.
 */
function initPool() {
  const {
    PG_HOST,
    PG_PORT,
    PG_USER,
    PG_PASSWORD,
    PG_DATABASE,
    PG_SSL,
    NODE_ENV,
  } = process.env;

  // Debug log (optional: first restart ke baad logs me check kar sakte ho)
  logger.info(
    {
      env: NODE_ENV,
      PG_HOST,
      PG_PORT,
      PG_DATABASE,
      PG_SSL,
    },
    'Loaded PG environment config'
  );

  if (!PG_HOST) {
    logger.warn('PG_HOST not set; PostgreSQL pool not initialized');
    return null;
  }

  const pgConfig = {
    host: PG_HOST,
    port: PG_PORT ? Number(PG_PORT) : 5432,
    user: PG_USER,
    password: PG_PASSWORD,
    database: PG_DATABASE,
    ssl: PG_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30_000,
  };

  pool = new Pool(pgConfig);

  pool
    .connect()
    .then((client) => {
      client.release();
      logger.info('✅ PostgreSQL connection pool ready');
    })
    .catch((err) => {
      logger.error({ err }, '❌ Failed to connect to PostgreSQL');
    });

  return pool;
}

// Initialize pool immediately on module load
initPool();

/**
 * Safe query helper
 */
const query = (text, params) => {
  if (!pool) {
    throw new Error('PostgreSQL pool not initialized');
  }
  return pool.query(text, params);
};

module.exports = { pool, query, initPool };
