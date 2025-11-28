const { createServer } = require('http');
const app = require('./app');
const { config } = require('./utils/config');
const { logger } = require('./utils/logger');

const server = createServer(app);
const port = config.port;

server.listen(port, () => {
  logger.info(`Server running on port ${port} (${config.env})`);
});

process.on('unhandledRejection', (err) => {
  logger.error({ err }, 'Unhandled rejection');
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught exception');
  process.exit(1);
});
