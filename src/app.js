const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');
const path = require('path');
const fs = require('fs');

const app = express();

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use('/uploads', express.static(uploadsDir));
// Also expose uploads under /api/uploads for convenience
app.use('/api/uploads', express.static(uploadsDir));

app.use('/api', routes);

// Health/status routes at the root for quick checks
app.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'housekeeping-backend',
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3005,
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'housekeeping-backend',
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3005,
    timestamp: new Date().toISOString()
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
