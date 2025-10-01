const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

// Apply authentication to all notification routes
router.use(authMiddleware);

// Get user notifications
// GET /api/notifications?page=1&limit=20&unreadOnly=true
router.get('/', notificationController.getUserNotifications);

// Get unread notifications count
// GET /api/notifications/unread-count
router.get('/unread-count', notificationController.getUnreadCount);

// Mark notifications as read
// POST /api/notifications/mark-read
router.post('/mark-read', notificationController.markAsRead);

// Clear all notifications for user
// DELETE /api/notifications/clear-all
router.delete('/clear-all', notificationController.clearAllNotifications);

// Send notification (for follow-up completion, etc.)
// POST /api/notifications/send
router.post('/send', notificationController.sendNotification);

module.exports = router;

