const express = require('express');
const router = express.Router();

// Health check endpoint - no authentication required
router.get('/', async (req, res) => {
  try {
    // Simple health check
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'CRM Backend API',
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

module.exports = router;









