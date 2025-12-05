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

// @route   GET /api/dashboard/summary
// @desc    Get dashboard summary with trends (optimized for Dashboard page)
// @access  Private
router.get('/summary', dashboardController.getDashboardSummary);

// @route   GET /api/dashboard/last-7-days
// @desc    Get last 7 days stats for sparkline charts
// @access  Private
router.get('/last-7-days', dashboardController.getLast7DaysStats);

module.exports = router;
