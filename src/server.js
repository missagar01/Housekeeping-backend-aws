const { createServer } = require('http');
const app = require('./app');
const { config } = require('./utils/config');
const { logger } = require('./utils/logger');
const { initializePool } = require('../../config/db');

const server = createServer(app);
const port = config.port;

// Initialize database connection before starting server
async function startServer() {
  try {
    // Wait for database connection (only in non-test environments)
    if (config.env !== 'test') {
      logger.info('Initializing database connection...');
      await initializePool().catch(err => {
        logger.warn({ err }, 'Database connection failed, but continuing to start server');
      });
    }
    
    server.listen(port, () => {
      logger.info(`Server running on port ${port} (${config.env})`);
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

startServer();

process.on('unhandledRejection', (err) => {
  logger.error({ err }, 'Unhandled rejection');
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught exception');
  process.exit(1);
});
