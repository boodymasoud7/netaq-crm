const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authMiddleware, requirePermission } = require('../middleware/simple-auth');

// Apply authentication to all routes
router.use(authMiddleware);

// @route   GET /api/dashboard/manager
// @desc    Get comprehensive manager dashboard data
// @access  Private (managers and admins)
router.get('/manager', dashboardController.getManagerDashboard);

// @route   GET /api/dashboard/quick-stats
// @desc    Get quick stats for dashboard header
// @access  Private
router.get('/quick-stats', dashboardController.getQuickStats);

module.exports = router;
