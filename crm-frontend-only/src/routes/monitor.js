// Monitor Routes
// مسارات المراقبة

const express = require('express');
const router = express.Router();
const { getCurrentCounts, getLatestRecords } = require('../utils/dataMonitor');

// Get system statistics
router.get('/stats', async (req, res) => {
  try {
    const counts = await getCurrentCounts();
    const latest = await getLatestRecords();
    
    res.json({
      success: true,
      data: {
        counts,
        latest,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Monitor stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

module.exports = router;






