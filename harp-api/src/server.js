
// ==========================================
// src/server.js
// Entry point for the Harp API server
// force rebuild (11/04 11:38  UTC)
// ==========================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/health');
const collectionsRoutes = require('./routes/collections');
const authRoutes = require('./routes/auth');
const databaseService = require('./services/databaseService');
const debug = require('debug')('harp:server');
const httpDebug = require('debug')('harp:http');
const errDebug = require('debug')('harp:error');

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: true,
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Log request body for debugging (after JSON parsing)
// HTTP request/response debug middleware
app.use((req, res, next) => {
  // Suppress logs for Kubernetes health probes and the health endpoint
  const ua = (req.headers['user-agent'] || '').toLowerCase();
  const isKubeProbe = ua.includes('kube-probe');
  const isHealthEndpoint = req.path === '/api/v1/health' || req.originalUrl.startsWith('/api/v1/health');
  if (isKubeProbe || isHealthEndpoint) return next();

  // start a console timer for the whole request lifecycle
  const reqTimer = `req:${req.method}:${req.originalUrl}:${Date.now()}`;
  console.time(reqTimer);

  httpDebug('Incoming %s %s', req.method, req.originalUrl);
  httpDebug('headers=%o', { host: req.headers.host, 'content-type': req.headers['content-type'] });
  if (Object.keys(req.query || {}).length) httpDebug('query=%o', req.query);
  if (Object.keys(req.params || {}).length) httpDebug('params=%o', req.params);
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') httpDebug('body=%o', req.body);

  res.on('finish', () => {
    const ms = Date.now() - (parseInt(reqTimer.split(':').pop(), 10) || Date.now());
    httpDebug('Completed %s %s -> %d (%dms)', req.method, req.originalUrl, res.statusCode, ms);
    console.timeEnd(reqTimer);
  });

  next();
});

// Register routes
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/collections', collectionsRoutes);

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  debug('Server is running on port %d', PORT);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\nShutting down gracefully...');

  server.close(async () => {
    console.log('HTTP server closed');
    await databaseService.closePool();
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forcing shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Generic express error handler (logs via debug)
app.use((err, req, res, next) => {
  errDebug('Unhandled error for %s %s: %O', req.method, req.originalUrl, err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ success: false, error: 'Internal Server Error', message: err.message });
});
