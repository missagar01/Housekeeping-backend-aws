const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Try multiple possible paths for .env file
const possiblePaths = [
  path.resolve(__dirname, '../../.env'), // From src/utils/config.js -> backend/.env
  path.resolve(process.cwd(), '.env'),   // Current working directory
  path.join(__dirname, '../../.env'),     // Alternative relative path
  '.env'                                  // Current directory (fallback)
];

let envPath = null;
for (const envFile of possiblePaths) {
  if (fs.existsSync(envFile)) {
    envPath = envFile;
    break;
  }
}

if (envPath) {
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.warn(`Warning: Error loading .env from ${envPath}:`, result.error.message);
  } else {
    console.log(`✓ Loaded .env from: ${envPath}`);
  }
} else {
  // Only warn once, not on every require
  if (!process.env._ENV_WARNED) {
    console.warn('⚠️  No .env file found. Tried paths:', possiblePaths.join(', '));
    console.warn('Using environment variables from system or process.env');
    process.env._ENV_WARNED = 'true';
  }
  // Still call dotenv.config() without path to load from environment
  dotenv.config();
}

const truthy = (v) => v === true || v === 'true' || v === '1';

const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  logLevel: process.env.LOG_LEVEL || 'info',
  pg: {
    host: process.env.PG_HOST || process.env.DB_HOST,
    port: Number(process.env.PG_PORT || process.env.DB_PORT || 5432),
    user: process.env.PG_USER || process.env.DB_USER,
    password: process.env.PG_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.PG_DATABASE || process.env.DB_NAME,
    ssl: truthy(process.env.PG_SSL || process.env.DB_SSL)
  },
  jwtSecret: process.env.JWT_SECRET || 'change-me'
};

// Log config status (without sensitive data)
if (config.env !== 'test') {
  console.log('Database config:', {
    host: config.pg.host ? '***' : 'MISSING',
    port: config.pg.port,
    user: config.pg.user ? '***' : 'MISSING',
    database: config.pg.database ? '***' : 'MISSING',
    ssl: config.pg.ssl,
    envPath: envPath || 'NOT FOUND'
  });
}

module.exports = { config };
