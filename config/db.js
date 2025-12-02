const { Pool } = require('pg');
const { config } = require('../src/utils/config');
const { logger } = require('../src/utils/logger');

let pool;

/**
 * Ensure that the PostgreSQL pool is initialized.
 * - Local + AWS dono jagah kaam karega
 * - Agar startup pe pool nahi bana, to pehle query par bana dega
 */
function ensurePool() {
  if (pool) return pool;

  if (config.env === 'test') {
    logger.info('Test environment; DB pool not created');
    throw new Error('DB not allowed in test env');
  }

  if (!config.pg || !config.pg.host) {
    logger.error({ pg: config.pg }, 'PG connection info missing; cannot init pool');
    throw new Error('PostgreSQL config missing (host not set)');
  }

  logger.info(
    {
      host: config.pg.host,
      database: config.pg.database,
      user: config.pg.user,
      port: config.pg.port
    },
    'Initializing PostgreSQL connection pool (lazy)'
  );

  pool = new Pool({
    host: config.pg.host,
    port: config.pg.port,
    user: config.pg.user,
    password: config.pg.password,
    database: config.pg.database,
    ssl: config.pg.ssl ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30_000
  });

  // Optional: test connection once
  pool
    .connect()
    .then((client) => {
      client.release();
      logger.info('PostgreSQL connection pool ready');
    })
    .catch((err) => {
      logger.error({ err }, 'Failed to connect to PostgreSQL during pool init');
    });

  return pool;
}

/**
 * Generic query helper
 */
const query = (text, params) => {
  const db = ensurePool();   // 🔥 yahi main change hai
  return db.query(text, params);
};

module.exports = { pool, query };
