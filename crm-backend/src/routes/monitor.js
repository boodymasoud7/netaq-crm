const express = require('express');
const router = express.Router();
const { getCurrentCounts, getLatestRecords } = require('../utils/dataMonitor');
const authMiddleware = require('../middleware/auth');

// Apply authentication to all routes
router.use(authMiddleware);

// @route   GET /api/monitor/stats
// @desc    Get current system statistics
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const counts = await getCurrentCounts();
    const latest = await getLatestRecords();
    
    res.json({
      message: 'System statistics retrieved successfully',
      timestamp: new Date().toISOString(),
      data: {
        counts,
        latest: {
          client: latest.client ? {
            id: latest.client.id,
            name: latest.client.name,
            email: latest.client.email,
            createdAt: latest.client.createdAt
          } : null,
          lead: latest.lead ? {
            id: latest.lead.id,
            name: latest.lead.name,
            email: latest.lead.email,
            createdAt: latest.lead.createdAt
          } : null,
          project: latest.project ? {
            id: latest.project.id,
            name: latest.project.name,
            createdAt: latest.project.createdAt
          } : null,
          sale: latest.sale ? {
            id: latest.sale.id,
            clientName: latest.sale.clientName,
            projectName: latest.sale.projectName,
            price: latest.sale.price,
            createdAt: latest.sale.createdAt
          } : null,
          task: latest.task ? {
            id: latest.task.id,
            title: latest.task.title,
            assignedTo: latest.task.assignedTo,
            createdAt: latest.task.createdAt
          } : null
        }
      }
    });
  } catch (error) {
    console.error('Monitor stats error:', error);
    res.status(500).json({
      message: 'Server error while retrieving monitor statistics',
      code: 'SERVER_ERROR'
    });
  }
});

// @route   GET /api/monitor/health
// @desc    Get system health status
// @access  Private
router.get('/health', async (req, res) => {
  try {
    const startTime = Date.now();
    const counts = await getCurrentCounts();
    const responseTime = Date.now() - startTime;
    
    const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);
    
    res.json({
      message: 'System health check completed',
      timestamp: new Date().toISOString(),
      health: {
        status: 'healthy',
        database: 'connected',
        responseTime: `${responseTime}ms`,
        totalRecords,
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100
        }
      },
      data: counts
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      message: 'System health check failed',
      timestamp: new Date().toISOString(),
      health: {
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message
      }
    });
  }
});

module.exports = router;



