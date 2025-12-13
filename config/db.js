const { Pool } = require('pg');
const { config } = require('../src/utils/config');
const { logger } = require('../src/utils/logger');

let pool;


if (config.env !== 'test' && config.pg.host) {
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

  pool
    .connect()
    .then((client) => {
      client.release();
      logger.info('PostgreSQL connection pool ready');
    })
    .catch((err) => {
      logger.error({ err }, 'Failed to connect to PostgreSQL');
    });
} else if (config.env === 'test') {
  logger.info('Test environment detected; PostgreSQL pool not initialized');
} else {
  logger.warn('PG connection info missing; database pool not initialized');
}


const query = (text, params) => {
  if (!pool) {
    throw new Error('PostgreSQL pool not initialized');
  }
  return pool.query(text, params);
};

module.exports = { pool, query };
