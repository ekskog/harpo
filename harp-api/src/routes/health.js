const express = require('express');
const router = express.Router();
const databaseService = require('../services/databaseService');

router.get('/', async (req, res) => {
  try {
    const dbStatus = await databaseService.checkConnection();
    
    const healthStatus = {
      status: dbStatus.success ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: dbStatus.success,
        message: dbStatus.message
      }
    };

    const statusCode = dbStatus.success ? 200 : 503;
    
    if (!dbStatus.success && dbStatus.error) {
      healthStatus.database.error = dbStatus.error;
    }

    res.status(statusCode).json(healthStatus);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

module.exports = router;