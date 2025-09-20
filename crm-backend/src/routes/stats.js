const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { authMiddleware, requirePermission } = require('../middleware/simple-auth');

// Apply authentication to all routes
router.use(authMiddleware);

// @route   GET /api/stats/manager
// @desc    Get comprehensive manager dashboard statistics
// @access  Private (any authenticated user for now)
router.get('/manager', statsController.getManagerStats);

// @route   GET /api/stats/activity-feed
// @desc    Get real-time activity feed
// @access  Private (any authenticated user)
router.get('/activity-feed', statsController.getActivityFeed);

module.exports = router;
