
// ==========================================
// src/server.js
// Entry point for the Harp API server
// force rebuild (21/11 11:11  UTC)
// ==========================================

require('dotenv').config();
const express = require('express');
const healthRoutes = require('./routes/health');
const collectionsRoutes = require('./routes/collections');
const databaseService = require('./services/databaseService');

const app = express();

// Register routes
app.use('/health', healthRoutes);
app.use('/collections', collectionsRoutes);

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
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

