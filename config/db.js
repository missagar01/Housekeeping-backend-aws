const { Pool } = require('pg');
const { config } = require('../src/utils/config');
const { logger } = require('../src/utils/logger');

let pool;
let poolReady = false;
let poolReadyPromise = null;

function initializePool() {
  if (config.env === 'test') {
    logger.info('Test environment detected; PostgreSQL pool not initialized');
    return Promise.resolve();
  }

  if (!config.pg.host) {
    logger.warn('PG connection info missing; database pool not initialized');
    logger.warn('Required env vars: PG_HOST (or DB_HOST), PG_DATABASE (or DB_NAME), PG_USER (or DB_USER), PG_PASSWORD (or DB_PASSWORD)');
    return Promise.resolve();
  }

  if (pool) {
    return poolReadyPromise || Promise.resolve();
  }

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

  poolReadyPromise = pool
    .connect()
    .then((client) => {
      client.release();
      poolReady = true;
      logger.info('PostgreSQL connection pool ready');
      return true;
    })
    .catch((err) => {
      poolReady = false;
      logger.error({ err }, 'Failed to connect to PostgreSQL');
      throw err;
    });

  // Handle pool errors
  pool.on('error', (err) => {
    logger.error({ err }, 'Unexpected error on idle PostgreSQL client');
    poolReady = false;
  });

  return poolReadyPromise;
}

// Initialize pool immediately
initializePool();

const query = async (text, params) => {
  if (!pool) {
    // Try to initialize if not already done
    if (!poolReadyPromise) {
      await initializePool();
    } else {
      await poolReadyPromise;
    }
  }

  if (!pool || !poolReady) {
    throw new Error('PostgreSQL pool not initialized or not ready. Check your database connection settings in .env file.');
  }
  
  return pool.query(text, params);
};

module.exports = { pool, query, initializePool, poolReady: () => poolReady };
