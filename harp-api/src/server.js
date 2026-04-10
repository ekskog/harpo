
// ==========================================
// src/server.js
// Entry point for the Harp API server
// force rebuild (07/04 14:08  UTC)
// ==========================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/health');
const collectionsRoutes = require('./routes/collections');
const authRoutes = require('./routes/auth');
const databaseService = require('./services/databaseService');

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Log request body for debugging (after JSON parsing)
app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    console.log(`[${req.method} ${req.path}] Raw body received:`, req.body);
    console.log(`[${req.method} ${req.path}] Content-Type:`, req.headers['content-type']);
  }
  next();
});

// Register routes
// API prefix for versioning
const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/health`, healthRoutes);
app.use(`${API_PREFIX}/collections`, collectionsRoutes);
app.use(`${API_PREFIX}/auth`, authRoutes);

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}${API_PREFIX}/health`);
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

